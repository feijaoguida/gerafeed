# Task 299: Rate Limiting, Proteção contra Brute Force de OTP/Login e Política Fail-Closed no Webhook Asaas

## Status
TODO

## Contexto
A auditoria de segurança pré-produção identificou nos itens **17 (Rate Limiting e Brute Force)** e **20 (Abuse Cases)**:
1. As rotas `POST /api/auth/verify-code` e `POST /api/auth/forgot-password/reset` validam códigos OTP numéricos de 6 dígitos sem limite de tentativas incorretas e sem invalidar o token após falhas sucessivas, permitindo ataques de força bruta dentro da janela de 15 minutos.
2. O login por credenciais e as rotas públicas de autenticação não possuem controle de taxa contra força bruta por IP/identificador.
3. No `AsaasGateway.handleWebhook` (`src/lib/payments/asaas.ts`), a verificação `if (this.webhookToken && headers)` permite que qualquer requisição passe sem autenticação caso a variável `ASAAS_WEBHOOK_TOKEN` não esteja definida no servidor (comportamento *Fail-Open*).

## Escopo de Implementação

### 1. Módulo Central de Rate Limiting e Anti-Brute Force (`src/lib/security/rate-limit.ts`)
1. Criar `src/lib/security/rate-limit.ts` operando em memória no processo Node.js (respeitando a regra do `AGENTS.md` de não adicionar Redis/infraestrutura externa no monólito), com limpeza automática de entradas expiradas:
   - `extractClientIp(request?: Request): string` (lendo `x-forwarded-for` ou `x-real-ip` com fallback para `"unknown-ip"`).
   - `checkRateLimit(key: string, options: { maxRequests: number; windowMs: number }): { allowed: boolean; remaining: number; retryAfterSeconds: number }`.
   - `recordFailedAttempt(key: string, options: { maxAttempts: number; windowMs: number; lockDurationMs: number }): { locked: boolean; attempts: number; remainingAttempts: number; retryAfterSeconds: number }`.
   - `getLockStatus(key: string): { locked: boolean; retryAfterSeconds: number }`.
   - `clearFailedAttempts(key: string): void`.

### 2. Proteção contra Brute Force nos Endpoints de OTP e Autenticação
1. **`POST /api/auth/verify-code` (`src/app/api/auth/verify-code/route.ts`)**:
   - Verificar `getLockStatus("otp-verify:" + cleanEmail)` antes de consultar o banco. Se bloqueado, retornar `HTTP 429` com tempo restante.
   - Caso o código informado esteja incorreto:
     - Chamar `recordFailedAttempt("otp-verify:" + cleanEmail, { maxAttempts: 5, windowMs: 15 * 60 * 1000, lockDurationMs: 15 * 60 * 1000 })`.
     - **Ao atingir 5 tentativas incorretas (`locked === true`)**:
       - Deletar imediatamente todos os `VerificationToken` para `identifier: cleanEmail` no banco de dados (invalidando o código sob ataque).
       - Gravar log de segurança em `SystemErrorLog` (`module: "AUTH"`, `statusCode: 429`, `path: "/api/auth/verify-code"`).
       - Retornar `HTTP 429` informando que o limite de tentativas foi excedido e um novo código deve ser solicitado.
   - Em caso de acerto, chamar `clearFailedAttempts("otp-verify:" + cleanEmail)`.
2. **`POST /api/auth/forgot-password/reset` (`src/app/api/auth/forgot-password/reset/route.ts`)**:
   - Aplicar a mesma proteção com chave `"otp-reset:" + cleanEmail` (máximo de 5 tentativas incorretas).
   - Na 5ª falha consecutiva, remover `VerificationToken` de `identifier: "password-reset:" + cleanEmail`, bloquear por 15 minutos (`HTTP 429`) e registrar em `SystemErrorLog` (`module: "AUTH"`, `statusCode: 429`).
3. **`POST /api/auth/register`** (quando tenta validar o código diretamente):
   - Aplicar a mesma proteção `"otp-verify:" + cleanEmail` para evitar bypass do `/verify-code` chamando `/register` diretamente em loop.
4. **Login `Credentials` (`src/auth.ts`)**:
   - Verificar bloqueio por e-mail (`"login:" + email`, máximo de 10 falhas em 15 minutos, bloqueio de 15 minutos) e registrar em `SystemErrorLog` quando bloqueado.

### 3. Política Fail-Closed no Webhook Asaas (`src/lib/payments/asaas.ts` e `src/app/api/webhooks/asaas/route.ts`)
1. Em `AsaasGateway.handleWebhook` (`src/lib/payments/asaas.ts`):
   - Verificar se `this.webhookToken` está configurado.
   - Se `!this.webhookToken`:
     - Lançar erro de autorização (`"Configuração de segurança ausente: ASAAS_WEBHOOK_TOKEN não definido no servidor."`), exceto se explicitamente instanciado em modo de teste unitário controlado com flag ou token configurado.
   - Exigir que o header `asaas-access-token` (ou `access_token`) esteja presente e corresponda exatamente a `this.webhookToken` usando comparação segura (`crypto.timingSafeEqual`).
2. Em `POST /api/webhooks/asaas` (`src/app/api/webhooks/asaas/route.ts`):
   - Quando `gateway.handleWebhook` lançar erro de autenticação (`401`), gravar obrigatoriamente registro em `SystemErrorLog` (`module: "BILLING"`, `statusCode: 401`, `path: "/api/webhooks/asaas"`) antes de responder `HTTP 401`.

## Critérios de Aceitação (Definition of Done)
- [ ] `src/lib/security/rate-limit.ts` implementado com controle de janela deslizante/fixa, bloqueio após $N$ falhas e limpeza de memória.
- [ ] `/api/auth/verify-code`, `/api/auth/forgot-password/reset` e `/api/auth/register` invalidam o OTP no banco e bloqueiam com `HTTP 429` + `SystemErrorLog` na 5ª tentativa incorreta.
- [ ] `AsaasGateway.handleWebhook` opera em modo *Fail-Closed* (rejeita requisições quando `ASAAS_WEBHOOK_TOKEN` está ausente ou quando o header `asaas-access-token` diverge).
- [ ] Teste automatizado `scripts/phase40/test-task299-rate-limit-and-webhook.ts` validando todos os fluxos.
- [ ] `npx tsc --noEmit`: PASS (0 erros).
- [ ] `npm run lint`: PASS (0 erros).

