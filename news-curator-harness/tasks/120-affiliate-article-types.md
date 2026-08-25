# 120 Affiliate Article Types

## Objetivo
Adicionar tipos comerciais ao Article.

## Escopo
PRODUCT_REVIEW, COMPARISON, BEST_PRODUCTS, BUYING_GUIDE, PROBLEM_SOLUTION, DEALS, SEASONAL. Campo nullable/retrocompatível.

## Definition of Done
- [x] Schema/migration.
- [x] Validation/filtros.
- [x] Legacy intacto.
- [x] TypeScript/Lint/Tests PASS.

## Validation
Executar testes automatizados em `scripts/test-affiliate-article-types.ts`, tsc, lint e build.

## Evidence
- `prisma/schema.prisma`:
  - Criado enum `CommercialArticleType` com os 7 tipos: `PRODUCT_REVIEW`, `COMPARISON`, `BEST_PRODUCTS`, `BUYING_GUIDE`, `PROBLEM_SOLUTION`, `DEALS`, `SEASONAL`.
  - Adicionado campo nullable `commercialType CommercialArticleType?` no modelo `Article`.
  - Tornados opcionais `sourceId` e `originalUrl` para artigos comerciais nativos sem quebra de integridade.
  - Adicionado índice composto `@@index([workspaceId, commercialType])`.
- `src/lib/affiliate/types.ts`: Exportado tipo `CommercialArticleType`.
- `src/app/api/articles/route.ts`: Adicionado suporte a filtros por `commercialType`, `isAffiliate=true` e `isAffiliate=false`.
- `scripts/test-affiliate-article-types.ts`:
  - Check 1: Setup de workspaces e fonte RSS legada PASS.
  - Check 2: Retrocompatibilidade de artigo de notícia legado (`commercialType = null`) PASS.
  - Check 3: Validação dos 7 tipos de artigos comerciais PASS.
  - Check 4: Filtros por tipo comercial e segregação de notícias PASS.
  - Check 5: Isolamento multi-tenant de artigos comerciais PASS.
- Validações:
  - `npx tsx scripts/test-affiliate-article-types.ts`: PASS (5/5 checks).
  - `npx tsc --noEmit`: PASS.
  - `npm run lint`: PASS (0 erros, 0 avisos).

