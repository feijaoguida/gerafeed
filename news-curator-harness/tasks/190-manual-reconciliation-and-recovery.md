# Task 190. Manual Reconciliation & Recovery

## Status
DONE

## Objetivo

Recuperar divergências entre estado local e Asaas sem Cron.

## Serviço

Criar algo equivalente:

```ts
reconcileWorkspaceBilling(workspaceId)
```

## Fluxo

1. obter providerCustomerId.
2. buscar Customer.
3. buscar Subscription relevante.
4. buscar Payments da Subscription.
5. normalizar.
6. comparar local.
7. upsert/corrigir.
8. registrar audit/result.

## Casos

- webhook perdido.
- event processing failed.
- providerSubscriptionId ausente.
- Invoice local ausente.
- status divergente.
- Customer duplicado detectado.
- checkout expirado.

## Segurança

Não apagar histórico para "igualar" provider.

Correções devem ser monotônicas/auditáveis quando possível.

## UI

Backoffice:

```text
[Sincronizar com Asaas]
```

Mostrar resultado resumido:
- customer.
- subscription.
- payments.
- alterações.
- warnings.

## Definition of Done

- [ ] reconciliation service.
- [ ] Backoffice action.
- [ ] customer sync.
- [ ] subscription sync.
- [ ] payment sync.
- [ ] audit.
- [ ] missing webhook recovery.
- [ ] provider outage handled.
- [ ] tests.
- [ ] TypeScript/Lint/Build PASS.

## Evidence

Simular Invoice ausente e recuperar via reconciliation.
