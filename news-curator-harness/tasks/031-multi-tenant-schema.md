# Task: 031-multi-tenant-schema

## Status: DONE

## Objetivo
Criar as tabelas de Auth e Workspace no Prisma, vinculando o domínio existente ao Workspace.

## Escopo
- Adicionar schemas padrão do `@auth/prisma-adapter` (`User`, `Account`, `Session`, `VerificationToken`).
- Criar modelo `Workspace` (id, name, slug, asaasCustomerId, stripeCustomerId).
- Criar modelo `WorkspaceUser` (userId, workspaceId, role).
- Adicionar `workspaceId` obrigatório em `Source`, `Article`, `Configuration` e `WordPressCategory`.
- Gerar migração segura com backfill para preservar dados existentes.

## Definition of Done
- [x] Migração aplicada com sucesso (`20260814175555_phase5_auth_workspace_multitenant`).
- [x] Banco reflete as novas relações.
- [x] TypeScript PASS (`npx tsc --noEmit`).
- [x] Lint PASS (`npm run lint`).
- [x] Build PASS (`npm run build`).

## Evidence
- Migração `prisma/migrations/20260814175555_phase5_auth_workspace_multitenant/migration.sql` criada e aplicada no PostgreSQL.
- Tabelas criadas: `User`, `Account`, `Session`, `VerificationToken`, `Workspace`, `WorkspaceUser`.
- `workspaceId` adicionado com backfill para `default-workspace` em todas as tabelas de domínio (`Source`, `Article`, `Configuration`, `WordPressCategory`).
- `PrismaAdapter(prisma)` configurado e ativo em `src/auth.ts`.
- Validação automatizada via `scripts/test-multi-tenant-schema.ts`: PASS (100% relações e isolamento validados).
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.
