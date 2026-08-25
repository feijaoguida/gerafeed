# 124 Product Review Generator

## Objetivo
Gerar reviews com dados estruturados.

## Escopo
Input: Product/Offer/specs/PromptTemplate/keyword. Output: canonical document + SEO. Não inventar teste físico, specs ou preço.

## Definition of Done
- [x] Structured generation.
- [x] Canonical blocks/SEO.
- [x] Guard tests.
- [x] TypeScript/Lint PASS.

## Validation
Executar testes automatizados em `scripts/test-product-review-generator.ts`, tsc, lint e build.

## Evidence
- `src/lib/affiliate/generators/review-generator.ts`:
  - Implementado `ProductReviewGenerator` para geração de reviews comerciais profundos a partir de produtos factuais do catálogo.
  - Guardrails anti-alucinação: injeção de especificações técnicas, pontos fortes (`pros`), pontos fracos (`cons`), marca e ofertas ativas reais no prompt.
  - Montagem automática do `CanonicalDocument` com blocos `AFFILIATE_DISCLOSURE`, `HEADING`, `PRODUCT_CARD`, `RICH_TEXT`, `PROS_CONS` e `CTA`.
  - Persistência automática do artigo com `commercialType: "PRODUCT_REVIEW"`, `canonicalContent`, metadados de SEO (`seoFocusKeyword`, `seoTitle`, `seoDescription`, `tags`) e vinculação atômica do produto via `ArticleProductService`.
- `src/app/api/affiliate/generate/review/route.ts`:
  - Endpoint `POST /api/affiliate/generate/review` com validação de entitlement de plano e isolamento multi-tenant.
- Validações:
  - `npx tsx scripts/test-product-review-generator.ts`: PASS (5/5 checks).
  - `npx tsc --noEmit`: PASS.
  - `npm run lint`: PASS (0 erros, 0 avisos).
