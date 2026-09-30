# Política de Segurança — Geo-Explorer — TrustPath AI

## Escopo

O Geo-Explorer — TrustPath AI é um protótipo educacional. O repositório e o fluxo demonstrativo foram desenhados para operar com **dados fictícios/sintéticos** e sem necessidade de credenciais, tokens ou dados pessoais reais.

O servidor MCP incluído neste projeto é local, read-only e usa `stdio`.

## Regras de segurança

- Não versione arquivos `.env`, tokens, chaves, senhas ou outras credenciais.
- Não inclua dados pessoais, empresariais ou institucionais reais no catálogo sintético.
- Não transforme paths, URLs ou comandos fornecidos pelo usuário em acesso arbitrário de filesystem.
- O servidor MCP não deve executar rede, shell, Git ou escrita de filesystem durante o runtime.
- Alterações devem preservar os fail-safes, a imutabilidade do catálogo e o uso explícito de dados sintéticos.
- O certificado gerado pelo protótipo permanece fictício/demonstrativo e não pode ser apresentado como credencial real.
- Dependências devem ser instaladas a partir do lockfile quando possível (`npm ci`) e qualquer mudança de versão deve ser revisada antes de integração.

## Relato de vulnerabilidade

Não publique em uma issue pública:

- credenciais ou tokens;
- dados pessoais;
- detalhes exploráveis de uma vulnerabilidade ainda não corrigida;
- conteúdo que permita abuso imediato.

Quando o GitHub oferecer o fluxo **Report a vulnerability** para este repositório, prefira esse canal privado. Se ele não estiver disponível, contate o mantenedor pelo perfil do GitHub antes de divulgar detalhes sensíveis publicamente.

Relatos públicos são adequados para problemas de documentação, comportamento reproduzível sem conteúdo sensível e sugestões de hardening que não criem risco imediato.

## Incidente com segredo ou dado real

Se um segredo ou dado real for adicionado por engano:

1. interrompa o uso daquele dado;
2. remova-o da superfície pública e do fluxo do projeto;
3. rotacione imediatamente qualquer credencial exposta;
4. avalie se o histórico Git também precisa de remediação;
5. só retome o desenvolvimento após confirmar o estado saneado.

## Limitações

Este documento descreve o modelo de segurança do protótipo. Ele não constitui auditoria de segurança, certificação de conformidade nem garantia de adequação para produção.
