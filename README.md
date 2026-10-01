# Geo-Explorer — TrustPath AI

> **Do interesse em IA à capacidade de utilizá-la com dados, segurança e supervisão humana.**

Projeto desenvolvido no contexto do **Desafio de Projeto Geo-Explorer — DIO / IBM Bob**.

> **Autoria e direitos:** © 2026 Otávio Diniz. Todos os direitos reservados sobre os materiais autorais específicos deste projeto, observados os direitos de terceiros. Este repositório é público para avaliação acadêmica, demonstração técnica e portfólio. A publicação pública **não constitui licença open source**. Consulte [`LICENSE`](LICENSE) e [`NOTICE.md`](NOTICE.md).

## Resumo

O Geo-Explorer — TrustPath AI é um protótipo educacional que transforma perfil, objetivo de uso de IA e contexto de risco em uma jornada estruturada de aprendizagem. O fluxo central conecta uma trilha determinística, um desafio prático baseado em evidências sintéticas e um certificado exclusivamente fictício/demonstrativo.

O projeto segue uma abordagem **AI-assisted, human-owned e security-by-design**: agentes de IA apoiam planejamento, implementação e testes, enquanto decisões materiais, revisão e publicação permanecem sob supervisão humana.

## Problema

Profissionais e pequenas organizações podem adotar IA mais rapidamente do que desenvolvem competências em dados, segurança, proveniência, pensamento crítico e supervisão humana. O TrustPath AI explora quais competências uma pessoa precisa praticar e demonstrar antes de ampliar o uso de IA em um contexto de trabalho.

## Solução e fluxo principal

`PERFIL/OBJETIVO → /trilha → /desafio → EVIDÊNCIAS SINTÉTICAS → /certificado`

- **`/trilha`** — recomenda uma sequência determinística de competências a partir de perfil, objetivo, nível e contexto de risco.
- **`/desafio`** — entrega o TrustPath Decision Gate, um desafio sintético centrado em evidência, proveniência, minimização de dados e Human-in-the-Loop. A solução permanece responsabilidade do participante.
- **`/certificado`** — gera exclusivamente um certificado fictício/demonstrativo após o atendimento dos critérios didáticos e associação das evidências sintéticas exigidas.

```text
perfil + objetivo + risco
        ↓
      /trilha
        ↓
     /desafio
        ↓
evidências sintéticas
        ↓
   /certificado
```

O fluxo descreve o protótipo; não representa emissão institucional de certificado.

## Estado do projeto

- **Core MVP:** concluído e validado funcionalmente.
- **Fluxo funcional:** `/trilha → /desafio → evidências sintéticas → /certificado`.
- **MCP read-only:** concluído e validado por `stdio`.
- **Validação:** baseline independente de referência **108/108 PASS**; o piloto Windows de 2026-09-30 encontrou **107/108** por um finding de portabilidade no guard `M15_CORE_REGRESSION_GUARD`, corrigido e homologado em 2026-10-01 em checkouts Windows CRLF e LF, ambos **108/108 PASS**. Consulte [Validação e evidências](#validação-e-evidências).
- **Catálogo sintético:** imutabilidade validada.
- **GitHub:** superfície pública de portfólio e demonstração técnica.
- **Submissão à DIO:** ação humana separada; não é inferida pelo estado técnico do repositório.

A implementação funcional está concluída como **protótipo educacional e case de portfólio**. O finding técnico de portabilidade do regression guard foi reproduzido e corrigido por normalização canônica de CRLF para LF antes do SHA-256. A homologação local cobriu checkouts Windows CRLF e LF; Linux/macOS não foram executados nesta rodada e não são inferidos por essa evidência.

## Quickstart — do clone à primeira validação

Pré-requisitos: **Git** e **Node.js 24+**.

```bash
git clone https://github.com/otavio-diniz/geo-explorer-trustpath-ai.git
cd geo-explorer-trustpath-ai
node -v
npm ci
npm test
```

Use uma pasta gravável do seu usuário; em Windows, evite diretórios protegidos como `C:\Windows\System32`.

Para reproduzir o piloto completo — incluindo `/trilha`, guardrail `CY-01`, `/desafio`, `/certificado`, bloqueio institucional, MCP read-only, sessão MCP real por `stdio`, saídas esperadas e troubleshooting — consulte:

**[`docs/PILOT_GUIDE.md`](docs/PILOT_GUIDE.md) — Guia de Piloto Reproduzível**.

## Como usar o Core

Os nomes `/trilha`, `/desafio` e `/certificado` representam o fluxo funcional do projeto. Na implementação atual, eles são funções JavaScript ESM exportadas pelos arquivos em `commands/`. Esta versão não possui interface gráfica.

### `/trilha`

```js
import { trilha } from './commands/trilha.js';

const result = trilha({
  role: 'finance_admin_sme',
  target_goal: 'safe_ai_document_work',
  current_level: 'L0',
  target_level: 'L2',
  risk_context: 'sensitive_data'
});

console.log(result);
```

### `/desafio`

```js
import { desafio } from './commands/desafio.js';

const result = desafio({
  track_id: 'TRK-AI-SAFE-DOCS-01',
  level: 'L2',
  role_id: 'finance_admin_sme',
  scenario_category: 'trustpath_decision_gate',
  risk_context: 'sensitive_data'
});

console.log(result);
```

O comando retorna o desafio e o dossiê sintético. Ele **não implementa a solução `decisionGate` pelo participante**.

### `/certificado`

```js
import { certificado } from './commands/certificado.js';

const result = certificado({
  participant_alias: 'PARTICIPANTE-DEMO',
  track_id: 'TRK-AI-SAFE-DOCS-01',
  completed_challenges: ['CH-TRK-AI-SAFE-DOCS-01-L2-01'],
  completion_date: '2026-09-30',
  evidence_ids: [
    {
      evidence_id: 'EVID-DEMO-001',
      track_id: 'TRK-AI-SAFE-DOCS-01',
      challenge_id: 'CH-TRK-AI-SAFE-DOCS-01-L2-01',
      synthetic: true
    }
  ]
});

console.log(result);
```

O resultado é sempre fictício/demonstrativo e contém disclaimer explícito de ausência de validade institucional.

## MCP read-only

O projeto inclui um servidor MCP local por `stdio`, com acesso exclusivamente de leitura a projeções mínimas do catálogo sintético.

Tools registradas:

- `list_tracks`
- `get_track`
- `list_skills`
- `get_challenge`

O servidor usa um caminho interno fixo para o catálogo, não aceita paths ou URLs arbitrários e não executa rede, shell, Git ou escrita de filesystem durante o runtime.

### Executar o servidor MCP

```bash
node mcp/server.js
```

O processo usa `stdio` como transporte MCP. Um host MCP deve iniciar esse comando e tratar `stdout` exclusivamente como canal do protocolo. Para uma sessão cliente-servidor reproduzível e instruções específicas de Windows, consulte [`docs/PILOT_GUIDE.md`](docs/PILOT_GUIDE.md).

## Arquitetura e estrutura

```text
Perfil + objetivo + contexto de risco
                │
                ▼
             /trilha
                │
                ▼
             /desafio
                │
                ▼
      evidências sintéticas
                │
                ▼
          /certificado

       catálogo sintético
          ▲         ▲
          │         │
      comandos   MCP read-only
```

Estrutura principal:

```text
commands/              comandos do Core
data/synthetic/        catálogo e dados fictícios
docs/                   documentação reproduzível de uso e piloto
mcp/                    servidor MCP read-only
tests/                  testes automatizados
```

Arquivos de governança operacional, prompts internos, logs de agentes e evidências administrativas não pertencem à superfície pública do projeto.

### Stack

- Node.js 24+
- JavaScript ESM
- JSON
- `node:test`
- `node:assert/strict`
- `@modelcontextprotocol/server` 2.2.0
- `zod` 4.6.5

## Validação e evidências

A validação independente que originou o baseline público reproduziu **108/108 testes aprovados**, sendo **93 testes do Core** e **15 testes MCP**, com zero falhas naquele ambiente.

Um piloto posterior em Windows, em 2026-09-30, reproduziu o Core e o MCP funcionalmente, mas encontrou **107/108** na suíte completa: somente `M15_CORE_REGRESSION_GUARD` falhou porque o guard calculava SHA-256 dos bytes físicos enquanto um checkout com `core.autocrlf=true` materializou arquivos LF como CRLF. O Git permaneceu com working tree limpo. Em 2026-10-01, a causa foi confirmada nos seis arquivos protegidos e o guard passou a normalizar CRLF para LF antes do hash.

A correção foi homologada localmente em dois clones limpos Windows do mesmo HEAD: um working tree CRLF (`core.autocrlf=true`) e outro LF (`core.autocrlf=false`), ambos com **108/108 PASS**. Uma troca puramente CRLF↔LF não dispara o M15, enquanto uma mutação material controlada continua sendo rejeitada. Esta rodada não executou Linux/macOS.

A suíte cobre, entre outros pontos:

- fluxos válidos e entradas inválidas;
- determinismo e integração entre IDs do Core;
- proveniência e uso exclusivo de dados sintéticos;
- fail-safes e regressão do Core;
- projeções mínimas das tools MCP;
- imutabilidade do catálogo;
- sessão MCP real por `stdio` com `initialize`, `tools/list` e `tools/call`;
- rejeição nativa de tool inexistente pelo protocolo MCP.

> O número de testes representa a suíte validada no respectivo ambiente/estado do repositório; não é métrica de eficácia educacional, adoção ou qualidade de mercado.

## Segurança, privacidade e limitações

- O MVP utiliza dados fictícios/sintéticos.
- Credenciais e dados reais não são necessários para o fluxo demonstrativo.
- Lacunas de evidência falham de forma controlada.
- Ações materiais e decisões finais permanecem humanas.
- O desafio enfatiza minimização de dados, proveniência e Human-in-the-Loop.
- O MCP é read-only, sem rede, shell ou escrita de filesystem no runtime.
- O certificado do protótipo é fictício/demonstrativo e não possui validade institucional ou profissional.
- Vulnerabilidades e incidentes devem seguir [`SECURITY.md`](SECURITY.md).
- O projeto é um protótipo educacional; não é produto comercial ou solução pronta para produção.
- Não comprova eficácia educacional, product-market fit ou conformidade regulatória.
- O MCP foi validado como servidor local `stdio`; integrações com hosts específicos dependem da configuração de cada host.
- O finding histórico de portabilidade do `M15_CORE_REGRESSION_GUARD` em checkout Windows LF→CRLF foi corrigido por hash canônico de texto e homologado em checkouts Windows CRLF e LF; outros sistemas operacionais permanecem fora do escopo da rodada de 2026-10-01.
- Métricas de valor e adoção permanecem hipóteses quando não há baseline observável.

## Melhorias realizadas sobre o fluxo-base

A implementação foi deliberadamente além do fluxo mínimo do exercício sem descaracterizar o desafio:

- especialização do Geo-Explorer em **capacitação responsável em IA** para um contexto profissional sintético;
- trilha determinística com competências de IA, dados, segurança, proveniência, pensamento crítico e Human-in-the-Loop;
- guarda de competência crítica de segurança em contexto sensível;
- desafio TrustPath Decision Gate com dossiê sintético, proveniência explícita e Human Gate, sem entregar a solução do participante;
- certificado fictício com fail-safes contra impersonação institucional;
- MCP read-only com quatro tools e data minimization;
- testes adversariais e regressivos sobre inputs malformados, referências ausentes/incompatíveis, imutabilidade e protocolo `stdio`;
- separação explícita entre conteúdo público de portfólio e governança operacional interna;
- camada pública de autoria, licença, segurança e contribuição;
- guia reproduzível de piloto para reduzir dependência de conhecimento tácito do autor.

## Desenvolvimento assistido por IA e aprendizados

O IBM Bob foi utilizado como agente de apoio em planejamento, implementação controlada, testes e operações de versionamento. O processo reforçou três práticas: tarefas estreitas e verificáveis, revisão independente do contrato mesmo após suítes verdes e interrupção segura quando o ambiente técnico não sustentava a próxima ação.

O projeto preserva a distinção entre proposta do agente, decisão humana, teste e resultado observado. Logs operacionais, prompts, reprompts e métricas internas de execução permanecem fora da superfície pública.

Principais aprendizados:

- uma suíte verde demonstra que a implementação passa nos testes existentes; não prova, isoladamente, que os testes representam todo o contrato;
- falha de aplicação e falha de ambiente precisam ser distinguidas antes de corrigir;
- reprodutibilidade inclui diferenças de ambiente e materialização do working tree;
- um guard de integridade baseado em bytes pode depender de convenções de line ending mesmo quando o conteúdo lógico não mudou;
- **bloquear com segurança** pode ser o comportamento correto quando autorização, contexto ou substrato técnico não sustentam a continuação.

## Roadmap opcional

Itens deliberadamente fora do caminho crítico desta entrega:

- `/diagnostico`
- `/risco`
- `/metricas`
- novas trilhas e desafios
- analytics
- interface de usuário

Roadmap representa possibilidades futuras, não funcionalidades implementadas.

## Contexto acadêmico e créditos

Projeto desenvolvido no contexto do Desafio de Projeto Geo-Explorer do bootcamp DIO / IBM Bob, adaptando o exercício base para um caso de capacitação responsável em IA com dados sintéticos, testes automatizados, documentação, GitHub e integração MCP.

A fonte oficial disponibilizada para o desafio define o Geo-Explorer, seus três comandos, testes, documentação, publicação em GitHub e a etapa MCP. Ela não fornece, no material autenticado deste projeto, um repositório público de referência ou identificação do expert que possa ser atribuída com segurança; por isso esses dados não são inventados aqui.

Agradeço à **DIO** pelo contexto educacional e pela proposta do desafio Geo-Explorer, e à **IBM** pelo ecossistema tecnológico associado ao **IBM Bob**, utilizado como apoio durante o processo de desenvolvimento e experimentação deste projeto.

A referência à DIO, à IBM e ao IBM Bob registra origem acadêmica, contexto tecnológico e agradecimento pelo programa; **não implica endosso, avaliação, certificação, parceria ou vínculo profissional** dessas partes com esta implementação autoral.

## Autoria, licença e direitos de terceiros

O Geo-Explorer — TrustPath AI é um projeto autoral de **Otávio Diniz**. O repositório permanece público para avaliação acadêmica, inspeção técnica, demonstração e portfólio, mas **não adota licença open source**.

A licença proprietária permite a avaliadores, instrutores, recrutadores e revisores inspecionar, clonar/baixar e executar o projeto na medida necessária para avaliação ou reprodução da demonstração documentada. Outros usos dependem dos termos completos.

As dependências e tecnologias de terceiros permanecem sob suas próprias licenças e termos. Entre as dependências diretas deste estado do projeto:

- `@modelcontextprotocol/server` 2.2.0 — Apache-2.0;
- `zod` 4.6.5 — MIT.

Model Context Protocol, Node.js, DIO, IBM e demais nomes/marcas citados pertencem aos respectivos titulares quando aplicável.

Documentos de referência:

- Termos de uso: [`LICENSE`](LICENSE)
- Autoria, finalidade pública e terceiros: [`NOTICE.md`](NOTICE.md)
- Política de segurança: [`SECURITY.md`](SECURITY.md)
- Orientações de contribuição: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Piloto reproduzível: [`docs/PILOT_GUIDE.md`](docs/PILOT_GUIDE.md)

A disponibilidade pública continua sujeita às funcionalidades e aos Termos de Serviço do GitHub.

## Contribuição e feedback

Feedback técnico e de produto é bem-vindo, inclusive sobre clareza da arquitetura, MCP read-only, segurança, Human-in-the-Loop, rastreabilidade, reprodutibilidade e evolução do protótipo.

Como este é um projeto acadêmico autoral e publicado sob licença proprietária, contribuições de código não são presumidamente aceitas. Consulte [`CONTRIBUTING.md`](CONTRIBUTING.md) antes de abrir uma Pull Request.

Não publique segredos, credenciais, dados pessoais ou detalhes exploráveis de vulnerabilidades em issues públicas; consulte [`SECURITY.md`](SECURITY.md).

---

**Geo-Explorer — TrustPath AI**  
© 2026 Otávio Diniz. Todos os direitos reservados.