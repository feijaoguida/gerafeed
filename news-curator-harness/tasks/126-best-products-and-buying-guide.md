# 126 Best Products And Buying Guide

## Objetivo
Implementar Best Products e Buying Guide.

## Escopo
BEST_PRODUCTS usa apenas produtos selecionados. BUYING_GUIDE foca critérios de compra e pode referenciar catálogo. IA não adiciona produtos não selecionados.

## Definition of Done
- [x] Generators/prompts.
- [x] Canonical blocks/SEO.
- [x] No hallucinated products.
- [x] TypeScript/Lint/Tests PASS.

## Validation
Executar testes automatizados em `scripts/test-best-products-and-buying-guide.ts`, tsc, lint e build.

## Evidence
- `src/lib/affiliate/generators/roundup-generator.ts`:
  - Implementado `BestProductsGenerator` para listas de melhores escolhas/top picks com guardrails rígidos anti-alucinação (somente produtos explicitamente selecionados no catálogo).
  - Implementado `BuyingGuideGenerator` com foco em critérios de compra, especificações essenciais e recomendações de produtos integradas.
  - Montagem de `CanonicalDocument` com `AFFILIATE_DISCLOSURE`, `HEADING`, `RICH_TEXT`, `PRODUCT_CARD`s ordenados com badges temáticos, `PROS_CONS` e `CTA`.
  - Persistência e associação relacional atômica via `ArticleProductService` com ordenação por posição (`position`).
- APIs:
  - `POST /api/affiliate/generate/best-products`
  - `POST /api/affiliate/generate/buying-guide`
- Validações:
  - `npx tsx scripts/test-best-products-and-buying-guide.ts`: PASS (4/4 checks).
  - `npx tsc --noEmit`: PASS.
  - `npm run lint`: PASS (0 erros, 0 avisos).

