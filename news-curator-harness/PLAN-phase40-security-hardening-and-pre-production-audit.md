# Plano de Ação — Phase 40: Hardening de Segurança Pré-Produção (Auditoria de 20 Pontos)

## 1. Contexto & Objetivo
Antes da publicação da plataforma **News Curator (GeraFeed)** em produção, foi realizada uma **Auditoria Completa de Segurança e Confiabilidade de 20 Pontos**.

Esta **Phase 40** estrutura o plano de remediação completo para corrigir todas as vulnerabilidades críticas, altas e alertas identificados na auditoria, garantindo:
1. **Autenticação Robusta (`src/auth.ts`)**: bloqueio de login por senha em contas com `passwordHash` nulo/vazio, comparação em tempo constante (`crypto.timingSafeEqual`) e restrição de credenciais fixas de admin em produção.
2. **Autorização no Servidor e Proteção de Rotas (`src/proxy.ts` e `src/app/(app)/layout.tsx`)**: bloqueio estrito de requisições não autenticadas nas rotas de API (`HTTP 401`) e redirecionamento obrigatório nas páginas privadas (`/login`), eliminando acesso anônimo.
3. **Isolamento Multi-Tenant e Prevenção a IDOR (`src/lib/workspace.ts`)**: remoção do fallback silencioso para `DEFAULT_WORKSPACE_ID` em requisições não autenticadas, lançando `UnauthorizedWorkspaceError` (`HTTP 401`) e garantindo isolamento estrito por `workspaceId`.
4. **Rate Limiting, Proteção contra Brute Force e Webhook Fail-Closed (`src/lib/security/rate-limit.ts` e `src/lib/payments/asaas.ts`)**: limite de tentativas e invalidação automática de OTPs de 6 dígitos após 5 falhas em `/api/auth/verify-code` e `/api/auth/forgot-password/reset`, proteção contra brute force no login e política *Fail-Closed* obrigatória para o `ASAAS_WEBHOOK_TOKEN`.
5. **Sanitização contra Stored XSS e Proteção contra SSRF (`src/lib/security/sanitize-html.ts`, `src/lib/rss.ts` e `src/lib/scraper.ts`)**: sanitização de HTML antes de qualquer `dangerouslySetInnerHTML` no editor/gerenciador de blocos e validação anti-SSRF (bloqueio de IPs privados, loopback e metadata cloud `169.254.169.254`) na coleta de feeds RSS e scraping de artigos.
6. **Security Headers, Tratamento Seguro de Erros e Higienização de Logs (`next.config.ts` e `src/lib/errors/service.ts`)**: configuração de CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` e `Permissions-Policy`, mascaramento de erros internos do Prisma/banco nas respostas HTTP e remoção de PII em logs de console.

---

## 2. Mapeamento dos 20 Pontos da Auditoria para as Tasks da Phase 40

| # | Ponto do Checklist | Status Inicial | Task de Correção | Meta Final |
|---|--------------------|:--------------:|:----------------:|:----------:|
| 1 | Chaves de API protegidas | `[CONFORME]` | Task 302 (Regressão) | `[CONFORME]` |
| 2 | `.env` e variáveis protegidas | `[CONFORME]` | Task 302 (Regressão) | `[CONFORME]` |
| 3 | Zero senhas no código | `[CONFORME]` | Task 297 | `[CONFORME]` |
| 4 | Autenticação robusta | `[VULNERÁVEL]` | **Task 297** | `[CONFORME]` |
| 5 | Autorização no servidor | `[VULNERÁVEL]` | **Task 297 & Task 298** | `[CONFORME]` |
| 6 | Prevenção a IDOR | `[ALERTA]` | **Task 298** | `[CONFORME]` |
| 7 | Isolamento de dados (Multi-tenancy) | `[VULNERÁVEL]` | **Task 298** | `[CONFORME]` |
| 8 | Permissões do banco de dados | `[ALERTA]` | **Task 298** | `[CONFORME]` |
| 9 | Regras de BaaS (Firebase / Supabase) | `[CONFORME]` | N/A | `[CONFORME]` |
| 10 | Proteção de rotas administrativas | `[CONFORME]` | Task 297 (Regressão) | `[CONFORME]` |
| 11 | Modo Debug desativado | `[ALERTA]` | **Task 301** | `[CONFORME]` |
| 12 | Tratamento seguro de erros | `[VULNERÁVEL]` | **Task 301** | `[CONFORME]` |
| 13 | Validação estrita no servidor | `[ALERTA]` | **Task 300 & Task 301** | `[CONFORME]` |
| 14 | Sanitização contra XSS | `[VULNERÁVEL]` | **Task 300** | `[CONFORME]` |
| 15 | Uploads protegidos | `[CONFORME]` | Task 302 (Regressão) | `[CONFORME]` |
| 16 | Proteção contra SQL / NoSQL Injection | `[CONFORME]` | Task 302 (Regressão) | `[CONFORME]` |
| 17 | Rate Limiting e Brute Force | `[VULNERÁVEL]` | **Task 299** | `[CONFORME]` |
| 18 | Histórico do Git limpo | `[CONFORME]` | Task 302 (Regressão) | `[CONFORME]` |
| 19 | Headers de segurança e CORS | `[VULNERÁVEL]` | **Task 301** | `[CONFORME]` |
| 20 | Teste como atacante (Abuse cases) | `[VULNERÁVEL]` | **Tasks 297–302** | `[CONFORME]` |

---

## 3. Arquitetura das Soluções de Segurança

### 3.1. Autenticação Estrita e Proxy Guard (Task 297)
- **`src/auth.ts`**:
  - No provider `Credentials`, um `regularUser` só pode autenticar se `Boolean(regularUser.passwordHash)` for verdadeiro e `await verifyPassword(password, regularUser.passwordHash)` retornar `true`. Se `passwordHash` for `null` ou vazio, o login é negado (`return null`).
  - A comparação de credenciais de `SUPERADMIN_PASSWORD` (e `ADMIN_PASSWORD` apenas fora de produção) utiliza `constantTimeCompare(a, b)` baseada em `crypto.timingSafeEqual` com hash SHA-256 dos operandos para evitar vazamento de tamanho ou tempo de comparação.
- **`src/proxy.ts`**:
  - Substituir o re-export passivo por um handler explícito que inspeciona `req.auth`:
    - Se `!req.auth?.user?.id`:
      - Para rotas `/api/*` (exceto rotas públicas explicitamente listadas: `/api/auth/*`, `/api/billing/coupons/validate`, `/api/webhooks/*`): retorna `NextResponse.json({ error: "Não autorizado. Faça login para continuar." }, { status: 401 })`.
      - Para rotas de páginas privadas: redireciona para `new URL("/login", req.url)`.
- **`src/app/(app)/layout.tsx`**:
  - Verifica `if (!session?.user?.id) redirect("/login");` antes de consultar dados do workspace ou renderizar a `Sidebar`.

### 3.2. Isolamento Multi-Tenant Sem Fallback Anônimo (Task 298)
- **`src/lib/workspace.ts`**:
  - Introduz `UnauthorizedWorkspaceError` (com `status = 401`).
  - `getSessionWorkspaceId()`:
    - Obtém `const session = await auth()`.
    - Se `session?.user?.workspaceId || session?.workspaceId` existir, retorna-o.
    - Caso contrário, permite fallback para `process.env.TEST_WORKSPACE_ID || DEFAULT_WORKSPACE_ID` **somente** quando `process.env.NODE_ENV !== "production"` **e** a execução não vier de uma requisição HTTP anônima em produção (ou quando `ALLOW_TEST_WORKSPACE_FALLBACK === "true"` em scripts de teste).
    - Quando uma requisição HTTP chega sem sessão autenticada, lança `UnauthorizedWorkspaceError`.
- **`src/lib/errors/service.ts`**:
  - Atualiza `handleApiError` para detectar `UnauthorizedWorkspaceError` (ou `error.message === "UNAUTHORIZED_WORKSPACE_ACCESS"`) e retornar `status: 401` com mensagem clara `"Não autorizado. Faça login para continuar."`.

### 3.3. Rate Limiting, Anti-Brute Force de OTP e Webhook Fail-Closed (Task 299)
- **`src/lib/security/rate-limit.ts`**:
  - Implementa `RateLimiter` em memória (com limpeza periódica de chaves expiradas, sem dependência de Redis conforme restrição arquitetural do `AGENTS.md`):
    - `checkRateLimit(key: string, maxRequests: number, windowMs: number)`
    - `recordFailedAttempt(key: string, maxAttempts: number, lockDurationMs: number)`
    - `clearAttempts(key: string)`
- **Proteção de OTP (`verify-code` e `forgot-password/reset`)**:
  - Máximo de **5 tentativas incorretas** por e-mail/identificador.
  - Na 5ª tentativa incorreta:
    1. Deleta imediatamente os registros `VerificationToken` daquele identificador no banco de dados (forçando a emissão de um novo código).
    2. Bloqueia novas verificações para aquele identificador por 15 minutos (`HTTP 429 Too Many Requests`).
    3. Grava alerta de segurança em `SystemErrorLog` (`module: "AUTH"`, `statusCode: 429`).
- **Webhook Asaas Fail-Closed (`src/lib/payments/asaas.ts`)**:
  - Exige `this.webhookToken` configurado e igual ao header `asaas-access-token` (comparado de forma segura).
  - Se `this.webhookToken` estiver vazio em produção (ou se o header não corresponder), lança erro de autenticação capturado com `HTTP 401` e gravado em `SystemErrorLog` (`module: "BILLING"`, `statusCode: 401`).

### 3.4. Sanitização HTML contra XSS e Anti-SSRF em RSS/Scraper (Task 300)
- **`src/lib/security/sanitize-html.ts`**:
  - Função `sanitizeHtml(dirtyHtml: string): string` que higieniza HTML dinâmico removendo `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<style>`, atributos `on*` (`onerror`, `onload`, `onclick`, etc.), `srcdoc` e URLs `javascript:` / `vbscript:` / `data:text/html`.
  - Aplicada em `src/components/affiliate/affiliate-article-editor.tsx` e `src/components/affiliate/affiliate-block-manager.tsx` em todos os usos de `dangerouslySetInnerHTML`.
- **Anti-SSRF em `src/lib/rss.ts`, `src/lib/scraper.ts` e `/api/sources`**:
  - Extrai/reutiliza `assertSafeExternalUrl(rawUrl: string)` baseado em `src/lib/affiliate/ssrf.ts` (validando protocolo `http:`/`https:`, ausência de credenciais na URL, resolução DNS e bloqueio de IPs privados/loopback/link-local `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `::1`, `fc00::/7`, `fe80::/10`).
  - Valida a URL antes de cadastrar/atualizar uma `Source` RSS (`/api/sources`), antes de buscar o feed em `fetchAndParseRss` (`src/lib/rss.ts`) e antes de raspar o artigo em `scrapeArticleContent` (`src/lib/scraper.ts`, com `redirect: "manual"` ou revalidação de redirecionamentos seguros).

### 3.5. Security Headers, Mascaramento de Erros e Higienização de Logs (Task 301)
- **`next.config.ts`**:
  - Configura `headers()` globais: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security`, `Permissions-Policy` e `Content-Security-Policy`.
- **Mascaramento de Erros (`src/lib/errors/service.ts`)**:
  - Função `getSafeClientErrorMessage(error: unknown, fallbackMessage: string): string` que impede que mensagens internas do Prisma (`Invalid \`prisma...`, `Unique constraint failed`, `Foreign key constraint`, nomes de tabelas, stack traces) sejam enviadas ao cliente em respostas JSON, retornando a `fallbackMessage` segura e mantendo o erro detalhado restrito ao `SystemErrorLog` no Backoffice.

---

## 4. Sequência de Tasks Planejadas (Phase 40)

1. **Task 297** (`tasks/297-auth-hardening-and-proxy-route-guard.md`): Autenticação Robusta (`src/auth.ts`), Bloqueio de Senha Nula, Comparação Constant-Time, Proxy Guard (`src/proxy.ts`) e Proteção do Layout Autenticado (`src/app/(app)/layout.tsx`).
2. **Task 298** (`tasks/298-multi-tenant-workspace-isolation-and-idor-guard.md`): Blindagem de Isolamento Multi-Tenant (`src/lib/workspace.ts`), Remoção de Fallback Anônimo para `DEFAULT_WORKSPACE_ID` e Prevenção a IDOR nas APIs.
3. **Task 299** (`tasks/299-rate-limiting-brute-force-and-webhook-fail-closed.md`): Rate Limiting e Anti-Brute Force de OTP/Login (`src/lib/security/rate-limit.ts`) e Política *Fail-Closed* no Webhook Asaas (`src/lib/payments/asaas.ts`).
4. **Task 300** (`tasks/300-xss-html-sanitization-and-ssrf-rss-scraper-guard.md`): Sanitização HTML contra Stored XSS (`src/lib/security/sanitize-html.ts`) e Proteção contra SSRF na Coleta RSS (`src/lib/rss.ts`) e Scraper (`src/lib/scraper.ts`).
5. **Task 301** (`tasks/301-security-headers-error-masking-and-log-hygiene.md`): Security Headers no `next.config.ts`, Mascaramento Seguro de Erros Internos nas APIs e Higienização de PII em Logs de Console.
6. **Task 302** (`tasks/302-phase40-security-audit-e2e-and-hardening.md`): Suíte E2E de Testes de Segurança (20 Pontos & Abuse Cases), Validação TypeScript, ESLint, Build de Produção e Registro de Evidências.

