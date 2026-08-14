# Task: 031-multi-tenant-schema

## Objetivo
Criar as tabelas de Auth e Workspace no Prisma, vinculando o domínio existente ao Workspace.

## Escopo
- Adicionar schemas padrão do `@auth/prisma-adapter` (`User`, `Account`, `Session`, `VerificationToken`).
- Criar modelo `Workspace` (id, name, asaasCustomerId, stripeCustomerId).
- Criar modelo `WorkspaceUser` (userId, workspaceId, role).
- Adicionar `workspaceId` obrigatório em `Source`, `Article`, `Configuration` e `WordPressCategory`.
- Gerar migração.

## Definition of Done
- [ ] Migração aplicada com sucesso.
- [ ] Banco reflete as novas relações.
