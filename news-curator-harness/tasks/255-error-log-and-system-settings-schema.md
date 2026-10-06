# Task 255: Modelos SystemErrorLog e SystemSetting no Prisma

## Status
DONE

## Contexto
Para registrar diagnósticos de erro e configurações globais de retenção, precisamos de modelos formais no Prisma:
1. `SystemErrorLog`: armazena detalhes de exceções capturadas no backend e reportadas pelo frontend, identificando tenant (Workspace), usuário, tela, rota/caminho, consulta/payload, módulo, status, mensagem original e stack trace.
2. `SystemSetting`: tabela chave/valor global para parâmetros de sistema (como tempo de retenção de logs em dias).

## Critérios de Aceitação
- [x] Adicionar modelo `SystemErrorLog` no `prisma/schema.prisma` com campos:
  - `id` (cuid)
  - `workspaceId` (String?, relation opcional com Workspace)
  - `userId` (String?)
  - `userEmail` (String?)
  - `userName` (String?)
  - `screen` (String?)
  - `path` (String)
  - `method` (String?, default "GET")
  - `query` (Json?)
  - `module` (String, default "GENERAL")
  - `errorMessage` (String, @db.Text)
  - `errorStack` (String?, @db.Text)
  - `statusCode` (Int?, default 500)
  - `ipAddress` (String?)
  - `userAgent` (String?)
  - `createdAt` (DateTime, default now)
  - Índices em `[workspaceId]`, `[module]`, `[createdAt]`, `[userId]`.
- [x] Adicionar modelo `SystemSetting` no `prisma/schema.prisma` com campos:
  - `id` (cuid)
  - `key` (String, @unique)
  - `value` (Json)
  - `description` (String?)
  - `createdAt` (DateTime, default now)
  - `updatedAt` (DateTime, updated)
- [x] Atualizar relação no modelo `Workspace` para incluir `systemErrorLogs SystemErrorLog[]`.
- [x] Rodar `npx prisma db push` ou migration para aplicar as alterações no PostgreSQL.
- [x] Rodar `npx prisma generate` para atualizar o Prisma Client.
- [x] Criar ou atualizar seed/script para garantir a configuração default `error_log_retention_days = 180`.
- [x] Validar compilação TypeScript com `npx tsc --noEmit`.

## Evidências
- `prisma/schema.prisma` atualizado com `SystemErrorLog` e `SystemSetting`.
- Relação `systemErrorLogs SystemErrorLog[]` adicionada a `Workspace`.
- `npx prisma db push`: Banco sincronizado com sucesso.
- `npx prisma generate`: Prisma Client v7.9.1 gerado com os novos modelos.
- `prisma/seed.ts` atualizado com o seed de `error_log_retention_days = 180`.
- `scripts/phase31/test-schema.ts`: Teste automatizado criando, consultando e deletando registro de `SystemErrorLog` e validando `SystemSetting` executado com 100% de sucesso.
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).


## Definition of Done
- Prisma schema atualizado sem conflitos.
- Banco atualizado e Prisma client gerado com os novos modelos.
- TypeScript compilando com sucesso (`npx tsc --noEmit`).
- Teste pontual confirmando criação e leitura de registros nos novos modelos.
