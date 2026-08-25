# Task 186. Payment Ledger & Invoice History

## Status
TODO

## Objetivo

Transformar Invoice existente em histórico confiável de cobranças/pagamentos.

## Regra

Subscription não é "paga".

Cada Payment representa uma cobrança/período.

## Schema

Evoluir Invoice, sem criar duplicata se ela já cumpre o papel.

Campos conforme SPEC.

## Mapping

PAYMENT_CREATED:
- cria/upsert Invoice.

PAYMENT_CONFIRMED:
- status financeiro confirmado;
- confirmedAt.

PAYMENT_RECEIVED:
- receivedAt.

PAYMENT_OVERDUE:
- overdueAt.

Refund:
- refundedAt/status.

## Dedup

Unique providerPaymentId por provider.

## UI Data

Preparar DTO seguro para:
- data;
- valor;
- forma;
- status;
- vencimento;
- pagamento.

## Definition of Done

- [ ] Invoice schema.
- [ ] upsert by providerPaymentId.
- [ ] payment event mapping.
- [ ] confirmed/received separados.
- [ ] overdue/refund.
- [ ] no card details.
- [ ] tenant isolation.
- [ ] tests.
- [ ] TypeScript/Lint/Build PASS.

## Evidence

Linha do tempo de uma cobrança sandbox.
