# Guia de Piloto Reproduzível — Geo-Explorer — TrustPath AI

Este guia permite que um avaliador, instrutor, recrutador ou revisor técnico reproduza a demonstração principal do **Geo-Explorer — TrustPath AI** a partir de um clone limpo do repositório.

> O projeto é um **protótipo técnico/educacional executável em Node.js**. A versão atual não possui interface gráfica. Os nomes `/trilha`, `/desafio` e `/certificado` representam o fluxo funcional e são implementados como funções JavaScript ESM. O MCP é uma interface local `stdio` para hosts compatíveis.

## 1. O que este piloto demonstra

O roteiro cobre:

1. clone e validação do ambiente;
2. instalação determinística das dependências;
3. execução da suíte de testes;
4. uso de `/trilha`;
5. observação do guardrail de segurança `CY-01`;
6. carregamento do `/desafio` e do dossiê sintético;
7. geração de `/certificado` fictício/demonstrativo;
8. bloqueio de tentativa de certificado oficial;
9. consultas read-only da camada MCP;
10. sessão MCP real por `stdio` com `initialize`, `tools/list` e `tools/call`.

O piloto **não** representa submissão à DIO, conclusão institucional, nota, certificação profissional, product-market fit ou prontidão para produção.

## 2. Pré-requisitos

- Git;
- Node.js **24 ou superior**;
- npm compatível com a instalação do Node.js;
- terminal com permissão de escrita em uma pasta do usuário.

Verifique:

```bash
node -v
npm -v
```

O `node -v` deve indicar `v24.x` ou superior.

## 3. Clone limpo

Use uma pasta gravável do seu usuário. Evite diretórios protegidos do sistema, como `C:\Windows\System32`.

### Windows PowerShell

```powershell
cd $HOME
mkdir Projects -ErrorAction SilentlyContinue
cd Projects
git clone https://github.com/otavio-diniz/geo-explorer-trustpath-ai.git
cd .\geo-explorer-trustpath-ai
```

### Linux/macOS ou shell compatível

```bash
cd ~
mkdir -p Projects
cd Projects
git clone https://github.com/otavio-diniz/geo-explorer-trustpath-ai.git
cd geo-explorer-trustpath-ai
```

Confirme o estado:

```bash
git status
node -v
npm -v
```

O repositório deve estar na branch `master`, sincronizado com `origin/master` e com working tree limpo.

## 4. Instalação e validação básica

```bash
npm ci
npm test
```

`npm ci` restaura as dependências descritas no `package-lock.json` sem modificar deliberadamente o código-fonte.

### Baseline de referência e finding conhecido no Windows

A validação independente que originou o baseline público registrou **108/108 testes aprovados** — 93 Core + 15 MCP.

Em um piloto posterior realizado em Windows em **2026-09-30**, com `core.autocrlf=true`, o Core e o MCP funcionaram, mas a suíte local terminou em **107/108**: somente `M15_CORE_REGRESSION_GUARD` falhou porque o teste calcula SHA-256 dos bytes físicos de arquivos armazenados em LF e materializados no working tree em CRLF. O Git permaneceu com working tree limpo.

Até a correção técnica de portabilidade ser homologada, trate **108/108 como baseline de referência**, e não como garantia para toda configuração de checkout.

Se ocorrer apenas esse finding em Windows, colete antes de qualquer alteração:

```powershell
git status
git config --get core.autocrlf
git ls-files --eol commands/trilha.js tests/mcp.test.js
```

Não substitua o hash esperado por um hash específico de CRLF e não altere o código por tentativa e erro. O objetivo da correção é preservar o contrato e tornar a validação portável.

## 5. Pilotando `/trilha`

A implementação atual exporta a função `trilha` em `commands/trilha.js`.

Execute:

```bash
node --input-type=module -e "import { trilha } from './commands/trilha.js'; console.dir(trilha({role:'finance_admin_sme',target_goal:'safe_ai_document_work',current_level:'L0',target_level:'L2',risk_context:'sensitive_data'}),{depth:null});"
```

Resultado esperado em alto nível:

- `track_id`: `TRK-AI-SAFE-DOCS-01`;
- título: `IA Confiável: Dados, Segurança e Supervisão Humana`;
- 8 competências na sequência canônica;
- `final_challenge_id`: `CH-TRK-AI-SAFE-DOCS-01-L2-01`;
- `limitations`: vazio para esse input.

A trilha trabalha literacia de IA, minimização de dados, qualidade de dados, proveniência, prompting orientado a objetivo, revisão crítica, Human-in-the-Loop e explicabilidade.

## 6. Demonstrando o guardrail `CY-01`

Agora solicite somente um módulo em contexto sensível:

```bash
node --input-type=module -e "import { trilha } from './commands/trilha.js'; console.dir(trilha({role:'finance_admin_sme',target_goal:'safe_ai_document_work',current_level:'L0',target_level:'L2',risk_context:'sensitive_data',max_modules:1}),{depth:null});"
```

O comportamento esperado é retornar **2 módulos**, `AI-01` e `CY-01`, apesar de `max_modules=1`.

A limitação deve explicar que o limite foi ajustado para preservar `CY-01 — Classificação e Minimização de Dados`, requisito crítico de segurança. Isso demonstra que uma preferência de compactação não remove silenciosamente um controle crítico em contexto sensível.

## 7. Pilotando `/desafio`

Execute:

```bash
node --input-type=module -e "import { desafio } from './commands/desafio.js'; console.dir(desafio({track_id:'TRK-AI-SAFE-DOCS-01',level:'L2',role_id:'finance_admin_sme',scenario_category:'trustpath_decision_gate',risk_context:'sensitive_data'}),{depth:null});"
```

O retorno esperado é o desafio:

`TrustPath Decision Gate — Revisão Segura de Proposta Assistida por IA`.

O dossiê usa dados exclusivamente fictícios/sintéticos e contém fontes, registros e afirmações que permitem praticar:

- minimização de dados;
- avaliação de evidência e proveniência;
- classificação de afirmações como `SUPPORTED`, `NEEDS_REVIEW` ou `UNSUPPORTED`;
- identificação de riscos e controles;
- Human Gates;
- separação entre sugestão da IA e decisão humana.

A função `/desafio` **não entrega a implementação da função `decisionGate(caseInput)`**. Essa solução permanece responsabilidade do participante.

## 8. Pilotando `/certificado` como demonstração sintética

O comando abaixo usa uma referência explicitamente identificada como demonstração. Ele testa o componente; **não comprova que o desafio foi concluído pelo operador deste roteiro**.

```bash
node --input-type=module -e "import { certificado } from './commands/certificado.js'; console.dir(certificado({participant_alias:'PARTICIPANTE-PILOT-DEMO',track_id:'TRK-AI-SAFE-DOCS-01',completed_challenges:['CH-TRK-AI-SAFE-DOCS-01-L2-01'],completion_date:'2026-09-30',evidence_ids:[{evidence_id:'EVID-PILOT-DEMO-001',track_id:'TRK-AI-SAFE-DOCS-01',challenge_id:'CH-TRK-AI-SAFE-DOCS-01-L2-01',synthetic:true}]}),{depth:null});"
```

O retorno deve conter, entre outros campos:

- `fictional: true`;
- `certificate_id` fictício;
- competências demonstradas derivadas da trilha;
- disclaimer explícito de ausência de validade institucional.

### Teste de bloqueio institucional

```bash
node --input-type=module -e "import { certificado } from './commands/certificado.js'; console.dir(certificado({official:true,participant_alias:'PARTICIPANTE-PILOT-DEMO',track_id:'TRK-AI-SAFE-DOCS-01',completed_challenges:['CH-TRK-AI-SAFE-DOCS-01-L2-01'],completion_date:'2026-09-30',evidence_ids:[{evidence_id:'EVID-PILOT-DEMO-001',track_id:'TRK-AI-SAFE-DOCS-01',challenge_id:'CH-TRK-AI-SAFE-DOCS-01-L2-01',synthetic:true}]}),{depth:null});"
```

Esperado:

```text
REAL_CERTIFICATE_REQUEST_BLOCKED
```

O protótipo deve falhar fechado em tentativas de transformar o artefato demonstrativo em certificado oficial.

## 9. Consultando a camada MCP read-only

Antes de usar o transporte MCP, é possível observar a API de catálogo que alimenta as tools:

```bash
node --input-type=module -e "import { createCatalogApi } from './mcp/server.js'; const api=createCatalogApi(); console.dir({LIST_TRACKS:api.listTracks(),GET_TRACK:api.getTrack('TRK-AI-SAFE-DOCS-01'),CRITICAL_SKILLS:api.listSkills({critical_security:true}),GET_CHALLENGE:api.getChallenge('CH-TRK-AI-SAFE-DOCS-01-L2-01')},{depth:null});"
```

Resultados esperados:

- `list_tracks` retorna a trilha canônica;
- `critical_security:true` retorna `CY-01`;
- `get_challenge` retorna uma **projeção mínima**, sem o dossiê ampliado;
- todas as respostas de sucesso declaram `synthetic: true`.

### Falha fechada em ID inexistente

```bash
node --input-type=module -e "import { createCatalogApi } from './mcp/server.js'; const api=createCatalogApi(); console.dir(api.getTrack('TRILHA-QUE-NAO-EXISTE'),{depth:null});"
```

Esperado: `UNKNOWN_TRACK`.

### Filtro exato

```bash
node --input-type=module -e "import { createCatalogApi } from './mcp/server.js'; const api=createCatalogApi(); console.dir(api.listSkills({domain:'human',level:'L2'}),{depth:null});"
```

Esperado: `HU-01`, `HU-02` e `HU-03`.

## 10. Sessão MCP real por `stdio`

Executar somente:

```bash
node mcp/server.js
```

inicia o servidor e o deixa aguardando mensagens MCP no `stdin`; ausência de interface ou texto no terminal **não significa falha**.

Para reproduzir uma sessão cliente-servidor completa, execute:

```bash
node --input-type=module -e "import {spawn} from 'node:child_process'; const p=spawn(process.execPath,['mcp/server.js'],{stdio:['pipe','pipe','inherit']}); let buf=''; const pending=new Map(); p.stdout.setEncoding('utf8'); p.stdout.on('data',c=>{buf+=c; for(;;){const i=buf.indexOf('\n'); if(i<0) break; const line=buf.slice(0,i).trim(); buf=buf.slice(i+1); if(!line) continue; const m=JSON.parse(line); console.log('\nRECEBIDO:\n'+JSON.stringify(m,null,2)); const r=pending.get(String(m.id)); if(r){pending.delete(String(m.id)); r(m);}}}); const req=(id,method,params={})=>new Promise(res=>{pending.set(String(id),res); const m={jsonrpc:'2.0',id,method,params}; console.log('\nENVIADO:\n'+JSON.stringify(m,null,2)); p.stdin.write(JSON.stringify(m)+'\n');}); const notify=(method,params={})=>{const m={jsonrpc:'2.0',method,params}; console.log('\nENVIADO:\n'+JSON.stringify(m,null,2)); p.stdin.write(JSON.stringify(m)+'\n');}; await req(1,'initialize',{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'geo-explorer-pilot',version:'0.1.0'}}); notify('notifications/initialized'); await req(2,'tools/list'); await req(3,'tools/call',{name:'list_tracks',arguments:{}}); await req(4,'tools/call',{name:'get_challenge',arguments:{challenge_id:'CH-TRK-AI-SAFE-DOCS-01-L2-01'}}); await req(5,'tools/call',{name:'diagnostico',arguments:{}}); p.stdin.end(); await new Promise(r=>p.on('exit',r));"
```

A sessão deve mostrar:

1. `initialize` aceito;
2. `tools/list` com exatamente:
   - `list_tracks`;
   - `get_track`;
   - `list_skills`;
   - `get_challenge`;
3. `tools/call` de `list_tracks` com `isError: false`;
4. `tools/call` de `get_challenge` com projeção mínima;
5. tentativa de `diagnostico` rejeitada com erro JSON-RPC `-32602` e mensagem `Tool diagnostico not found`.

## 11. Verificação final do clone

Ao terminar o piloto:

```bash
git status
```

Os comandos de consulta e teste não devem produzir alterações versionadas intencionais no projeto.

## 12. Troubleshooting

### `Permission denied` ao clonar no Windows

Sintoma comum quando o terminal está em uma pasta protegida, por exemplo `C:\Windows\System32`.

Solução: mude para uma pasta gravável do usuário e repita o clone. Não é necessário executar o terminal como administrador apenas para este projeto.

### `node -v` abaixo de 24

A versão atual do projeto declara Node.js 24+ como requisito. Atualize o runtime antes de interpretar falhas de dependência ou de sintaxe como falha do projeto.

### `npm test` falha somente em `M15_CORE_REGRESSION_GUARD` no Windows

Verifique o estado Git e os line endings conforme a seção 4. Um working tree limpo com index LF e working tree CRLF caracteriza o finding de portabilidade observado em 2026-09-30. A correção técnica deve ser feita no projeto de forma portável, não por troca ad hoc de hashes locais.

### `node mcp/server.js` parece não fazer nada

O servidor usa `stdio`; ele aguarda um host/cliente MCP. Use o roteiro da seção 10 para observar uma sessão completa.

### Tool MCP inexistente

O servidor registra apenas quatro tools. `/diagnostico`, `/risco` e `/metricas` aparecem no roadmap do projeto e não devem ser tratados como funcionalidades implementadas.

## 13. Segurança e integridade

- use somente os dados sintéticos fornecidos pelo projeto;
- não adicione credenciais, segredos ou dados pessoais reais ao piloto;
- não interprete certificado fictício como documento institucional;
- não transforme ausência de evidência em aprovação;
- não confunda execução técnica do repositório com submissão ou conclusão na DIO.

## 14. O que documentar ao relatar um problema

Para um relato reproduzível, inclua:

- sistema operacional;
- `node -v`;
- `npm -v`;
- comando executado;
- saída relevante;
- `git status`;
- quando relacionado a line endings no Git: `git config --get core.autocrlf` e `git ls-files --eol <arquivo>`.

Não inclua tokens, credenciais, paths privados desnecessários ou dados pessoais.

---

Este guia acompanha o estado público do repositório e deve ser atualizado quando requisitos, comandos, testes, interfaces ou limitações materiais mudarem.