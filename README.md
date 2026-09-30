# Geo-Explorer — TrustPath AI

> Protótipo educacional desenvolvido no contexto do Desafio de Projeto DIO / IBM Bob.

**Do interesse em IA à capacidade de utilizá-la com dados, segurança e supervisão humana.**

## Estado

Core MVP funcional, atualmente em desenvolvimento e mantido em repositório privado.

## Core MVP

O fluxo principal implementado é:

`/trilha → /desafio → evidências sintéticas → /certificado`

- **`/trilha`** — gera uma trilha de aprendizagem determinística a partir de perfil, objetivo, nível e contexto de risco.
- **`/desafio`** — gera o desafio sintético TrustPath Decision Gate, com foco em evidência, proveniência, minimização de dados e Human-in-the-Loop.
- **`/certificado`** — gera exclusivamente um certificado fictício/demonstrativo após a conclusão didática do fluxo e associação de evidências sintéticas.

## Stack

- Node.js
- JavaScript ESM
- JSON
- `node:test`
- `node:assert/strict`
- Zero dependências externas no Core MVP

## Testes

```bash
npm test
```

A suíte automatizada cobre fluxo funcional, determinismo, proveniência, fail-safes, segurança, Human Gates e integração entre os três comandos do Core.

## Segurança e integridade

- Dados do MVP são fictícios/sintéticos.
- Não são necessárias credenciais ou dados reais.
- Lacunas de evidência falham de forma controlada.
- Ações materiais permanecem sujeitas a decisão humana.
- O certificado gerado pelo protótipo não possui validade institucional ou profissional.

## Contexto acadêmico

Projeto desenvolvido como parte de um desafio educacional envolvendo o IBM Bob.

O protótipo demonstra aplicação prática de IA, dados, segurança, proveniência e supervisão humana. Ele não representa produto comercial ou solução pronta para produção.
