# 135 Affiliate Dashboard

## Objetivo
Criar dashboard Affiliate.

## Escopo
Cards/rankings para produtos, ofertas, artigos e cliques, top produtos/artigos/sites/componentes. AFFILIATE_ANALYTICS obrigatório. Não exibir vendas/comissão/conversão como fatos.

## Definition of Done
- [x] Cards/rankings/date filters.
- [x] Entitlement/tenant isolation.
- [x] Responsive.
- [x] TypeScript/Lint PASS.

## Validation
- `AffiliateAnalyticsService` implementado com agregação de métricas por período (7d, 30d, 90d, all, custom), rankings de Top Produtos, Top Artigos, Distribuição por Componentes e Desempenho por Site WordPress.
- Rota de API `GET /api/affiliate/analytics` criada com validação server-side de entitlement (`AFFILIATE_ANALYTICS`) e parâmetros de período.
- Componente `AffiliateDashboardView` e página `/affiliates/dashboard` criados com cards de resumo, gráfico de evolução temporal, rankings com barras de progresso, estado de paywall/upgrade e aviso de transparência de métricas.
- Testes automatizados executados via `npx tsx scripts/test-affiliate-dashboard.ts` com 100% de sucesso.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS (0 erros, 0 warnings).

## Evidence
- Arquivos alterados/criados:
  - `src/lib/affiliate/analytics-service.ts`
  - `src/lib/affiliate/index.ts`
  - `src/app/api/affiliate/analytics/route.ts`
  - `src/components/affiliate/affiliate-dashboard-view.tsx`
  - `src/app/(app)/affiliates/dashboard/page.tsx`
  - `scripts/test-affiliate-dashboard.ts`
- Comandos executados:
  - `npx tsx scripts/test-affiliate-dashboard.ts`: PASS
  - `npx tsc --noEmit`: PASS
  - `npm run lint`: PASS
- Resultados:
  - Workspaces sem `AFFILIATE_ANALYTICS` recebem bloqueio com tela informativa de upgrade.
  - Dados isolados estritamente por workspace (`workspaceId`).
  - Vendas, conversões e comissões não são simuladas nem exibidas como fatos sem dados oficiais de faturamento.
