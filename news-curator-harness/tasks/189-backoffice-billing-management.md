# Task 189. Backoffice Billing Management

## Status
DONE

## Objetivo

Dar ao SuperAdmin visão operacional do billing sem expor dados de cartão.

## Empresa > Plano e cobrança

Mostrar:
- BillingProfile.
- Plan.
- billingCycle.
- amount.
- billingMethod.
- local status.
- provider status.
- providerCustomerId.
- providerSubscriptionId.
- nextDueDate.
- currentPeriodEnd.
- cancelAtPeriodEnd.
- grace.
- payments.

## Ações

- sincronizar Customer.
- sincronizar Subscription.
- sincronizar Payments.
- cancelar renovação.
- reativar quando aplicável.
- agendar mudança de plano.

## Regras

- SuperAdmin server-side.
- confirmação para ação crítica.
- audit.
- não editar status para PAID diretamente.
- não mostrar card/CVV.

## Empresa List

Opcionalmente acrescentar:
- billing status.
- cycle.
- next due.

Sem deixar listagem lenta com N+1.

## Definition of Done

- [ ] protected UI.
- [ ] billing summary.
- [ ] payment history.
- [ ] sync actions.
- [ ] cancel/reactivate.
- [ ] plan change.
- [ ] audit.
- [ ] no secrets/card.
- [ ] query performance acceptable.
- [ ] TypeScript/Lint/Tests PASS.

## Evidence

Ações testadas em Workspace sandbox.
