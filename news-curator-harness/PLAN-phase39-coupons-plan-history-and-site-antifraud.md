# Plano de Ação — Phase 39: Cupons de Desconto, Integração de Ciclos Promocionais no Asaas, Histórico de Planos e Anti-Fraude de Sites

## 1. Contexto & Objetivo
Implementar um sistema completo de **Cupons de Desconto** gerenciado pelo Backoffice, integrado de ponta a ponta à **Criação de Conta**, à tela **Plano & Cobrança** e à **API v3 de Assinaturas do Asaas** (incluindo transição automática de valor após os $N$ primeiros meses promocionais), além de criar o **Histórico de Planos** e a **Trava Anti-Fraude de Cadastro de Sites em Múltiplas Contas** (permitindo até 2 contas e bloqueando da 3ª vez em diante com alerta para procurar o suporte), com **geração obrigatória de Logs de Erro (`SystemErrorLog`)** em qualquer falha ou bloqueio.

---

## 2. Validação Técnica da Regra na Documentação do Asaas
De acordo com a documentação oficial da **API v3 do Asaas** (`/v3/subscriptions`):
1. **Funcionamento Nativo do Asaas**:
   - O endpoint `POST /v3/subscriptions` recebe um único `value` recorrente para a assinatura (e `maxPayments` encerra a assinatura definitivamente, não devendo ser usado para períodos promocionais).
   - O endpoint `PUT /v3/subscriptions/{id}` permite alterar o `value` de uma assinatura ativa a qualquer momento e aceita o parâmetro `"updatePendingPayments": true`, que atualiza imediatamente cobranças `PENDING` já geradas para o próximo vencimento sem afetar faturas já pagas (`CONFIRMED` / `RECEIVED`).
2. **Estratégia para Descontos Temporários (Ex.: Plano Influencer de R$ 89,90 por R$ 19,90 nos 3 primeiros meses)**:
   - **Duração `0` (Para Sempre)**: A assinatura é criada (`POST /v3/subscriptions`) ou atualizada (`PUT /v3/subscriptions/{id}` com `updatePendingPayments: true`) diretamente com `value = 19.90` por tempo indeterminado.
   - **Duração `N > 0` (Ex.: `1` = 1º mês, `3` = 3 primeiros meses)**:
     1. A assinatura é criada/atualizada no Asaas com `value = 19.90` (valor promocional) e na tabela local `Subscription` são gravados:
        - `couponId`
        - `originalPlanAmount = 89.90`
        - `discountedAmount = 19.90`
        - `discountDurationMonths = 3`
        - `discountCyclesUsed = 0` (ou `discountRemainingCycles = 3`)
     2. A 1ª, 2ª e 3ª cobranças são geradas e pagas no Asaas no valor de `R$ 19,90`.
     3. No Webhook do Asaas (`POST /api/webhooks/asaas` nos eventos `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED` e `PAYMENT_CREATED`) e na sincronização (`BillingService.syncWorkspaceWithGateway`):
        - A cada ciclo promocional pago, incrementa-se `discountCyclesUsed`.
        - Assim que `discountCyclesUsed >= discountDurationMonths` (ex.: 3ª cobrança confirmada, ou caso uma 4ª cobrança seja gerada após as 3 promocionais), o sistema dispara automaticamente `PUT /v3/subscriptions/{asaasSubscriptionId}` com `{ value: 89.90, updatePendingPayments: true }`, restaurando o valor cheio do plano (`R$ 89,90`) para a 4ª cobrança e todas as seguintes, e registrando o evento `DISCOUNT_CYCLE_COMPLETED` no `PlanHistory`.
3. **Aplicação de Cupom para Cliente Base (`Plano & Cobrança`)**:
   - Se o cliente já possui `asaasSubscriptionId` ativo, o sistema valida o cupom (`customerType: BASE` ou `BOTH` + plano compatível) e chama imediatamente `PUT /v3/subscriptions/{asaasSubscriptionId}` com `{ value: discountedAmount, updatePendingPayments: true }`, atualizando também a próxima fatura em aberto no Asaas.

---

## 3. Modelagem de Dados (Prisma Schema)

### 3.1. `Coupon` & `CouponPlan` & `CouponRedemption`
```prisma
enum CouponDiscountType {
  PERCENTAGE      // Ex: 20% de desconto sobre o valor do plano
  FIXED_DISCOUNT  // Ex: R$ 70,00 de abatimento sobre o valor do plano
  FIXED_PRICE     // Ex: Pague exatamente R$ 19,90/mês nos planos selecionados
}

enum CouponCustomerType {
  NEW   // Exclusivo para Novos Clientes (Criação de Conta / 1ª assinatura)
  BASE  // Exclusivo para Clientes da Base (Tela Plano & Cobrança)
  BOTH  // Válido para Novos e Base
}

model Coupon {
  id                  String             @id @default(cuid())
  code                String             @unique // Código digitado pelo cliente (ex: INFLUENCER19)
  name                String             // Nome interno/comercial
  description         String?
  discountType        CouponDiscountType @default(PERCENTAGE)
  discountValue       Decimal            @db.Decimal(10, 2)
  durationMonths      Int                @default(1) // 0 = Para Sempre, 1 = 1º Mês, 3 = 3 Primeiros Meses, etc.
  customerType        CouponCustomerType @default(NEW)
  validFrom           DateTime?          @default(now())
  validUntil          DateTime?          // Válido até (null = sem expiração)
  maxUses             Int?               // Limite global de usos (null = ilimitado)
  maxUsesPerWorkspace Int                @default(1) // Evita reuso do mesmo cupom pela mesma conta
  usedCount           Int                @default(0)
  active              Boolean            @default(true)
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt

  plans               CouponPlan[]
  redemptions         CouponRedemption[]
  subscriptions       Subscription[]
  planHistories       PlanHistory[]

  @@index([code])
  @@index([active, validUntil])
}

model CouponPlan {
  id        String   @id @default(cuid())
  couponId  String
  planId    String
  createdAt DateTime @default(now())

  coupon    Coupon   @relation(fields: [couponId], references: [id], onDelete: Cascade)
  plan      Plan     @relation(fields: [planId], references: [id], onDelete: Cascade)

  @@unique([couponId, planId])
}

model CouponRedemption {
  id                     String   @id @default(cuid())
  couponId               String
  workspaceId            String
  userId                 String?
  planId                 String
  subscriptionId         String?
  originalAmount         Decimal  @db.Decimal(10, 2)
  discountedAmount       Decimal  @db.Decimal(10, 2)
  durationMonths         Int      // 0 = Para sempre, N = N meses
  cyclesUsed             Int      @default(0)
  status                 String   @default("ACTIVE") // ACTIVE, COMPLETED, CANCELED
  appliedAt              DateTime @default(now())
  completedAt            DateTime?

  coupon                 Coupon    @relation(fields: [couponId], references: [id], onDelete: Restrict)
  workspace              Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  plan                   Plan      @relation(fields: [planId], references: [id], onDelete: Restrict)

  @@index([workspaceId])
  @@index([couponId])
}
```

### 3.2. Campos Adicionais em `Subscription` e `BillingCheckoutSession`
- Em `Subscription`:
  - `couponId String?`
  - `originalPlanAmount Decimal? @db.Decimal(10, 2)` (ex: `89.90`)
  - `discountedAmount Decimal? @db.Decimal(10, 2)` (ex: `19.90`)
  - `discountDurationMonths Int?` (`0` = para sempre, `1`, `3`, etc.)
  - `discountCyclesUsed Int @default(0)`
- Em `BillingCheckoutSession`:
  - `couponId String?`
  - `couponCode String?`
  - `originalAmount Decimal? @db.Decimal(10, 2)`

### 3.3. `PlanHistory` (Histórico de Planos)
```prisma
model PlanHistory {
  id                     String   @id @default(cuid())
  workspaceId            String
  userId                 String?
  userEmail              String?
  previousPlanId         String?
  previousPlanName       String?
  newPlanId              String
  newPlanName            String
  eventType              String   // ACCOUNT_CREATED, CHECKOUT_STARTED, SUBSCRIPTION_ACTIVATED, PLAN_CHANGED, COUPON_APPLIED, DISCOUNT_ENDED, CANCELED, REACTIVATED, BACKOFFICE_UPDATE
  billingCycle           String   @default("MONTHLY")
  originalAmount         Decimal  @db.Decimal(10, 2)
  chargedAmount          Decimal  @db.Decimal(10, 2)
  couponId               String?
  couponCode             String?
  discountDurationMonths Int?
  asaasSubscriptionId    String?
  notes                  String?  @db.Text
  createdAt              DateTime @default(now())

  workspace              Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  coupon                 Coupon?   @relation(fields: [couponId], references: [id], onDelete: SetNull)

  @@index([workspaceId, createdAt])
}
```

### 3.4. `SiteRegistrationHistory` (Histórico e Anti-Fraude de Cadastro de Sites)
```prisma
model SiteRegistrationHistory {
  id               String   @id @default(cuid())
  normalizedDomain String   // Ex: "sitedoemail1.com.br" (sem http/https, sem www, lowercase)
  rawUrl           String   // URL original informada
  workspaceId      String
  userId           String?
  userEmail        String?
  wordpressSiteId  String?  // Preenchido quando originado de WordPressSite
  sourceContext    String   @default("WORDPRESS_SITE") // "REGISTER" ou "WORDPRESS_SITE"
  attemptNumber    Int      // Nº da conta distinta que cadastrou/tentou cadastrar este domínio (1, 2, 3...)
  status           String   @default("ALLOWED") // "ALLOWED" (1ª e 2ª vez) ou "BLOCKED" (3ª vez em diante)
  createdAt        DateTime @default(now())

  workspace        Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([normalizedDomain])
  @@index([workspaceId])
  @@index([normalizedDomain, workspaceId])
}
```
> **Nota importante sobre exclusão**: Mesmo que o usuário exclua um `WordPressSite` de uma conta antiga, o registro em `SiteRegistrationHistory` **não é apagado**. Assim, a contagem de quantas contas distintas já utilizaram aquele domínio permanece íntegra:
> - **1ª conta distinta**: `attemptNumber = 1` → **OK (Permitido)**.
> - **2ª conta distinta**: `attemptNumber = 2` → **OK (Permitido)**.
> - **3ª conta distinta em diante**: `attemptNumber >= 3` → **BLOQUEADO!** Exibe alerta informando que o site já foi utilizado no limite máximo de contas permitidas e orienta o usuário a **procurar o suporte**, além de gravar log detalhado em `SystemErrorLog`.

---

## 4. Divisão de Tasks (Sequência de Execução)

| Task | Nome | Escopo Resumido | Depende de |
|---|---|---|---|
| **Task 290** | `290-coupons-plan-history-and-site-antifraud-schema.md` | Schema Prisma (`Coupon`, `CouponPlan`, `CouponRedemption`, `PlanHistory`, `SiteRegistrationHistory`, campos em `Subscription` e `BillingCheckoutSession`), migração do banco e serviços base (`CouponService`, `PlanHistoryService`, `SiteAntifraudService`) com logging em `SystemErrorLog`. | Autorização |
| **Task 291** | `291-site-antifraud-guard-and-history.md` | Normalização de domínio/URL, aplicação da regra 1ª vez OK / 2ª vez OK / 3ª vez Bloqueia + Alerta de Suporte no cadastro de sites WordPress (`/api/wordpress/sites`, `/settings/wordpress`) e no registro de conta (`/api/auth/register`, `/register`), mais visualização no Backoffice e geração de `SystemErrorLog`. | 290 |
| **Task 292** | `292-backoffice-coupons-and-history-management.md` | CRUD completo de Cupons no Backoffice (`/backoffice/coupons` e `/api/backoffice/coupons`) com Nome, Código, Descrição, Válido até, Múltiplos Planos, Tipo de Desconto (Percentual, Desconto Fixo ou Preço Fixo ex: R$ 19,90), Quanto Tempo (`0` = Para Sempre, `1` = 1º mês, `3` = 3 primeiros meses...), Tipo de Cliente (`Novo`, `Base`, `Ambos`), Limite de usos e Aba/Seção de Histórico de Planos e Histórico de Sites no Backoffice. | 290 |
| **Task 293** | `293-asaas-subscription-discount-lifecycle.md` | Evolução de `AsaasGateway` (`updateSubscription` via `PUT /v3/subscriptions/{id}` com `updatePendingPayments: true`), controle automático de ciclos promocionais no Webhook (`/api/webhooks/asaas`) e no `BillingService.syncWorkspaceWithGateway` (transição automática de R$ 19,90 nos $N$ primeiros meses para R$ 89,90 nas cobranças seguintes) e logs de erro completos em `SystemErrorLog`. | 290 |
| **Task 294** | `294-register-and-onboarding-coupon-flow.md` | Campo e validação de Cupom de Desconto na Criação da Conta (`/register` e `/checkout/billing`), endpoint `POST /api/billing/coupons/validate`, validação de cupom ativo/válido/cliente Novo/plano compatível, preview do desconto ("3 primeiros meses por R$ 19,90, depois R$ 89,90"), envio ao Asaas em `/api/billing/checkout` e gravação de `SystemErrorLog` em qualquer falha. | 290, 292, 293 |
| **Task 295** | `295-billing-settings-base-coupon-and-plan-history-ui.md` | Opção de informar e aplicar Cupom de Desconto em **Plano & Cobrança** (`/settings/billing` e `/settings/billing/upgrade`), endpoint `POST /api/billing/coupons/apply` validando cupom ativo/válido/plano do cliente/cliente Base, atualização imediata da assinatura no Asaas (`PUT /v3/subscriptions/{id}`), e exibição do **Histórico de Planos** para o usuário. | 290, 292, 293 |
| **Task 296** | `296-phase39-e2e-tests-and-hardening.md` | Bateria de testes E2E automatizados (`scripts/phase39/test-coupons-history-and-site-antifraud-e2e.ts`) validando todos os cenários (Cupom Cliente Novo 3 meses a R$ 19,90 -> transição para R$ 89,90 no 4º mês, Cupom Cliente Base atualizando assinatura Asaas, Histórico de Planos, Bloqueio de 3ª conta com mesmo site WordPress e geração de `SystemErrorLog`), `npx tsc --noEmit`, `npm run lint` e `npm run build`. | 290–295 |

---

## 5. Garantias de Logs de Erro (`SystemErrorLog`)
Todas as rotas e serviços novos/alterados utilizarão `logSystemError` / `handleApiError` (`src/lib/errors/service.ts`):
- **Módulo `BILLING`**:
  - Tentativa de uso de cupom inexistente, inativo, expirado ou esgotado;
  - Tentativa de cliente Base usar cupom exclusivo de Cliente Novo (e vice-versa);
  - Tentativa de usar cupom em plano não vinculado ao cupom;
  - Qualquer falha HTTP/rede ao criar ou atualizar assinatura no Asaas (`POST /v3/subscriptions`, `PUT /v3/subscriptions/{id}`) ou processar Webhook.
- **Módulo `WORDPRESS` / `AUTH`**:
  - Bloqueio na 3ª tentativa (ou superior) de cadastrar o mesmo domínio/site em contas diferentes (registrando no `SystemErrorLog` os e-mails/workspaces anteriores e a conta atual para facilitar o atendimento do suporte).
- **Módulo `BACKOFFICE`**:
  - Erros de validação ou persistência ao criar/editar/inativar cupons no Backoffice.

