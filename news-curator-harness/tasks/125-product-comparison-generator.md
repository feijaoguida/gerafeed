# 125 Product Comparison Generator

## Objetivo
Gerar comparações.

## Escopo
Mínimo 2 produtos. Comparar atributos disponíveis. Recommendation baseada em critérios visíveis. Comparison block referencia IDs.

## Definition of Done
- [x] Validation/generation.
- [x] SEO/blocks.
- [x] Tests.
- [x] TypeScript/Lint PASS.

## Validation
Executar testes automatizados em `scripts/test-product-comparison-generator.ts`, tsc, lint e build.

## Evidence
- `src/lib/affiliate/generators/comparison-generator.ts`:
  - Implementado `ProductComparisonGenerator` para geração de artigos comparativos a partir de múltiplos produtos do catálogo (mínimo de 2 produtos exigido e validado).
  - Construção de prompt comparativo com especificação técnica, prós, contras, notas e ofertas ativas de todos os produtos selecionados.
  - Montagem de `CanonicalDocument` com bloco `PRODUCT_COMPARISON`, cards individuais de produtos (`PRODUCT_CARD`), prós/contras (`PROS_CONS`) e chamada para ação (`CTA`).
  - Vinculação ordenada de todos os produtos via `ArticleProductService` com posições 0, 1, 2... e badges de recomendação.
- `src/app/api/affiliate/generate/comparison/route.ts`:
  - Endpoint `POST /api/affiliate/generate/comparison` com validação de cardinalidade mínima e entitlement de plano.
- Validações:
  - `npx tsx scripts/test-product-comparison-generator.ts`: PASS (6/6 checks).
  - `npx tsc --noEmit`: PASS.
  - `npm run lint`: PASS (0 erros, 0 avisos).

