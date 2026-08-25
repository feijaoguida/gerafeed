# 102 Affiliate Product Schema

## Objetivo
Criar ProductCategory, Product e ProductOffer.

## Escopo
ProductOffer contém affiliateUrl obrigatório e metadata de importação: externalProductId, originalUrl/resolvedUrl, metadataSource e metadataLastFetchedAt. Adicionar índices úteis e tenant isolation.

## Definition of Done
- [x] Prisma/migration.
- [x] Constraints/índices.
- [x] Tenant tests.
- [x] TypeScript/Lint/Tests PASS.

## Validation
Executar testes automatizados em `scripts/test-affiliate-product-schema.ts` e validações manuais aplicáveis.

## Evidence
- `prisma/schema.prisma`:
  - Adicionado `ProductCategory` com `workspaceId`, `name`, `slug`, `description` e constraint `@@unique([workspaceId, slug])`.
  - Adicionado `Product` com `workspaceId`, `categoryId`, `name`, `slug`, `brand`, `description`, `imageUrl`, `specs`, `pros`, `cons`, `rating`, `status` (`DRAFT`, `ACTIVE`, `ARCHIVED`) e índices `[workspaceId]`, `[categoryId]`.
  - Adicionado `ProductOffer` com `workspaceId`, `productId`, `affiliateProgramId`, `externalProductId`, `originalUrl`, `resolvedUrl`, `affiliateUrl` (obrigatório), `seller`, `price`, `oldPrice`, `currency`, `trackingLabel`, `metadataSource`, `metadataLastFetchedAt`, `status` (`ACTIVE`, `PAUSED`, `OUT_OF_STOCK`, `ARCHIVED`) e índices `[workspaceId]`, `[productId]`, `[affiliateProgramId]`, `[workspaceId, affiliateProgramId, externalProductId]`.
  - Atualizado modelo `Workspace` e `AffiliateProgram` com as devidas relações.
  - Sincronizado com PostgreSQL via `prisma db push` e client atualizado via `prisma generate`.
- `scripts/test-affiliate-product-schema.ts`:
  - Check 1: Criação de Tenants (Workspaces) A e B PASS.
  - Check 2: ProductCategory e isolamento de slug por tenant PASS (permite mesmo slug em tenants diferentes, bloqueia duplicado no mesmo tenant).
  - Check 3: Product com campos estruturados (specs JSON, pros/cons, rating) PASS.
  - Check 4: ProductOffer com metadados de importação e affiliateUrl obrigatório PASS.
  - Check 5: Isolamento estrito de dados entre workspaces (0 vazamento) PASS.
  - Check 6: Exclusão em cascata de ProductOffer na deleção de Product PASS.
- Validações:
  - `npx tsx scripts/test-affiliate-product-schema.ts`: PASS (6/6 checks).
  - `npx tsx scripts/test-affiliate-program-and-provider.ts`: PASS (5/5 checks).
  - `npx tsx scripts/test-affiliate-plan-entitlements.ts`: PASS (5/5 checks).
  - `npx tsc --noEmit`: PASS.
  - `npm run lint`: PASS (0 erros, 0 avisos).

