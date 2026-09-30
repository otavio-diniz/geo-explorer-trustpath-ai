import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { desafio, _resolveChallengeFromCatalog } from '../commands/desafio.js';
import { trilha } from '../commands/trilha.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = join(__dirname, '..', 'data', 'synthetic', 'catalog.json');

// ---------------------------------------------------------------------------
// Input canônico — compartilhado entre casos
// ---------------------------------------------------------------------------

const CANONICAL_INPUT = {
  track_id: 'TRK-AI-SAFE-DOCS-01',
  level: 'L2',
  role_id: 'finance_admin_sme',
  scenario_category: 'trustpath_decision_gate',
  risk_context: 'sensitive_data',
};

const CANONICAL_CHALLENGE_ID = 'CH-TRK-AI-SAFE-DOCS-01-L2-01';
const CANONICAL_TITLE = 'TrustPath Decision Gate — Revisão Segura de Proposta Assistida por IA';

// ---------------------------------------------------------------------------
// T01 — Caminho válido com input canônico
// ---------------------------------------------------------------------------

test('T01_VALID_CHALLENGE — input canônico retorna desafio completo sem erro', () => {
  const result = desafio(CANONICAL_INPUT);

  // Sem erro
  assert.equal(result.error, undefined, 'Não deve retornar erro no caminho válido');

  // challenge_id exato
  assert.equal(result.challenge_id, CANONICAL_CHALLENGE_ID,
    'challenge_id deve ser ' + CANONICAL_CHALLENGE_ID);

  // title exato
  assert.equal(result.title, CANONICAL_TITLE,
    'title deve ser exato conforme contrato');

  // scenario coerente
  assert.ok(typeof result.scenario === 'string' && result.scenario.length > 0,
    'scenario deve ser string não-vazia');
  assert.ok(result.scenario.includes('Marina'), 'scenario deve mencionar a persona Marina');
});

// ---------------------------------------------------------------------------
// T02 — Campo obrigatório ausente
// ---------------------------------------------------------------------------

test('T02_MISSING_INPUT — track_id ausente retorna MISSING_REQUIRED_INPUT', () => {
  const { track_id: _omit, ...without } = CANONICAL_INPUT;
  const result = desafio(without);

  assert.equal(result.error, 'MISSING_REQUIRED_INPUT');
  assert.ok(Array.isArray(result.missing_fields), 'missing_fields deve ser array');
  assert.ok(result.missing_fields.includes('track_id'), 'missing_fields deve conter track_id');
  assert.equal(result.challenge_id, undefined, 'Não deve retornar challenge parcial');
});

test('T02b_MISSING_INPUT — level ausente retorna MISSING_REQUIRED_INPUT', () => {
  const { level: _omit, ...without } = CANONICAL_INPUT;
  const result = desafio(without);

  assert.equal(result.error, 'MISSING_REQUIRED_INPUT');
  assert.ok(result.missing_fields.includes('level'));
  assert.equal(result.challenge_id, undefined);
});

test('T02c_MISSING_INPUT — role_id ausente retorna MISSING_REQUIRED_INPUT', () => {
  const { role_id: _omit, ...without } = CANONICAL_INPUT;
  const result = desafio(without);

  assert.equal(result.error, 'MISSING_REQUIRED_INPUT');
  assert.ok(result.missing_fields.includes('role_id'));
});

test('T02d_MISSING_INPUT — scenario_category ausente retorna MISSING_REQUIRED_INPUT', () => {
  const { scenario_category: _omit, ...without } = CANONICAL_INPUT;
  const result = desafio(without);

  assert.equal(result.error, 'MISSING_REQUIRED_INPUT');
  assert.ok(result.missing_fields.includes('scenario_category'));
});

test('T02e_MISSING_INPUT — risk_context ausente retorna MISSING_REQUIRED_INPUT', () => {
  const { risk_context: _omit, ...without } = CANONICAL_INPUT;
  const result = desafio(without);

  assert.equal(result.error, 'MISSING_REQUIRED_INPUT');
  assert.ok(result.missing_fields.includes('risk_context'));
});

// ---------------------------------------------------------------------------
// T03 — Level inválido
// ---------------------------------------------------------------------------

test('T03_INVALID_LEVEL — level fora de L0|L1|L2|L3 retorna INVALID_LEVEL', () => {
  const result = desafio({ ...CANONICAL_INPUT, level: 'L9' });

  assert.equal(result.error, 'INVALID_LEVEL');
  assert.equal(result.challenge_id, undefined, 'Não deve retornar challenge parcial');
});

test('T03b_INVALID_LEVEL — level string vazia retorna MISSING_REQUIRED_INPUT', () => {
  const result = desafio({ ...CANONICAL_INPUT, level: '' });

  assert.equal(result.error, 'MISSING_REQUIRED_INPUT');
  assert.ok(result.missing_fields.includes('level'));
});

// ---------------------------------------------------------------------------
// T04 — track_id inexistente
// ---------------------------------------------------------------------------

test('T04_UNKNOWN_TRACK — track_id inexistente retorna UNKNOWN_TRACK', () => {
  const result = desafio({ ...CANONICAL_INPUT, track_id: 'TRK-INEXISTENTE-999' });

  assert.equal(result.error, 'UNKNOWN_TRACK');
  assert.equal(result.challenge_id, undefined, 'Não deve retornar challenge parcial');
});

// ---------------------------------------------------------------------------
// T05 — Proveniência sintética
// ---------------------------------------------------------------------------

test('T05_SYNTHETIC_PROVENANCE — catalog.synthetic=true', () => {
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  assert.equal(catalog.synthetic, true, 'catalog.synthetic deve ser true');
});

test('T05b_SYNTHETIC_PROVENANCE — challenge.synthetic=true na definição', () => {
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  const track = catalog.tracks.find((t) => t.track_id === 'TRK-AI-SAFE-DOCS-01');
  const challenge = track.challenges.find((c) => c.challenge_id === CANONICAL_CHALLENGE_ID);
  assert.equal(challenge.synthetic, true, 'challenge.synthetic deve ser true');
});

test('T05c_SYNTHETIC_PROVENANCE — todas as fontes do dossiê têm synthetic=true', () => {
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  const track = catalog.tracks.find((t) => t.track_id === 'TRK-AI-SAFE-DOCS-01');
  const challenge = track.challenges.find((c) => c.challenge_id === CANONICAL_CHALLENGE_ID);
  const sources = challenge.synthetic_inputs.sources;

  const requiredSourceIds = ['DOC-001', 'DOC-002', 'DATA-001', 'AI-DRAFT-001'];
  for (const sid of requiredSourceIds) {
    const src = sources.find((s) => s.source_id === sid);
    assert.ok(src, `Fonte ${sid} deve existir no dossiê`);
    assert.equal(src.synthetic, true, `${sid}.synthetic deve ser true`);
  }
});

test('T05d_SYNTHETIC_PROVENANCE — registros de DATA-001 têm synthetic=true', () => {
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  const track = catalog.tracks.find((t) => t.track_id === 'TRK-AI-SAFE-DOCS-01');
  const challenge = track.challenges.find((c) => c.challenge_id === CANONICAL_CHALLENGE_ID);
  const data001 = challenge.synthetic_inputs.sources.find((s) => s.source_id === 'DATA-001');

  for (const rec of data001.records) {
    assert.equal(rec.synthetic, true, `Registro ${rec.client_id} deve ter synthetic=true`);
  }
});

test('T05e_SYNTHETIC_PROVENANCE — claims de AI-DRAFT-001 têm synthetic=true', () => {
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  const track = catalog.tracks.find((t) => t.track_id === 'TRK-AI-SAFE-DOCS-01');
  const challenge = track.challenges.find((c) => c.challenge_id === CANONICAL_CHALLENGE_ID);
  const draft = challenge.synthetic_inputs.sources.find((s) => s.source_id === 'AI-DRAFT-001');

  for (const claim of draft.claims) {
    assert.equal(claim.synthetic, true, `${claim.claim_id}.synthetic deve ser true`);
  }
});

test('T05f_SYNTHETIC_PROVENANCE — emails somente em domínio example.invalid', () => {
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  const track = catalog.tracks.find((t) => t.track_id === 'TRK-AI-SAFE-DOCS-01');
  const challenge = track.challenges.find((c) => c.challenge_id === CANONICAL_CHALLENGE_ID);
  const str = JSON.stringify(challenge.synthetic_inputs);

  // Extrair todos os endereços de e-mail presentes
  const emailRegex = /[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  let match;
  while ((match = emailRegex.exec(str)) !== null) {
    assert.equal(match[1], 'example.invalid',
      `E-mail com domínio "${match[1]}" encontrado; somente example.invalid é permitido`);
  }
});

test('T05g_SYNTHETIC_PROVENANCE — definição não sintética injetada retorna SYNTHETIC_DATA_REQUIRED', () => {
  // Injetar catálogo em memória com synthetic=false para testar fail-safe
  const fakeCatalog = {
    synthetic: false,
    tracks: [],
    valid_levels: ['L0', 'L1', 'L2', 'L3'],
    sensitive_risk_keywords: [],
  };

  const result = _resolveChallengeFromCatalog(CANONICAL_INPUT, fakeCatalog);
  assert.equal(result.error, 'SYNTHETIC_DATA_REQUIRED');
  assert.equal(result.challenge_id, undefined, 'Não deve retornar challenge parcial');
});

// ---------------------------------------------------------------------------
// T06 — Security Gate
// ---------------------------------------------------------------------------

test('T06_SECURITY_GATE — security_criteria no output menciona minimização', () => {
  const result = desafio(CANONICAL_INPUT);
  assert.equal(result.error, undefined);

  const sc = result.security_criteria;
  assert.ok(Array.isArray(sc) && sc.length > 0, 'security_criteria deve ser array não-vazio');

  const scText = sc.join(' ');
  assert.ok(scText.toLowerCase().includes('minimiz'),
    'security_criteria deve mencionar minimização');
});

test('T06b_SECURITY_GATE — security_criteria menciona desconto >5% e Human Gate', () => {
  const result = desafio(CANONICAL_INPUT);
  assert.equal(result.error, undefined);

  const scText = result.security_criteria.join(' ');
  assert.ok(scText.includes('5%'), 'security_criteria deve mencionar limite de 5% de desconto');
  assert.ok(scText.toLowerCase().includes('human gate') || scText.toLowerCase().includes('human_gate'),
    'security_criteria deve mencionar Human Gate');
});

test('T06c_SECURITY_GATE — security_criteria menciona proibição de envio externo', () => {
  const result = desafio(CANONICAL_INPUT);
  assert.equal(result.error, undefined);

  const scText = result.security_criteria.join(' ').toLowerCase();
  assert.ok(scText.includes('externo') || scText.includes('external'),
    'security_criteria deve mencionar envio externo');
});

test('T06d_SECURITY_GATE — security_criteria menciona proibição de dado real/segredo', () => {
  const result = desafio(CANONICAL_INPUT);
  assert.equal(result.error, undefined);

  const scText = result.security_criteria.join(' ').toLowerCase();
  assert.ok(scText.includes('real') || scText.includes('segredo') || scText.includes('credencial'),
    'security_criteria deve mencionar proibição de dado real, segredo ou credencial');
});

// ---------------------------------------------------------------------------
// T07 — Output schema: 12 campos obrigatórios
// ---------------------------------------------------------------------------

test('T07_OUTPUT_SCHEMA — output de sucesso contém os 12 campos funcionais', () => {
  const result = desafio(CANONICAL_INPUT);
  assert.equal(result.error, undefined);

  const requiredFields = [
    'challenge_id',
    'title',
    'scenario',
    'task',
    'constraints',
    'synthetic_inputs',
    'expected_evidence',
    'quality_criteria',
    'security_criteria',
    'human_gate_condition',
    'hints_progressive',
    'post_challenge_reflection',
  ];

  for (const field of requiredFields) {
    assert.ok(field in result, `Campo obrigatório "${field}" deve estar presente no output`);
    assert.notEqual(result[field], null, `Campo "${field}" não pode ser null`);
    assert.notEqual(result[field], undefined, `Campo "${field}" não pode ser undefined`);
  }
});

// ---------------------------------------------------------------------------
// T08 — Determinismo
// ---------------------------------------------------------------------------

test('T08_DETERMINISM — mesmo input executado duas vezes produz resultado idêntico', () => {
  const result1 = desafio(CANONICAL_INPUT);
  const result2 = desafio(CANONICAL_INPUT);

  assert.deepEqual(result1, result2, 'Duas chamadas idênticas devem produzir resultado idêntico');

  // challenge_id idêntico
  assert.equal(result1.challenge_id, result2.challenge_id);
});

// ---------------------------------------------------------------------------
// T09 — Provenance Gap
// ---------------------------------------------------------------------------

test('T09a_PROVENANCE_GAP — CLAIM-002 com intentional_provenance_gap=true não bloqueia geração', () => {
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  const track = catalog.tracks.find((t) => t.track_id === 'TRK-AI-SAFE-DOCS-01');
  const challenge = track.challenges.find((c) => c.challenge_id === CANONICAL_CHALLENGE_ID);
  const draft = challenge.synthetic_inputs.sources.find((s) => s.source_id === 'AI-DRAFT-001');
  const claim002 = draft.claims.find((c) => c.claim_id === 'CLAIM-002');

  // Confirmar estrutura canônica
  assert.deepEqual(claim002.source_ids, [],
    'CLAIM-002 deve ter source_ids vazio no catálogo canônico');
  assert.equal(claim002.intentional_provenance_gap, true,
    'CLAIM-002 deve ter intentional_provenance_gap=true');

  // Geração canônica não deve ser bloqueada
  const result = desafio(CANONICAL_INPUT);
  assert.equal(result.error, undefined,
    'CLAIM-002 com intentional_provenance_gap=true não deve bloquear a geração');
  assert.equal(result.challenge_id, CANONICAL_CHALLENGE_ID);
});

test('T09b_PROVENANCE_GAP — claim sem lacuna intencional com source_id inexistente retorna PROVENANCE_GAP', () => {
  // Injetar catálogo em memória com claim inválido NÃO marcado como intencional
  const invalidClaim = {
    claim_id: 'CLAIM-INVALID',
    synthetic: true,
    text: 'Afirmação com fonte inexistente.',
    source_ids: ['SOURCE-NAO-EXISTE'],
    intentional_provenance_gap: false,
  };

  const fakeCatalog = {
    synthetic: true,
    valid_levels: ['L0', 'L1', 'L2', 'L3'],
    sensitive_risk_keywords: [],
    tracks: [
      {
        track_id: 'TRK-AI-SAFE-DOCS-01',
        final_challenge_id: 'CH-FAKE-01',
        challenges: [
          {
            challenge_id: 'CH-FAKE-01',
            synthetic: true,
            track_id: 'TRK-AI-SAFE-DOCS-01',
            level: 'L2',
            role_ids: ['finance_admin_sme'],
            scenario_category: 'trustpath_decision_gate',
            risk_context: 'sensitive_data',
            title: 'Desafio Fake — FICTÍCIO/SINTÉTICO',
            scenario: 'Cenário fake sintético.',
            task: 'Task fake.',
            constraints: [],
            synthetic_inputs: {
              synthetic: true,
              sources: [
                {
                  source_id: 'DOC-FAKE',
                  synthetic: true,
                  title: 'Documento fake — FICTÍCIO/SINTÉTICO',
                },
                {
                  source_id: 'AI-DRAFT-FAKE',
                  synthetic: true,
                  type: 'rascunho fake',
                  claims: [invalidClaim],
                },
              ],
            },
            expected_evidence: [],
            quality_criteria: [],
            security_criteria: [],
            human_gate_condition: [],
            hints_progressive: [],
            post_challenge_reflection: [],
          },
        ],
      },
    ],
  };

  const result = _resolveChallengeFromCatalog(CANONICAL_INPUT, fakeCatalog);
  assert.equal(result.error, 'PROVENANCE_GAP',
    'Claim com source_id inexistente e intentional_provenance_gap=false deve retornar PROVENANCE_GAP');
  assert.equal(result.challenge_id, undefined, 'Não deve retornar challenge parcial');
});

// ---------------------------------------------------------------------------
// T10 — Evidência insuficiente — approved_budget=null
// ---------------------------------------------------------------------------

test('T10_INSUFFICIENT_EVIDENCE — DATA-001/CL-AURORA-001 tem approved_budget=null', () => {
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  const track = catalog.tracks.find((t) => t.track_id === 'TRK-AI-SAFE-DOCS-01');
  const challenge = track.challenges.find((c) => c.challenge_id === CANONICAL_CHALLENGE_ID);
  const data001 = challenge.synthetic_inputs.sources.find((s) => s.source_id === 'DATA-001');
  const aurora = data001.records.find((r) => r.client_id === 'CL-AURORA-001');

  assert.equal(aurora.approved_budget, null,
    'CL-AURORA-001.approved_budget deve ser null no dossiê sintético');
});

test('T10b_INSUFFICIENT_EVIDENCE — quality_criteria orienta INSUFFICIENT_EVIDENCE e BLOCKED_SAFE', () => {
  const result = desafio(CANONICAL_INPUT);
  assert.equal(result.error, undefined);

  const qcText = result.quality_criteria.join(' ').toLowerCase();
  assert.ok(qcText.includes('insufficient_evidence') || qcText.includes('evidência insuficiente') || qcText.includes('insuficiente'),
    'quality_criteria deve mencionar evidência insuficiente');
  assert.ok(qcText.includes('blocked_safe'),
    'quality_criteria deve mencionar BLOCKED_SAFE como alternativa a inferência');
});

// ---------------------------------------------------------------------------
// T11 — Human Gate obrigatório (CLAIM-003 desconto >5% + CLAIM-004 envio externo)
// ---------------------------------------------------------------------------

test('T11_HUMAN_GATE_REQUIRED — human_gate_condition menciona desconto >5%', () => {
  const result = desafio(CANONICAL_INPUT);
  assert.equal(result.error, undefined);

  const hgcText = JSON.stringify(result.human_gate_condition).toLowerCase();
  assert.ok(hgcText.includes('discount') || hgcText.includes('desconto'),
    'human_gate_condition deve mencionar desconto');
  assert.ok(hgcText.includes('5%') || hgcText.includes('5 percent'),
    'human_gate_condition deve mencionar o limite de 5%');
  assert.ok(hgcText.includes('human_approval_required') || hgcText.includes('human approval'),
    'human_gate_condition deve mencionar HUMAN_APPROVAL_REQUIRED para desconto');
});

test('T11b_HUMAN_GATE_REQUIRED — human_gate_condition menciona envio externo', () => {
  const result = desafio(CANONICAL_INPUT);
  assert.equal(result.error, undefined);

  const hgcText = JSON.stringify(result.human_gate_condition).toLowerCase();
  assert.ok(hgcText.includes('external_send') || hgcText.includes('envio externo'),
    'human_gate_condition deve mencionar envio externo');
  assert.ok(hgcText.includes('stop_external_action') || hgcText.includes('human_approval_required'),
    'human_gate_condition deve mencionar STOP_EXTERNAL_ACTION ou HUMAN_APPROVAL_REQUIRED para envio externo');
});

test('T11c_HUMAN_GATE_REQUIRED — CLAIM-003 referencia DOC-002 no dossiê canônico', () => {
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  const track = catalog.tracks.find((t) => t.track_id === 'TRK-AI-SAFE-DOCS-01');
  const challenge = track.challenges.find((c) => c.challenge_id === CANONICAL_CHALLENGE_ID);
  const draft = challenge.synthetic_inputs.sources.find((s) => s.source_id === 'AI-DRAFT-001');

  const claim003 = draft.claims.find((c) => c.claim_id === 'CLAIM-003');
  assert.ok(claim003, 'CLAIM-003 deve existir no dossiê');
  assert.ok(claim003.source_ids.includes('DOC-002'),
    'CLAIM-003 deve referenciar DOC-002 (regra de desconto)');

  const claim004 = draft.claims.find((c) => c.claim_id === 'CLAIM-004');
  assert.ok(claim004, 'CLAIM-004 deve existir no dossiê');
  assert.ok(claim004.source_ids.includes('DOC-002'),
    'CLAIM-004 deve referenciar DOC-002 (regra de envio externo)');
});

// ---------------------------------------------------------------------------
// T12 — Integração /trilha + /desafio
// ---------------------------------------------------------------------------

test('T12_TRACK_CHALLENGE_INTEGRATION — trilha(marinaInput).final_challenge_id === canonical', () => {
  const marinaInput = {
    role: 'finance_admin_sme',
    target_goal: 'safe_ai_document_work',
    current_level: 'L1',
    target_level: 'L2',
    risk_context: 'sensitive_data',
  };

  const trilhaResult = trilha(marinaInput);
  assert.equal(trilhaResult.error, undefined, 'trilha() não deve retornar erro com input da Marina');
  assert.equal(trilhaResult.final_challenge_id, CANONICAL_CHALLENGE_ID,
    'trilha().final_challenge_id deve ser igual ao challenge_id canônico');
});

test('T12b_TRACK_CHALLENGE_INTEGRATION — desafio(canonicalInput).challenge_id === canonical', () => {
  const desafioResult = desafio(CANONICAL_INPUT);
  assert.equal(desafioResult.error, undefined, 'desafio() não deve retornar erro com input canônico');
  assert.equal(desafioResult.challenge_id, CANONICAL_CHALLENGE_ID,
    'desafio().challenge_id deve ser igual ao challenge_id canônico');
});

test('T12c_TRACK_CHALLENGE_INTEGRATION — IDs de trilha e desafio são exatamente iguais', () => {
  const marinaInput = {
    role: 'finance_admin_sme',
    target_goal: 'safe_ai_document_work',
    current_level: 'L1',
    target_level: 'L2',
    risk_context: 'sensitive_data',
  };

  const trilhaResult = trilha(marinaInput);
  const desafioResult = desafio(CANONICAL_INPUT);

  assert.equal(trilhaResult.error, undefined);
  assert.equal(desafioResult.error, undefined);

  assert.equal(
    trilhaResult.final_challenge_id,
    desafioResult.challenge_id,
    'trilha().final_challenge_id deve ser exatamente igual a desafio().challenge_id'
  );
});

// ---------------------------------------------------------------------------
// T04b — Challenge com track_id divergente retorna CHALLENGE_NOT_AVAILABLE
// ---------------------------------------------------------------------------

test('T04B_CHALLENGE_TRACK_MISMATCH — challenge.track_id diferente do input retorna CHALLENGE_NOT_AVAILABLE', () => {
  // Catálogo injetado em memória: track_id da trilha é TRK-AI-SAFE-DOCS-01,
  // mas o challenge aninhado declara track_id diferente.
  const fakeCatalog = {
    synthetic: true,
    valid_levels: ['L0', 'L1', 'L2', 'L3'],
    sensitive_risk_keywords: [],
    tracks: [
      {
        track_id: 'TRK-AI-SAFE-DOCS-01',
        final_challenge_id: 'CH-MISMATCH-01',
        challenges: [
          {
            challenge_id: 'CH-MISMATCH-01',
            synthetic: true,
            track_id: 'TRK-OUTRA-TRILHA',   // divergência intencional do teste
            level: 'L2',
            role_ids: ['finance_admin_sme'],
            scenario_category: 'trustpath_decision_gate',
            risk_context: 'sensitive_data',
            title: 'Challenge com track_id divergente — FICTÍCIO/SINTÉTICO',
            scenario: 'Cenário sintético para teste de mismatch.',
            task: 'Task sintética.',
            constraints: [],
            synthetic_inputs: {
              synthetic: true,
              sources: [
                {
                  source_id: 'DOC-MISMATCH',
                  synthetic: true,
                  title: 'Documento sintético — FICTÍCIO/SINTÉTICO',
                },
              ],
            },
            expected_evidence: [],
            quality_criteria: [],
            security_criteria: [],
            human_gate_condition: [],
            hints_progressive: [],
            post_challenge_reflection: [],
          },
        ],
      },
    ],
  };

  const result = _resolveChallengeFromCatalog(CANONICAL_INPUT, fakeCatalog);
  assert.equal(result.error, 'CHALLENGE_NOT_AVAILABLE',
    'challenge.track_id divergente deve retornar CHALLENGE_NOT_AVAILABLE');
  assert.equal(result.challenge_id, undefined, 'Não deve retornar challenge parcial');
});

// ---------------------------------------------------------------------------
// T09c — Claim não intencional com source_ids=[] retorna PROVENANCE_GAP
// ---------------------------------------------------------------------------

test('T09C_PROVENANCE_EMPTY_SOURCE_IDS — source_ids vazio sem lacuna intencional retorna PROVENANCE_GAP', () => {
  const fakeCatalog = {
    synthetic: true,
    valid_levels: ['L0', 'L1', 'L2', 'L3'],
    sensitive_risk_keywords: [],
    tracks: [
      {
        track_id: 'TRK-AI-SAFE-DOCS-01',
        final_challenge_id: 'CH-PROV-EMPTY-01',
        challenges: [
          {
            challenge_id: 'CH-PROV-EMPTY-01',
            synthetic: true,
            track_id: 'TRK-AI-SAFE-DOCS-01',
            level: 'L2',
            role_ids: ['finance_admin_sme'],
            scenario_category: 'trustpath_decision_gate',
            risk_context: 'sensitive_data',
            title: 'Challenge com claim source_ids vazio — FICTÍCIO/SINTÉTICO',
            scenario: 'Cenário sintético.',
            task: 'Task sintética.',
            constraints: [],
            synthetic_inputs: {
              synthetic: true,
              sources: [
                {
                  source_id: 'DOC-PROV',
                  synthetic: true,
                  title: 'Documento sintético — FICTÍCIO/SINTÉTICO',
                },
                {
                  source_id: 'AI-DRAFT-PROV',
                  synthetic: true,
                  type: 'rascunho sintético',
                  claims: [
                    {
                      claim_id: 'CLAIM-EMPTY',
                      synthetic: true,
                      text: 'Afirmação sem fontes.',
                      source_ids: [],                   // vazio — caso de teste
                      intentional_provenance_gap: false, // NÃO intencional
                    },
                  ],
                },
              ],
            },
            expected_evidence: [],
            quality_criteria: [],
            security_criteria: [],
            human_gate_condition: [],
            hints_progressive: [],
            post_challenge_reflection: [],
          },
        ],
      },
    ],
  };

  const result = _resolveChallengeFromCatalog(CANONICAL_INPUT, fakeCatalog);
  assert.equal(result.error, 'PROVENANCE_GAP',
    'Claim com source_ids=[] e intentional_provenance_gap=false deve retornar PROVENANCE_GAP');
  assert.equal(result.challenge_id, undefined, 'Não deve retornar challenge parcial');
});

// ---------------------------------------------------------------------------
// T09d — Claim não intencional com propriedade source_ids ausente retorna PROVENANCE_GAP
// ---------------------------------------------------------------------------

test('T09D_PROVENANCE_MISSING_SOURCE_IDS — propriedade source_ids ausente sem lacuna intencional retorna PROVENANCE_GAP', () => {
  const fakeCatalog = {
    synthetic: true,
    valid_levels: ['L0', 'L1', 'L2', 'L3'],
    sensitive_risk_keywords: [],
    tracks: [
      {
        track_id: 'TRK-AI-SAFE-DOCS-01',
        final_challenge_id: 'CH-PROV-MISSING-01',
        challenges: [
          {
            challenge_id: 'CH-PROV-MISSING-01',
            synthetic: true,
            track_id: 'TRK-AI-SAFE-DOCS-01',
            level: 'L2',
            role_ids: ['finance_admin_sme'],
            scenario_category: 'trustpath_decision_gate',
            risk_context: 'sensitive_data',
            title: 'Challenge com claim sem propriedade source_ids — FICTÍCIO/SINTÉTICO',
            scenario: 'Cenário sintético.',
            task: 'Task sintética.',
            constraints: [],
            synthetic_inputs: {
              synthetic: true,
              sources: [
                {
                  source_id: 'DOC-PROV-M',
                  synthetic: true,
                  title: 'Documento sintético — FICTÍCIO/SINTÉTICO',
                },
                {
                  source_id: 'AI-DRAFT-PROV-M',
                  synthetic: true,
                  type: 'rascunho sintético',
                  claims: [
                    {
                      claim_id: 'CLAIM-NOSOURCES',
                      synthetic: true,
                      text: 'Afirmação sem propriedade source_ids.',
                      // source_ids propositalmente ausente — caso de teste
                      intentional_provenance_gap: false,
                    },
                  ],
                },
              ],
            },
            expected_evidence: [],
            quality_criteria: [],
            security_criteria: [],
            human_gate_condition: [],
            hints_progressive: [],
            post_challenge_reflection: [],
          },
        ],
      },
    ],
  };

  const result = _resolveChallengeFromCatalog(CANONICAL_INPUT, fakeCatalog);
  assert.equal(result.error, 'PROVENANCE_GAP',
    'Claim sem propriedade source_ids e intentional_provenance_gap=false deve retornar PROVENANCE_GAP');
  assert.equal(result.challenge_id, undefined, 'Não deve retornar challenge parcial');
});
