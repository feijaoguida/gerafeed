# MEMORY.md. Memória Permanente

## Banco de dados e Modelagem SaaS
- PostgreSQL + Prisma.
- `User`: Possui flag `isSuperAdmin Boolean @default(false)` (Phase 9).
- `Workspace`: Possui status de atividade (`isActive Boolean @default(true)`) (Phase 9).
- `WordPressSite`: Nova tabela (Phase 8). Representa a conexão com um site WP específico.
  Campos: `id`, `workspaceId`, `name`, `url`, `username`, `applicationPassword` (criptografada), `promptSettings` (JSON opcional).
- `Source` (Feeds): Pertence a um `Workspace` e pode estar vinculado a um `WordPressSite` (`wordPressSiteId String?`).
- Isolamento por Workspace mantido firmemente.

## Configuração de AI / Prompts
- O Prompt Editorial pode ser definido globalmente no Workspace (`Configuration.aiPromptSettings`) E/OU localmente no `WordPressSite.promptSettings`. O prompt do site específico, se existir, tem prioridade sobre o global na reescrita IA.

## Backoffice
- Rotas sob `/admin` são estritamente para `isSuperAdmin`.
- O Backoffice não vaza para a experiência do usuário final no `/dashboard`.
- "Impersonation" / Edição Remota: O Super Admin edita dados passando o `workspaceId` explicitamente para os controllers/actions.
