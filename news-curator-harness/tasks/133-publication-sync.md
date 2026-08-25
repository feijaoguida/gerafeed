# 133 Publication Sync

## Objetivo
Marcar publicação desatualizada quando oferta muda.

## Escopo
Usar renderedContentHash, needsRepublish e lastPublishedAt. Mudança relevante em ProductOffer marca publicações dependentes. Republish manual no MVP.

## Definition of Done
- [x] Dependency lookup.
- [x] needsRepublish.
- [x] UI indicator/manual republish.
- [x] Tests.
- [x] TypeScript/Lint PASS.

## Validation
Executar testes automatizados em `scripts/test-publication-sync.ts`, tsc, lint e build.

## Evidence
- `prisma/schema.prisma`:
  - Adicionados campos `renderedContentHash String?`, `needsRepublish Boolean @default(false)` e `lastPublishedAt DateTime?` no modelo `Article` com índice `@@index([workspaceId, needsRepublish])`.
- `src/lib/publisher/publication-sync.ts`:
  - Implementado `PublicationSyncService` com `computeContentHash` (SHA-256), `recordPublication`, `checkArticleOutdated`, `markDependentArticlesForRepublish` e `republishArticle`.
- `src/lib/affiliate/offer-service.ts`:
  - Integrado gatilho automático de detecção de desatualização em `updateOffer` ao alterar preço, status ou URL de ofertas ativas.
- `src/app/api/articles/[id]/republish/route.ts`:
  - Endpoint HTTP POST para republicação manual sincronizada no WordPress.
- `src/components/affiliate/affiliate-article-editor.tsx` e `src/app/(app)/articles/[id]/page.tsx`:
  - Adicionado indicador visual de ofertas desatualizadas (`⚠️ Ofertas Desatualizadas`) e botão de ação para sincronização no WordPress.
- Validações:
  - `npx tsx scripts/test-publication-sync.ts`: PASS (4/4 checks).
  - `npx tsc --noEmit`: PASS.
  - `npm run lint`: PASS (0 erros, 0 avisos).

