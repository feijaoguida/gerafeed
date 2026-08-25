# 128 Phase12 Integration

## Objetivo
Validar motor de conteúdo Affiliate.

## Escopo
Cenários review, comparison, best products e buying guide. Garantir dados estruturados, nenhum produto inventado e nenhum affiliateUrl no documento.

## Definition of Done
- [x] Cenários PASS.
- [x] Legacy news intacto.
- [x] TypeScript/Lint/Tests/Build PASS.

## Validation
Executar testes de integração em `scripts/test-phase12-e2e-integration.ts`, suite completa de testes de toda a Phase 12, lint, tsc e build.

## Evidence
- `scripts/test-phase12-e2e-integration.ts`:
  - Cenário 1: Entitlements de plano e workspaces multi-tenant configurados com sucesso.
  - Cenário 2: Motor de Review de Produto Único (`ProductReviewGenerator`) gerando `PRODUCT_REVIEW` com vinculação de 1 produto factual.
  - Cenário 3: Motor de Comparativo Multi-Produto (`ProductComparisonGenerator`) gerando `COMPARISON` com bloco estruturado de tabela (`PRODUCT_COMPARISON`) e posições ordenadas.
  - Cenário 4: Motor de Melhores Produtos (`BestProductsGenerator`) gerando `BEST_PRODUCTS` com guardrails rígidos anti-alucinação.
  - Cenário 5: Motor de Guia de Compra (`BuyingGuideGenerator`) gerando `BUYING_GUIDE` com critérios e produtos recomendados.
  - Cenário 6: Validação de invariante canônico: nenhum link de afiliado exposto no documento estruturado (apenas referências `productId` e `offerId`).
  - Cenário 7: Retrocompatibilidade 100% preservada com notícias legadas RSS (`commercialType: null`).
  - Cenário 8: Isolamento estrito de dados e segurança entre múltiplos tenants.
- Validações:
  - `npx tsx scripts/test-phase12-e2e-integration.ts`: PASS (8/8 cenários).
  - `npx tsc --noEmit`: PASS.
  - `npm run lint`: PASS (0 erros, 0 avisos).
  - `npm run build`: PASS (Next.js compilado com sucesso, 52 rotas estáticas/dinâmicas).

