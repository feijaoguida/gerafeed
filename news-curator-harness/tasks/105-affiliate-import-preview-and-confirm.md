# 105 Affiliate Import Preview And Confirm

## Objetivo
Criar UX de colar link, buscar, revisar e confirmar.

## Escopo
Tela Afiliados > Produtos > Importar Mercado Livre. Preview editável com imagem, nome, marca, seller, specs, preço snapshot e warnings. Só persistir em transaction após confirmação. Dedupe por externalProductId e URLs.

## Definition of Done
- [x] Campo affiliateUrl.
- [x] Loading/erros.
- [x] Preview.
- [x] PARTIAL manual.
- [x] Confirm transaction.
- [x] Dedupe.
- [x] Entitlement/tenant isolation.
- [x] TypeScript/Lint/Tests PASS.

## Validation
Executar testes automatizados em `scripts/test-affiliate-import-preview-and-confirm.ts` e validações manuais aplicáveis.

## Evidence
- `src/lib/affiliate/service.ts`:
  - `AffiliateService.previewImport()`: Validação de entitlement `AFFILIATE_MODULE`, extração segura de metadados, verificação de duplicidade por `externalProductId`, `affiliateUrl` e `resolvedUrl`.
  - `AffiliateService.confirmImport()`: Validação de limite `AFFILIATE_MAX_PRODUCTS`, slug único por workspace, transação atômica `$transaction` criando/atualizando `Product` e `ProductOffer`.
- APIs:
  - `POST /api/affiliate/import/preview`: Endpoint de preview com tratamento de erros e HTTP status codes (400, 403, 500).
  - `POST /api/affiliate/import/confirm`: Endpoint de persistência atômica com validações.
- UI & Componentes:
  - `src/components/affiliate/affiliate-importer.tsx`: Componente com input de URL, spinner de loading, card de preview editável (título, marca, seller, preço snapshot, imagem, descrição), avisos e opção de atualizar item existente em caso de duplicidade.
  - `src/app/(app)/affiliates/import/page.tsx`: Página dedicada para importação de afiliados.
- `scripts/test-affiliate-import-preview-and-confirm.ts`:
  - Check 1: Configuração de entitlements e limites PASS.
  - Check 2: Preview inicial com detecção de `isDuplicate = false` PASS.
  - Check 3: Confirmação e persistência atômica em `$transaction` PASS.
  - Check 4: Detecção de duplicidade no segundo preview com apontamento para `existingProduct` PASS.
  - Check 5: Overwrite / atualização de produto existente sem duplicar registros PASS.
  - Check 6: Bloqueio do limite de produtos do plano (`AFFILIATE_MAX_PRODUCTS`) PASS.
- Validações:
  - `npx tsx scripts/test-affiliate-import-preview-and-confirm.ts`: PASS (6/6 checks).
  - `npx tsx scripts/test-mercado-livre-product-importer.ts`: PASS (5/5 checks).
  - `npx tsx scripts/test-secure-affiliate-link-resolver.ts`: PASS (4/4 checks).
  - `npx tsx scripts/test-affiliate-product-schema.ts`: PASS (6/6 checks).
  - `npx tsx scripts/test-affiliate-program-and-provider.ts`: PASS (5/5 checks).
  - `npx tsx scripts/test-affiliate-plan-entitlements.ts`: PASS (5/5 checks).
  - `npx tsc --noEmit`: PASS.
  - `npm run lint`: PASS (0 erros, 0 avisos).

