# Task 295: Cupom de Desconto para Cliente Base em Plano & Cobrança (`/settings/billing`) e Histórico de Planos

## Status
DONE

## Evidência de Conclusão
- `src/app/api/billing/coupons/apply/route.ts`: Endpoint criado para aplicar cupom de desconto em assinatura ativa de Cliente Base (`BASE` ou `BOTH`), chamando `gateway.updateSubscription` com `updatePendingPayments: true`, atualizando faturas pendentes, gravando metadados de desconto na `Subscription`, registrando resgate em `CouponRedemption` e evento `COUPON_APPLIED` em `PlanHistory`.
- `src/app/api/billing/plan-history/route.ts`: Endpoint `GET /api/billing/plan-history` criado retornando a linha do tempo cronológica de alterações de plano e assinaturas do Workspace autenticado.
- `src/lib/billing.ts`, `src/app/api/billing/subscription/cancel/route.ts` e `reactivate/route.ts`: Eventos `SUBSCRIPTION_CANCELED` e `SUBSCRIPTION_REACTIVATED` registrados no histórico de planos com tratamento de erro via `handleApiError`.
- `src/components/settings/plan-history-list.tsx`: Componente visual criado e incorporado em `/settings/billing` exibindo tabela completa do histórico de planos, eventos, valores originais vs cobrados e cupons utilizados.
- `src/components/settings/subscription-management-card.tsx`: Adicionada seção de aplicação de cupom para clientes da base e badge de cupom ativo com detalhes da duração e valor promocional.
- `src/app/(app)/settings/billing/upgrade/page.tsx`: Barra de cupom adicionada no topo da tela de upgrade com validação inline para Cliente Base, cálculo automático de preço promocional nos cards de planos e repasse no checkout.
- Teste integrado executado com sucesso: `npx tsx scripts/phase39/test-task295.ts` (PASS).
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).

## Critérios de Aceitação (Definition of Done)
- [x] Em `/settings/billing`, o usuário pode informar um cupom de desconto, que é validado quanto a validade, status ativo, compatibilidade com o plano dele e elegibilidade para **Cliente Base**.
- [x] Ao aplicar o cupom em assinatura existente, o sistema chama `PUT /v3/subscriptions/{id}` no Asaas com `updatePendingPayments: true`, atualiza `Subscription` e registra em `CouponRedemption` e `PlanHistory`.
- [x] Em `/settings/billing/upgrade`, o cliente também pode aplicar um cupom de Cliente Base ao contratar/fazer upgrade de plano.
- [x] A seção **Histórico de Planos** é exibida em `/settings/billing`.
- [x] Qualquer erro gera registro em `SystemErrorLog`.
- [x] `npx tsc --noEmit` PASS e `npm run lint` PASS.

## Escopo de Implementação

### 1. Endpoint de Aplicação de Cupom em Assinatura Existente (`POST /api/billing/coupons/apply` em `src/app/api/billing/coupons/apply/route.ts`)
1. Autenticado por `getSessionWorkspaceId()`.
2. Carrega a `Subscription` atual do Workspace (com `plan`).
3. Valida o `code` informado via `CouponService.validateCouponForTarget`:
   - `customerTypeContext: "BASE"` (aceita cupons com `customerType === "BASE"` ou `"BOTH"`; rejeita cupons exclusivos de Cliente Novo `NEW` com mensagem clara e log em `SystemErrorLog`);
   - Verifica se o cupom está ativo, dentro da validade (`validUntil`), com usos disponíveis (`maxUses`) e se este Workspace ainda não utilizou o mesmo cupom (`maxUsesPerWorkspace`);
   - Verifica se o **plano atual do cliente** (`subscription.planId`) está entre os planos permitidos pelo cupom (`CouponPlan`).
4. **Se a assinatura possui `asaasSubscriptionId` ativo no Asaas**:
   - Calcula `originalAmount` (valor cheio contratado do plano) e `discountedAmount` (novo valor com o cupom).
   - Chama `gateway.updateSubscription({ subscriptionId: subscription.asaasSubscriptionId, value: discountedAmount, updatePendingPayments: true, description: ... })` para atualizar imediatamente a recorrência e qualquer cobrança `PENDING` no Asaas!
   - Atualiza também na tabela local `Invoice` qualquer fatura `PENDING` da assinatura para refletir o novo valor promocional.
5. Atualiza `Subscription` no banco de dados em transação (`prisma.$transaction`):
   - `couponId = coupon.id`
   - `amount = discountedAmount`
   - `originalPlanAmount = originalAmount`
   - `discountedAmount = discountedAmount`
   - `discountDurationMonths = coupon.durationMonths` (`0` = Para Sempre, `1` = 1º Mês, `3` = 3 Primeiros Meses...)
   - `discountCyclesUsed = 0`
   - Cria `CouponRedemption` (`status: "ACTIVE"`) e incrementa `Coupon.usedCount`.
   - Grava registro em `PlanHistory` (`eventType: "COUPON_APPLIED"`, `originalAmount`, `chargedAmount: discountedAmount`, `couponCode: coupon.code`, `discountDurationMonths: coupon.durationMonths`).
6. **Toda falha** (cupom inválido, cupom só para cliente novo, cupom de outro plano, erro na API do Asaas) é capturada e gravada em `SystemErrorLog` (`module: "BILLING"`, `screen: "Plano & Cobrança - Aplicar Cupom"`).

### 2. Endpoint de Consulta do Histórico de Planos (`GET /api/billing/plan-history` em `src/app/api/billing/plan-history/route.ts`)
1. Retorna a lista cronológica de registros de `PlanHistory` do Workspace autenticado.
2. Também registrar eventos em `PlanHistory` nas rotas `/api/billing/subscription/cancel` (`SUBSCRIPTION_CANCELED`) e `/api/billing/subscription/reactivate` (`SUBSCRIPTION_REACTIVATED`), garantindo que erros nessas rotas também chamem `handleApiError`.

### 3. Interface de Cupom e Histórico de Planos em `/settings/billing` e `/settings/billing/upgrade`
1. Em `src/components/settings/subscription-management-card.tsx` e `src/app/(app)/settings/billing/page.tsx`:
   - Exibir badge de **Cupom Ativo** quando a assinatura tiver um cupom vigente (ex.: *"Cupom INFLUENCER19 ativo: R$ 19,90/mês (Ciclo 1 de 3) • Após: R$ 89,90/mês"* ou *"Desconto Vitalício"*).
   - Adicionar área **"Aplicar Cupom de Desconto"** dentro do card de gerenciamento do plano (para clientes com plano ativo aplicarem um cupom de Cliente Base direto na sua assinatura e atualizarem no Asaas).
   - Criar componente `src/components/settings/plan-history-list.tsx` exibindo o **Histórico de Planos & Assinaturas** na tela `/settings/billing` (data, evento, plano anterior -> plano novo, valor original, valor cobrado e cupom utilizado).
2. Em `src/app/(app)/settings/billing/upgrade/page.tsx`:
   - Adicionar barra de **Cupom de Desconto** no topo dos cards de planos para que um cliente da base que queira fazer Upgrade também possa validar um cupom (`customerTypeContext: "BASE"`), visualizar os preços com desconto nos planos elegíveis e enviá-lo para `/api/billing/checkout`.

## Critérios de Aceitação (Definition of Done)
- [ ] Em `/settings/billing`, o usuário pode informar um cupom de desconto, que é validado quanto a validade, status ativo, compatibilidade com o plano dele e elegibilidade para **Cliente Base**.
- [ ] Ao aplicar o cupom em assinatura existente, o sistema chama `PUT /v3/subscriptions/{id}` no Asaas com `updatePendingPayments: true`, atualiza `Subscription` e registra em `CouponRedemption` e `PlanHistory`.
- [ ] Em `/settings/billing/upgrade`, o cliente também pode aplicar um cupom de Cliente Base ao contratar/fazer upgrade de plano.
- [ ] A seção **Histórico de Planos** é exibida em `/settings/billing`.
- [ ] Qualquer erro gera registro em `SystemErrorLog`.
- [ ] `npx tsc --noEmit` PASS e `npm run lint` PASS.

