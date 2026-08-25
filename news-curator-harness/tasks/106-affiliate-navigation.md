# 106 Affiliate Navigation

## Objetivo
Adicionar módulo Affiliate ao menu.

## Escopo
Menu: Dashboard, Produtos, Ofertas, Conteúdo. Sem AFFILIATE_MODULE ocultar ou upsell, mas APIs permanecem protegidas.

## Definition of Done
- [x] Sidebar.
- [x] Entitlement UI.
- [x] Protected routes.
- [x] Responsive.
- [x] TypeScript/Lint PASS.

## Validation
Executar testes automatizados em `scripts/test-affiliate-navigation.ts` e validações manuais aplicáveis.

## Evidence
- `src/components/sidebar.tsx`:
  - Seção dedicada de navegação "Afiliados" com badge contextual (PRO).
  - Links para Importar Produto (`/affiliates/import`), Catálogo de Produtos (`/affiliates/products`), Ofertas (`/affiliates/offers`), Conteúdo Afiliado (`/affiliates/content`) e Analytics Afiliados (`/affiliates/dashboard`).
  - Suporte a fallback com badge e link de Upgrade caso `hasAffiliateModule === false`.
  - Suporte responsivo (mobile drawer com backdrop e desktop fixed sidebar).
- `src/app/(app)/layout.tsx`:
  - Consulta automática de entitlement via `BillingService.hasFeature(workspaceId, AFFILIATE_FEATURES.MODULE)` repassando `hasAffiliateModule` para a Sidebar.
- `scripts/test-affiliate-navigation.ts`:
  - Check 1: Setup de planos e workspaces habilitados e desabilitados PASS.
  - Check 2: Verificação de flags de entitlement para UI PASS.
  - Check 3: Proteção server-side de rotas e APIs contra workspaces sem o módulo PASS.
- Validações:
  - `npx tsx scripts/test-affiliate-navigation.ts`: PASS (3/3 checks).
  - `npx tsx scripts/test-affiliate-import-preview-and-confirm.ts`: PASS (6/6 checks).
  - `npx tsx scripts/test-mercado-livre-product-importer.ts`: PASS (5/5 checks).
  - `npx tsx scripts/test-secure-affiliate-link-resolver.ts`: PASS (4/4 checks).
  - `npx tsx scripts/test-affiliate-product-schema.ts`: PASS (6/6 checks).
  - `npx tsx scripts/test-affiliate-program-and-provider.ts`: PASS (5/5 checks).
  - `npx tsx scripts/test-affiliate-plan-entitlements.ts`: PASS (5/5 checks).
  - `npx tsc --noEmit`: PASS.
  - `npm run lint`: PASS (0 erros, 0 avisos).

