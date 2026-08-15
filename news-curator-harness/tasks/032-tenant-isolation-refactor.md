# Task: 032-tenant-isolation-refactor

## Status: DONE

## Objetivo
Refatorar TODAS as queries do sistema (Fases 1, 2 e 3) para incluir o `workspaceId`.

## Escopo
- Ao logar, definir um Workspace padrão para o usuário.
- Atualizar todas as rotas da API (`/api/process`, `/api/articles`, `/api/sources`, `/api/wordpress/*`, `/api/ai/*`, `/api/images/*`, `/api/dashboard/*`) para extrair o `workspaceId` da sessão.
- Injetar `workspaceId` nos `.findMany`, `.create`, `.update`, `.delete` do Prisma e nos serviços centrais (`src/lib/config.ts`, `src/lib/rss.ts`, `src/lib/wordpress.ts`, `src/lib/ai.ts`, `src/lib/workspace.ts`).

## Definition of Done
- [x] Impossível ler/alterar fontes ou artigos de outro Workspace (100% isolado).
- [x] Tudo funcionando como antes, mas de forma multilocatário.
- [x] TypeScript PASS (`npx tsc --noEmit`).
- [x] Lint PASS (`npm run lint`).
- [x] Build PASS (`npm run build`).

## Evidence
- `src/auth.ts`: Atualizado para vincular usuário ao workspace e enriquecer o JWT e a Session (`session.user.workspaceId`, `session.workspaceId`).
- `src/lib/workspace.ts`: Criado helper central `getSessionWorkspaceId()` e `getAuthenticatedWorkspace()`.
- `src/lib/config.ts`: Suporte completo a `workspaceId` em `getConfig`, `setConfig`, `getAllConfigs`, `deleteConfig`.
- `src/lib/rss.ts`: `processRssSources` recebe `workspaceId` e isola fontes e artigos criados.
- `src/lib/wordpress.ts`: `getWordPressConfig`, `fetchWordPressCategories`, `syncWordPressCategories`, `testWordPressConnection` e `publishArticleToWordPress` totalmente isolados por `workspaceId`.
- `src/lib/ai.ts` e `src/lib/ai/service.ts`: `processArticleWithAi`, `getActiveAIProvider`, `testActiveAIProviderConnection` isolados por `workspaceId`.
- Todas as rotas de API (`/api/sources`, `/api/sources/[id]`, `/api/articles`, `/api/articles/[id]`, `/api/articles/[id]/approve`, `/api/articles/[id]/reject`, `/api/articles/[id]/process-ai`, `/api/dashboard/stats`, `/api/wordpress/categories`, `/api/wordpress/categories/sync`, `/api/wordpress/config`, `/api/wordpress/test`, `/api/ai/config`, `/api/ai/prompt-settings`, `/api/ai/test`, `/api/images/config`) refatoradas para extrair e filtrar por `workspaceId`.
- Teste automatizado de isolamento multi-tenant (`scripts/test-tenant-isolation.ts`): PASS (verificado isolamento cruzado de artigos, fontes, configurações e categorias).
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.
