# Task 191. Phase 20 Integration & Hardening

## Status
TODO

## Objetivo

Validar Phase 20 ponta a ponta no Asaas Sandbox e auditar segurança.

## Cenário A. Monthly Card

- Plano pago.
- MONTHLY.
- Hosted Checkout.
- Webhook.
- ACTIVE.
- Invoice.
- history.

## Cenário B. Yearly Card

- desconto anual.
- YEARLY.
- snapshot correto.
- ACTIVE.

## Cenário C. Monthly Boleto

- Subscription.
- Payment CREATED.
- pagamento simulado/confirmado.
- ACTIVE.

## Cenário D. Yearly Boleto

- annual amount.
- YEARLY.
- Invoice.

## Cenário E. Pix

Executar contract test.

Se suportado:
- fluxo real sandbox.

Se não:
- capability false;
- UI não oferece;
- chamada bloqueada.

## Cenário F. Webhook Duplicate

Mesmo `event.id` duas vezes:
- um efeito.

## Cenário G. PAYMENT_CONFIRMED / RECEIVED

- CONFIRMED libera.
- RECEIVED registra liquidação.
- sem duplicidade.

## Cenário H. Overdue

- PAST_DUE.
- grace.
- SUSPENDED após prazo.

## Cenário I. Cancelamento

- cancelAtPeriodEnd.
- acesso até fim.
- sem renovação posterior.

## Cenário J. Reconciliation

- remover/simular estado local incompleto.
- sync restaura.

## Cenário K. Tenant

Workspace A não vê/altera Billing de B.

## Security Audit

- [ ] no cardNumber.
- [ ] no CVV.
- [ ] API key server-only.
- [ ] webhook token server-only.
- [ ] tokens diferentes.
- [ ] webhook authentication.
- [ ] idempotency.
- [ ] PII logs revisados.
- [ ] callbacks não ativam.
- [ ] SuperAdmin enforcement.
- [ ] Workspace enforcement.

## Regression

- [ ] plan features.
- [ ] BillingService limits.
- [ ] Affiliate entitlements.
- [ ] Backoffice.
- [ ] existing FREE users.
- [ ] existing subscriptions/migrations.

## Quality

- [ ] TypeScript PASS.
- [ ] Lint PASS.
- [ ] Tests PASS.
- [ ] Build PASS.

## Evidence

Criar matriz final com IDs sandbox mascarados, valores, ciclos, eventos e resultado.
