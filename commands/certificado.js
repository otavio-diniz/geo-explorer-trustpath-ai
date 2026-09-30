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
// Constantes do contrato
// ---------------------------------------------------------------------------

const REQUIRED_FIELDS = [
  'participant_alias',
  'track_id',
  'completed_challenges',
  'completion_date',
  'evidence_ids',
];

const CERTIFICATE_ID_CANONICAL = 'FCERT-TRK-AI-SAFE-DOCS-01-L2-001';
const TITLE_CANONICAL = 'Certificado Fictício/Demonstrativo — IA Confiável: Dados, Segurança e Supervisão Humana';
const DISCLAIMER_EXACT = 'CERTIFICADO FICTÍCIO/DEMONSTRATIVO — não emitido por DIO, IBM, Bradesco ou instituição certificadora.';
const COMPLETION_SUMMARY_EXACT =
  'Conclusão didática registrada no protótipo da trilha "IA Confiável: Dados, Segurança e Supervisão Humana", ' +
  'incluindo o desafio "TrustPath Decision Gate — Revisão Segura de Proposta Assistida por IA", ' +
  'com evidências sintéticas associadas. ' +
  'Este registro não representa certificação institucional, nota ou habilitação profissional.';

// ---------------------------------------------------------------------------
// Helpers de validação
// ---------------------------------------------------------------------------

/**
 * Valida formato YYYY-MM-DD e existência civil da data.
 * Não usa relógio atual — puramente estrutural.
 */
function isValidCompletionDate(value) {
  if (typeof value !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;
  // Verificar dia máximo usando Date sem relógio (ano/mês fixos do input)
  const lastDay = new Date(year, month, 0).getDate();
  return day <= lastDay;
}

// ---------------------------------------------------------------------------
// _resolveCertificateFromCatalog — auxiliar testável com catálogo injetado
//
// Recebe input já validado (campos obrigatórios presentes, bloqueios checados,
// data validada) e o catálogo. Retorna o certificado ou um objeto de erro.
// ---------------------------------------------------------------------------

/**
 * @param {object} input - campos validados de /certificado
 * @param {object} catalog - catálogo (pode ser injetado em memória para testes)
 * @returns {object} CertificateOutput | CertificateError
 */
export function _resolveCertificateFromCatalog(input, catalog) {
  // -------------------------------------------------------------------------
  // 1. Resolver track_id por igualdade exata
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
  // 2. Verificar final_challenge_id utilizável
  // -------------------------------------------------------------------------

  const finalChallengeId = track.final_challenge_id;

  if (typeof finalChallengeId !== 'string' || finalChallengeId.trim() === '') {
    return {
      error: 'CHALLENGE_NOT_COMPLETED',
      message: `A trilha "${input.track_id}" não possui final_challenge_id utilizável.`,
    };
  }

  // -------------------------------------------------------------------------
  // 3. Verificar final_challenge_id em completed_challenges
  // -------------------------------------------------------------------------

  const completed = input.completed_challenges;
  if (!completed.includes(finalChallengeId)) {
    return {
      error: 'CHALLENGE_NOT_COMPLETED',
      message: `O desafio final "${finalChallengeId}" não está presente em completed_challenges.`,
    };
  }

  // -------------------------------------------------------------------------
  // 4. Validar evidence_ids
  // -------------------------------------------------------------------------

  const evidenceRefs = input.evidence_ids;

  if (evidenceRefs.length === 0) {
    return {
      error: 'INSUFFICIENT_EVIDENCE',
      message: 'evidence_ids não pode ser array vazio.',
    };
  }

  const validatedEvidenceIds = [];

  for (const ref of evidenceRefs) {
    // ref deve ser objeto estruturado (não null, não primitivo, não array)
    if (ref === null || typeof ref !== 'object' || Array.isArray(ref)) {
      return {
        error: 'INSUFFICIENT_EVIDENCE',
        message: 'Item de evidence_ids não é um objeto estruturado válido.',
      };
    }
    // evidence_id deve ser string não vazia
    if (!ref.evidence_id || typeof ref.evidence_id !== 'string' || ref.evidence_id.trim() === '') {
      return {
        error: 'INSUFFICIENT_EVIDENCE',
        message: 'Referência de evidência sem evidence_id válido.',
      };
    }
    // track_id deve bater com input.track_id
    if (ref.track_id !== input.track_id) {
      return {
        error: 'INSUFFICIENT_EVIDENCE',
        message: `Referência "${ref.evidence_id}": track_id "${ref.track_id}" difere de "${input.track_id}".`,
      };
    }
    // challenge_id deve bater com final_challenge_id da trilha
    if (ref.challenge_id !== finalChallengeId) {
      return {
        error: 'INSUFFICIENT_EVIDENCE',
        message: `Referência "${ref.evidence_id}": challenge_id "${ref.challenge_id}" difere de "${finalChallengeId}".`,
      };
    }
    // synthetic deve ser true
    if (ref.synthetic !== true) {
      return {
        error: 'INSUFFICIENT_EVIDENCE',
        message: `Referência "${ref.evidence_id}" não declara synthetic=true.`,
      };
    }
    validatedEvidenceIds.push(ref.evidence_id);
  }

  // -------------------------------------------------------------------------
  // 5. Resolver demonstrated_skills a partir de module_sequence
  // -------------------------------------------------------------------------

  const moduleSequence = track.module_sequence ?? [];
  const competencyMap = new Map((catalog.competencies ?? []).map((c) => [c.skill_id, c]));

  const missingSkillIds = moduleSequence.filter((id) => !competencyMap.has(id));
  if (missingSkillIds.length > 0) {
    return {
      error: 'CATALOG_SKILL_GAP',
      message: `Competência(s) ausente(s) no catálogo: ${missingSkillIds.join(', ')}.`,
      missing_skill_ids: missingSkillIds,
    };
  }

  const demonstratedSkills = moduleSequence.map((id) => {
    const comp = competencyMap.get(id);
    return { skill_id: comp.skill_id, title: comp.title };
  });

  // -------------------------------------------------------------------------
  // 6. Montar output determinístico com os 10 campos funcionais
  // -------------------------------------------------------------------------

  return {
    certificate_id: CERTIFICATE_ID_CANONICAL,
    title: TITLE_CANONICAL,
    participant_alias: input.participant_alias.trim(),
    track_id: input.track_id,
    demonstrated_skills: demonstratedSkills,
    completion_summary: COMPLETION_SUMMARY_EXACT,
    completion_date: input.completion_date,
    evidence_ids: validatedEvidenceIds,
    fictional: true,
    disclaimer: DISCLAIMER_EXACT,
  };
}

// ---------------------------------------------------------------------------
// Função principal exportada
// ---------------------------------------------------------------------------

/**
 * Gera um certificado FICTÍCIO/DEMONSTRATIVO a partir do catálogo sintético.
 *
 * @param {object} input
 * @param {string}   input.participant_alias       - obrigatório
 * @param {string}   input.track_id               - obrigatório
 * @param {string[]} input.completed_challenges    - obrigatório
 * @param {string}   input.completion_date         - obrigatório: YYYY-MM-DD
 * @param {object[]} input.evidence_ids            - obrigatório (array de refs estruturadas)
 * @returns {object} CertificateOutput | CertificateError
 */
export function certificado(input) {
  // -------------------------------------------------------------------------
  // 1. Validar que input é objeto
  // -------------------------------------------------------------------------

  if (input === null || input === undefined || typeof input !== 'object') {
    return {
      error: 'MISSING_REQUIRED_INPUT',
      message: 'Input ausente ou inválido.',
      missing_fields: REQUIRED_FIELDS,
    };
  }

  // -------------------------------------------------------------------------
  // 2. Detectar tentativa de certificado real/institucional (falha fechada)
  // -------------------------------------------------------------------------

  if (input.official === true || input.claim_official_validity === true || input.remove_disclaimer === true) {
    return {
      error: 'REAL_CERTIFICATE_REQUEST_BLOCKED',
      message: 'Tentativa de certificado oficial bloqueada. Este comando gera somente artefato fictício/demonstrativo.',
    };
  }

  const institutionalFields = [
    'requested_issuer',
    'institutional_logo',
    'institutional_signature',
    'institutional_validation_code',
    'qr_code',
  ];

  for (const field of institutionalFields) {
    const val = input[field];
    if (val !== undefined && val !== null && val !== false && val !== '') {
      return {
        error: 'INSTITUTIONAL_IMPERSONATION_BLOCKED',
        message: `Campo institucional "${field}" não é permitido. Este comando não impersona emissora institucional.`,
        field,
      };
    }
  }

  // -------------------------------------------------------------------------
  // 3. Validar campos obrigatórios
  // -------------------------------------------------------------------------

  const missing = [];

  if (typeof input.participant_alias !== 'string' || input.participant_alias.trim() === '') {
    missing.push('participant_alias');
  }
  if (input.track_id === undefined || input.track_id === null ||
      String(input.track_id).trim() === '') {
    missing.push('track_id');
  }
  if (!Array.isArray(input.completed_challenges)) {
    missing.push('completed_challenges');
  }
  if (input.completion_date === undefined || input.completion_date === null ||
      String(input.completion_date).trim() === '') {
    missing.push('completion_date');
  }
  if (!Array.isArray(input.evidence_ids)) {
    missing.push('evidence_ids');
  }

  if (missing.length > 0) {
    return {
      error: 'MISSING_REQUIRED_INPUT',
      message: `Campo(s) obrigatório(s) ausente(s): ${missing.join(', ')}.`,
      missing_fields: missing,
    };
  }

  // -------------------------------------------------------------------------
  // 4. Validar completion_date
  // -------------------------------------------------------------------------

  if (!isValidCompletionDate(input.completion_date)) {
    return {
      error: 'INVALID_COMPLETION_DATE',
      message: `completion_date inválida: "${input.completion_date}". Use o formato YYYY-MM-DD com data civil existente.`,
      field: 'completion_date',
    };
  }

  // -------------------------------------------------------------------------
  // 5. Resolver via catálogo
  // -------------------------------------------------------------------------

  const catalog = loadCatalog();
  return _resolveCertificateFromCatalog(input, catalog);
}
