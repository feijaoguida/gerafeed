# Task 256: Serviço de Error Logging e Handler de API no Servidor

## Status
DONE

## Contexto
Quando ocorre um erro em rotas de API ou serviços do servidor, os erros são tratados mas mascarados para o cliente. Precisamos de um serviço centralizado (`src/lib/errors/service.ts`) e um handler utilitário (`handleApiError`) que:
1. Registre o erro no banco de dados (`SystemErrorLog`) com contexto completo: usuário autenticado, tenant, tela, rota, query/payload sanitizado e stack trace.
2. Seja não-bloqueante: uma falha ao tentar salvar o log no banco de dados nunca deve quebrar ou travar a resposta da API.
3. Higienize dados sensíveis antes de salvar no campo `query` (ex: senhas, hashes, tokens de API).
4. Retorne para a API uma resposta JSON com status adequado e mensagem amigável mascarada, além de um `errorId` rastreável.

## Critérios de Aceitação
- [x] Criar `src/lib/errors/service.ts` com funções:
  - `logSystemError(data: LogSystemErrorInput): Promise<string | null>` (retorna o ID do log gravado, ou null em caso de falha silenciosa).
  - Sanitizador de payload (remove campos `password`, `token`, `secret`, `apiKey`, etc.).
- [x] Criar helper `handleApiError(error: unknown, req?: Request, context?: ApiErrorContext): Promise<NextResponse>` para uso nas rotas de API.
- [x] Integrar o handler nas principais rotas de API críticas do sistema (`/api/sources`, `/api/articles/[id]/process-ai`, `/api/billing/checkout`, `/api/wordpress/sites/[id]/test`).
- [x] Escrever teste automatizado em `scripts/phase31/test-server-logger.ts` validando a gravação de logs, sanitização de senhas e comportamento não-bloqueante.
- [x] Validar com `npx tsc --noEmit` e `npm run lint`.

## Evidências
- `src/lib/errors/service.ts` criado com `logSystemError`, `sanitizeData`, `extractErrorMessage`, `extractErrorStack` e `handleApiError`.
- Sanitização recursiva aprovada em dados aninhados para senhas, tokens e credenciais.
- Integração de `handleApiError` nas rotas:
  - `src/app/api/sources/route.ts` (GET e POST)
  - `src/app/api/articles/[id]/process-ai/route.ts` (POST)
  - `src/app/api/wordpress/sites/[id]/test/route.ts` (POST)
  - `src/app/api/billing/checkout/route.ts` (POST)
- `scripts/phase31/test-server-logger.ts`: Testes unitários de sanitização, captura de stack, gravação de log e mascaramento de resposta executados com 100% de sucesso.
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).


## Definition of Done
- Serviço de logging implementado com tratamento não-bloqueante.
- Sanitização de dados sensíveis validada.
- Rotas essenciais integradas.
- Testes passando com sucesso.
