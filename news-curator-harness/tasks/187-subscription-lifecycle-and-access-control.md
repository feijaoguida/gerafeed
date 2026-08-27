# Task 187. Subscription Lifecycle & Access Control

## Status
DONE

## Objetivo

Definir regras locais de acesso, cancelamento e inadimplência.

## Status

```text
PENDING
ACTIVE
PAST_DUE
SUSPENDED
CANCELED
EXPIRED
```

## Activation

PAYMENT_CONFIRMED:
- ativa período;
- atualiza currentPeriodStart/end quando aplicável;
- libera entitlements.

## Received

PAYMENT_RECEIVED:
- registra liquidação;
- não precisa ser o primeiro evento de liberação.

## Overdue

- Invoice OVERDUE.
- Subscription PAST_DUE.
- gracePeriodEndsAt.

## Grace

`BILLING_GRACE_PERIOD_DAYS`, default 3.

Fim do grace sem regularização:
`SUSPENDED`.

## Sem fidelidade

Cancelar:
- `cancelAtPeriodEnd = true`;
- impedir futura renovação no provider;
- manter acesso até currentPeriodEnd.

## Reativar

Quando ainda estiver dentro do período e provider permitir, limpar cancelamento/recriar recorrência de forma segura.

## Plan Change

Preferir `pendingPlanId`/próximo ciclo.

Sem pró-rata complexo.

## BillingService

Feature checks devem considerar lifecycle.

## Definition of Done

- [ ] activation.
- [ ] confirmed vs received.
- [ ] overdue.
- [ ] grace.
- [ ] suspension.
- [ ] cancelAtPeriodEnd.
- [ ] access until period end.
- [ ] no future charge after cancel.
- [ ] reactivation behavior.
- [ ] next-cycle plan change policy.
- [ ] entitlement integration.
- [ ] tests with time control.
- [ ] TypeScript/Lint/Build PASS.

## Evidence

Linha do tempo mensal, anual, overdue e cancelamento.
