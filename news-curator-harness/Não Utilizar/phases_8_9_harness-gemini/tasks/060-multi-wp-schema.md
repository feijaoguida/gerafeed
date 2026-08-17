# Task: 060-multi-wp-schema

## Objetivo
Preparar o banco de dados para Múltiplos sites WordPress e Backoffice.

## Escopo
- Criar Model `WordPressSite` no Prisma (id, workspaceId, name, url, username, applicationPassword, promptSettings).
- Adicionar `wordPressSiteId String?` e relação correspondente no Model `Source`.
- Adicionar `isSuperAdmin Boolean @default(false)` no `User`.
- Adicionar `isActive Boolean @default(true)` no `Workspace`.
- Criar script `prisma/seed.ts` que cria um usuário admin padrão ou transforma um e-mail específico em admin.
- Gerar migrações do banco.

## Definition of Done
- [ ] Schema Prisma atualizado.
- [ ] Migração rodou sem quebrar dados existentes.
- [ ] Script de seed criado e testado.
