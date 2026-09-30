import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { certificado, _resolveCertificateFromCatalog } from '../commands/certificado.js';
import { trilha } from '../commands/trilha.js';
import { desafio } from '../commands/desafio.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = join(__dirname, '..', 'data', 'synthetic', 'catalog.json');

// ---------------------------------------------------------------------------
// Constantes canônicas
// ---------------------------------------------------------------------------

const CANONICAL_CERTIFICATE_ID = 'FCERT-TRK-AI-SAFE-DOCS-01-L2-001';
const CANONICAL_TITLE = 'Certificado Fictício/Demonstrativo — IA Confiável: Dados, Segurança e Supervisão Humana';
const CANONICAL_DISCLAIMER = 'CERTIFICADO FICTÍCIO/DEMONSTRATIVO — não emitido por DIO, IBM, Bradesco ou instituição certificadora.';
const CANONICAL_TRACK_ID = 'TRK-AI-SAFE-DOCS-01';
const CANONICAL_FINAL_CHALLENGE_ID = 'CH-TRK-AI-SAFE-DOCS-01-L2-01';

// Input canônico compartilhado
const CANONICAL_INPUT = {
  participant_alias: 'Marina — Participante Fictícia',
  track_id: CANONICAL_TRACK_ID,
  completed_challenges: [CANONICAL_FINAL_CHALLENGE_ID],
  completion_date: '2026-09-30',
  evidence_ids: [
    {
      evidence_id: 'EVID-SYN-001',
      track_id: CANONICAL_TRACK_ID,
      challenge_id: CANONICAL_FINAL_CHALLENGE_ID,
      synthetic: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// T01 — Caminho válido com input canônico
// ---------------------------------------------------------------------------

test('T01_VALID_CERTIFICATE — input canônico retorna certificado completo sem erro', () => {
  const result = certificado(CANONICAL_INPUT);

  assert.equal(result.error, undefined, 'Não deve retornar erro no caminho válido');
  assert.equal(result.certificate_id, CANONICAL_CERTIFICATE_ID, 'certificate_id deve ser canônico');
  assert.equal(result.title, CANONICAL_TITLE, 'title deve ser exato');
  assert.equal(result.participant_alias, 'Marina — Participante Fictícia', 'participant_alias deve ser preservado');
  assert.equal(result.track_id, CANONICAL_TRACK_ID, 'track_id deve ser preservado');
  assert.equal(result.completion_date, '2026-09-30', 'completion_date deve ser preservada');
  assert.equal(result.fictional, true, 'fictional deve ser true');
  assert.equal(result.disclaimer, CANONICAL_DISCLAIMER, 'disclaimer deve ser exato');
});

// ---------------------------------------------------------------------------
// T02 — Campo obrigatório ausente
// ---------------------------------------------------------------------------

test('T02_MISSING_REQUIRED_INPUT — participant_alias ausente', () => {
  const { participant_alias: _omit, ...without } = CANONICAL_INPUT;
  const result = certificado(without);

  assert.equal(result.error, 'MISSING_REQUIRED_INPUT');
  assert.ok(Array.isArray(result.missing_fields), 'missing_fields deve ser array');
  assert.ok(result.missing_fields.includes('participant_alias'));
  assert.equal(result.certificate_id, undefined, 'Não deve retornar certificado parcial');
});

test('T02b_MISSING_REQUIRED_INPUT — track_id ausente', () => {
  const { track_id: _omit, ...without } = CANONICAL_INPUT;
  const result = certificado(without);

  assert.equal(result.error, 'MISSING_REQUIRED_INPUT');
  assert.ok(result.missing_fields.includes('track_id'));
  assert.equal(result.certificate_id, undefined);
});

test('T02c_MISSING_REQUIRED_INPUT — completed_challenges ausente', () => {
  const { completed_challenges: _omit, ...without } = CANONICAL_INPUT;
  const result = certificado(without);

  assert.equal(result.error, 'MISSING_REQUIRED_INPUT');
  assert.ok(result.missing_fields.includes('completed_challenges'));
  assert.equal(result.certificate_id, undefined);
});

test('T02d_MISSING_REQUIRED_INPUT — completion_date ausente', () => {
  const { completion_date: _omit, ...without } = CANONICAL_INPUT;
  const result = certificado(without);

  assert.equal(result.error, 'MISSING_REQUIRED_INPUT');
  assert.ok(result.missing_fields.includes('completion_date'));
  assert.equal(result.certificate_id, undefined);
});

test('T02e_MISSING_REQUIRED_INPUT — evidence_ids ausente', () => {
  const { evidence_ids: _omit, ...without } = CANONICAL_INPUT;
  const result = certificado(without);

  assert.equal(result.error, 'MISSING_REQUIRED_INPUT');
  assert.ok(result.missing_fields.includes('evidence_ids'));
  assert.equal(result.certificate_id, undefined);
});

test('T02f_MISSING_REQUIRED_INPUT — input não objeto (null) retorna MISSING_REQUIRED_INPUT', () => {
  const result = certificado(null);

  assert.equal(result.error, 'MISSING_REQUIRED_INPUT');
  assert.ok(Array.isArray(result.missing_fields));
  assert.equal(result.certificate_id, undefined);
});

test('T02g_MISSING_REQUIRED_INPUT — participant_alias vazio retorna MISSING_REQUIRED_INPUT', () => {
  const result = certificado({ ...CANONICAL_INPUT, participant_alias: '   ' });

  assert.equal(result.error, 'MISSING_REQUIRED_INPUT');
  assert.ok(result.missing_fields.includes('participant_alias'));
  assert.equal(result.certificate_id, undefined);
});

// ---------------------------------------------------------------------------
// T03 — track_id inexistente
// ---------------------------------------------------------------------------

test('T03_UNKNOWN_TRACK — track_id inexistente retorna UNKNOWN_TRACK', () => {
  const result = certificado({ ...CANONICAL_INPUT, track_id: 'TRK-INEXISTENTE-999' });

  assert.equal(result.error, 'UNKNOWN_TRACK');
  assert.equal(result.certificate_id, undefined, 'Não deve retornar certificado parcial');
});

// ---------------------------------------------------------------------------
// T04 — Desafio final não completado
// ---------------------------------------------------------------------------

test('T04_CHALLENGE_NOT_COMPLETED — completed_challenges vazio retorna CHALLENGE_NOT_COMPLETED', () => {
  const result = certificado({ ...CANONICAL_INPUT, completed_challenges: [] });

  assert.equal(result.error, 'CHALLENGE_NOT_COMPLETED');
  assert.equal(result.certificate_id, undefined);
});

test('T04b_CHALLENGE_NOT_COMPLETED — challenge_id errado em completed_challenges', () => {
  const result = certificado({
    ...CANONICAL_INPUT,
    completed_challenges: ['CH-OUTRO-CHALLENGE'],
  });

  assert.equal(result.error, 'CHALLENGE_NOT_COMPLETED');
  assert.equal(result.certificate_id, undefined);
});

test('T04c_CHALLENGE_NOT_COMPLETED — trilha sem final_challenge_id retorna CHALLENGE_NOT_COMPLETED (injeção)', () => {
  const fakeCatalog = {
    synthetic: true,
    competencies: [],
    tracks: [
      {
        track_id: CANONICAL_TRACK_ID,
        final_challenge_id: null,
        module_sequence: [],
      },
    ],
  };

  const result = _resolveCertificateFromCatalog(CANONICAL_INPUT, fakeCatalog);
  assert.equal(result.error, 'CHALLENGE_NOT_COMPLETED');
  assert.equal(result.certificate_id, undefined);
});

// ---------------------------------------------------------------------------
// T05 — evidence_ids vazio
// ---------------------------------------------------------------------------

test('T05_INSUFFICIENT_EVIDENCE_EMPTY — evidence_ids=[] retorna INSUFFICIENT_EVIDENCE', () => {
  const result = certificado({ ...CANONICAL_INPUT, evidence_ids: [] });

  assert.equal(result.error, 'INSUFFICIENT_EVIDENCE');
  assert.equal(result.certificate_id, undefined);
});

// ---------------------------------------------------------------------------
// T06 — Evidence com track_id divergente
// ---------------------------------------------------------------------------

test('T06_EVIDENCE_TRACK_MISMATCH — evidence ref.track_id diferente retorna INSUFFICIENT_EVIDENCE', () => {
  const result = certificado({
    ...CANONICAL_INPUT,
    evidence_ids: [
      {
        evidence_id: 'EVID-SYN-001',
        track_id: 'TRK-OUTRA-TRILHA',
        challenge_id: CANONICAL_FINAL_CHALLENGE_ID,
        synthetic: true,
      },
    ],
  });

  assert.equal(result.error, 'INSUFFICIENT_EVIDENCE');
  assert.equal(result.certificate_id, undefined);
});

// ---------------------------------------------------------------------------
// T07 — Evidence com challenge_id divergente
// ---------------------------------------------------------------------------

test('T07_EVIDENCE_CHALLENGE_MISMATCH — evidence ref.challenge_id diferente retorna INSUFFICIENT_EVIDENCE', () => {
  const result = certificado({
    ...CANONICAL_INPUT,
    evidence_ids: [
      {
        evidence_id: 'EVID-SYN-001',
        track_id: CANONICAL_TRACK_ID,
        challenge_id: 'CH-OUTRO-CHALLENGE',
        synthetic: true,
      },
    ],
  });

  assert.equal(result.error, 'INSUFFICIENT_EVIDENCE');
  assert.equal(result.certificate_id, undefined);
});

// ---------------------------------------------------------------------------
// T08 — Evidence sem synthetic=true
// ---------------------------------------------------------------------------

test('T08_EVIDENCE_NOT_SYNTHETIC — synthetic=false retorna INSUFFICIENT_EVIDENCE', () => {
  const result = certificado({
    ...CANONICAL_INPUT,
    evidence_ids: [
      {
        evidence_id: 'EVID-SYN-001',
        track_id: CANONICAL_TRACK_ID,
        challenge_id: CANONICAL_FINAL_CHALLENGE_ID,
        synthetic: false,
      },
    ],
  });

  assert.equal(result.error, 'INSUFFICIENT_EVIDENCE');
  assert.equal(result.certificate_id, undefined);
});

test('T08b_EVIDENCE_NOT_SYNTHETIC — synthetic ausente retorna INSUFFICIENT_EVIDENCE', () => {
  const result = certificado({
    ...CANONICAL_INPUT,
    evidence_ids: [
      {
        evidence_id: 'EVID-SYN-001',
        track_id: CANONICAL_TRACK_ID,
        challenge_id: CANONICAL_FINAL_CHALLENGE_ID,
        // synthetic propositalmente ausente
      },
    ],
  });

  assert.equal(result.error, 'INSUFFICIENT_EVIDENCE');
  assert.equal(result.certificate_id, undefined);
});

test('T08c_EVIDENCE_MISSING_ID — evidence_id ausente retorna INSUFFICIENT_EVIDENCE', () => {
  const result = certificado({
    ...CANONICAL_INPUT,
    evidence_ids: [
      {
        // evidence_id propositalmente ausente
        track_id: CANONICAL_TRACK_ID,
        challenge_id: CANONICAL_FINAL_CHALLENGE_ID,
        synthetic: true,
      },
    ],
  });

  assert.equal(result.error, 'INSUFFICIENT_EVIDENCE');
  assert.equal(result.certificate_id, undefined);
});

test('T08d_EVIDENCE_EMPTY_ID — evidence_id vazio retorna INSUFFICIENT_EVIDENCE', () => {
  const result = certificado({
    ...CANONICAL_INPUT,
    evidence_ids: [
      {
        evidence_id: '   ',
        track_id: CANONICAL_TRACK_ID,
        challenge_id: CANONICAL_FINAL_CHALLENGE_ID,
        synthetic: true,
      },
    ],
  });

  assert.equal(result.error, 'INSUFFICIENT_EVIDENCE');
  assert.equal(result.certificate_id, undefined);
});

// ---------------------------------------------------------------------------
// T09 — Data de conclusão inválida
// ---------------------------------------------------------------------------

test('T09_INVALID_COMPLETION_DATE — formato com barra retorna INVALID_COMPLETION_DATE', () => {
  const result = certificado({ ...CANONICAL_INPUT, completion_date: '2026/09/30' });

  assert.equal(result.error, 'INVALID_COMPLETION_DATE');
  assert.equal(result.certificate_id, undefined);
});

test('T09b_INVALID_COMPLETION_DATE — data impossível (fev 30) retorna INVALID_COMPLETION_DATE', () => {
  const result = certificado({ ...CANONICAL_INPUT, completion_date: '2026-02-30' });

  assert.equal(result.error, 'INVALID_COMPLETION_DATE');
  assert.equal(result.certificate_id, undefined);
});

test('T09c_INVALID_COMPLETION_DATE — formato invertido retorna INVALID_COMPLETION_DATE', () => {
  const result = certificado({ ...CANONICAL_INPUT, completion_date: '30-09-2026' });

  assert.equal(result.error, 'INVALID_COMPLETION_DATE');
  assert.equal(result.certificate_id, undefined);
});

test('T09d_INVALID_COMPLETION_DATE — mês 13 retorna INVALID_COMPLETION_DATE', () => {
  const result = certificado({ ...CANONICAL_INPUT, completion_date: '2026-13-01' });

  assert.equal(result.error, 'INVALID_COMPLETION_DATE');
  assert.equal(result.certificate_id, undefined);
});

test('T09e_INVALID_COMPLETION_DATE — texto livre retorna INVALID_COMPLETION_DATE', () => {
  const result = certificado({ ...CANONICAL_INPUT, completion_date: 'setembro de 2026' });

  assert.equal(result.error, 'INVALID_COMPLETION_DATE');
  assert.equal(result.certificate_id, undefined);
});

// ---------------------------------------------------------------------------
// T10 — Artefato fictício e ausência de campos institucionais
// ---------------------------------------------------------------------------

test('T10_FICTIONAL_DISCLAIMER — fictional=true e disclaimer exato', () => {
  const result = certificado(CANONICAL_INPUT);

  assert.equal(result.error, undefined);
  assert.equal(result.fictional, true, 'fictional deve ser true');
  assert.equal(result.disclaimer, CANONICAL_DISCLAIMER, 'disclaimer deve ser exato');
});

test('T10b_FICTIONAL_DISCLAIMER — campos institucionais ausentes no output', () => {
  const result = certificado(CANONICAL_INPUT);
  assert.equal(result.error, undefined);

  const forbidden = [
    'issuer', 'institution', 'logo', 'signature', 'qr_code',
    'validation_code', 'institutional_validation_code', 'verification_url',
    'grade', 'score', 'ranking', 'matricula',
  ];

  for (const field of forbidden) {
    assert.equal(result[field], undefined,
      `Campo proibido "${field}" não deve estar presente no output`);
  }
});

// ---------------------------------------------------------------------------
// T11 — Demonstrated skills derivadas de module_sequence
// ---------------------------------------------------------------------------

test('T11_DEMONSTRATED_SKILLS_DERIVED — 8 skills na ordem canônica', () => {
  const result = certificado(CANONICAL_INPUT);
  assert.equal(result.error, undefined);

  const skills = result.demonstrated_skills;
  assert.ok(Array.isArray(skills), 'demonstrated_skills deve ser array');
  assert.equal(skills.length, 8, 'Deve haver exatamente 8 skills');

  const expectedOrder = ['AI-01', 'CY-01', 'DA-01', 'DA-05', 'AI-02', 'HU-01', 'HU-02', 'HU-03'];
  const actualOrder = skills.map((s) => s.skill_id);
  assert.deepEqual(actualOrder, expectedOrder, 'Ordem deve seguir module_sequence canônica');
});

test('T11b_DEMONSTRATED_SKILLS_DERIVED — cada item contém somente skill_id e title', () => {
  const result = certificado(CANONICAL_INPUT);
  assert.equal(result.error, undefined);

  const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  const competencyMap = new Map(catalog.competencies.map((c) => [c.skill_id, c]));

  for (const skill of result.demonstrated_skills) {
    // Somente os dois campos esperados
    assert.ok('skill_id' in skill, 'skill_id deve estar presente');
    assert.ok('title' in skill, 'title deve estar presente');
    assert.equal(skill.level, undefined, 'level não deve estar presente em demonstrated_skills');

    // Title deve vir exatamente do catálogo
    const catalogComp = competencyMap.get(skill.skill_id);
    assert.ok(catalogComp, `skill_id "${skill.skill_id}" deve existir no catálogo`);
    assert.equal(skill.title, catalogComp.title, `title de "${skill.skill_id}" deve vir do catálogo`);
  }
});

// ---------------------------------------------------------------------------
// T12 — CATALOG_SKILL_GAP via injeção de catálogo
// ---------------------------------------------------------------------------

test('T12_CATALOG_SKILL_GAP — skill ausente no catálogo retorna CATALOG_SKILL_GAP (injeção)', () => {
  // Catálogo injetado com CY-01 removido — referenciado na module_sequence
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  const catalogWithGap = {
    ...catalog,
    competencies: catalog.competencies.filter((c) => c.skill_id !== 'CY-01'),
  };

  const result = _resolveCertificateFromCatalog(CANONICAL_INPUT, catalogWithGap);

  assert.equal(result.error, 'CATALOG_SKILL_GAP');
  assert.ok(Array.isArray(result.missing_skill_ids), 'missing_skill_ids deve ser array');
  assert.ok(result.missing_skill_ids.includes('CY-01'), 'missing_skill_ids deve conter CY-01');
  assert.equal(result.certificate_id, undefined, 'Não deve retornar certificado parcial');
});

// ---------------------------------------------------------------------------
// T13 — Determinismo
// ---------------------------------------------------------------------------

test('T13_DETERMINISM — mesmo input executado duas vezes produz resultado idêntico', () => {
  const result1 = certificado(CANONICAL_INPUT);
  const result2 = certificado(CANONICAL_INPUT);

  assert.deepEqual(result1, result2, 'Duas chamadas idênticas devem produzir resultado idêntico');
  assert.equal(result1.certificate_id, result2.certificate_id);
  assert.equal(result1.fictional, result2.fictional);
});

// ---------------------------------------------------------------------------
// T14 — Bloqueios de uso indevido (certificado real / impersonação institucional)
// ---------------------------------------------------------------------------

test('T14A_REAL_BLOCK — official=true retorna REAL_CERTIFICATE_REQUEST_BLOCKED', () => {
  const result = certificado({ ...CANONICAL_INPUT, official: true });

  assert.equal(result.error, 'REAL_CERTIFICATE_REQUEST_BLOCKED');
  assert.equal(result.certificate_id, undefined);
});

test('T14B_REAL_BLOCK — remove_disclaimer=true retorna REAL_CERTIFICATE_REQUEST_BLOCKED', () => {
  const result = certificado({ ...CANONICAL_INPUT, remove_disclaimer: true });

  assert.equal(result.error, 'REAL_CERTIFICATE_REQUEST_BLOCKED');
  assert.equal(result.certificate_id, undefined);
});

test('T14C_REAL_BLOCK — claim_official_validity=true retorna REAL_CERTIFICATE_REQUEST_BLOCKED', () => {
  const result = certificado({ ...CANONICAL_INPUT, claim_official_validity: true });

  assert.equal(result.error, 'REAL_CERTIFICATE_REQUEST_BLOCKED');
  assert.equal(result.certificate_id, undefined);
});

test('T14D_INSTITUTIONAL_BLOCK — requested_issuer="DIO" retorna INSTITUTIONAL_IMPERSONATION_BLOCKED', () => {
  const result = certificado({ ...CANONICAL_INPUT, requested_issuer: 'DIO' });

  assert.equal(result.error, 'INSTITUTIONAL_IMPERSONATION_BLOCKED');
  assert.equal(result.certificate_id, undefined);
});

test('T14E_INSTITUTIONAL_BLOCK — institutional_signature="qualquer valor" retorna INSTITUTIONAL_IMPERSONATION_BLOCKED', () => {
  const result = certificado({ ...CANONICAL_INPUT, institutional_signature: 'qualquer valor' });

  assert.equal(result.error, 'INSTITUTIONAL_IMPERSONATION_BLOCKED');
  assert.equal(result.certificate_id, undefined);
});

test('T14F_INSTITUTIONAL_BLOCK — institutional_validation_code="ABC123" retorna INSTITUTIONAL_IMPERSONATION_BLOCKED', () => {
  const result = certificado({ ...CANONICAL_INPUT, institutional_validation_code: 'ABC123' });

  assert.equal(result.error, 'INSTITUTIONAL_IMPERSONATION_BLOCKED');
  assert.equal(result.certificate_id, undefined);
});

test('T14G_INSTITUTIONAL_BLOCK — qr_code="qualquer valor" retorna INSTITUTIONAL_IMPERSONATION_BLOCKED', () => {
  const result = certificado({ ...CANONICAL_INPUT, qr_code: 'qualquer valor' });

  assert.equal(result.error, 'INSTITUTIONAL_IMPERSONATION_BLOCKED');
  assert.equal(result.certificate_id, undefined);
});

test('T14H_INSTITUTIONAL_BLOCK — institutional_logo="qualquer valor" retorna INSTITUTIONAL_IMPERSONATION_BLOCKED', () => {
  const result = certificado({ ...CANONICAL_INPUT, institutional_logo: 'qualquer valor' });

  assert.equal(result.error, 'INSTITUTIONAL_IMPERSONATION_BLOCKED');
  assert.equal(result.certificate_id, undefined);
});

// ---------------------------------------------------------------------------
// T15 — Integração Core: /trilha → /desafio → /certificado
// ---------------------------------------------------------------------------

test('T15_CORE_INTEGRATION — encadeamento trilha → desafio → certificado', () => {
  const marinaInput = {
    role: 'finance_admin_sme',
    target_goal: 'safe_ai_document_work',
    current_level: 'L1',
    target_level: 'L2',
    risk_context: 'sensitive_data',
  };

  const desafioInput = {
    track_id: 'TRK-AI-SAFE-DOCS-01',
    level: 'L2',
    role_id: 'finance_admin_sme',
    scenario_category: 'trustpath_decision_gate',
    risk_context: 'sensitive_data',
  };

  // trilha
  const trilhaResult = trilha(marinaInput);
  assert.equal(trilhaResult.error, undefined, 'trilha() não deve retornar erro');
  assert.equal(trilhaResult.final_challenge_id, CANONICAL_FINAL_CHALLENGE_ID,
    'trilha().final_challenge_id deve ser o challenge canônico');

  // desafio
  const desafioResult = desafio(desafioInput);
  assert.equal(desafioResult.error, undefined, 'desafio() não deve retornar erro');
  assert.equal(desafioResult.challenge_id, CANONICAL_FINAL_CHALLENGE_ID,
    'desafio().challenge_id deve ser o challenge canônico');

  // Confirmar que o challenge_id das evidências bate com o final_challenge_id
  const evidenceRef = {
    evidence_id: 'EVID-SYN-001',
    track_id: trilhaResult.track_id,
    challenge_id: desafioResult.challenge_id,
    synthetic: true,
  };
  assert.equal(evidenceRef.challenge_id, CANONICAL_FINAL_CHALLENGE_ID,
    'evidence ref.challenge_id deve ser igual ao challenge canônico');

  // certificado
  const certInput = {
    participant_alias: 'Marina — Participante Fictícia',
    track_id: trilhaResult.track_id,
    completed_challenges: [desafioResult.challenge_id],
    completion_date: '2026-09-30',
    evidence_ids: [evidenceRef],
  };

  const certResult = certificado(certInput);
  assert.equal(certResult.error, undefined, 'certificado() não deve retornar erro');
  assert.equal(certResult.certificate_id, CANONICAL_CERTIFICATE_ID,
    'certificate_id deve ser o ID canônico');
  assert.equal(certResult.fictional, true, 'fictional deve ser true');
});

// ---------------------------------------------------------------------------
// T02h — participant_alias com tipo errado retorna MISSING_REQUIRED_INPUT
// ---------------------------------------------------------------------------

test('T02H_PARTICIPANT_ALIAS_WRONG_TYPE — participant_alias=123 retorna MISSING_REQUIRED_INPUT sem lançar exceção', () => {
  const result = certificado({ ...CANONICAL_INPUT, participant_alias: 123 });

  assert.equal(result.error, 'MISSING_REQUIRED_INPUT',
    'Tipo não-string em participant_alias deve retornar MISSING_REQUIRED_INPUT');
  assert.ok(Array.isArray(result.missing_fields), 'missing_fields deve ser array');
  assert.ok(result.missing_fields.includes('participant_alias'),
    'missing_fields deve conter participant_alias');
  assert.equal(result.certificate_id, undefined, 'Não deve retornar certificado parcial');
});

// ---------------------------------------------------------------------------
// T04d — final_challenge_id vazio é tratado como não utilizável
// ---------------------------------------------------------------------------

test('T04D_CHALLENGE_ID_EMPTY — final_challenge_id="" retorna CHALLENGE_NOT_COMPLETED (injeção)', () => {
  // Catálogo injetado em memória com final_challenge_id vazio
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  const catalogWithEmpty = {
    ...catalog,
    tracks: catalog.tracks.map((t) =>
      t.track_id === CANONICAL_TRACK_ID
        ? { ...t, final_challenge_id: '' }
        : t
    ),
  };

  // completed_challenges contém string vazia para evitar bloqueio anterior
  const inputWithEmpty = {
    ...CANONICAL_INPUT,
    completed_challenges: [''],
  };

  const result = _resolveCertificateFromCatalog(inputWithEmpty, catalogWithEmpty);

  assert.equal(result.error, 'CHALLENGE_NOT_COMPLETED',
    'final_challenge_id="" deve retornar CHALLENGE_NOT_COMPLETED');
  assert.equal(result.certificate_id, undefined, 'Não deve retornar certificado parcial');
});

// ---------------------------------------------------------------------------
// T08e — item null em evidence_ids retorna INSUFFICIENT_EVIDENCE sem exceção
// ---------------------------------------------------------------------------

test('T08E_EVIDENCE_REF_NOT_OBJECT — evidence_ids=[null] retorna INSUFFICIENT_EVIDENCE sem lançar exceção', () => {
  const result = certificado({ ...CANONICAL_INPUT, evidence_ids: [null] });

  assert.equal(result.error, 'INSUFFICIENT_EVIDENCE',
    'Item null em evidence_ids deve retornar INSUFFICIENT_EVIDENCE');
  assert.equal(result.certificate_id, undefined, 'Não deve retornar certificado parcial');
});

test('T08E_EVIDENCE_REF_NOT_OBJECT_b — evidence_ids=["string"] retorna INSUFFICIENT_EVIDENCE sem lançar exceção', () => {
  const result = certificado({ ...CANONICAL_INPUT, evidence_ids: ['EVID-SYN-001'] });

  assert.equal(result.error, 'INSUFFICIENT_EVIDENCE',
    'Item primitivo (string) em evidence_ids deve retornar INSUFFICIENT_EVIDENCE');
  assert.equal(result.certificate_id, undefined, 'Não deve retornar certificado parcial');
});
