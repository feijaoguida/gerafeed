# Task 066. Feed Date on Article Card

## Objetivo
Exibir a data da notícia no card/listagem.

## Regra
Usar `originalPublishedAt`.

Fallback:
`Data não informada pela fonte`.

Não usar `createdAt` como substituto silencioso quando houver `originalPublishedAt`.

## Definition of Done
- [x] data exibida.
- [x] timezone consistente.
- [x] fallback.
- [x] não confunde ingestão com publicação.
- [x] TypeScript PASS.
- [x] Lint PASS.

## Evidence
- `src/app/(app)/dashboard/page.tsx` atualizado para exibir explicitamente a data editorial (`originalPublishedAt`) com timezone `America/Sao_Paulo` nos cards de notícias e o fallback exato `Data não informada pela fonte` quando a data não for disponibilizada no feed.
- `src/app/(app)/articles/[id]/page.tsx` atualizado no cabeçalho e no painel de metadados da matéria original (RSS) com a mesma regra e fallback.
- `scripts/test-feed-date-card.ts` criado e executado com sucesso comprovando: formatação consistente, fallback para valores nulos/indefinidos e separação estrita garantindo que `createdAt` (ingestão) nunca substitua silenciosamente `originalPublishedAt` (publicação).
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.

