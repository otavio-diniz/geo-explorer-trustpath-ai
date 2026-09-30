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

A mudança não deve reduzir silenciosamente a cobertura existente. No estado publicado que originou este documento, a suíte validada possuía **108 testes** — 93 Core e 15 MCP.

Se a contagem futura mudar legitimamente, documente o novo estado em vez de tratar 108 como número permanente.

## Checklist para Pull Request

- [ ] O escopo da mudança está claro.
- [ ] O comportamento alterado foi testado.
- [ ] O estado declarado corresponde à evidência disponível.
- [ ] Não incluí segredos, credenciais ou dados reais.
- [ ] Dados de exemplo permanecem sintéticos.
- [ ] Não incluí prompts, logs, paths ou governança operacional interna.
- [ ] Referências e componentes de terceiros estão corretamente atribuídos.
- [ ] Roadmap continua separado de funcionalidades implementadas.
- [ ] Li `SECURITY.md`, `LICENSE` e `NOTICE.md`.

## Segurança

Vulnerabilidades sensíveis não devem ser divulgadas em issues públicas. Consulte `SECURITY.md`.
