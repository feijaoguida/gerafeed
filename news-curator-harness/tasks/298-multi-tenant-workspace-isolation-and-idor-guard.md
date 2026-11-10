# Task 298: Blindagem de Isolamento Multi-Tenant (`src/lib/workspace.ts`) e Prevenção a IDOR

## Status
TODO

## Contexto
A auditoria de segurança pré-produção identificou nos itens **6 (Prevenção a IDOR)** e **7 (Isolamento de dados / Multi-tenancy)** que a função central `getSessionWorkspaceId()` em `src/lib/workspace.ts` faz fallback silencioso para `DEFAULT_WORKSPACE_ID` (`"default-workspace"`) sempre que `auth()` retorna `null` ou lança exceção, e `getAuthenticatedWorkspace()` também retorna `{ workspaceId: DEFAULT_WORKSPACE_ID }` no bloco `catch`.

Em produção, uma requisição HTTP sem sessão válida jamais pode operar sobre o tenant `"default-workspace"`.

## Escopo de Implementação

### 1. Endurecimento de `src/lib/workspace.ts`
1. Criar classe de erro tipada `UnauthorizedWorkspaceError extends Error`:
   - `name = "UnauthorizedWorkspaceError"`
   - `status = 401`
   - `message = "Não autorizado. Faça login para acessar este recurso."`
2. Atualizar `getAuthenticatedWorkspace()`:
   - Se `!session?.user?.id`, retornar `null`.
   - No bloco `catch`, retornar `null` (nunca retornar `{ workspaceId: DEFAULT_WORKSPACE_ID }`).
3. Atualizar `getSessionWorkspaceId()`:
   - Tentar obter `const session = await auth()`.
   - Se `session?.user?.id` estiver presente, retornar `session.user.workspaceId || session.workspaceId || DEFAULT_WORKSPACE_ID`.
   - Se não houver sessão autenticada:
     - Permitir fallback para `process.env.TEST_WORKSPACE_ID || DEFAULT_WORKSPACE_ID` **exclusivamente** quando `process.env.NODE_ENV !== "production"` **e** a chamada ocorrer fora de um request Next.js não autenticado (ou quando `process.env.ALLOW_TEST_WORKSPACE_FALLBACK === "true"` em scripts CLI de teste).
     - Em produção (`NODE_ENV === "production"`) ou quando exigido em request sem sessão, lançar `new UnauthorizedWorkspaceError()`.

### 2. Tratamento Automático de `UnauthorizedWorkspaceError` nas Rotas de API (`src/lib/errors/service.ts`)
1. Atualizar `handleApiError` em `src/lib/errors/service.ts`:
   - Se `error instanceof UnauthorizedWorkspaceError` ou `(error as { status?: number })?.status === 401`:
     - Retornar `NextResponse.json({ error: "Não autorizado. Faça login para continuar." }, { status: 401 })` sem expor detalhes internos.
2. Garantir que rotas de API que capturam erros com `try / catch` próprio respeitem `error.status === 401` (ou `error instanceof UnauthorizedWorkspaceError`) retornando `HTTP 401` em vez de `HTTP 500`.

### 3. Auditoria de Prevenção a IDOR por `workspaceId`
1. Verificar e assegurar que as operações de leitura, atualização e exclusão por `[id]` em `/api/articles/[id]/*`, `/api/sources/[id]`, `/api/wordpress/sites/[id]/*`, `/api/affiliate/products/[id]/*`, `/api/affiliate/offers/[id]/*` e `/api/affiliate/categories/[id]` validem sempre o par `{ id, workspaceId }` pertencente ao usuário autenticado antes de modificar qualquer registro.

## Critérios de Aceitação (Definition of Done)
- [ ] `getAuthenticatedWorkspace()` retorna `null` em caso de ausência de sessão ou exceção, nunca caindo em `DEFAULT_WORKSPACE_ID`.
- [ ] `getSessionWorkspaceId()` lança `UnauthorizedWorkspaceError` (`status: 401`) quando chamado sem sessão autenticada em produção, mantendo compatibilidade controlada apenas para scripts CLI de teste em desenvolvimento.
- [ ] `handleApiError` responde `HTTP 401` para `UnauthorizedWorkspaceError`.
- [ ] Teste automatizado `scripts/phase40/test-task298-tenant-isolation-and-idor.ts` validando bloqueio de acesso sem sessão e isolamento estrito entre Workspaces A e B (prevenção a IDOR).
- [ ] `npx tsc --noEmit`: PASS (0 erros).
- [ ] `npm run lint`: PASS (0 erros).

