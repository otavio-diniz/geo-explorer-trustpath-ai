# Geo-Explorer — TrustPath AI


> Do interesse em IA à capacidade de utilizá-la com dados, segurança e supervisão humana.


## Resumo


O Geo-Explorer — TrustPath AI é um protótipo educacional que transforma perfil, objetivo de uso de IA e contexto de risco em uma jornada estruturada de aprendizagem. O fluxo central conecta uma trilha determinística, um desafio prático baseado em evidências sintéticas e um certificado exclusivamente fictício/demonstrativo.


O projeto segue uma abordagem **AI-assisted, human-owned e security-by-design**: agentes de IA apoiam planejamento, implementação e testes, enquanto decisões materiais, revisão e publicação permanecem sob supervisão humana.


## Problema


Profissionais e pequenas organizações podem adotar IA mais rapidamente do que desenvolvem competências em dados, segurança, proveniência, pensamento crítico e supervisão humana. O TrustPath AI explora quais competências uma pessoa precisa praticar e demonstrar antes de ampliar o uso de IA em um contexto de trabalho.


## Fluxo principal


`PERFIL/OBJETIVO → /trilha → /desafio → EVIDÊNCIAS SINTÉTICAS → /certificado`


- **`/trilha`** — recomenda uma sequência determinística de competências a partir de perfil, objetivo, nível e contexto de risco.
- **`/desafio`** — entrega o TrustPath Decision Gate, um desafio sintético centrado em evidência, proveniência, minimização de dados e Human-in-the-Loop. A solução permanece responsabilidade do participante.
- **`/certificado`** — gera exclusivamente um certificado fictício/demonstrativo após o atendimento dos critérios didáticos e associação das evidências sintéticas exigidas.


## MCP read-only


O projeto inclui um servidor MCP local por `stdio`, com acesso exclusivamente de leitura a projeções mínimas do catálogo sintético.


Tools registradas:


- `list_tracks`
- `get_track`
- `list_skills`
- `get_challenge`


O servidor usa um caminho interno fixo para o catálogo, não aceita paths ou URLs arbitrários e não executa rede, shell, Git ou escrita de filesystem durante o runtime.


## Arquitetura


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


## Stack


- Node.js 24+
- JavaScript ESM
- JSON
- `node:test`
- `node:assert/strict`
- `@modelcontextprotocol/server` 2.2.0
- `zod` 4.6.5


## Instalação e testes


```bash
npm ci
npm test
```


Validação independente reproduziu **108/108 testes aprovados**, sendo **93 testes do Core** e **15 testes MCP**, com zero falhas.


A suíte cobre, entre outros pontos:


- fluxos válidos e entradas inválidas;
- determinismo e integração entre IDs do Core;
- proveniência e uso exclusivo de dados sintéticos;
- fail-safes e regressão do Core;
- projeções mínimas das tools MCP;
- imutabilidade do catálogo;
- sessão MCP real por `stdio` com `initialize`, `tools/list` e `tools/call`;
- rejeição nativa de tool inexistente pelo protocolo MCP.


## Executando o servidor MCP


```bash
node mcp/server.js
```


O processo usa `stdio` como transporte MCP. A integração com um host MCP deve iniciar esse comando e tratar `stdout` exclusivamente como canal do protocolo.


## Estrutura principal


```text
commands/              comandos do Core
data/synthetic/        catálogo e dados fictícios
mcp/                   servidor MCP read-only
tests/                 testes automatizados
docs/                  documentação complementar quando aplicável
```


Arquivos de governança operacional e evidências internas não pertencem à superfície pública do projeto.


## Segurança, privacidade e integridade


- O MVP utiliza dados fictícios/sintéticos.
- Credenciais e dados reais não são necessários para o fluxo demonstrativo.
- Lacunas de evidência falham de forma controlada.
- Ações materiais e decisões finais permanecem humanas.
- O desafio enfatiza minimização de dados, proveniência e Human-in-the-Loop.
- O MCP é read-only, sem rede, shell ou escrita de filesystem no runtime.
- O certificado do protótipo é fictício/demonstrativo e não possui validade institucional ou profissional.


## Desenvolvimento assistido por IA


O IBM Bob foi utilizado como agente de apoio em planejamento, implementação controlada, testes e operações de versionamento. O processo reforçou três práticas: tarefas estreitas e verificáveis, revisão independente do contrato mesmo após suítes verdes e interrupção segura quando o ambiente técnico não sustentava a próxima ação.


O projeto preserva a distinção entre proposta do agente, decisão humana, teste e resultado observado.


## Aprendizados


Uma suíte verde demonstra que a implementação passa nos testes existentes; ela não prova, isoladamente, que os testes representam todo o contrato. Durante o projeto, a revisão independente encontrou divergências semânticas mesmo após execuções verdes e direcionou correções específicas.


Outro aprendizado foi separar falha de aplicação de falha do ambiente: dependências e Core foram reproduzidos em substrato local confiável antes de prosseguir com a implementação MCP.


## Limitações


- Protótipo educacional; não é produto comercial ou solução pronta para produção.
- Não comprova eficácia educacional, product-market fit ou conformidade regulatória.
- Dados e certificados são fictícios/demonstrativos.
- O MCP foi validado como servidor local `stdio`; integrações com hosts específicos dependem da configuração de cada host.
- Métricas de valor e adoção permanecem hipóteses quando não há baseline observável.


## Roadmap opcional


Itens deliberadamente fora do caminho crítico desta entrega:


- `/diagnostico`
- `/risco`
- `/metricas`
- novas trilhas e desafios
- analytics
- interface de usuário


## Contexto acadêmico


Projeto desenvolvido no contexto do Desafio de Projeto Geo-Explorer do bootcamp DIO / IBM Bob, adaptando o exercício base para um caso de capacitação responsável em IA com dados sintéticos, testes automatizados, documentação, GitHub e integração MCP.
