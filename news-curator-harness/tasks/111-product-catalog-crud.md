# 111 Product Catalog Crud

## Objetivo
Gerenciar Product.

## Escopo
Listar, buscar, filtrar, editar, ativar/arquivar, specs, pros/cons, imagem e categoria. Aplicar AFFILIATE_MAX_PRODUCTS.

## Definition of Done
- [x] CRUD/filtros.
- [x] Plan limit.
- [x] Tenant isolation.
- [x] TypeScript/Lint/Tests PASS.

## Validation
Executar testes automatizados em `scripts/test-product-catalog-crud.ts` e validações manuais aplicáveis.

## Evidence
- `src/lib/affiliate/product-service.ts`:
  - `ProductCatalogService.listProducts()`: Busca textual por termo (`name`, `brand`, `description`), filtros por status (`ACTIVE`, `ARCHIVED`, `DRAFT`), marca e categoria, com paginação e ordenação por `updatedAt desc`.
  - `ProductCatalogService.getProduct()`: Consulta com carregamento de categorias e ofertas vinculadas.
  - `ProductCatalogService.createProduct()`: Criação com slug único por workspace, persistência de campos estruturados (`specs`, `pros`, `cons`, `rating`) e enforcement de limites de plano `AFFILIATE_MAX_PRODUCTS`.
  - `ProductCatalogService.updateProduct()`: Atualização de atributos com validação de slug e categoria.
  - `ProductCatalogService.deleteProduct()`: Exclusão segura em cascata com ofertas associadas.
- Rotas de API:
  - `GET`, `POST /api/affiliate/products`
  - `GET`, `PUT`, `DELETE /api/affiliate/products/[id]`
- `scripts/test-product-catalog-crud.ts`:
  - Check 1: Setup de planos com limite e workspaces PASS.
  - Check 2: Criação de produtos com specs, pros/cons, rating e categoria PASS.
  - Check 3: Atualização de produto e transição de status para `ARCHIVED` PASS.
  - Check 4: Listagem, busca textual, filtros de status/brand e paginação PASS.
  - Check 5: Bloqueio do limite de produtos do plano (`AFFILIATE_MAX_PRODUCTS`) PASS.
  - Check 6: Isolamento estrito multi-tenant entre workspaces PASS.
  - Check 7: Exclusão de produto PASS.
- Validações:
  - `npx tsx scripts/test-product-catalog-crud.ts`: PASS (7/7 checks).
  - `npx tsx scripts/test-product-category.ts`: PASS (6/6 checks).
  - `npx tsx scripts/test-phase10-e2e-integration.ts`: PASS (8/8 cenários).
  - `npx tsc --noEmit`: PASS.
  - `npm run lint`: PASS (0 erros, 0 avisos).

