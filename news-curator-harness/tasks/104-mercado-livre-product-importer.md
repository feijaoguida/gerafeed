# 104 Mercado Livre Product Importer

## Objetivo
Importar metadados a partir do affiliateUrl resolvido.

## Escopo
Pipeline resolver → externalProductId/canonical URL → fonte oficial/provider → fallback isolado de metadados públicos estruturados → NormalizedProductImport COMPLETE/PARTIAL/FAILED. Nunca acessar Portal autenticado e nunca inventar dados.

## Definition of Done
- [x] COMPLETE/PARTIAL/FAILED.
- [x] metadataSource/fetchedAt/warnings.
- [x] Preço tratado como snapshot.
- [x] Fixtures/testes.
- [x] TypeScript/Lint/Tests PASS.

## Validation
Executar testes automatizados em `scripts/test-mercado-livre-product-importer.ts` e validações manuais aplicáveis.

## Evidence
- `src/lib/affiliate/metadata-extractor.ts`:
  - Parser e normalizador estruturado de HTML com hierarquia de extração: JSON-LD (`schema.org/Product`), OpenGraph (`og:title`, `og:image`, `product:price:amount`, etc.) e Microdata/Title.
  - Sanitização de entidades HTML e normalização de preço numérico.
  - Categorização determinística de status de importação:
    - `COMPLETE`: Título válido + imagem + (preço, marca ou descrição).
    - `PARTIAL`: Título válido com dados parciais ausentes.
    - `FAILED`: Sem título identificável ou página inacessível.
  - Tratamento de preço como snapshot pontual com inclusão automática de aviso em `warnings` e registro de `fetchedAt`.
- `src/lib/affiliate/mercado-livre.ts`:
  - Integração do pipeline `fetchProductMetadata` com `SafeUrlResolver` e `extractProductMetadata`.
  - Tratamento de exceções e erros de validação sem quebra da aplicação.
- `scripts/test-mercado-livre-product-importer.ts`:
  - Check 1: Fixture JSON-LD completo validando status `COMPLETE`, preço snapshot, marca, seller e MLB ID PASS.
  - Check 2: Fixture OpenGraph validando status `COMPLETE` PASS.
  - Check 3: Fixture parcial sem imagem/preço validando status `PARTIAL` e warnings informativos PASS.
  - Check 4: Fixture sem título/404 validando status `FAILED` PASS.
  - Check 5: Provider rejeitando URL fora da allowlist com status `FAILED` PASS.
- Validações:
  - `npx tsx scripts/test-mercado-livre-product-importer.ts`: PASS (5/5 checks).
  - `npx tsx scripts/test-secure-affiliate-link-resolver.ts`: PASS (4/4 checks).
  - `npx tsx scripts/test-affiliate-product-schema.ts`: PASS (6/6 checks).
  - `npx tsx scripts/test-affiliate-program-and-provider.ts`: PASS (5/5 checks).
  - `npx tsx scripts/test-affiliate-plan-entitlements.ts`: PASS (5/5 checks).
  - `npx tsc --noEmit`: PASS.
  - `npm run lint`: PASS (0 erros, 0 avisos).

