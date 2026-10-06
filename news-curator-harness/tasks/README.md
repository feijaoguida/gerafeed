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

