import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { trilha, _buildModulesFromCatalog } from '../commands/trilha.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = join(__dirname, '..', 'data', 'synthetic', 'catalog.json');

// ---------------------------------------------------------------------------
// Input sintético da Marina — compartilhado entre casos
// ---------------------------------------------------------------------------

const MARINA_INPUT = {
  role: 'finance_admin_sme',
  target_goal: 'safe_ai_document_work',
  current_level: 'L1',
  target_level: 'L2',
  risk_context: 'sensitive_data',
};

const EXPECTED_SEQUENCE = ['AI-01', 'CY-01', 'DA-01', 'DA-05', 'AI-02', 'HU-01', 'HU-02', 'HU-03'];

const WHY_THIS_TRACK_EXPECTED =
  'Esta trilha foi escolhida porque o objetivo de Marina não é apenas aprender a usar IA, ' +
  'mas utilizá-la com dados adequados, controles de segurança e supervisão humana. ' +
  'A sequência desenvolve primeiro os fundamentos e os controles necessários para depois ' +
  'aplicar prompting, revisão crítica e Human-in-the-Loop de forma responsável.';

// ---------------------------------------------------------------------------
// T01 — Caminho válido da Marina
// ---------------------------------------------------------------------------

test('T01_MARINA_VALID — caminho válido com input sintético da Marina', () => {
  const result = trilha(MARINA_INPUT);

  // Sem erro
  assert.equal(result.error, undefined, 'Não deve retornar erro em caminho válido');

  // track_id correto
  assert.equal(result.track_id, 'TRK-AI-SAFE-DOCS-01');

  // Campos obrigatórios do contrato presentes
  assert.ok(typeof result.title === 'string' && result.title.length > 0, 'title deve ser string não-vazia');
  assert.ok(typeof result.why_this_track === 'string' && result.why_this_track.length > 0, 'why_this_track deve ser string não-vazia');
  assert.ok(Array.isArray(result.prerequisites), 'prerequisites deve ser array');
  assert.ok(Array.isArray(result.modules) && result.modules.length > 0, 'modules deve ser array não-vazio');
  assert.ok(Array.isArray(result.limitations), 'limitations deve ser array');
  assert.ok('final_challenge_id' in result, 'final_challenge_id deve estar presente');
});

// ---------------------------------------------------------------------------
// T02 — Campo obrigatório ausente
// ---------------------------------------------------------------------------

test('T02_MISSING_INPUT — campo role ausente retorna MISSING_REQUIRED_INPUT', () => {
  const { role: _omitted, ...withoutRole } = MARINA_INPUT;
  const result = trilha(withoutRole);

  assert.equal(result.error, 'MISSING_REQUIRED_INPUT');
  assert.ok(Array.isArray(result.missing_fields), 'missing_fields deve ser array');
  assert.ok(result.missing_fields.includes('role'), 'missing_fields deve conter "role"');
  assert.equal(result.modules, undefined, 'Não deve retornar módulos em caso de erro');
});

test('T02b_MISSING_INPUT — target_goal ausente retorna MISSING_REQUIRED_INPUT', () => {
  const { target_goal: _omitted, ...withoutGoal } = MARINA_INPUT;
  const result = trilha(withoutGoal);

  assert.equal(result.error, 'MISSING_REQUIRED_INPUT');
  assert.ok(result.missing_fields.includes('target_goal'));
});

test('T02c_MISSING_INPUT — current_level ausente retorna MISSING_REQUIRED_INPUT', () => {
  const { current_level: _omitted, ...withoutLevel } = MARINA_INPUT;
  const result = trilha(withoutLevel);

  assert.equal(result.error, 'MISSING_REQUIRED_INPUT');
  assert.ok(result.missing_fields.includes('current_level'));
});

// ---------------------------------------------------------------------------
// T03 — Role ou target_goal sem correspondência
// ---------------------------------------------------------------------------

test('T03_NO_MATCH — role inexistente retorna NO_MATCHING_TRACK', () => {
  const result = trilha({
    ...MARINA_INPUT,
    role: 'neurocirurgiao_robotico',
  });

  assert.equal(result.error, 'NO_MATCHING_TRACK');
  assert.equal(result.modules, undefined, 'Não deve retornar módulos quando não há match');
});

test('T03b_NO_MATCH — target_goal inexistente retorna NO_MATCHING_TRACK', () => {
  const result = trilha({
    ...MARINA_INPUT,
    target_goal: 'objetivo_completamente_inexistente',
  });

  assert.equal(result.error, 'NO_MATCHING_TRACK');
});

// ---------------------------------------------------------------------------
// T04 — Contrato e ordem autoral dos módulos
// ---------------------------------------------------------------------------

test('T04_CONTRACT_AND_ORDER — contrato completo e sequência autoral preservada', () => {
  const result = trilha(MARINA_INPUT);

  // title exato
  assert.equal(result.title, 'IA Confiável: Dados, Segurança e Supervisão Humana');

  // why_this_track — texto autoral preservado
  assert.equal(result.why_this_track, WHY_THIS_TRACK_EXPECTED);

  // prerequisites presente
  assert.ok(Array.isArray(result.prerequisites));

  // 8 módulos sem max_modules
  assert.equal(result.modules.length, 8, 'Deve conter exatamente 8 módulos sem max_modules');

  // Sequência autoral exata
  const actualSequence = result.modules.map((m) => m.skill_id);
  assert.deepEqual(actualSequence, EXPECTED_SEQUENCE);

  // Todos os módulos com level L2
  result.modules.forEach((m, i) => {
    assert.equal(m.level, 'L2', `Módulo ${i + 1} (${m.skill_id}) deve ter level L2`);
  });

  // order consistente (1-based)
  result.modules.forEach((m, i) => {
    assert.equal(m.order, i + 1, `order do módulo ${i + 1} deve ser ${i + 1}`);
  });

  // Campos de conteúdo presentes em todos os módulos
  result.modules.forEach((m) => {
    assert.ok(typeof m.objective === 'string' && m.objective.length > 0, `objective presente em ${m.skill_id}`);
    assert.ok(typeof m.practice === 'string' && m.practice.length > 0, `practice presente em ${m.skill_id}`);
    assert.ok(typeof m.evidence_expected === 'string' && m.evidence_expected.length > 0, `evidence_expected presente em ${m.skill_id}`);
  });
});

// ---------------------------------------------------------------------------
// T05 — Pré-requisito crítico de segurança preservado
// ---------------------------------------------------------------------------

test('T05_CRITICAL_SECURITY — CY-01 presente em contexto de dado sensível', () => {
  const result = trilha({
    ...MARINA_INPUT,
    risk_context: 'sensitive_data',
  });

  assert.equal(result.error, undefined);
  const cy01 = result.modules.find((m) => m.skill_id === 'CY-01');
  assert.ok(cy01, 'CY-01 deve estar presente em contexto de dado sensível');
});

test('T05b_CRITICAL_SECURITY — CY-01 presente mesmo sem risk_context explícito', () => {
  const { risk_context: _omitted, ...withoutRisk } = MARINA_INPUT;
  const result = trilha(withoutRisk);

  assert.equal(result.error, undefined);
  const cy01 = result.modules.find((m) => m.skill_id === 'CY-01');
  assert.ok(cy01, 'CY-01 deve estar presente na sequência autoral independentemente de risk_context');
});

// ---------------------------------------------------------------------------
// T06 — max_modules fail-safe: CY-01 não é removido silenciosamente
// ---------------------------------------------------------------------------

test('T06_MAX_MODULES_FAIL_SAFE — max_modules=1 em contexto crítico produz [AI-01, CY-01]', () => {
  const result = trilha({
    ...MARINA_INPUT,
    risk_context: 'sensitive_data',
    max_modules: 1,
  });

  assert.equal(result.error, undefined);

  // Sequência exata obrigatória: AI-01 seguido de CY-01
  const actualIds = result.modules.map((m) => m.skill_id);
  assert.deepEqual(actualIds, ['AI-01', 'CY-01'], 'Com max_modules=1 e contexto sensível, resultado deve ser [AI-01, CY-01]');

  // Cardinalidade: exatamente 2 módulos
  assert.equal(result.modules.length, 2, 'Deve conter exatamente 2 módulos (cap=1 + CY-01 adicionado)');

  // Orders corretos
  assert.equal(result.modules[0].order, 1, 'AI-01 deve ter order=1');
  assert.equal(result.modules[1].order, 2, 'CY-01 deve ter order=2');

  // limitations deve declarar o ajuste com referência explícita a CY-01 e ao cap solicitado
  const limitationText = result.limitations.join(' ');
  assert.ok(
    limitationText.includes('max_modules') && limitationText.includes('CY-01'),
    `limitations deve mencionar max_modules e CY-01; obtido: "${limitationText}"`
  );
  assert.ok(
    limitationText.includes('1') && limitationText.includes('2'),
    'limitations deve indicar cap solicitado (1) e resultado (2)'
  );
});

test('T06b_MAX_MODULES — max_modules=3 sem contexto crítico trunca corretamente', () => {
  const { risk_context: _omitted, ...withoutRisk } = MARINA_INPUT;
  const result = trilha({ ...withoutRisk, max_modules: 3 });

  assert.equal(result.error, undefined);
  assert.equal(result.modules.length, 3, 'Deve conter exatamente 3 módulos com max_modules=3 sem contexto crítico');

  // Ordem autoral preservada nos módulos selecionados
  const actualIds = result.modules.map((m) => m.skill_id);
  const expectedFirst3 = EXPECTED_SEQUENCE.slice(0, 3);
  assert.deepEqual(actualIds, expectedFirst3);

  // limitations menciona truncamento
  const hasTruncNote = result.limitations.some((l) => l.includes('trunca') || l.includes('max_modules') || l.includes('omitido'));
  assert.ok(hasTruncNote, 'limitations deve declarar truncamento');
});

// ---------------------------------------------------------------------------
// T06c — CATALOG_SKILL_GAP via _buildModulesFromCatalog com catálogo injetado
// Testa a lógica de CATALOG_SKILL_GAP sem alterar catalog.json de produção.
// ---------------------------------------------------------------------------

test('T06c_CATALOG_SKILL_GAP — skill inexistente na sequência retorna CATALOG_SKILL_GAP', () => {
  // Mapa sintético mínimo: AI-01 existe, SKILL-INEXISTENTE não existe
  const fakeMap = new Map([
    ['AI-01', { skill_id: 'AI-01', level: 'L2', critical_security: false,
                objective: 'obj', practice: 'prac', evidence_expected: 'ev' }],
  ]);

  const sequence = ['AI-01', 'SKILL-INEXISTENTE', 'OUTRO-AUSENTE'];
  const result = _buildModulesFromCatalog(sequence, fakeMap, false, null);

  assert.equal(result.error, 'CATALOG_SKILL_GAP', 'Deve retornar CATALOG_SKILL_GAP');
  assert.ok(Array.isArray(result.missing_skill_ids), 'missing_skill_ids deve ser array');
  assert.ok(result.missing_skill_ids.includes('SKILL-INEXISTENTE'), 'missing_skill_ids deve conter SKILL-INEXISTENTE');
  assert.ok(result.missing_skill_ids.includes('OUTRO-AUSENTE'), 'missing_skill_ids deve conter OUTRO-AUSENTE');
  assert.equal(result.modules, undefined, 'Não deve retornar módulos em CATALOG_SKILL_GAP');
});

test('T06d_CATALOG_SKILL_GAP — sequência válida completa não retorna erro', () => {
  const fakeMap = new Map([
    ['AI-01', { skill_id: 'AI-01', level: 'L2', critical_security: false,
                objective: 'obj', practice: 'prac', evidence_expected: 'ev' }],
    ['CY-01', { skill_id: 'CY-01', level: 'L2', critical_security: true,
                objective: 'obj', practice: 'prac', evidence_expected: 'ev' }],
  ]);

  const sequence = ['AI-01', 'CY-01'];
  const result = _buildModulesFromCatalog(sequence, fakeMap, false, null);

  assert.equal(result.error, undefined, 'Sequência válida não deve retornar erro');
  assert.ok(Array.isArray(result.modules), 'modules deve ser array');
  assert.equal(result.modules.length, 2);
});

// ---------------------------------------------------------------------------
// T07 — Proveniência sintética
// ---------------------------------------------------------------------------

test('T07_SYNTHETIC_PROVENANCE — catálogo declara synthetic=true e output não requer dados reais', () => {
  // Catálogo declara synthetic=true
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  assert.equal(catalog.synthetic, true, 'Catálogo deve declarar synthetic=true');

  // Output da Marina não contém PII
  const result = trilha(MARINA_INPUT);
  assert.equal(result.error, undefined);

  const outputStr = JSON.stringify(result);

  // Verificações de ausência de padrões de PII comuns
  assert.ok(!/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(outputStr), 'Output não deve conter endereço de e-mail');
  assert.ok(!/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/.test(outputStr), 'Output não deve conter CPF');
  assert.ok(!/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/.test(outputStr), 'Output não deve conter CNPJ');
});

// ---------------------------------------------------------------------------
// T08 — Determinismo
// ---------------------------------------------------------------------------

test('T08_DETERMINISM — mesmo input produz resultado estruturalmente idêntico', () => {
  const result1 = trilha(MARINA_INPUT);
  const result2 = trilha(MARINA_INPUT);

  assert.deepEqual(result1, result2, 'Duas chamadas idênticas devem produzir resultado idêntico');

  // track_id idêntico
  assert.equal(result1.track_id, result2.track_id);

  // Sequência de módulos idêntica
  const seq1 = result1.modules.map((m) => m.skill_id);
  const seq2 = result2.modules.map((m) => m.skill_id);
  assert.deepEqual(seq1, seq2);
});
