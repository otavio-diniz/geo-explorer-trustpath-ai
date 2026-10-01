# Contribuindo com o Geo-Explorer — TrustPath AI

## Princípio

Este repositório acompanha um projeto acadêmico autoral e de portfólio. Feedback é bem-vindo, mas a publicação pública **não constitui uma licença open source** e Pull Requests não são presumidamente aceitos.

Antes de propor código, consulte `LICENSE` e `NOTICE.md`.

## O que é bem-vindo

- relato reproduzível de bug;
- melhoria de documentação;
- sugestão de teste ou guardrail;
- observação sobre clareza da arquitetura;
- feedback sobre segurança, acessibilidade ou experiência de uso;
- correção factual que preserve o escopo acadêmico e a autoria.

Para mudanças de código, abra primeiro uma issue descrevendo a proposta e aguarde alinhamento do mantenedor.

## Integridade acadêmica

- Não copie solução de instrutor ou de terceiro como produção autoral.
- Referências externas devem ser identificadas como referência.
- Dados do protótipo devem permanecer fictícios/sintéticos.
- Não implemente nem apresente como concluída uma funcionalidade de roadmap sem evidência.
- Não transforme o desafio educacional em uma solução previamente resolvida para o participante.

## Branch e commits

A branch integrada deste repositório é:

- `master`: estado público revisado.

Para trabalho autorizado, prefira branches de tarefa, por exemplo:

- `feat/<tema>`
- `docs/<tema>`
- `fix/<tema>`
- `test/<tema>`

Mensagens de commit devem ser curtas e descritivas:

- `docs: clarify mcp usage`
- `test: cover invalid challenge id`
- `fix: preserve catalog immutability`

## Validação

Antes de propor uma mudança:

```bash
npm ci
npm test
```

A mudança não deve reduzir silenciosamente a cobertura existente. O baseline independente que originou a publicação possuía **108 testes** — 93 Core e 15 MCP. Um piloto Windows posterior identificou uma dependência de line endings no guard de hash `M15_CORE_REGRESSION_GUARD`; por isso, contagens ou resultados de um único ambiente não devem ser promovidos como portabilidade universal sem evidência.

Se a contagem futura mudar legitimamente, documente o novo estado em vez de tratar 108 como número permanente.

## Reprodutibilidade pública

Para mudanças que afetem instalação, execução, testes, interfaces ou comportamento observável, a documentação pública deve continuar permitindo que um terceiro parta de um clone limpo e chegue ao comportamento anunciado sem depender de conhecimento tácito do autor.

No mínimo, mantenha atualizado:

- pré-requisitos e versões materiais;
- comando de clone e diretório de trabalho quando aplicável;
- instalação determinística das dependências;
- comando de validação/testes;
- caminho curto até a primeira execução útil;
- saídas ou critérios de aceite esperados;
- limitações conhecidas e diferenças relevantes entre ambientes;
- troubleshooting para falhas reproduzíveis que possam confundir um avaliador;
- verificação final de estado limpo quando aplicável.

O README deve permanecer legível. Quando o procedimento completo for extenso, mantenha um Quickstart no README e um guia detalhado em `docs/`, como [`docs/PILOT_GUIDE.md`](docs/PILOT_GUIDE.md).

Se um resultado variar entre Windows, Linux, macOS ou configurações Git relevantes, registre a diferença com evidência. Não altere hashes, testes ou expectativas apenas para fazer um ambiente local ficar verde sem compreender a causa.

## Checklist para Pull Request

- [ ] O escopo da mudança está claro.
- [ ] O comportamento alterado foi testado.
- [ ] O estado declarado corresponde à evidência disponível.
- [ ] Quickstart/guia reproduzível foi atualizado quando a mudança afeta instalação, execução, testes ou interfaces.
- [ ] Saídas esperadas e limitações ambientais relevantes estão documentadas.
- [ ] Ambientes materiais foram testados ou a limitação de portabilidade está explicitamente declarada.
- [ ] Não incluí segredos, credenciais ou dados reais.
- [ ] Dados de exemplo permanecem sintéticos.
- [ ] Não incluí prompts, logs, paths ou governança operacional interna.
- [ ] Referências e componentes de terceiros estão corretamente atribuídos.
- [ ] Roadmap continua separado de funcionalidades implementadas.
- [ ] Li `SECURITY.md`, `LICENSE`, `NOTICE.md` e o guia de piloto quando a mudança afeta uso reproduzível.

## Segurança

Vulnerabilidades sensíveis não devem ser divulgadas em issues públicas. Consulte `SECURITY.md`.
