import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod/v4';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = join(__dirname, '..', 'data', 'synthetic', 'catalog.json');

export const TOOL_NAMES = Object.freeze([
  'list_tracks',
  'get_track',
  'list_skills',
  'get_challenge',
]);

class ContractError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ContractError';
    this.code = code;
    this.details = details;
  }
}

function assertObject(value, message) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new ContractError('CATALOG_INTEGRITY_ERROR', message);
  }
}
function assertId(value, field, code = 'INVALID_INPUT') {
  if (typeof value !== 'string' || value.length === 0 || value !== value.trim()) {
    throw new ContractError(code, `${field} deve ser string não vazia, sem espaços laterais.`, { field });
  }
}

function buildIndex(catalog) {
  assertObject(catalog, 'Catálogo deve ser objeto JSON.');
  if (catalog.synthetic !== true) {
    throw new ContractError('SYNTHETIC_DATA_REQUIRED', 'catalog.synthetic deve ser true.');
  }
  if (!Array.isArray(catalog.competencies) || !Array.isArray(catalog.tracks)) {
    throw new ContractError('CATALOG_INTEGRITY_ERROR', 'competencies e tracks devem ser arrays.');
  }

  const skillMap = new Map();
  for (const skill of catalog.competencies) {
    assertObject(skill, 'Competência inválida.');
    assertId(skill.skill_id, 'skill_id', 'CATALOG_INTEGRITY_ERROR');
    if (skillMap.has(skill.skill_id)) {
      throw new ContractError('CATALOG_INTEGRITY_ERROR', `skill_id duplicado: ${skill.skill_id}`);
    }
    skillMap.set(skill.skill_id, skill);
  }

  const trackMap = new Map();
  const challengeMap = new Map();
  for (const track of catalog.tracks) {
    assertObject(track, 'Trilha inválida.');
    assertId(track.track_id, 'track_id', 'CATALOG_INTEGRITY_ERROR');
    if (trackMap.has(track.track_id)) {
      throw new ContractError('CATALOG_INTEGRITY_ERROR', `track_id duplicado: ${track.track_id}`);
    }
    if (!Array.isArray(track.module_sequence)) {
      throw new ContractError('CATALOG_INTEGRITY_ERROR', `module_sequence inválida: ${track.track_id}`);
    }
    for (const skillId of track.module_sequence) {
      if (!skillMap.has(skillId)) {
        throw new ContractError('CATALOG_INTEGRITY_ERROR', `Skill ausente em module_sequence: ${skillId}`);
      }
    }
    trackMap.set(track.track_id, track);

    const challenges = track.challenges ?? [];
    if (!Array.isArray(challenges)) {
      throw new ContractError('CATALOG_INTEGRITY_ERROR', `challenges inválido: ${track.track_id}`);
    }
    for (const challenge of challenges) {
      assertObject(challenge, 'Challenge inválido.');
      assertId(challenge.challenge_id, 'challenge_id', 'CATALOG_INTEGRITY_ERROR');
      if (challengeMap.has(challenge.challenge_id)) {
        throw new ContractError('CATALOG_INTEGRITY_ERROR', `challenge_id duplicado: ${challenge.challenge_id}`);
      }
      if (challenge.synthetic !== true) {
        throw new ContractError('SYNTHETIC_DATA_REQUIRED', `Challenge não sintético: ${challenge.challenge_id}`);
      }
      if (challenge.track_id !== track.track_id) {
        throw new ContractError('CATALOG_INTEGRITY_ERROR', `track_id divergente em ${challenge.challenge_id}`);
      }
      if (challenge.synthetic_inputs?.synthetic !== true) {
        throw new ContractError('SYNTHETIC_DATA_REQUIRED', `synthetic_inputs inválido: ${challenge.challenge_id}`);
      }
      const sources = challenge.synthetic_inputs?.sources ?? [];
      if (!Array.isArray(sources)) {
        throw new ContractError('CATALOG_INTEGRITY_ERROR', `sources inválido: ${challenge.challenge_id}`);
      }
      for (const source of sources) {
        if (source?.synthetic !== true) {
          throw new ContractError('SYNTHETIC_DATA_REQUIRED', `Fonte não sintética em ${challenge.challenge_id}`);
        }
        for (const claim of source.claims ?? []) {
          if (claim?.synthetic !== true) {
            throw new ContractError('SYNTHETIC_DATA_REQUIRED', `Claim não sintético em ${challenge.challenge_id}`);
          }
        }
        for (const record of source.records ?? []) {
          if (record?.synthetic !== true) {
            throw new ContractError('SYNTHETIC_DATA_REQUIRED', `Registro não sintético em ${challenge.challenge_id}`);
          }
        }
      }
      challengeMap.set(challenge.challenge_id, challenge);
    }

    if (track.final_challenge_id !== null && track.final_challenge_id !== undefined) {
      if (!challengeMap.has(track.final_challenge_id)) {
        throw new ContractError(
          'CATALOG_INTEGRITY_ERROR',
          `final_challenge_id inexistente: ${track.final_challenge_id}`,
        );
      }
    }
  }

  return { skillMap, trackMap, challengeMap };
}

function success(payload) {
  return { ok: true, synthetic: true, ...payload };
}

function failure(error) {
  if (error instanceof ContractError) {
    return { ok: false, error: error.code, message: error.message, ...error.details };
  }
  throw error;
}

function projectSkill(skill) {
  return {
    skill_id: skill.skill_id,
    title: skill.title,
    domain: skill.domain,
    level: skill.level,
    critical_security: skill.critical_security === true,
  };
}
function projectTrackList(track) {
  return {
    track_id: track.track_id,
    title: track.title,
    role_ids: [...(track.role_ids ?? [])],
    target_goals: [...(track.target_goals ?? [])],
    final_challenge_id: track.final_challenge_id ?? null,
  };
}

function projectTrack(track) {
  return {
    track_id: track.track_id,
    title: track.title,
    role_ids: [...(track.role_ids ?? [])],
    target_goals: [...(track.target_goals ?? [])],
    goal_tags: [...(track.goal_tags ?? [])],
    why_this_track: track.why_this_track,
    prerequisites: [...(track.prerequisites ?? [])],
    module_sequence: [...(track.module_sequence ?? [])],
    final_challenge_id: track.final_challenge_id ?? null,
  };
}

function projectChallenge(challenge) {
  return {
    challenge_id: challenge.challenge_id,
    title: challenge.title,
    track_id: challenge.track_id,
    level: challenge.level,
    scenario_category: challenge.scenario_category,
    risk_context: challenge.risk_context,
    synthetic: true,
  };
}

export function loadCanonicalCatalog() {
  const raw = readFileSync(CATALOG_PATH, 'utf8');
  return JSON.parse(raw);
}

export function createCatalogApi(catalog = loadCanonicalCatalog()) {
  const { skillMap, trackMap, challengeMap } = buildIndex(catalog);

  function listTracks() {
    return success({ tracks: catalog.tracks.map(projectTrackList) });
  }

  function getTrack(trackId) {
    try {
      assertId(trackId, 'track_id');
      const track = trackMap.get(trackId);
      if (!track) {
        throw new ContractError('UNKNOWN_TRACK', `Trilha não encontrada: ${trackId}`, { track_id: trackId });
      }
      return success({ track: projectTrack(track) });
    } catch (error) {
      return failure(error);
    }
  }
  function listSkills(filters = {}) {
    try {
      assertObject(filters, 'Filtros de list_skills devem ser objeto.');
      const allowed = new Set(['skill_id', 'domain', 'level', 'critical_security']);
      const unsupported = Object.keys(filters).filter((key) => !allowed.has(key));
      if (unsupported.length > 0) {
        throw new ContractError('INVALID_INPUT', `Filtro não suportado: ${unsupported.join(', ')}`);
      }
      for (const field of ['skill_id', 'domain', 'level']) {
        if (filters[field] !== undefined) assertId(filters[field], field);
      }
      if (filters.domain !== undefined && !['ai', 'cyber', 'data', 'human'].includes(filters.domain)) {
        throw new ContractError('INVALID_INPUT', 'domain inválido.', { field: 'domain' });
      }
      if (filters.level !== undefined && !['L0', 'L1', 'L2', 'L3'].includes(filters.level)) {
        throw new ContractError('INVALID_INPUT', 'level inválido.', { field: 'level' });
      }
      if (filters.critical_security !== undefined && typeof filters.critical_security !== 'boolean') {
        throw new ContractError('INVALID_INPUT', 'critical_security deve ser boolean.', { field: 'critical_security' });
      }

      let skills = catalog.competencies;
      if (filters.skill_id !== undefined) {
        if (!skillMap.has(filters.skill_id)) {
          throw new ContractError('UNKNOWN_SKILL', `Skill não encontrada: ${filters.skill_id}`, { skill_id: filters.skill_id });
        }
        skills = skills.filter((skill) => skill.skill_id === filters.skill_id);
      }
      if (filters.domain !== undefined) {
        skills = skills.filter((skill) => skill.domain === filters.domain);
      }
      if (filters.level !== undefined) {
        skills = skills.filter((skill) => skill.level === filters.level);
      }
      if (filters.critical_security !== undefined) {
        skills = skills.filter((skill) => (skill.critical_security === true) === filters.critical_security);
      }

      return success({ skills: skills.map(projectSkill) });
    } catch (error) {
      return failure(error);
    }
  }

  function getChallenge(challengeId) {
    try {
      assertId(challengeId, 'challenge_id');
      const challenge = challengeMap.get(challengeId);
      if (!challenge) {
        throw new ContractError(
          'UNKNOWN_CHALLENGE',
          `Challenge não encontrado: ${challengeId}`,
          { challenge_id: challengeId },
        );
      }
      return success({ challenge: projectChallenge(challenge) });
    } catch (error) {
      return failure(error);
    }
  }

  return { listTracks, getTrack, listSkills, getChallenge };
}
function asToolResult(payload) {
  return {
    isError: payload.ok !== true,
    content: [{ type: 'text', text: JSON.stringify(payload) }],
  };
}

const emptyInputSchema = z.object({}).strict();
const getTrackInputSchema = z.object({ track_id: z.string() }).strict();
const listSkillsInputSchema = z.object({
  skill_id: z.string().min(1).optional(),
  domain: z.enum(['ai', 'cyber', 'data', 'human']).optional(),
  level: z.enum(['L0', 'L1', 'L2', 'L3']).optional(),
  critical_security: z.boolean().optional(),
}).strict();
const getChallengeInputSchema = z.object({ challenge_id: z.string() }).strict();

export function createMcpServer(catalog = loadCanonicalCatalog()) {
  const api = createCatalogApi(catalog);
  const server = new McpServer(
    { name: 'geo-explorer-trustpath-ai', version: '0.1.0' },
    { capabilities: { tools: {} } },
  );

  server.registerTool(
    'list_tracks',
    {
      description: 'Lista projeções mínimas das trilhas sintéticas canônicas.',
      inputSchema: emptyInputSchema,
    },
    () => asToolResult(api.listTracks()),
  );
  server.registerTool(
    'get_track',
    {
      description: 'Obtém uma projeção mínima de uma trilha por track_id exato.',
      inputSchema: getTrackInputSchema,
    },
    ({ track_id }) => asToolResult(api.getTrack(track_id)),
  );

  server.registerTool(
    'list_skills',
    {
      description: 'Lista skills sintéticas com filtros exatos opcionais.',
      inputSchema: listSkillsInputSchema,
    },
    (filters) => asToolResult(api.listSkills(filters)),
  );

  server.registerTool(
    'get_challenge',
    {
      description: 'Obtém uma projeção mínima de challenge por challenge_id exato.',
      inputSchema: getChallengeInputSchema,
    },
    ({ challenge_id }) => asToolResult(api.getChallenge(challenge_id)),
  );

  return server;
}

export function startStdio() {
  return serveStdio(() => createMcpServer());
}

const isMain = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  startStdio();
}
