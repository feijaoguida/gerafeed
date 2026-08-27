# Task 184. Asaas Recurring Subscriptions

## Status
DONE

## Objetivo

Criar recorrência mensal/anual no Asaas e Subscription local com snapshot.

## Ciclos

```text
MONTHLY -> Asaas MONTHLY
YEARLY  -> Asaas YEARLY
```

## Valor

MONTHLY:
`Plan.monthlyPrice`.

YEARLY:
helper da Task 180.

Persistir `amount` na Subscription.

## Sem fidelidade

Não informar fim fixo/maxPayments para uma assinatura contínua.

Cancelamento será tratado pela Task 187.

## Métodos

### CREDIT_CARD
Integrar Subscription resultante do Hosted Checkout.

### BOLETO
Criar Subscription direta quando suportado.

### PIX
Antes de habilitar:
- executar contract test no sandbox;
- documentar resultado;
- preencher `recurringPix` capability.

Se não suportado:
- UI oculta/desabilita;
- não enviar chamada inválida.

Pix Automático fora de escopo.

## Subscription local

Evoluir existente com:
- billingCycle;
- billingMethod;
- amount;
- annualDiscountPercentSnapshot;
- providerCustomerId;
- providerSubscriptionId;
- currentPeriod*;
- nextDueDate;
- cancelAtPeriodEnd.

## Definition of Done

- [ ] MONTHLY card.
- [ ] YEARLY card.
- [ ] MONTHLY boleto.
- [ ] YEARLY boleto.
- [ ] PIX contract test.
- [ ] capability refletida.
- [ ] snapshot.
- [ ] provider subscription ID.
- [ ] no duplicate subscription on retry.
- [ ] tests.
- [ ] TypeScript/Lint/Build PASS.

## Evidence

Registrar IDs sandbox mascarados e matriz de métodos/ciclos.
