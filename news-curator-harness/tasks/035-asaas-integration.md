# Task: 035-asaas-integration

## Status: DONE

## Objetivo
Implementar a comunicação real com a API do Asaas.

## Escopo
- Criar `AsaasGateway` que implementa `PaymentGateway`.
- Desenvolver integração com a API Rest do Asaas (criação de cliente, cobrança/assinatura e links de pagamento).
- Criar endpoint Webhook (`/api/webhooks/asaas`) para escutar os eventos do Asaas e gerenciar a tabela `Subscription` e datas de validade.

## Definition of Done
- [x] Classe AsaasGateway funcional usando fetch.
- [x] Webhook validando o token do Asaas e atualizando a data de validade da assinatura no banco.
- [x] TypeScript PASS (`npx tsc --noEmit`).
- [x] Lint PASS (`npm run lint`).
- [x] Build PASS (`npm run build`).

## Evidence
- `src/lib/payments/asaas.ts`: Implementada a classe `AsaasGateway` com `createCustomer`, `createSubscription`, `getCheckoutUrl`, `cancelSubscription` e `handleWebhook` (com suporte a Sandbox/Produção e validação de token).
- `src/lib/payments/index.ts`: Registrado `AsaasGateway` na factory `getPaymentGateway`.
- `src/app/api/webhooks/asaas/route.ts`: Criada rota POST para processamento de webhooks do Asaas com suporte a `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_OVERDUE` e `SUBSCRIPTION_DELETED`, renovando a assinatura (+30 dias) e atualizando o status.
- `scripts/test-asaas-integration.ts`: PASS (validada rejeição 401 de token inválido, atualização de status ACTIVE e validUntil em pagamento recebido, PAST_DUE em atraso, e CANCELED em cancelamento).
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.

