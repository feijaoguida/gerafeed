# Task 301: Security Headers (`next.config.ts`), Mascaramento Seguro de Erros nas APIs e Higienização de Logs

## Status
DONE

## Contexto
A auditoria de segurança pré-produção identificou nos itens **11 (Modo Debug desativado)**, **12 (Tratamento seguro de erros)** e **19 (Headers de segurança e CORS)**:
1. `next.config.ts` não possui a configuração `headers()`, deixando a aplicação sem `Content-Security-Policy` (CSP), `Strict-Transport-Security` (HSTS), `X-Frame-Options` (proteção contra Clickjacking), `X-Content-Type-Options: nosniff`, `Referrer-Policy` e `Permissions-Policy`.
2. Mais de 110 endpoints em `src/app/api/` retornam `error.message` diretamente no JSON em caso de exceção `500`. Caso o Prisma ou o banco PostgreSQL lancem erros internos (`PrismaClientKnownRequestError`, `PrismaClientValidationError`, `ECONNREFUSED`, nomes de tabelas/constraints), esses detalhes estruturais vazam para o cliente.
3. Em `src/lib/payments/asaas.ts` e `src/app/api/webhooks/asaas/route.ts`, chamadas `console.log` exibem e-mails, nomes de clientes e referências em stdout mesmo em produção.

## Escopo de Implementação

### 1. Configuração de Security Headers em `next.config.ts`
1. Implementar `async headers()` em `next.config.ts` aplicando a todas as rotas (`/:path*`):
   - `X-DNS-Prefetch-Control: on`
   - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`
   - `Content-Security-Policy`: política segura permitindo `'self'`, scripts/estilos do Next.js e Google Tag Manager (`https://www.googletagmanager.com`, `https://www.google-analytics.com`), imagens `'self' data: blob: https:`, fontes `'self' data: https:` e `frame-ancestors 'none'`.

### 2. Mascaramento de Erros Internos nas Respostas de API (`src/lib/errors/service.ts` e Rotas de API)
1. Em `src/lib/errors/service.ts`:
   - Criar função `isInternalInfrastructureError(error: unknown): boolean` que detecta erros do Prisma (`PrismaClientKnownRequestError`, `PrismaClientUnknownRequestError`, `PrismaClientValidationError`, `PrismaClientInitializationError`, `PrismaClientRustPanicError`) ou mensagens contendo `Invalid \`prisma.`, `Unique constraint failed`, `Foreign key constraint failed`, `ECONNREFUSED`, `ETIMEDOUT`, `select `, `insert into `, `update `, `delete from `, ou caminhos de arquivos internos (`/home/`, `node_modules`).
   - Criar helper `getSafeClientErrorMessage(error: unknown, fallbackMessage: string): string`:
     - Se `isInternalInfrastructureError(error)` for verdadeiro, retorna obrigatoriamente `fallbackMessage` (nunca a mensagem crua do Prisma/banco).
     - Caso contrário, se for um erro de validação de domínio com mensagem amigável, retorna a mensagem higienizada limitada a 300 caracteres.
2. Atualizar as rotas de API em `src/app/api/` que retornam `error.message` em blocos `catch` para utilizar `getSafeClientErrorMessage(error, "...")` ou `handleApiError(error, request, { ... })`, assegurando que nenhum erro de banco/Prisma vaze nomes de tabelas, colunas ou stack traces para o cliente.

### 3. Higienização de Logs de Console em Produção (`Modo Debug / PII`)
1. Em `src/lib/payments/asaas.ts` e `src/app/api/webhooks/asaas/route.ts`:
   - Remover a exposição de `name`, `email` e `cpfCnpj` em `console.log`, ou restringir logs de depuração apenas quando `process.env.NODE_ENV === "development"`.
2. Em `src/lib/mail/adapters/mock-adapter.ts`:
   - Em `process.env.NODE_ENV === "production"`, nunca imprimir o código OTP ou o corpo do e-mail em texto aberto no `console.log`.

## Critérios de Aceitação (Definition of Done)
- [x] `next.config.ts` exporta todos os headers de segurança (`CSP`, `HSTS`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`).
- [x] `isInternalInfrastructureError` e `getSafeClientErrorMessage` implementados em `src/lib/errors/service.ts` e aplicados nas rotas de API para impedir vazamento de detalhes do Prisma/PostgreSQL.
- [x] Logs de console em `asaas.ts`, `webhooks/asaas/route.ts` e `mock-adapter.ts` higienizados contra vazamento de PII e OTPs em produção.
- [x] Teste automatizado `scripts/phase40/test-task301-headers-and-error-masking.ts` validando os headers e o mascaramento de erros do Prisma.
- [x] `npx tsc --noEmit`: PASS (0 erros).
- [x] `npm run lint`: PASS (0 erros).

## Evidências
- `next.config.ts`: adicionada a função `async headers()` configurando CSP restrito, HSTS com preload, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy e Permissions-Policy.
- `src/lib/errors/service.ts`: implementadas as funções `isInternalInfrastructureError` e `getSafeClientErrorMessage`. Integradas nas rotas de autenticação e manipulação de erros.
- `src/lib/payments/asaas.ts` e `src/lib/mail/adapters/mock-adapter.ts`: registros de log com e-mails, nomes de clientes e códigos OTP desativados no ambiente de produção (`NODE_ENV === "production"`).
- `scripts/phase40/test-task301-headers-and-error-masking.ts`: PASS (100% de sucesso).
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).

