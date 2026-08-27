# Task 185. Asaas Webhook Ingestion

## Status
DONE

## Objetivo

Criar ingestão segura, idempotente e tolerante a evolução do payload.

## Endpoint

Seguir convenção do projeto, por exemplo:

```text
POST /api/webhooks/asaas
```

## Authentication

Validar:

```text
asaas-access-token
```

Environment:

```text
ASAAS_WEBHOOK_TOKEN
```

Não reutilizar API Key.

## ProviderWebhookEvent

Criar model conforme SPEC.

Unique:
`provider + providerEventId`.

## Payment Events

Cobrir ao menos:
- PAYMENT_CREATED.
- PAYMENT_UPDATED.
- PAYMENT_CONFIRMED.
- PAYMENT_RECEIVED.
- PAYMENT_OVERDUE.
- PAYMENT_REFUNDED.
- PAYMENT_PARTIALLY_REFUNDED.
- PAYMENT_DELETED.
- PAYMENT_CREDIT_CARD_CAPTURE_REFUSED.
- PAYMENT_CHARGEBACK_REQUESTED.

## Subscription Events

- SUBSCRIPTION_CREATED.
- SUBSCRIPTION_UPDATED.
- SUBSCRIPTION_INACTIVATED.
- SUBSCRIPTION_DELETED.

## Idempotência

Evento repetido:
- 2xx.
- nenhum side effect duplicado.

## Robustez

- não falhar com campo desconhecido.
- não depender da ordem.
- logging seguro.
- erro processável fica registrado.

## Definition of Done

- [ ] endpoint.
- [ ] token validation.
- [ ] event table.
- [ ] unique event.
- [ ] payment handlers.
- [ ] subscription handlers.
- [ ] duplicate test.
- [ ] out-of-order test.
- [ ] unknown event test.
- [ ] no secrets in logs.
- [ ] TypeScript/Lint/Tests/Build PASS.

## Evidence

Replay do mesmo evento deve produzir um único efeito.
