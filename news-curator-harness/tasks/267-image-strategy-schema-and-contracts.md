# Task 267: Schema Prisma e Contratos de Estratégia de Imagem com IA

## Status
DONE

## Contexto
Expandir o modelo de dados e os contratos de configuração para suportar a geração de novas imagens com IA no GeraFeed:
1. No modelo `Article` do Prisma, adicionar os campos `generatedImageUrl` (URL ou Data URI da imagem gerada) e `imagePrompt` (prompt descritivo em inglês utilizado na geração).
2. O campo existente `selectedImage` deve aceitar além de `ORIGINAL` e `MODIFIED`, o novo valor `AI_GENERATED`.
3. Nos contratos de configuração de imagem (`ImageSettings`), suportar:
   - `defaultStrategy: "ORIGINAL" | "MODIFIED" | "AI_GENERATED"`
   - `imageStyle: "REALISTIC" | "CARTOON" | "DRAWING" | "SATIRICAL_CARTOON" | "CUSTOM"`
   - `customImageStyle?: string`
   - `imagePromptTemplate?: string`
   - `imageProvider?: "openai" | "gemini" | "openrouter"`
   - `useSameKeyAsTextAi: boolean` (padrão `true` para OpenAI, Gemini e OpenRouter, `false` para Anthropic)
   - `customApiKey?: string` (criptografada no banco se informada)
   - `customModel?: string`
4. Atualizar a rota de configuração `POST /api/images/config` e `GET /api/images/config` para validar e persistir esses campos de forma multi-tenant (`workspaceId`).

## Critérios de Aceitação
- [x] Adicionar campos `generatedImageUrl String?` e `imagePrompt String?` no model `Article` em `prisma/schema.prisma`.
- [x] Executar `npx prisma generate` e criar migração / sincronização no banco PostgreSQL (`npx prisma db push` concluído em 241ms).
- [x] Definir interfaces TypeScript estritas para `ImageSettingsStored`, `ImageStyle`, `ImageStrategy` e `ImageProviderType` em `src/lib/images/types.ts`.
- [x] Atualizar endpoint `GET /api/images/config` para retornar a configuração persistida com defaults seguros e indicação do provedor de texto ativo (`textAiContext`).
- [x] Atualizar endpoint `POST /api/images/config` para validar payload, sanitizar valores e salvar no banco com `setConfig`.
- [x] Criar script de validação de schema e contratos em `scripts/phase33/test-schema-contracts.ts`.
- [x] `npx tsc --noEmit` PASS (0 erros).

## Evidências
- `prisma/schema.prisma`: Adicionados `generatedImageUrl String?` e `imagePrompt String?` em `Article`.
- `npx prisma db push`: Sincronizado com sucesso em PostgreSQL local sem perda de dados.
- `npx prisma generate`: Tipos do Prisma Client v7.9.1 gerados e atualizados.
- `src/lib/images/types.ts`: Criados tipos estritos `ImageStrategy`, `ImageStyle`, `ImageProviderType`, `ImageSettingsStored`, `IMAGE_STYLE_DEFINITIONS` e defaults seguros.
- `src/app/api/images/config/route.ts`: Implementados endpoints `GET` (com contexto da LLM ativa, detecção de herança e indicação Anthropic) e `POST` (com validação e criptografia AES).
- `scripts/phase33/test-schema-contracts.ts`: 100% dos testes aprovados:
  - Criação de artigo com `generatedImageUrl`, `imagePrompt` e `selectedImage = "AI_GENERATED"`.
  - Persistência e leitura multi-tenant de `imageSettings`.
  - Mapeamento completo dos 5 estilos visuais.
  - Limpeza automática de fixtures de teste.
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).

## Definition of Done
- Schema Prisma atualizado e migrado.
- Contratos tipados sem `any`.
- Teste automatizado aprovado.
- TypeScript sem erros.
