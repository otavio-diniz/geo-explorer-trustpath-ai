import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

// ---------------------------------------------------------------------------
// Catálogo sintético — carregado uma vez em módulo load
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = join(__dirname, '..', 'data', 'synthetic', 'catalog.json');

let _catalog = null;

function loadCatalog() {
  if (_catalog) return _catalog;
  const raw = readFileSync(CATALOG_PATH, 'utf8');
  _catalog = JSON.parse(raw);
  return _catalog;
}

// ---------------------------------------------------------------------------
// Campos obrigatórios do input
// ---------------------------------------------------------------------------

const REQUIRED_FIELDS = ['track_id', 'level', 'role_id', 'scenario_category', 'risk_context'];

const VALID_LEVELS = ['L0', 'L1', 'L2', 'L3'];

// ---------------------------------------------------------------------------
// _resolveChallengeFromCatalog — função auxiliar testável com catálogo injetado
//
// Permite testes de fail-safes sem alterar catalog.json permanentemente.
// Retorna o challenge completo ou um objeto de erro.
// ---------------------------------------------------------------------------

/**
 * @param {object} input - campos validados de /desafio
 * @param {object} catalog - catálogo (pode ser injetado em memória para testes)
 * @returns {object} challenge completo ou { error, ... }
 */
export function _resolveChallengeFromCatalog(input, catalog) {
  // -------------------------------------------------------------------------
  // 1. Verificação sintética do catálogo
  // -------------------------------------------------------------------------

  if (catalog.synthetic !== true) {
    return { error: 'SYNTHETIC_DATA_REQUIRED', message: 'catalog.synthetic deve ser true.' };
  }

  // -------------------------------------------------------------------------
  // 2. Resolver track_id exato
  // -------------------------------------------------------------------------

  const tracks = catalog.tracks ?? [];
  const track = tracks.find((t) => t.track_id === input.track_id);

  if (!track) {
    return {
      error: 'UNKNOWN_TRACK',
      message: `Trilha não encontrada: "${input.track_id}".`,
    };
  }

  // -------------------------------------------------------------------------
  // 3. Verificar final_challenge_id
  // -------------------------------------------------------------------------

  if (track.final_challenge_id === null || track.final_challenge_id === undefined) {
    return {
      error: 'CHALLENGE_NOT_AVAILABLE',
      message: `A trilha "${input.track_id}" ainda não possui desafio final disponível.`,
    };
  }

  // -------------------------------------------------------------------------
  // 4. Resolver challenge_id exato dentro da trilha
  // -------------------------------------------------------------------------

  const challenges = track.challenges ?? [];
  const challenge = challenges.find((c) => c.challenge_id === track.final_challenge_id);

  if (!challenge) {
    return {
      error: 'UNKNOWN_CHALLENGE',
      message: `Challenge "${track.final_challenge_id}" referenciado em final_challenge_id não encontrado em challenges[].`,
    };
  }

  // -------------------------------------------------------------------------
  // 5. Verificação sintética do challenge
  // -------------------------------------------------------------------------

  if (challenge.synthetic !== true) {
    return { error: 'SYNTHETIC_DATA_REQUIRED', message: 'challenge.synthetic deve ser true.' };
  }

  // -------------------------------------------------------------------------
  // 6. Verificação sintética dos componentes obrigatórios do dossiê
  // -------------------------------------------------------------------------

  const sources = challenge.synthetic_inputs?.sources ?? [];
  const syntheticInputsFlag = challenge.synthetic_inputs?.synthetic;

  if (syntheticInputsFlag !== true) {
    return { error: 'SYNTHETIC_DATA_REQUIRED', message: 'challenge.synthetic_inputs.synthetic deve ser true.' };
  }

  for (const src of sources) {
    if (src.synthetic !== true) {
      return {
        error: 'SYNTHETIC_DATA_REQUIRED',
        message: `Fonte "${src.source_id}" não declara synthetic=true.`,
      };
    }
    // Verificar claims dentro de AI-DRAFT sources
    if (Array.isArray(src.claims)) {
      for (const claim of src.claims) {
        if (claim.synthetic !== true) {
          return {
            error: 'SYNTHETIC_DATA_REQUIRED',
            message: `Claim "${claim.claim_id}" em "${src.source_id}" não declara synthetic=true.`,
          };
        }
      }
    }
    // Verificar records dentro de DATA sources
    if (Array.isArray(src.records)) {
      for (const rec of src.records) {
        if (rec.synthetic !== true) {
          return {
            error: 'SYNTHETIC_DATA_REQUIRED',
            message: `Registro "${rec.client_id}" em "${src.source_id}" não declara synthetic=true.`,
          };
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // 7. Verificar proveniência dos claims (somente lacunas NÃO intencionais)
  // -------------------------------------------------------------------------

  const sourceIndex = new Set(sources.map((s) => s.source_id));

  for (const src of sources) {
    if (!Array.isArray(src.claims)) continue;
    for (const claim of src.claims) {
      // Lacuna intencional: não bloqueia a geração
      if (claim.intentional_provenance_gap === true) continue;
      // source_ids ausente ou vazio é PROVENANCE_GAP para claim não intencional
      if (!Array.isArray(claim.source_ids) || claim.source_ids.length === 0) {
        return {
          error: 'PROVENANCE_GAP',
          message: `Claim "${claim.claim_id}" não possui source_ids válidos e não está marcado como lacuna intencional.`,
          claim_id: claim.claim_id,
          reason: 'MISSING_OR_EMPTY_SOURCE_IDS',
        };
      }
      // Verificar cada source_id referenciado
      for (const sid of claim.source_ids) {
        if (!sourceIndex.has(sid)) {
          return {
            error: 'PROVENANCE_GAP',
            message: `Claim "${claim.claim_id}" referencia source_id "${sid}" inexistente no dossiê.`,
            claim_id: claim.claim_id,
            missing_source_id: sid,
          };
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // 8. Compatibilidade exata: track/level/role/scenario/risk
  // -------------------------------------------------------------------------

  const trackIdMatch = challenge.track_id === input.track_id;
  const levelMatch = challenge.level === input.level;
  const roleMatch = Array.isArray(challenge.role_ids) && challenge.role_ids.includes(input.role_id);
  const scenarioMatch = challenge.scenario_category === input.scenario_category;
  const riskMatch = challenge.risk_context === input.risk_context;

  if (!trackIdMatch || !levelMatch || !roleMatch || !scenarioMatch || !riskMatch) {
    return {
      error: 'CHALLENGE_NOT_AVAILABLE',
      message: 'O desafio encontrado não é compatível com os parâmetros fornecidos (track_id/level/role_id/scenario_category/risk_context).',
    };
  }

  // -------------------------------------------------------------------------
  // 9. Montar output determinístico com os 12 campos funcionais
  // -------------------------------------------------------------------------

  return {
    challenge_id: challenge.challenge_id,
    title: challenge.title,
    scenario: challenge.scenario,
    task: challenge.task,
    constraints: challenge.constraints,
    synthetic_inputs: challenge.synthetic_inputs,
    expected_evidence: challenge.expected_evidence,
    quality_criteria: challenge.quality_criteria,
    security_criteria: challenge.security_criteria,
    human_gate_condition: challenge.human_gate_condition,
    hints_progressive: challenge.hints_progressive,
    post_challenge_reflection: challenge.post_challenge_reflection,
  };
}

// ---------------------------------------------------------------------------
// Função principal exportada
// ---------------------------------------------------------------------------

/**
 * Gera o desafio canônico a partir do catálogo sintético.
 *
 * @param {object} input
 * @param {string} input.track_id           - obrigatório
 * @param {string} input.level              - obrigatório: L0|L1|L2|L3
 * @param {string} input.role_id            - obrigatório
 * @param {string} input.scenario_category  - obrigatório
 * @param {string} input.risk_context       - obrigatório
 * @returns {object} ChallengeOutput | ChallengeError
 */
export function desafio(input) {
  // -------------------------------------------------------------------------
  // Validação de input e campos obrigatórios
  // -------------------------------------------------------------------------

  if (input === null || input === undefined || typeof input !== 'object') {
    return {
      error: 'MISSING_REQUIRED_INPUT',
      message: 'Input ausente ou inválido.',
      missing_fields: REQUIRED_FIELDS,
    };
  }

  const missing = REQUIRED_FIELDS.filter(
    (f) => input[f] === undefined || input[f] === null || String(input[f]).trim() === ''
  );

  if (missing.length > 0) {
    return {
      error: 'MISSING_REQUIRED_INPUT',
      message: `Campo(s) obrigatório(s) ausente(s): ${missing.join(', ')}.`,
      missing_fields: missing,
    };
  }

  // -------------------------------------------------------------------------
  // Validação de level
  // -------------------------------------------------------------------------

  if (!VALID_LEVELS.includes(input.level)) {
    return {
      error: 'INVALID_LEVEL',
      message: `level inválido: "${input.level}". Valores válidos: ${VALID_LEVELS.join(', ')}.`,
      field: 'level',
    };
  }

  // -------------------------------------------------------------------------
  // Resolver via catálogo
  // -------------------------------------------------------------------------

  const catalog = loadCatalog();
  return _resolveChallengeFromCatalog(input, catalog);
}
