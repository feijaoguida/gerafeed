# Task 294: Cupom de Desconto na Criação da Conta (`/register` e `/checkout/billing`) para Cliente Novo

## Status
DONE

## Evidência de Conclusão
- `src/app/api/billing/coupons/validate/route.ts`: Endpoint público e autenticado criado para validar cupom com plano, ciclo e contexto de cliente (`NEW` vs `BASE`), retornando precificação e `suggestedPlanSlug`.
- `src/lib/plan-intent.ts`: Adicionado suporte a `couponCode` no `PlanIntent`.
- `src/app/(public)/register/register-view.tsx`: Adicionado campo de cupom no Passo 1 com validação imediata, badge persistente com detalhes do desconto nos Passos 2 e 3 e repasse do cupom via query param na URL de checkout.
- `src/app/api/auth/register/route.ts`: Registro do evento histórico `ACCOUNT_CREATED` no `PlanHistory`.
- `src/components/checkout/billing-onboarding-view.tsx`: Suporte a pré-carregamento automático de cupom vindo da URL/storage e validação inline com visualização de desconto.
- `src/app/api/billing/checkout/route.ts`: Integração com o Asaas aplicando o valor promocional, gravando metadados de cupom em `Subscription`, registrando resgate em `CouponRedemption` e eventos `CHECKOUT_STARTED` e `COUPON_APPLIED` em `PlanHistory`.
- Teste integrado `scripts/phase39/test-task294.ts` executado com sucesso: PASS.
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).

## Critérios de Aceitação (Definition of Done)
- [x] Na tela `/register`, o usuário pode informar um cupom de desconto, validá-lo para Cliente Novo e visualizar o resumo do desconto.
- [x] O cupom validado acompanha o usuário até `/checkout/billing` e `/api/billing/checkout`.
- [x] `/api/billing/checkout` cria a assinatura no Asaas com o valor promocional (ex.: `19.90`), armazena `originalPlanAmount` (`89.90`) e `discountDurationMonths` (`3`) na `Subscription`, registra `CouponRedemption` e `PlanHistory`.
- [x] Qualquer erro na validação do cupom ou no checkout gera registro em `SystemErrorLog`.
- [x] `npx tsc --noEmit` PASS e `npm run lint` PASS.

## Escopo de Implementação

### 1. Endpoint de Validação de Cupom (`POST /api/billing/coupons/validate` em `src/app/api/billing/coupons/validate/route.ts`)
1. Aceita `{ code, planSlug, planId, cycle, customerTypeContext: "NEW" | "BASE" }`.
2. Rota liberada no proxy (`src/proxy.ts`) para poder ser chamada já na tela de cadastro (`/register`) antes do login, bem como autenticada em `/checkout/billing` e `/settings/billing`.
3. Executa `CouponService.validateCouponForTarget`:
   - Verifica se o cupom existe, se está `active === true`, se `validUntil` não expirou, se `maxUses` não esgotou;
   - Verifica se `customerType` permite `customerTypeContext` (`NEW` exige cupom `NEW` ou `BOTH`; `BASE` exige cupom `BASE` ou `BOTH`);
   - Se o usuário já estiver em `/register` com `plan === "free"` (ex.: clicou em Criar Conta direto pelo cabeçalho) e digitar um cupom que pertence a um plano pago (ex.: `INFLUENCER19` vinculado ao Plano Influencer), o validador identifica automaticamente o plano principal do cupom e retorna `{ suggestedPlanSlug: "influencer", ... }` para que a tela de cadastro já selecione o plano correspondente ao cupom!
   - Caso o usuário já tenha selecionado um plano pago específico, valida se o plano selecionado faz parte dos planos do cupom (`CouponPlan`).
   - Retorna:
     ```json
     {
       "valid": true,
       "coupon": {
         "id": "...",
         "code": "INFLUENCER19",
         "name": "Promo Influencer 3 Meses",
         "discountType": "FIXED_PRICE",
         "discountValue": 19.90,
         "durationMonths": 3,
         "durationLabel": "nos 3 primeiros meses",
         "customerType": "NEW"
       },
       "pricing": {
         "planId": "...",
         "planSlug": "influencer",
         "planName": "Plano Influencer",
         "originalAmount": 89.90,
         "discountedAmount": 19.90,
         "savingsPerCycle": 70.00,
         "summaryText": "R$ 19,90/mês nos 3 primeiros meses (depois R$ 89,90/mês)"
       }
     }
     ```
4. **Logs de Erro Obrigatórios**: Qualquer validação negada (cupom inexistente, expirado, inativo, exclusivo para cliente base, plano incompatível) ou exceção inesperada grava registro em `SystemErrorLog` (`module: "BILLING"`, `screen: "Validação de Cupom"`) antes de responder ao cliente.

### 2. Interface de Cupom na Tela de Criação da Conta (`src/app/(public)/register/register-view.tsx`) e Persistência em `plan-intent.ts`
1. Em `src/lib/plan-intent.ts`:
   - Expandir `PlanIntent` para suportar `couponCode?: string`.
2. Em `src/app/(public)/register/register-view.tsx`:
   - Adicionar campo **"Possui um cupom de desconto? (opcional)"** com botão **"Validar Cupom"** no Passo 1 (e manter o badge visível nos Passos 2 e 3).
   - Ao validar com sucesso:
     - Exibir card verde com o resumo do cupom aplicado (ex.: *"Cupom INFLUENCER19 aplicado! Você pagará R$ 19,90 nos 3 primeiros meses e R$ 89,90 nos demais"*).
     - Se o usuário estava sem plano pago selecionado (`free`) e o cupom era de um plano pago (ex.: `influencer`), atualizar `planConfig` automaticamente para o plano do cupom.
   - Ao concluir o Passo 3 (`POST /api/auth/register`):
     - Propagar `couponCode` para `/checkout/billing?plan=${planSlug}&cycle=${cycle}&coupon=${encodeURIComponent(couponCode)}`.
     - Em `/api/auth/register/route.ts`, gravar o evento inicial `ACCOUNT_CREATED` no `PlanHistory` e substituir o `catch` por `handleApiError` (`module: "AUTH"`).

### 3. Onboarding Fiscal e Checkout no Asaas com Cupom (`src/components/checkout/billing-onboarding-view.tsx` e `src/app/api/billing/checkout/route.ts`)
1. Em `src/components/checkout/billing-onboarding-view.tsx`:
   - Ler `coupon` da URL ou `getStoredPlanIntent()`.
   - Exibir seção de **Cupom de Desconto** permitindo visualizar o cupom já trazido do cadastro (ou digitar/alterar um cupom antes de ir para o Asaas), mostrando o valor original riscado (`de R$ 89,90`) e o valor promocional (`por R$ 19,90 nos 3 primeiros meses, depois R$ 89,90/mês`).
   - Enviar `couponCode` na chamada `POST /api/billing/checkout`.
2. Em `src/app/api/billing/checkout/route.ts`:
   - Se `couponCode` for enviado:
     - Determinar se o Workspace é **Cliente Novo** (nunca teve fatura paga `CONFIRMED`/`RECEIVED` anteriormente) ou **Cliente Base**;
     - Revalidar o cupom de forma estrita no servidor via `CouponService.validateCouponForTarget`;
     - Se inválido, gravar em `SystemErrorLog` e retornar HTTP 400 com a mensagem explicativa;
     - Se válido:
       - Calcular `originalAmount` (ex.: `89.90`) e `discountedAmount` (ex.: `19.90`);
       - Criar a assinatura no Asaas (`gateway.createSubscription`) com `price = discountedAmount` (`19.90`) e descrição detalhando a regra promocional (`3 primeiras de R$ 19,90 e demais de R$ 89,90`);
       - Salvar na `Subscription`:
         - `couponId: coupon.id`
         - `amount: discountedAmount` (`19.90`)
         - `originalPlanAmount: originalAmount` (`89.90`)
         - `discountedAmount: discountedAmount` (`19.90`)
         - `discountDurationMonths: coupon.durationMonths` (`3` ou `0`)
         - `discountCyclesUsed: 0`
       - Criar registro em `CouponRedemption` e incrementar `Coupon.usedCount`;
       - Gravar em `PlanHistory` os eventos `CHECKOUT_STARTED` e `COUPON_APPLIED`.

## Critérios de Aceitação (Definition of Done)
- [ ] Na tela `/register`, o usuário pode informar um cupom de desconto, validá-lo para Cliente Novo e visualizar o resumo do desconto.
- [ ] O cupom validado acompanha o usuário até `/checkout/billing` e `/api/billing/checkout`.
- [ ] `/api/billing/checkout` cria a assinatura no Asaas com o valor promocional (ex.: `19.90`), armazena `originalPlanAmount` (`89.90`) e `discountDurationMonths` (`3`) na `Subscription`, registra `CouponRedemption` e `PlanHistory`.
- [ ] Qualquer erro na validação do cupom ou no checkout gera registro em `SystemErrorLog`.
- [ ] `npx tsc --noEmit` PASS e `npm run lint` PASS.

