# 100 Affiliate Plan Entitlements

## Objetivo
Adicionar Affiliate às Features do Backoffice e habilitar validação server-side de entitlements.

## Escopo
- Features cadastradas/seedadas com chaves normalizadas em lowercase:
  - `affiliate_module` (BOOLEAN)
  - `affiliate_analytics` (BOOLEAN)
  - `affiliate_max_products` (QUANTITY)
  - `affiliate_max_programs` (QUANTITY)
- Reutilizar e expandir o `BillingService` com helpers otimizados para consulta/validação de `Feature`/`PlanFeature`.
- Garantir que planos sem uma `PlanFeature` associada sejam tratados com segurança como desabilitados (`enabled: false` ou limite `0`).
- APIs e serviços de afiliados validarão server-side com consultas indexadas e de alto desempenho.
- Permitir gestão e atribuição dessas features no Backoffice.
- Não implementar catálogo de produtos nem telas de importação nesta task.

## Definition of Done
- [x] Features seedadas no banco com chaves em lowercase.
- [x] Backoffice consegue atribuir e configurar limites para as novas features.
- [x] Helper do BillingService implementado de forma performática.
- [x] Workspace com feature habilitada passa na validação.
- [x] Workspace em plano sem a feature (ou com ela desabilitada) é bloqueado com segurança (`enabled: false`).
- [x] Limites numéricos (QUANTITY) são validados corretamente.
- [x] Script de teste automatizado cobre todos os cenários.
- [x] TypeScript/Lint/Tests/Build PASS.

## Validation
Executar testes automatizados em `scripts/test-affiliate-plan-entitlements.ts` e validações manuais aplicáveis.

## Evidence
- `src/lib/billing.ts`:
  - Constantes `AFFILIATE_FEATURES` (`affiliate_module`, `affiliate_analytics`, `affiliate_max_products`, `affiliate_max_programs`).
  - Constante `SEED_FEATURES` e método `BillingService.ensureDefaultFeatures()`.
  - Métodos `getPlanFeature`, `hasFeature`, `getFeatureLimit`, `assertFeature`, `checkFeatureLimit` e `assertFeatureLimit` implementados com normalização `.toLowerCase()` e consultas indexadas.
  - Fallback seguro para planos sem feature vinculada (`enabled: false`, limite 0).
- `scripts/test-affiliate-plan-entitlements.ts`:
  - Check 1: Seed de features e validação de idempotência PASS.
  - Check 2: Criação de planos no Backoffice com e sem features de afiliados PASS.
  - Check 3: Workspace com feature habilitada passa na validação e bloqueia quando desabilitada PASS.
  - Check 4: Workspace sem feature configurada é bloqueado com fallback seguro PASS.
  - Check 5: Validação de limites quantitativos e mensagens de bloqueio PASS.
- Validações:
  - `npx tsx scripts/test-affiliate-plan-entitlements.ts`: PASS (5/5 checks).
  - `npx tsc --noEmit`: PASS (sem erros de compilação).
  - `npm run lint`: PASS (0 erros, 0 avisos).


