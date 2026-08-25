# 112 Product Offer Management

## Objetivo
Gerenciar ProductOffer.

## Escopo
Adicionar novo affiliateUrl, importar, editar seller/trackingLabel, status ACTIVE/PAUSED/ARCHIVED e oferta preferencial quando aplicável.

## Definition of Done
- [x] CRUD.
- [x] Provider validation/import.
- [x] Status.
- [x] Tenant isolation.
- [x] TypeScript/Lint/Tests PASS.

## Validation
Executar testes automatizados em `scripts/test-product-offer-management.ts` e validações manuais aplicáveis.

## Evidence
- `src/lib/affiliate/offer-service.ts`:
  - `ProductOfferService.listOffers()`: Listagem filtrada por `productId`, `status` e `programCode`, com paginação e ordenação por preço ascendente.
  - `ProductOfferService.getOffer()`: Consulta com carregamento de dados completos do produto e programa de afiliados.
  - `ProductOfferService.createOffer()`: Criação de oferta com validação de URL pelo provider (`MERCADO_LIVRE`), extração de `externalProductId` (MLB) e `resolvedUrl`.
  - `ProductOfferService.updateOffer()`: Atualização de preço, trackingLabel, seller e transição de status (`ACTIVE`, `PAUSED`, `OUT_OF_STOCK`, `ARCHIVED`).
  - `ProductOfferService.deleteOffer()`: Exclusão segura com isolamento de tenant.
- Rotas de API:
  - `GET`, `POST /api/affiliate/offers`
  - `GET`, `PUT`, `DELETE /api/affiliate/offers/[id]`
- `scripts/test-product-offer-management.ts`:
  - Check 1: Setup de planos e workspaces PASS.
  - Check 2: Criação de produto e oferta com extração de externalProductId PASS.
  - Check 3: Atualização de preço e status da oferta (`PAUSED`) PASS.
  - Check 4: Listagem e filtros de ofertas por produto e status PASS.
  - Check 5: Isolamento multi-tenant estrito entre workspaces PASS.
  - Check 6: Exclusão de oferta PASS.
- Validações:
  - `npx tsx scripts/test-product-offer-management.ts`: PASS (6/6 checks).
  - `npx tsx scripts/test-product-catalog-crud.ts`: PASS (7/7 checks).
  - `npx tsx scripts/test-product-category.ts`: PASS (6/6 checks).
  - `npx tsx scripts/test-phase10-e2e-integration.ts`: PASS (8/8 cenários).
  - `npx tsc --noEmit`: PASS.
  - `npm run lint`: PASS (0 erros, 0 avisos).

