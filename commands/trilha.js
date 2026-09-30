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
// Helpers
// ---------------------------------------------------------------------------

const REQUIRED_FIELDS = ['role', 'target_goal', 'current_level', 'target_level'];

function isSensitiveRiskContext(riskContext, catalog) {
  if (!riskContext) return false;
  const keywords = catalog.sensitive_risk_keywords ?? [];
  const lc = riskContext.toLowerCase();
  return keywords.some((kw) => lc.includes(kw.toLowerCase()));
}

// ---------------------------------------------------------------------------
// Lógica de seleção de módulos com max_modules + guarda crítica
//
// Exportada para permitir testes unitários com catálogo injetado
// (sem alterar catalog.json de produção).
// ---------------------------------------------------------------------------

/**
 * Valida a sequência do catálogo e aplica max_modules com guarda de CY-01.
 *
 * @param {string[]} moduleSequence  - sequência autoral de skill_ids da trilha
 * @param {Map}      competencyMap   - mapa skill_id → competência
 * @param {boolean}  sensitiveCtx    - true quando risk_context indica dado sensível
 * @param {number|null} maxModules   - cap opcional; null = sem limite
 * @returns {{ modules: object[], limitations: string[] } | { error: string, missing_skill_ids: string[] }}
 */
export function _buildModulesFromCatalog(moduleSequence, competencyMap, sensitiveCtx, maxModules) {
  // -------------------------------------------------------------------------
  // CORREÇÃO 2 — Validação antecipada de toda a sequência (CATALOG_SKILL_GAP)
  // Qualquer skill ausente interrompe imediatamente; nunca retornar trilha parcial.
  // -------------------------------------------------------------------------

  const missingSkillIds = moduleSequence.filter((id) => !competencyMap.has(id));

  if (missingSkillIds.length > 0) {
    return {
      error: 'CATALOG_SKILL_GAP',
      message: `Competência(s) referenciada(s) na trilha não existem no catálogo: ${missingSkillIds.join(', ')}.`,
      missing_skill_ids: missingSkillIds,
    };
  }

  // Todas as competências existem; montar lista completa na ordem autoral
  const allModules = moduleSequence.map((id) => competencyMap.get(id));
  const limitations = [];

  // -------------------------------------------------------------------------
  // CORREÇÃO 1 — max_modules com guarda crítica
  //
  // Regra:
  //   1. Selecionar os primeiros `maxModules` na ordem autoral (base normal).
  //   2. Se sensitiveCtx=true e CY-01 não estiver na seleção, inserir CY-01
  //      na sua posição autoral (mínimo excedente necessário).
  //   3. Sem sensitiveCtx ou sem max_modules: truncar ou retornar tudo.
  // -------------------------------------------------------------------------

  let selectedModules;

  if (maxModules === null || maxModules === undefined || maxModules >= allModules.length) {
    // Sem corte necessário
    selectedModules = allModules;
  } else {
    // Seleção base: primeiros maxModules na ordem autoral
    const baseSelection = allModules.slice(0, maxModules);

    if (sensitiveCtx) {
      const cy01InBase = baseSelection.some((m) => m.critical_security);

      if (cy01InBase) {
        // CY-01 já está dentro do cap — nenhum ajuste
        selectedModules = baseSelection;
      } else {
        // CY-01 está fora do cap — incluí-lo na posição autoral correta
        // Posição autoral de CY-01 dentro de allModules
        const cy01Index = allModules.findIndex((m) => m.critical_security);
        // Construir seleção: módulos autoral cujo índice esteja em baseSelection OU seja cy01Index
        const baseIndexes = new Set(baseSelection.map((_, i) => i));
        baseIndexes.add(cy01Index);
        selectedModules = allModules.filter((_, i) => baseIndexes.has(i));

        const exceeded = selectedModules.length - maxModules;
        limitations.push(
          `max_modules solicitado (${maxModules}) foi ajustado para ${selectedModules.length} módulo(s) ` +
            `para incluir CY-01, requisito crítico de segurança (excedente mínimo: ${exceeded}). ` +
            `${allModules.length - selectedModules.length} módulo(s) omitido(s).`
        );
      }
    } else {
      selectedModules = baseSelection;
    }

    // Registrar truncamento se houve corte (com ou sem contexto crítico)
    const omitted = allModules.length - selectedModules.length;
    if (omitted > 0 && !limitations.length) {
      limitations.push(
        `Trilha truncada em ${selectedModules.length} módulo(s) por max_modules=${maxModules}. ` +
          `${omitted} módulo(s) omitido(s).`
      );
    }
  }

  return { modules: selectedModules, limitations };
}

// ---------------------------------------------------------------------------
// Função principal exportada
// ---------------------------------------------------------------------------

/**
 * Gera uma trilha de aprendizagem a partir do catálogo sintético.
 *
 * @param {object} input
 * @param {string} input.role               - obrigatório
 * @param {string} input.target_goal        - obrigatório
 * @param {string} input.current_level      - obrigatório: L0|L1|L2|L3
 * @param {string} input.target_level       - obrigatório: L0|L1|L2|L3
 * @param {string} [input.risk_context]     - opcional
 * @param {number} [input.max_modules]      - opcional; inteiro ≥ 1
 * @returns {object} TrilhaOutput | TrilhaError
 */
export function trilha(input) {
  const catalog = loadCatalog();

  // -------------------------------------------------------------------------
  // Validação de campos obrigatórios
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
  // Validação de níveis
  // -------------------------------------------------------------------------

  const validLevels = catalog.valid_levels ?? ['L0', 'L1', 'L2', 'L3'];

  if (!validLevels.includes(input.current_level)) {
    return {
      error: 'INVALID_LEVEL',
      message: `current_level inválido: "${input.current_level}". Valores válidos: ${validLevels.join(', ')}.`,
      field: 'current_level',
    };
  }

  if (!validLevels.includes(input.target_level)) {
    return {
      error: 'INVALID_LEVEL',
      message: `target_level inválido: "${input.target_level}". Valores válidos: ${validLevels.join(', ')}.`,
      field: 'target_level',
    };
  }

  // -------------------------------------------------------------------------
  // Validação de max_modules (quando presente)
  // -------------------------------------------------------------------------

  if (input.max_modules !== undefined && input.max_modules !== null) {
    const mm = input.max_modules;
    if (!Number.isInteger(mm) || mm < 1) {
      return {
        error: 'MISSING_REQUIRED_INPUT',
        message: `max_modules deve ser um inteiro ≥ 1; recebido: ${mm}.`,
        field: 'max_modules',
      };
    }
  }

  // -------------------------------------------------------------------------
  // Matching determinístico por IDs e tags explícitos
  // -------------------------------------------------------------------------

  const tracks = catalog.tracks ?? [];

  const matchedTrack = tracks.find((t) => {
    const roleMatch = Array.isArray(t.role_ids) && t.role_ids.includes(input.role);
    const goalMatch =
      (Array.isArray(t.target_goals) && t.target_goals.includes(input.target_goal)) ||
      (Array.isArray(t.goal_tags) && t.goal_tags.includes(input.target_goal));
    return roleMatch && goalMatch;
  });

  if (!matchedTrack) {
    return {
      error: 'NO_MATCHING_TRACK',
      message: `Nenhuma trilha encontrada para role="${input.role}" e target_goal="${input.target_goal}".`,
    };
  }

  // -------------------------------------------------------------------------
  // Construção dos módulos via função auxiliar (valida + aplica max_modules)
  // -------------------------------------------------------------------------

  const competencyMap = new Map(
    (catalog.competencies ?? []).map((c) => [c.skill_id, c])
  );

  const sensitiveCtx = isSensitiveRiskContext(input.risk_context, catalog);
  const maxModules = (input.max_modules !== undefined && input.max_modules !== null)
    ? input.max_modules
    : null;

  const buildResult = _buildModulesFromCatalog(
    matchedTrack.module_sequence,
    competencyMap,
    sensitiveCtx,
    maxModules
  );

  // Retornar erro se CATALOG_SKILL_GAP detectado
  if (buildResult.error) {
    return buildResult;
  }

  const { modules: selectedModules, limitations } = buildResult;

  // -------------------------------------------------------------------------
  // Limitação de final_challenge_id
  // -------------------------------------------------------------------------

  if (matchedTrack.final_challenge_id === null) {
    limitations.push(
      'final_challenge_id não disponível: o comando /desafio ainda não está implementado neste incremento.'
    );
  }

  // -------------------------------------------------------------------------
  // Montagem do output final
  // -------------------------------------------------------------------------

  const modules = selectedModules.map((comp, idx) => ({
    order: idx + 1,
    skill_id: comp.skill_id,
    level: comp.level,
    objective: comp.objective,
    practice: comp.practice,
    evidence_expected: comp.evidence_expected,
  }));

  return {
    track_id: matchedTrack.track_id,
    title: matchedTrack.title,
    why_this_track: matchedTrack.why_this_track,
    prerequisites: matchedTrack.prerequisites ?? [],
    modules,
    final_challenge_id: matchedTrack.final_challenge_id,
    limitations,
  };
}
