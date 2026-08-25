# 110 Product Category

## Objetivo
Criar taxonomia própria do catálogo.

## Escopo
ProductCategory workspace-scoped com parentId opcional, name, slug e active. Não usar WordPressCategory.

## Definition of Done
- [x] CRUD.
- [x] Parent/child.
- [x] Constraints.
- [x] Tenant isolation.
- [x] TypeScript/Lint/Tests PASS.

## Validation
Executar testes automatizados em `scripts/test-product-category.ts` e validações manuais aplicáveis.

## Evidence
- `prisma/schema.prisma`:
  - Modelo `ProductCategory` atualizado com auto-relacionamento de hierarquia (`parentId`, `parent`, `children`), `active` (default true) e índices `[workspaceId, slug]` e `[workspaceId, parentId]`.
- `src/lib/affiliate/category-service.ts`:
  - `ProductCategoryService.listCategories()`: Listagem com filtros de status e contagem de produtos/filhos.
  - `ProductCategoryService.getCategory()`: Busca com isolamento estrito de workspace.
  - `ProductCategoryService.createCategory()`: Validação de slug único por workspace e verificação de pertencimento de categoria pai.
  - `ProductCategoryService.updateCategory()`: Atualização segura prevenindo referências circulares (`currentParentId === categoryId`) e auto-paternidade.
  - `ProductCategoryService.deleteCategory()`: Exclusão segura em transação realizando reparenting automático de categorias filhas e desvinculação graciosa de produtos (`categoryId = null`).
- Rotas de API:
  - `GET`, `POST /api/affiliate/categories`
  - `GET`, `PUT`, `DELETE /api/affiliate/categories/[id]`
- `scripts/test-product-category.ts`:
  - Check 1: Setup de planos e workspaces habilitados PASS.
  - Check 2: CRUD básico de criação, busca e atualização PASS.
  - Check 3: Hierarquia de categorias (Avô -> Pai -> Filho) PASS.
  - Check 4: Prevenção de auto-paternidade e detecção de ciclos circulares PASS.
  - Check 5: Isolamento multi-tenant de slugs e categorias entre tenants PASS.
  - Check 6: Exclusão com reparenting de filhos e desvinculação de produtos PASS.
- Validações:
  - `npx tsx scripts/test-product-category.ts`: PASS (6/6 checks).
  - `npx tsx scripts/test-phase10-e2e-integration.ts`: PASS (8/8 cenários).
  - `npx tsc --noEmit`: PASS.
  - `npm run lint`: PASS (0 erros, 0 avisos).

