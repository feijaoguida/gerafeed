# Phase 20 Tasks

| Task | Objetivo |
|---|---|
| 180 | Preço mensal/anual e desconto |
| 181 | BillingProfile |
| 182 | PaymentProvider v2 + Customer Asaas |
| 183 | Hosted Checkout |
| 184 | Assinaturas recorrentes |
| 185 | Webhooks |
| 186 | Ledger / Invoice |
| 187 | Lifecycle e acesso |
| 188 | Portal do cliente |
| 189 | Backoffice Billing |
| 190 | Reconciliação manual |
| 191 | Integração e hardening |

# Phase 30 Tasks — implementação parcial

Plano: [Phase 30](../PLAN-phase30-affiliates.md). Tasks 247–251 DONE; 252–254 TODO.
Execução encerrada após task 251 por solicitação do usuário em 2026-10-03.
Status e evidências detalhados em [PROGRESS.md](../PROGRESS.md).

| Task | Objetivo |
|---|---|
| [247](247-affiliate-block-contracts.md) | Contratos de blocos, persistência e compatibilidade |
| [248](248-shopee-affiliate-import.md) | Provider Shopee, preview, confirmação e refresh |
| [249](249-affiliate-block-renderers.md) | Cinco modelos visuais e renderização compartilhada |
| [250](250-affiliate-original-images-and-placement.md) | Imagens originais e cards no meio e final |
| [251](251-product-content-research-and-review.md) | Conteúdo & Pesquisa e review pré-selecionado |
| [252](252-affiliate-cursor-editor.md) | Inserção e edição de cards no cursor |
| [253](253-affiliate-save-publish-entitlements.md) | Persistência, publicação e autorização integradas |
| [254](254-phase30-integration-and-hardening.md) | Integração, regressão e evidências da Phase 30 |

# Phase 31 Tasks — Sistema de Log de Erros, Diagnóstico e Auditoria no Backoffice

Plano: [Phase 31](../PLAN-phase31-error-logs.md). Tasks 255–260 DONE.

| Task | Objetivo |
|---|---|
| [255](255-error-log-and-system-settings-schema.md) | Modelos `SystemErrorLog` e `SystemSetting`, migration e seed inicial |
| [256](256-server-error-logger-and-api-handler.md) | Serviço central de logging e handler de API não-bloqueante com mascaramento |
| [257](257-client-error-boundary-and-toast-system.md) | Módulo client de captura, endpoint de reporte e toast popup nos cantos |
| [258](258-backoffice-error-logs-viewer.md) | Tela Backoffice de logs com filtros (tenant, módulo, usuário, data) e modal de stack trace |
| [259](259-backoffice-general-settings-and-cleanup.md) | Tela de Configurações Gerais no Backoffice, retenção (180 dias) e rotina de expurgo |
| [260](260-phase31-integration-and-hardening.md) | Integração end-to-end, testes de regressão, lint, tipos e evidências |

# Phase 32 Tasks — Recuperação de Senha com Código de Segurança via E-mail

Plano: [Phase 32](../PLAN-phase32-password-recovery.md). Tasks 261–265 DONE.

| Task | Objetivo |
|---|---|
| [261](261-password-reset-email-template.md) | Template de e-mail de recuperação de senha com código OTP e instruções |
| [262](262-password-reset-api-endpoints.md) | Endpoints de solicitação (`/send-code`) e redefinição (`/reset`) com token isolado e anti-enumeração |
| [263](263-login-link-and-proxy-route.md) | Link "Esqueceu a senha?" no formulário de login e liberação de rota pública em `src/proxy.ts` |
| [264](264-forgot-password-page-and-view.md) | Página `/forgot-password` e view em 2 passos com timer regressivo, acessibilidade e design GeraFeed |
| [265](265-phase32-integration-and-hardening.md) | Script de testes automatizados, validação de segurança (anti-flood, anti-enumeração, expiração), lint, tsc e build |

# Phase 33 a 38 Tasks — Concluídas

- **Phase 33** ([PLAN-phase33-ai-image-generation.md](../PLAN-phase33-ai-image-generation.md)): Tasks `267`–`272` DONE.
- **Phase 35** ([PLAN-phase35-manual-article-creation.md](../PLAN-phase35-manual-article-creation.md)): Tasks `273`–`277` DONE.
- **Phase 36** ([PLAN-phase36-huggingface-free-image-ai.md](../PLAN-phase36-huggingface-free-image-ai.md)): Tasks `278`–`281` DONE.
- **Phase 37** ([PLAN-phase37-woocommerce-and-sales-ai.md](../PLAN-phase37-woocommerce-and-sales-ai.md)): Tasks `282`–`285` DONE.
- **Phase 38** ([PLAN-phase38-woocommerce-site-keys-and-plan-guard.md](../PLAN-phase38-woocommerce-site-keys-and-plan-guard.md)): Tasks `286`–`289` DONE.

# Phase 39 Tasks — Cupons de Desconto, Ciclos Promocionais no Asaas, Histórico de Planos e Anti-Fraude de Cadastro de Sites

Plano: [Phase 39](../PLAN-phase39-coupons-plan-history-and-site-antifraud.md). Tasks `290`–`296` DONE.

| Task | Objetivo |
|---|---|
| [290](290-coupons-plan-history-and-site-antifraud-schema.md) | Schema Prisma (`Coupon`, `CouponPlan`, `CouponRedemption`, `PlanHistory`, `SiteRegistrationHistory`, campos em `Subscription`) e serviços de domínio com logging em `SystemErrorLog` |
| [291](291-site-antifraud-guard-and-history.md) | Normalização de domínio/URL e trava anti-fraude (1ª vez OK, 2ª vez OK, 3ª vez Bloqueia + Alerta de Suporte + `SystemErrorLog`) em `/api/wordpress/sites`, `/settings/wordpress` e `/register` |
| [292](292-backoffice-coupons-and-history-management.md) | CRUD completo de Cupons de Desconto no Backoffice (`/backoffice/coupons`) + visualização de Histórico de Planos e Histórico/Liberação de Sites no Backoffice |
| [293](293-asaas-subscription-discount-lifecycle.md) | Integração Asaas (`PUT /v3/subscriptions/{id}` com `updatePendingPayments: true`) e automação de ciclos promocionais no Webhook Asaas e `BillingService` |
| [294](294-register-and-onboarding-coupon-flow.md) | Opção de Cupom de Desconto na Criação da Conta (`/register` e `/checkout/billing`) para Cliente Novo + envio ao Asaas + `SystemErrorLog` |
| [295](295-billing-settings-base-coupon-and-plan-history-ui.md) | Opção de Cupom de Desconto em **Plano & Cobrança** (`/settings/billing` e `/settings/billing/upgrade`) para Cliente Base + atualização no Asaas + exibição do Histórico de Planos |
| [296](296-phase39-e2e-tests-and-hardening.md) | Bateria de testes E2E automatizados da Phase 39, auditoria de logs de erro e segurança, `npx tsc --noEmit`, `npm run lint` e `npm run build` |

# Phase 40 Tasks — Hardening de Segurança Pré-Produção (Auditoria de 20 Pontos)

Plano: [Phase 40](../PLAN-phase40-security-hardening-and-pre-production-audit.md). Tasks `297`–`302` TODO.

| Task | Objetivo |
|---|---|
| [297](297-auth-hardening-and-proxy-route-guard.md) | Endurecimento de Autenticação (`src/auth.ts`), bloqueio de senha nula, comparação constant-time, Proxy Guard (`src/proxy.ts`) e proteção de `src/app/(app)/layout.tsx` |
| [298](298-multi-tenant-workspace-isolation-and-idor-guard.md) | Blindagem de Isolamento Multi-Tenant (`src/lib/workspace.ts`), eliminação de fallback anônimo para `DEFAULT_WORKSPACE_ID` e prevenção a IDOR |
| [299](299-rate-limiting-brute-force-and-webhook-fail-closed.md) | Rate Limiting e Anti-Brute Force de OTP/Login (`src/lib/security/rate-limit.ts`) e Política *Fail-Closed* no Webhook Asaas (`src/lib/payments/asaas.ts`) |
| [300](300-xss-html-sanitization-and-ssrf-rss-scraper-guard.md) | Sanitização HTML contra Stored XSS (`src/lib/security/sanitize-html.ts`) e Proteção Anti-SSRF na Coleta RSS (`src/lib/rss.ts`) e Scraper (`src/lib/scraper.ts`) |
| [301](301-security-headers-error-masking-and-log-hygiene.md) | Security Headers (`next.config.ts`), Mascaramento Seguro de Erros Internos do Prisma nas APIs e Higienização de PII em Logs |
| [302](302-phase40-security-audit-e2e-and-hardening.md) | Suíte E2E de Testes de Segurança (20 Pontos & Abuse Cases), TypeScript, ESLint, Build de Produção e Evidências |



