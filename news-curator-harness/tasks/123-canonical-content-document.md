# 123 Canonical Content Document

## Objetivo
Criar documento canônico independente do WordPress.

## Escopo
Blocos versionados: RICH_TEXT, HEADING, PRODUCT_CARD, PRODUCT_COMPARISON, PROS_CONS, CTA, AFFILIATE_DISCLOSURE, IMAGE. Referenciar IDs, nunca affiliateUrl.

## Definition of Done
- [x] Schema/validation/serialization.
- [x] Legacy content intacto.
- [x] Tests.
- [x] TypeScript/Lint PASS.

## Validation
Executar testes automatizados em `scripts/test-canonical-content-document.ts`, tsc, lint e build.

## Evidence
- `prisma/schema.prisma`:
  - Adicionado campo `canonicalContent Json?` no modelo `Article` para persistência de documento estruturado nativo.
  - Mantido campo string `content` para total retrocompatibilidade com notícias legadas.
- `src/lib/affiliate/canonical-document.ts`:
  - Definidos os 8 tipos de blocos canônicos estruturados: `RICH_TEXT`, `HEADING`, `PRODUCT_CARD`, `PRODUCT_COMPARISON`, `PROS_CONS`, `CTA`, `AFFILIATE_DISCLOSURE`, `IMAGE`.
  - Blocos referenciam estritamente identificadores conceituais (`productId`, `offerId`), desacoplando a publicação da camada de renderização.
  - Implementado `CanonicalDocumentService` com `createDocument`, `validateDocument`, `serialize`, `parse`, `extractReferencedProductIds`, `extractReferencedOfferIds` e conversão de fallback `convertLegacyHtmlToCanonical`.
- Validações:
  - `npx tsx scripts/test-canonical-content-document.ts`: PASS (6/6 checks).
  - `npx tsc --noEmit`: PASS.
  - `npm run lint`: PASS (0 erros, 0 avisos).

