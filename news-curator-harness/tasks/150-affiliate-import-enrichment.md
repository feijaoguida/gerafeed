# Task 150. Affiliate Import Enrichment

## Objetivo
Corrigir MercadoLivreAffiliateProvider para preencher sourceDescription, brand, marketplaceCategory, sourceSpecs, sourceRating/count, seller, price, oldPrice e currency quando disponíveis.

## Regras
Não inventar dados; preservar SSRF; não acessar Portal autenticado; metadataSource obrigatório; preço snapshot.

## Definition of Done
- [x] descrição
- [x] seller/preço
- [x] marca/categoria
- [x] specs
- [x] rating/count
- [x] preview atualizado
- [x] COMPLETE/PARTIAL correto
- [x] fixtures
- [x] TypeScript/Lint/Tests/Build PASS
