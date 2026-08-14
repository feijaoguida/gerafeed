# Task: 032-tenant-isolation-refactor

## Objetivo
Refatorar TODAS as queries do sistema (Fases 1, 2 e 3) para incluir o `workspaceId`.

## Escopo
- Ao logar, definir um Workspace padrão para o usuário.
- Atualizar todas as rotas da API (`/api/process`, `/api/articles`, `/api/sources`) para extrair o `workspaceId` da sessão.
- Injetar `workspaceId` nos `.findMany`, `.create`, `.update` do Prisma.

## Definition of Done
- [ ] Impossível ler/alterar fontes ou artigos de outro Workspace.
- [ ] Tudo funcionando como antes, mas de forma multilocatário.
