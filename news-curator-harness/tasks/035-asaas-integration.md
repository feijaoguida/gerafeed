# Task: 035-asaas-integration

## Objetivo
Implementar a comunicação real com a API do Asaas.

## Escopo
- Criar `AsaasGateway` que implementa `PaymentGateway`.
- Desenvolver integração com a API Rest do Asaas (criação de cliente e link de pagamento/assinatura).
- Criar endpoint Webhook (`/api/webhooks/asaas`) para escutar o status "PAYMENT_RECEIVED" e renovar a tabela `Subscription`.

## Definition of Done
- [ ] Classe AsaasGateway funcional usando fetch.
- [ ] Webhook validando o token do Asaas e atualizando a data de validade da assinatura no banco.
