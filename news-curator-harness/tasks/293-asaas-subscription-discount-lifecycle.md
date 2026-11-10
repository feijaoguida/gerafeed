# Task 293: Integração Asaas (`PUT /v3/subscriptions/{id}`) e Automação do Ciclo de Vida de Descontos Temporários

## Status
DONE

## Contexto
Conforme validado na documentação oficial do Asaas (`https://docs.asaas.com/docs/assinaturas-recorrência`), o Asaas recebe um único `value` recorrente vigente na assinatura, e permite atualizar esse valor para as próximas cobranças e cobranças pendentes através de `PUT /v3/subscriptions/{id}` com `"updatePendingPayments": true`.
Quando um cliente assina (ou aplica um cupom) com desconto por $N$ meses (ex.: Plano Influencer de R$ 89,90 por **R$ 19,90 nos 3 primeiros meses** e **R$ 89,90 nos demais**):
- As 3 primeiras cobranças devem ser de `R$ 19,90`;
- Assim que as 3 primeiras cobranças forem cumpridas, a assinatura no Asaas deve ser automaticamente atualizada para `R$ 89,90` para que a 4ª cobrança em diante seja de `R$ 89,90`.

## Escopo de Implementação

### 1. Evolução do Contrato `PaymentGateway`, `AsaasGateway` e `MockPaymentGateway`
1. Em `src/lib/payments/types.ts` e `src/lib/payments/PaymentGateway.ts`:
   - Adicionar interface `UpdateSubscriptionParams`:
     ```ts
     export interface UpdateSubscriptionParams {
       subscriptionId: string;
       value: number;
       cycle?: BillingCycle;
       billingType?: BillingType;
       description?: string;
       updatePendingPayments?: boolean;
       nextDueDate?: string;
     }
     ```
   - Adicionar método `updateSubscription(params: UpdateSubscriptionParams): Promise<{ updated: boolean; subscriptionId: string; value: number; raw?: unknown }>` no contrato `PaymentGateway`.
2. Em `src/lib/payments/asaas.ts` (`AsaasGateway`):
   - Implementar `updateSubscription(params: UpdateSubscriptionParams)`:
     - Faz requisição `PUT ${this.baseUrl}/subscriptions/${params.subscriptionId}` com headers `access_token` e body JSON contendo `value`, `updatePendingPayments: params.updatePendingPayments ?? true`, e campos opcionais (`cycle`, `billingType`, `description`, `nextDueDate`).
     - Em caso de erro HTTP da API do Asaas, extrai a mensagem de `data.errors?.[0]?.description`, grava log detalhado em `SystemErrorLog` (`module: "BILLING"`, `path: "/v3/subscriptions/{id}"`) e lança erro normalizado.
3. Em `src/lib/payments/mock.ts` (`MockPaymentGateway`):
   - Implementar `updateSubscription` compatível para uso nos testes automatizados e ambiente de desenvolvimento.

### 2. Serviço de Ciclo de Vida Promocional (`BillingService.evaluateSubscriptionDiscountLifecycle`)
1. Em `src/lib/billing.ts`:
   - Criar método `BillingService.evaluateSubscriptionDiscountLifecycle(subscriptionId: string, context: { eventType: string; paymentId?: string; paymentValue?: number })`:
     - Carrega a `Subscription` com `plan`, `coupon` e `invoices`.
     - Se a assinatura possui cupom com `discountDurationMonths !== null`:
       - Se `discountDurationMonths === 0`: desconto é vitalício ("Para Sempre"), mantém `discountedAmount`.
       - Se `discountDurationMonths > 0`:
         - Conta de forma idempotente quantas faturas confirmadas/recebidas (`status IN ["CONFIRMED", "RECEIVED"]`) existem desde a aplicação do cupom (ou incrementa `discountCyclesUsed` garantindo idempotência por `providerPaymentId`).
         - Atualiza `Subscription.discountCyclesUsed` e `CouponRedemption.cyclesUsed`.
         - **Se `discountCyclesUsed >= discountDurationMonths` e `Number(subscription.amount) !== Number(subscription.originalPlanAmount)`**:
           1. Chama `gateway.updateSubscription({ subscriptionId: subscription.asaasSubscriptionId, value: Number(subscription.originalPlanAmount), updatePendingPayments: true, description: "Assinatura News Curator - " + subscription.plan.name })`.
           2. Atualiza `Subscription` local: `amount = subscription.originalPlanAmount`, mantendo histórico de que o cupom concluiu seus ciclos.
           3. Atualiza `CouponRedemption`: `status = "COMPLETED"`, `completedAt = new Date()`.
           4. Registra em `PlanHistory`: `eventType = "DISCOUNT_ENDED"`, `originalAmount = subscription.originalPlanAmount`, `chargedAmount = subscription.originalPlanAmount`, `notes = "Fim do período promocional de N meses do cupom. Valor restaurado para o preço integral do plano."`.
         - **Salvaguarda em `PAYMENT_CREATED`**:
           - Se o Asaas disparar `PAYMENT_CREATED` para uma nova cobrança e o total de cobranças geradas (não canceladas) no período promocional já for `> discountDurationMonths` (ex.: 4ª fatura gerada), executa imediatamente o `gateway.updateSubscription` com `updatePendingPayments: true` para que essa 4ª fatura pendente já assuma o valor cheio (`originalPlanAmount`).

### 3. Integração no Webhook do Asaas (`/api/webhooks/asaas`) e na Sincronização (`syncWorkspaceWithGateway`)
1. Em `src/app/api/webhooks/asaas/route.ts`:
   - Após registrar o `Invoice` e atualizar o status da `Subscription`, chamar `await BillingService.evaluateSubscriptionDiscountLifecycle(subscription.id, { eventType: type, paymentId, paymentValue })`.
   - Registrar em `PlanHistory` (`SUBSCRIPTION_ACTIVATED` / `SUBSCRIPTION_CANCELED`) quando aplicável.
   - No bloco `catch` do webhook, além de atualizar `ProviderWebhookEvent`, chamar obrigatoriamente `logSystemError` (`module: "BILLING"`, `screen: "Asaas Webhook"`, `path: "/api/webhooks/asaas"`).
2. Em `BillingService.syncWorkspaceWithGateway`:
   - Também invocar `evaluateSubscriptionDiscountLifecycle` após sincronizar os pagamentos da assinatura, garantindo consistência mesmo se um webhook tiver atrasado.

## Critérios de Aceitação (Definition of Done)
- [x] `AsaasGateway.updateSubscription` implementado usando `PUT /v3/subscriptions/{id}` com `updatePendingPayments: true`.
- [x] Quando `discountDurationMonths = 3` (ex.: R$ 19,90 por 3 meses em plano de R$ 89,90):
  - Pagamentos 1 e 2 mantêm a assinatura em `R$ 19,90`;
  - Ao confirmar o 3º pagamento (ou ao gerar a 4ª cobrança), a assinatura no Asaas é atualizada automaticamente para `R$ 89,90` com `updatePendingPayments: true` e `PlanHistory` registra `DISCOUNT_ENDED`.
- [x] Quando `discountDurationMonths = 0` (Para Sempre), a assinatura permanece em `R$ 19,90` indefinidamente.
- [x] Qualquer erro no webhook ou na chamada ao Asaas grava log em `SystemErrorLog`.
- [x] `npx tsc --noEmit` PASS e `npm run lint` PASS.

## Evidência de Conclusão
- `src/lib/payments/types.ts`, `PaymentGateway.ts`, `asaas.ts` e `mock.ts`: `updateSubscription` implementado invocando `PUT /v3/subscriptions/{id}` com `updatePendingPayments: true` e captura de erros da API Asaas para `SystemErrorLog`.
- `src/lib/billing.ts`: `BillingService.evaluateSubscriptionDiscountLifecycle` implementado para restaurar automaticamente o valor cheio no Asaas e na Subscription local ao completar os $N$ ciclos, marcando o resgate como `COMPLETED` e registrando `DISCOUNT_ENDED` em `PlanHistory`.
- `src/app/api/webhooks/asaas/route.ts`: Webhook do Asaas integrado com o ciclo de vida promocional e telemetria completa de erros em `SystemErrorLog`.
- Teste integrado executado com sucesso: `npx tsx scripts/phase39/test-task293.ts` (PASS — validando transição 3x R$ 19,90 -> R$ 89,90 no Asaas e banco).
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).

