# Task 066. Feed Date on Article Card

## Objetivo
Exibir a data da notícia no card/listagem.

## Regra
Usar `originalPublishedAt`.

Fallback:
`Data não informada pela fonte`.

Não usar `createdAt` como substituto silencioso quando houver `originalPublishedAt`.

## Definition of Done
- [ ] data exibida.
- [ ] timezone consistente.
- [ ] fallback.
- [ ] não confunde ingestão com publicação.
- [ ] TypeScript PASS.
- [ ] Lint PASS.
