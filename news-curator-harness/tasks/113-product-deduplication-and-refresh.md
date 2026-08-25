# 113 Product Deduplication And Refresh

## Objetivo
Implementar dedupe e refresh manual.

## Escopo
Botão Atualizar dados do Mercado Livre. Sem cron. externalProductId é prioridade. Definir merge policy para não sobrescrever edição editorial sem regra explícita.

## Definition of Done
- [x] Refresh.
- [x] Dedupe.
- [x] Merge policy.
- [x] metadataLastFetchedAt.
- [x] TypeScript/Lint/Tests PASS.

## Validation
Executar testes automatizados em `scripts/test-product-deduplication-and-refresh.ts` e validações manuais aplicáveis.

## Evidence
- `src/lib/affiliate/refresh-service.ts`:
  - `ProductRefreshService.refreshOffer()`: Atualização de preço, snapshot comercial e carimbo `metadataLastFetchedAt`, definindo `metadataSource = "REFRESH_MANUAL"`.
  - `ProductRefreshService.refreshProduct()`: Atualização em lote de todas as ofertas associadas ao produto.
  - Implementação estrita de merge policy: dados editoriais customizados (`description`, `pros`, `cons`, `rating`, título) não são sobrescritos durante atualizações de ofertas do provedor.
- Rotas de API:
  - `POST /api/affiliate/offers/[id]/refresh`
  - `POST /api/affiliate/products/[id]/refresh`
- `scripts/test-product-deduplication-and-refresh.ts`:
  - Check 1: Setup de planos e workspaces PASS.
  - Check 2: Criação de produto com dados editoriais e oferta inicial com data defasada PASS.
  - Check 3: Execução de refresh manual da oferta com atualização de `metadataLastFetchedAt` PASS.
  - Check 4: Preservação de campos editoriais do produto pela merge policy PASS.
  - Check 5: Refresh em lote no nível de produto (múltiplas ofertas) PASS.
  - Check 6: Isolamento multi-tenant no refresh PASS.
- Validações:
  - `npx tsx scripts/test-product-deduplication-and-refresh.ts`: PASS (6/6 checks).
  - `npx tsx scripts/test-product-offer-management.ts`: PASS (6/6 checks).
  - `npx tsx scripts/test-product-catalog-crud.ts`: PASS (7/7 checks).
  - `npx tsx scripts/test-product-category.ts`: PASS (6/6 checks).
  - `npx tsx scripts/test-phase10-e2e-integration.ts`: PASS (8/8 cenários).
  - `npx tsc --noEmit`: PASS.
  - `npm run lint`: PASS (0 erros, 0 avisos).

