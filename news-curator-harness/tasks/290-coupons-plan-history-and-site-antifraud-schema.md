# Task 290: Schema Prisma e Serviços Base de Cupons, Histórico de Planos e Anti-Fraude de Sites

## Status
DONE

## Contexto
Para suportar Cupons de Desconto no Backoffice, aplicação na Criação da Conta (Cliente Novo) e em Plano & Cobrança (Cliente Base), transição automática de valor após $N$ meses no Asaas, Histórico de Planos e a Trava Anti-Fraude de Cadastro de Sites em Múltiplas Contas (1ª e 2ª vez OK, 3ª vez em diante Bloqueada com alerta de suporte), precisamos evoluir o schema do Prisma e construir os serviços centrais de domínio com registro obrigatório de erros em `SystemErrorLog`.

## Escopo de Implementação

### 1. Evolução do Schema Prisma (`prisma/schema.prisma`)
1. **Enums Novos**:
   - `CouponDiscountType`:
     - `PERCENTAGE` (Desconto percentual sobre o valor do plano, ex.: `20` = 20% OFF)
     - `FIXED_DISCOUNT` (Valor fixo abatido do valor do plano, ex.: `70.00` = -R$ 70,00)
     - `FIXED_PRICE` (Valor fixo promocional final da mensalidade nos planos selecionados, ex.: `19.90` = cliente paga R$ 19,90/mês)
   - `CouponCustomerType`:
     - `NEW` (Exclusivo para Cliente Novo na criação da conta / 1ª assinatura)
     - `BASE` (Exclusivo para Cliente Base em Plano & Cobrança)
     - `BOTH` (Válido para ambos)
2. **Model `Coupon`**:
   - `id String @id @default(cuid())`
   - `code String @unique` (sempre uppercase e sem espaços, ex.: `INFLUENCER19`)
   - `name String` (Nome do cupom)
   - `description String?` (Descrição do cupom)
   - `discountType CouponDiscountType @default(PERCENTAGE)`
   - `discountValue Decimal @db.Decimal(10, 2)`
   - `durationMonths Int @default(1)` (`0` = Para Sempre, `1` = Primeiro Mês, `3` = 3 Primeiros Meses, $N \ge 0$)
   - `customerType CouponCustomerType @default(NEW)`
   - `validFrom DateTime? @default(now())`
   - `validUntil DateTime?` (Data limite de validade; `null` = sem data limite)
   - `maxUses Int?` (Limite global de usos; `null` = ilimitado)
   - `maxUsesPerWorkspace Int @default(1)`
   - `usedCount Int @default(0)`
   - `active Boolean @default(true)`
   - `createdAt DateTime @default(now())`
   - `updatedAt DateTime @updatedAt`
   - Relações: `plans CouponPlan[]`, `redemptions CouponRedemption[]`, `subscriptions Subscription[]`, `planHistories PlanHistory[]`
3. **Model `CouponPlan` (Relação N:N Cupom ↔ Múltiplos Planos)**:
   - `id String @id @default(cuid())`
   - `couponId String`
   - `planId String`
   - `@@unique([couponId, planId])`
4. **Model `CouponRedemption`**:
   - `id String @id @default(cuid())`
   - `couponId String`
   - `workspaceId String`
   - `userId String?`
   - `planId String`
   - `subscriptionId String?`
   - `originalAmount Decimal @db.Decimal(10, 2)` (ex.: `89.90`)
   - `discountedAmount Decimal @db.Decimal(10, 2)` (ex.: `19.90`)
   - `durationMonths Int` (`0` = Para Sempre, $N$ = $N$ meses)
   - `cyclesUsed Int @default(0)`
   - `status String @default("ACTIVE")` (`ACTIVE`, `COMPLETED`, `CANCELED`)
   - `appliedAt DateTime @default(now())`
   - `completedAt DateTime?`
5. **Evolução de `Subscription` e `BillingCheckoutSession`**:
   - Em `Subscription`:
     - `couponId String?`
     - `coupon Coupon? @relation(fields: [couponId], references: [id], onDelete: SetNull)`
     - `originalPlanAmount Decimal? @db.Decimal(10, 2)`
     - `discountedAmount Decimal? @db.Decimal(10, 2)`
     - `discountDurationMonths Int?`
     - `discountCyclesUsed Int @default(0)`
   - Em `BillingCheckoutSession`:
     - `couponId String?`
     - `couponCode String?`
     - `originalAmount Decimal? @db.Decimal(10, 2)`
6. **Model `PlanHistory` (Histórico de Planos)**:
   - `id String @id @default(cuid())`
   - `workspaceId String`
   - `userId String?`
   - `userEmail String?`
   - `previousPlanId String?`
   - `previousPlanName String?`
   - `newPlanId String`
   - `newPlanName String`
   - `eventType String` (`ACCOUNT_CREATED`, `CHECKOUT_STARTED`, `SUBSCRIPTION_ACTIVATED`, `PLAN_CHANGED`, `COUPON_APPLIED`, `DISCOUNT_ENDED`, `SUBSCRIPTION_CANCELED`, `SUBSCRIPTION_REACTIVATED`, `BACKOFFICE_UPDATE`)
   - `billingCycle String @default("MONTHLY")`
   - `originalAmount Decimal @db.Decimal(10, 2)`
   - `chargedAmount Decimal @db.Decimal(10, 2)`
   - `couponId String?`
   - `couponCode String?`
   - `discountDurationMonths Int?`
   - `asaasSubscriptionId String?`
   - `notes String? @db.Text`
   - `createdAt DateTime @default(now())`
7. **Model `SiteRegistrationHistory` (Histórico Perpétuo e Anti-Fraude de Cadastro de Sites)**:
   - `id String @id @default(cuid())`
   - `normalizedDomain String` (ex.: `sitedoemail1.com.br`)
   - `rawUrl String`
   - `workspaceId String`
   - `userId String?`
   - `userEmail String?`
   - `wordpressSiteId String?`
   - `sourceContext String @default("WORDPRESS_SITE")` (`REGISTER` | `WORDPRESS_SITE`)
   - `attemptNumber Int` (`1`, `2`, `3`...)
   - `status String @default("ALLOWED")` (`ALLOWED`, `BLOCKED`, `CLEARED_BY_SUPPORT`)
   - `createdAt DateTime @default(now())`
8. Executar `npx prisma db push` e `npx prisma generate`.

### 2. Serviços Centrais de Domínio
1. **`src/lib/coupons.ts` (`CouponService`)**:
   - `normalizeCouponCode(code: string): string`
   - `calculateCouponPricing(planPrice: DecimalLike, discountType: CouponDiscountType, discountValue: DecimalLike): { originalAmount: Prisma.Decimal; discountedAmount: Prisma.Decimal; discountSaved: Prisma.Decimal }`
     - Valida que `discountedAmount > 0` (ou `>= 5.00` conforme mínimo Asaas para cobranças pagas) e `discountedAmount < originalAmount`.
   - `validateCouponForTarget(params: { code: string; planId?: string; planSlug?: string; customerTypeContext: "NEW" | "BASE"; workspaceId?: string; userId?: string; userEmail?: string; reqPath?: string })`:
     - Valida existência, `active === true`, `validFrom`, `validUntil` não expirado, `maxUses` global, `maxUsesPerWorkspace` (se `workspaceId` informado), `customerType` (`NEW` vs `BASE` vs `BOTH`) e se o `plan` está vinculado em `CouponPlan`.
     - **Importante**: Caso qualquer validação falhe, grava imediatamente um log detalhado em `SystemErrorLog` via `logSystemError` (`module: "BILLING"`, `statusCode: 400` ou `403`) e retorna objeto estruturado `{ valid: false, error, code }` com mensagem amigável.
   - `formatDurationLabel(durationMonths: number): string` (ex.: `0` -> `"Para Sempre"`, `1` -> `"1º Mês"`, `3` -> `"3 Primeiros Meses"`).
2. **`src/lib/plan-history.ts` (`PlanHistoryService`)**:
   - `recordPlanEvent(input: RecordPlanHistoryInput)` (não-bloqueante, com fallback para `logSystemError` se falhar).
   - `getWorkspacePlanHistory(workspaceId: string, limit?: number)`
3. **`src/lib/site-antifraud.ts` (`SiteAntifraudService`)**:
   - `normalizeSiteDomain(rawUrl: string): string` (remove `http://`, `https://`, `www.`, portas, query params, barras finais e sufixos como `/wp-admin`, `/wp-json`, `/wp-login.php`, `/xmlrpc.php`).
   - `validateAndRecordSiteRegistration(params: { rawUrl: string; workspaceId?: string | null; userId?: string | null; userEmail?: string | null; wordpressSiteId?: string | null; sourceContext: "REGISTER" | "WORDPRESS_SITE"; reqPath?: string })`:
     - Conta quantos `workspaceId`s distintos (ou registros `REGISTER` de e-mails distintos) possuem `status: "ALLOWED"` para o `normalizedDomain`.
     - **1ª conta (`attemptNumber = 1`)**: Grava `ALLOWED` e retorna `{ allowed: true, attemptNumber: 1 }`.
     - **2ª conta distinta (`attemptNumber = 2`)**: Grava `ALLOWED` e retorna `{ allowed: true, attemptNumber: 2 }`.
     - **3ª conta distinta em diante (`attemptNumber >= 3`)**:
       - Grava `BLOCKED` em `SiteRegistrationHistory` (se `workspaceId` existir) e **grava obrigatoriamente em `SystemErrorLog`** (`module: "WORDPRESS"` ou `"AUTH"`, `statusCode: 403`) listando as contas anteriores que usaram o site.
       - Retorna `{ allowed: false, attemptNumber, blockedMessage: "Alerta de Segurança: Este site já foi vinculado anteriormente ao limite máximo de contas permitidas. O cadastro deste site foi bloqueado. Por favor, entre em contato com o nosso Suporte para liberação." }`.

## Critérios de Aceitação (Definition of Done)
- [x] `prisma/schema.prisma` atualizado com `Coupon`, `CouponPlan`, `CouponRedemption`, `PlanHistory`, `SiteRegistrationHistory` e novos campos em `Subscription` e `BillingCheckoutSession`.
- [x] `npx prisma db push` e `npx prisma generate` executados sem erros.
- [x] `src/lib/coupons.ts`, `src/lib/plan-history.ts` e `src/lib/site-antifraud.ts` criados com tipagem TypeScript estrita.
- [x] Qualquer rejeição de cupom ou bloqueio de site gera registro verificável em `SystemErrorLog`.
- [x] `npx tsc --noEmit` PASS (0 erros) e `npm run lint` PASS (0 erros).

## Evidência de Conclusão
- `prisma/schema.prisma` sincronizado com sucesso no banco de dados via `npx prisma db push` e client regenerado.
- `src/lib/coupons.ts`: `CouponService` com normalização de códigos, cálculo de precificação para `PERCENTAGE`, `FIXED_DISCOUNT` e `FIXED_PRICE` (com validações de piso e teto), validação de regras de Novo vs Base, expiração, limite global e por workspace, e registro em `SystemErrorLog`.
- `src/lib/plan-history.ts`: `PlanHistoryService` com gravação não-bloqueante e consulta cronológica.
- `src/lib/site-antifraud.ts`: `SiteAntifraudService` com normalização profunda de domínios, regra de 1ª/2ª conta permitidas e 3ª conta distinta bloqueada com mensagem de suporte e `SystemErrorLog` detalhado.
- Teste executado com sucesso: `npx tsx scripts/phase39/test-task290.ts` (PASS).
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).

