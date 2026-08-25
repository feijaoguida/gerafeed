# Task 151. Source vs Editorial Product Data

## Objetivo
Separar sourceDescription/sourceSpecs/marketplaceCategory/sourceRating de description/specs/ProductCategory/rating editoriais.

## Regras
Refresh preserva editorial. Cópia source→editorial é explícita. Categoria externa só sugere interna.

## Definition of Done
- [x] schema/migration
- [x] mapping
- [x] UI copy actions
- [x] refresh preservation
- [x] category suggestion
- [x] tenant/tests/TypeScript/Lint/Build PASS
