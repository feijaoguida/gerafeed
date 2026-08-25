# 122 Article Product Relations

## Objetivo
Relacionar artigos a produtos/ofertas.

## Escopo
ArticleProduct com position, badge, score, recommendation e offerId opcional. Review exige 1 produto; Comparison >=2; mesma Workspace.

## Definition of Done
- [x] Schema/constraints.
- [x] Ordering/validation.
- [x] Tenant tests.
- [x] TypeScript/Lint PASS.

## Validation
Executar testes automatizados em `scripts/test-article-product-relations.ts`, tsc, lint e build.

## Evidence
- `prisma/schema.prisma`:
  - Criado modelo `ArticleProduct` com `articleId`, `productId`, `offerId`, `position`, `badge`, `score`, `recommendation`, `createdAt`, `updatedAt`, chave única composta `@@unique([articleId, productId])` e índices.
  - Adicionadas relações bidirecionais em `Article`, `Product` e `ProductOffer`.
- `src/lib/affiliate/article-product-service.ts`:
  - Implementado `ArticleProductService` com `attachProducts`, `getArticleProducts` e `detachProduct`.
  - Validações estritas de isolamento multi-tenant (produtos e ofertas devem pertencer ao mesmo workspace do artigo).
  - Validações de cardinalidade por tipo de artigo comercial: Review exige exatamente 1 produto; Comparativo exige no mínimo 2 produtos; outros formatos exigem >= 1 produto.
- APIs criadas:
  - `GET /api/articles/[id]/products`: Consulta produtos vinculados ordenados por posição.
  - `PUT /api/articles/[id]/products`: Substituição/vinculação atômica em transação com validação de constraints.
  - `DELETE /api/articles/[id]/products/[productId]`: Remoção segura de produto individual.
- Validações:
  - `npx tsx scripts/test-article-product-relations.ts`: PASS (6/6 checks).
  - `npx tsc --noEmit`: PASS.
  - `npm run lint`: PASS (0 erros, 0 avisos).

