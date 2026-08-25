# 101 Affiliate Program And Provider

## Objetivo
Criar AffiliateProgram e contrato AffiliateProvider.

## Escopo
Seed MERCADO_LIVRE. Criar interface/factory com capabilities, validateAffiliateUrl, resolveAffiliateUrl e fetchProductMetadata. Mercado Livre: automaticAffiliateLinkGeneration=false, affiliateLinkImport=true, productMetadataImport=true, supportsTrackingLabel=true. Não criar workflow de compliance.

## Definition of Done
- [x] Model/seed.
- [x] Interface/factory.
- [x] MercadoLivreAffiliateProvider.
- [x] Testes de capabilities.
- [x] TypeScript/Lint/Tests PASS.

## Validation
Executar testes automatizados em `scripts/test-affiliate-program-and-provider.ts` e validações manuais aplicáveis.

## Evidence
- `prisma/schema.prisma`:
  - Adicionado modelo `AffiliateProgram` com campos `id`, `code`, `name`, `providerType`, `active`, `createdAt`, `updatedAt`.
  - Migrado para o banco com `prisma db push` e client atualizado com `prisma generate`.
- `src/lib/affiliate/`:
  - `types.ts`: Definição de `AffiliateProvider`, `AffiliateProviderCapabilities`, `AffiliateUrlValidationResult`, `ResolvedAffiliateLink`, `ProductMetadataInput`, `NormalizedProductImport`, `ProductImportStatus`.
  - `mercado-livre.ts`: `MercadoLivreAffiliateProvider` com capabilities (`automaticAffiliateLinkGeneration: false`, `affiliateLinkImport: true`, `productMetadataImport: true`, `supportsTrackingLabel: true`), validação de hosts Mercado Livre e resolução inicial.
  - `factory.ts`: `AffiliateProviderFactory` para resolução unificada e case-insensitive de provedores.
  - `seed.ts`: Seed idempotente de `MERCADO_LIVRE` no banco via `ensureDefaultAffiliatePrograms()`.
  - `index.ts`: Re-export de types, providers e factory.
- `scripts/test-affiliate-program-and-provider.ts`:
  - Check 1: Model & Seed idempotente do `MERCADO_LIVRE` PASS.
  - Check 2: Factory e resolução case-insensitive PASS.
  - Check 3: Validação de capabilities do Mercado Livre PASS.
  - Check 4: Validação de URLs legítimas vs URLs maliciosas/inválidas e extração de externalProductId PASS.
  - Check 5: Contrato `fetchProductMetadata` PASS.
- Validações:
  - `npx tsx scripts/test-affiliate-program-and-provider.ts`: PASS (5/5 checks).
  - `npx tsx scripts/test-affiliate-plan-entitlements.ts`: PASS (5/5 checks).
  - `npx tsc --noEmit`: PASS.
  - `npm run lint`: PASS (0 erros, 0 avisos).

