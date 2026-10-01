import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  TOOL_NAMES,
  createCatalogApi,
  createMcpServer,
  loadCanonicalCatalog,
} from '../mcp/server.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CATALOG_PATH = join(ROOT, 'data', 'synthetic', 'catalog.json');
const TRACK_ID = 'TRK-AI-SAFE-DOCS-01';
const CHALLENGE_ID = 'CH-TRK-AI-SAFE-DOCS-01-L2-01';

function sha256(path) {
  const canonical = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
  return createHash('sha256').update(canonical, 'utf8').digest('hex').toUpperCase();
}

function api() {
  return createCatalogApi(loadCanonicalCatalog());
}

function startWireClient() {
  const child = spawn(process.execPath, [join(ROOT, 'mcp', 'server.js')], {
    cwd: ROOT,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');

  let stdoutBuffer = '';
  let stderr = '';
  const nonJson = [];
  const messages = [];
  const waiters = new Map();

  function handleLine(line) {
    const text = line.trim();
    if (!text) return;
    let message;
    try {
      message = JSON.parse(text);
    } catch {
      nonJson.push(text);
      return;
    }
    messages.push(message);
    const waiter = waiters.get(String(message.id));
    if (waiter) {
      waiters.delete(String(message.id));
      clearTimeout(waiter.timer);
      waiter.resolve(message);
    }
  }

  child.stdout.on('data', (chunk) => {
    stdoutBuffer += chunk;
    let index;
    while ((index = stdoutBuffer.indexOf('\n')) !== -1) {
      const line = stdoutBuffer.slice(0, index);
      stdoutBuffer = stdoutBuffer.slice(index + 1);
      handleLine(line);
    }
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });

  const exitPromise = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({ code, signal }));
  });

  function request(id, method, params = {}) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        waiters.delete(String(id));
        reject(new Error(`Timeout aguardando resposta MCP id=${id}`));
      }, 5000);
      waiters.set(String(id), { resolve, reject, timer });
      child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
    });
  }

  function notify(method, params = {}) {
    child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method, params })}\n`);
  }

  async function close() {
    child.stdin.end();
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout encerrando MCP stdio')), 5000));
    const result = await Promise.race([exitPromise, timeout]);
    if (stdoutBuffer.trim()) handleLine(stdoutBuffer);
    return result;
  }

  return {
    child,
    request,
    notify,
    close,
    messages,
    nonJson,
    get stderr() {
      return stderr;
    },
  };
}

function keys(value) {
  return Object.keys(value).sort();
}

test('M01_SERVER_TOOL_REGISTRY — exatamente quatro tools aprovadas', () => {
  const server = createMcpServer();
  assert.deepEqual(keys(server._registeredTools), [...TOOL_NAMES].sort());
  assert.equal(Object.keys(server._registeredTools).length, 4);
});

test('M02_LIST_TRACKS_VALID — projeção exata do contrato', () => {
  const result = api().listTracks();
  assert.equal(result.ok, true);
  assert.equal(result.synthetic, true);
  assert.equal(result.tracks.length, 1);
  assert.deepEqual(keys(result.tracks[0]), [
    'final_challenge_id', 'role_ids', 'target_goals', 'title', 'track_id',
  ]);
  assert.equal(result.tracks[0].track_id, TRACK_ID);
});

test('M03_GET_TRACK_VALID — projeção exata e matching exato', () => {
  const result = api().getTrack(TRACK_ID);
  assert.equal(result.ok, true);
  assert.deepEqual(keys(result.track), [
    'final_challenge_id', 'goal_tags', 'module_sequence', 'prerequisites', 'role_ids',
    'target_goals', 'title', 'track_id', 'why_this_track',
  ]);
  assert.equal(result.track.final_challenge_id, CHALLENGE_ID);
});

test('M04_UNKNOWN_TRACK — ID inexistente falha fechado', () => {
  const result = api().getTrack('TRK-UNKNOWN-999');
  assert.equal(result.ok, false);
  assert.equal(result.error, 'UNKNOWN_TRACK');
});

test('M05_LIST_SKILLS_VALID — projeção exata das skills', () => {
  const result = api().listSkills();
  assert.equal(result.ok, true);
  assert.equal(result.skills.length, 8);
  for (const skill of result.skills) {
    assert.deepEqual(keys(skill), ['critical_security', 'domain', 'level', 'skill_id', 'title']);
  }
});

test('M06_FILTERS_EXACT — somente filtros aprovados e AND exato', () => {
  const service = api();
  assert.deepEqual(service.listSkills({ skill_id: 'AI-01' }).skills.map((s) => s.skill_id), ['AI-01']);
  assert.deepEqual(service.listSkills({ domain: 'data' }).skills.map((s) => s.skill_id), ['DA-01', 'DA-05']);
  assert.equal(service.listSkills({ level: 'L2' }).skills.length, 8);
  assert.deepEqual(service.listSkills({ critical_security: true }).skills.map((s) => s.skill_id), ['CY-01']);
  assert.deepEqual(service.listSkills({ domain: 'data', level: 'L2', critical_security: false }).skills.map((s) => s.skill_id), ['DA-01', 'DA-05']);
  assert.equal(service.listSkills({ level: 'L0' }).skills.length, 0);
  assert.equal(service.listSkills({ domain: 'cyber', critical_security: false }).skills.length, 0);
  assert.equal(service.listSkills({ skill_id: 'NO-SUCH-SKILL' }).error, 'UNKNOWN_SKILL');
  assert.equal(service.listSkills({ domain: 'finance' }).error, 'INVALID_INPUT');
  assert.equal(service.listSkills({ level: 'L9' }).error, 'INVALID_INPUT');
  assert.equal(service.listSkills({ critical_security: 'true' }).error, 'INVALID_INPUT');
  assert.equal(service.listSkills({ track_id: TRACK_ID }).error, 'INVALID_INPUT');
});

test('M07_GET_CHALLENGE_VALID — projeção exata sem dossiê ampliado', () => {
  const result = api().getChallenge(CHALLENGE_ID);
  assert.equal(result.ok, true);
  assert.deepEqual(keys(result.challenge), [
    'challenge_id', 'level', 'risk_context', 'scenario_category', 'synthetic', 'title', 'track_id',
  ]);
  assert.equal(result.challenge.challenge_id, CHALLENGE_ID);
  assert.equal(result.challenge.synthetic, true);
});

test('M08_UNKNOWN_CHALLENGE — ID inexistente falha fechado', () => {
  const result = api().getChallenge('CH-UNKNOWN-999');
  assert.equal(result.ok, false);
  assert.equal(result.error, 'UNKNOWN_CHALLENGE');
});

test('M09_SYNTHETIC_TRUE — respostas declaram origem sintética', () => {
  const service = api();
  assert.equal(service.listTracks().synthetic, true);
  assert.equal(service.getTrack(TRACK_ID).synthetic, true);
  assert.equal(service.listSkills().synthetic, true);
  assert.equal(service.getChallenge(CHALLENGE_ID).synthetic, true);
});

test('M10_DETERMINISM — chamadas idênticas produzem resultados idênticos', () => {
  const service = api();
  assert.deepEqual(service.listTracks(), service.listTracks());
  assert.deepEqual(service.getTrack(TRACK_ID), service.getTrack(TRACK_ID));
  assert.deepEqual(service.listSkills({ domain: 'data' }), service.listSkills({ domain: 'data' }));
  assert.deepEqual(service.getChallenge(CHALLENGE_ID), service.getChallenge(CHALLENGE_ID));
});

test('M11_INVALID_INPUT — input lógico malformado é rejeitado', () => {
  const service = api();
  assert.equal(service.getTrack('  ').error, 'INVALID_INPUT');
  assert.equal(service.listSkills({ domain: ' data' }).error, 'INVALID_INPUT');
  assert.equal(service.listSkills({ skill_id: 123 }).error, 'INVALID_INPUT');
  assert.equal(service.getChallenge('CH-UNKNOWN-999 ').error, 'INVALID_INPUT');
});

test('M12_UNKNOWN_TOOL_WIRE — stdio real rejeita tool não registrada', async () => {
  const wire = startWireClient();
  try {
    const init = await wire.request(1, 'initialize', {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: { name: 'geo-explorer-mcp-test', version: '0.1.0' },
    });
    assert.equal(init.error, undefined);
    assert.equal(init.result.protocolVersion, '2025-11-25');
    wire.notify('notifications/initialized');

    const listed = await wire.request(2, 'tools/list');
    assert.equal(listed.error, undefined);
    assert.deepEqual(listed.result.tools.map((tool) => tool.name).sort(), [...TOOL_NAMES].sort());

    const valid = await wire.request(3, 'tools/call', { name: 'list_tracks', arguments: {} });
    assert.equal(valid.error, undefined);
    const payload = JSON.parse(valid.result.content[0].text);
    assert.equal(payload.ok, true);

    const unknown = await wire.request(4, 'tools/call', { name: 'diagnostico', arguments: {} });
    assert.equal(unknown.result, undefined);
    assert.equal(unknown.error.code, -32602);
    assert.match(unknown.error.message, /Tool diagnostico not found/);
  } finally {
    const exit = await wire.close();
    assert.equal(exit.code, 0);
    assert.deepEqual(wire.nonJson, []);
    assert.equal(wire.stderr, '');
  }
});

test('M13_CATALOG_IMMUTABLE — chamadas MCP não alteram catalog.json', () => {
  const before = sha256(CATALOG_PATH);
  const service = api();
  service.listTracks();
  service.getTrack(TRACK_ID);
  service.listSkills({ critical_security: true });
  service.getChallenge(CHALLENGE_ID);
  const after = sha256(CATALOG_PATH);
  assert.equal(after, before);
});

test('M14_REAL_CORE_IDS — integração usa IDs reais do Core', () => {
  const service = api();
  const track = service.getTrack(TRACK_ID);
  const challenge = service.getChallenge(CHALLENGE_ID);
  const skills = service.listSkills();
  const skillIds = new Set(skills.skills.map((skill) => skill.skill_id));

  for (const skillId of track.track.module_sequence) {
    assert.equal(skillIds.has(skillId), true, skillId);
  }
  assert.equal(track.track.final_challenge_id, challenge.challenge.challenge_id);
});

const CORE_BASELINE = Object.freeze({
  'commands/trilha.js': '9274117D2751C7A6FC8F49B46F6164EC99F749F843ED796BAE982FD7ECB4F97D',
  'commands/desafio.js': '78E01A03369E42D1278BBD61D4E210AF0DAD98D66ACEEA0B7259F980BA061324',
  'commands/certificado.js': '8FAA5A41CB471B06D46900C67D7020D3E995A4E499E8D81B4D56E0E9A20FE285',
  'tests/trilha.test.js': '380BD9081E38BB7E694223A70AF1E164B41D458CE7A8C3D8E73401BE764B71BF',
  'tests/desafio.test.js': 'B0820AB5A309FA6438C182942D1A98901BD5E72BC82DBAA56BBD9194979C0800',
  'tests/certificado.test.js': 'B48B9F9FEDFCE0047B72F27EA516A071157458E9941CCB42E971110A126CA655',
});

test('M15_CORE_REGRESSION_GUARD — arquivos Core permanecem no baseline autenticado', () => {
  for (const [relative, expected] of Object.entries(CORE_BASELINE)) {
    assert.equal(sha256(join(ROOT, ...relative.split('/'))), expected, relative);
  }
});
