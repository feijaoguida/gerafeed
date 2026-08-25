# Asaas Research. Phase 20 Billing

Pesquisa revisada em agosto de 2026.

## Assinaturas

Asaas Subscription é um agendador de cobranças recorrentes.

Ciclos documentados incluem:
- MONTHLY;
- YEARLY;
- além de outros ciclos não utilizados nesta fase.

`nextDueDate` é o vencimento inicial. Cobranças seguintes são geradas conforme o cycle.

ID da Subscription deve ser persistido.

## Customer

Antes de operações recorrentes, o Asaas trabalha com Customer.

O ID retornado deve ser persistido.

`externalReference` é recomendado para relacionar o Customer ao registro interno.

A API permite Customers duplicados, portanto a aplicação precisa prevenir duplicidade.

## Checkout

Asaas Checkout é hospedado.

Documentação atual do Checkout:
- CREDIT_CARD;
- PIX;
- chargeTypes incluindo RECURRENT.

O exemplo específico de Checkout recorrente usa CREDIT_CARD.

Callback/redirect não deve ser usado como confirmação financeira.

Webhooks confirmam estado.

## Pix. Atenção

Há divergência aparente entre documentos públicos atuais:

1. FAQ de Assinaturas:
   informa que assinaturas podem usar boleto, Pix e cartão e que Pix/boleto geram cobranças que o cliente paga manualmente.

2. Página "Formas de cobrança":
   informa que recorrência tradicional não possui Pix direto e orienta usar boleto, que contém QR Code Pix.

3. Pix Automático:
   é um produto separado, com autorização do pagador e criação das cobranças futuras controlada pela aplicação.

Decisão Phase 20:
- não assumir Pix direto;
- validar no sandbox/API usada pelo projeto;
- capability gate;
- Pix Automático fora de escopo.

## Webhooks

Webhooks têm entrega "at least once".

Usar `id` do evento para idempotência.

Validar:
`asaas-access-token`.

O token do webhook não deve ser a API Key.

## Payments

Eventos relevantes incluem:
- PAYMENT_CREATED;
- PAYMENT_UPDATED;
- PAYMENT_CONFIRMED;
- PAYMENT_RECEIVED;
- PAYMENT_OVERDUE;
- PAYMENT_REFUNDED;
- PAYMENT_PARTIALLY_REFUNDED;
- PAYMENT_CREDIT_CARD_CAPTURE_REFUSED;
- outros conforme documentação vigente.

`PAYMENT_CONFIRMED` significa pagamento confirmado, ainda sem saldo disponibilizado.

`PAYMENT_RECEIVED` representa cobrança recebida/liquidada.

## Subscription Events

- SUBSCRIPTION_CREATED;
- SUBSCRIPTION_UPDATED;
- SUBSCRIPTION_INACTIVATED;
- SUBSCRIPTION_DELETED.

Não depender da ordem de eventos.

## Fontes oficiais

- https://docs.asaas.com/docs/visao-geral
- https://docs.asaas.com/docs/assinaturas
- https://docs.asaas.com/docs/criando-uma-assinatura
- https://docs.asaas.com/reference/criar-nova-assinatura
- https://docs.asaas.com/docs/faq-assinaturas
- https://docs.asaas.com/docs/checkout-asaas
- https://docs.asaas.com/docs/checkout-com-assinatura-recorrente
- https://docs.asaas.com/reference/criar-novo-checkout
- https://docs.asaas.com/reference/criar-novo-cliente
- https://docs.asaas.com/docs/eventos-de-webhooks
- https://docs.asaas.com/docs/webhook-para-cobrancas
- https://docs.asaas.com/docs/eventos-para-assinaturas
- https://docs.asaas.com/docs/como-implementar-idempotencia-em-webhooks
- https://docs.asaas.com/docs/pix-automatico
- https://docs.asaas.com/docs/diferenca-entre-pix-automatico-e-assinaturas-1
