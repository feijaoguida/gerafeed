# Task 026. Migrate Providers to Dynamic Prompt

## Status
DONE

## Objetivo
Migrar os 4 providers de IA para usar `buildSystemPrompt()` em vez da constante `SYSTEM_PROMPT_EDITORIAL`, e integrar o carregamento das configurações no fluxo de processamento de artigos.

## Contexto
A task 025 cria a função `buildSystemPrompt(settings?)` e a API de configuração. Esta task conecta tudo: faz os providers usarem a função dinâmica e faz o `processArticleWithAi` carregar as preferências do banco antes de chamar o provider.

## Escopo
- Adicionar campo opcional `promptSettings?: PromptSettings` na interface `GenerateArticleInput` em `src/lib/ai/types.ts`.
- Atualizar os 4 providers para usar `buildSystemPrompt(input.promptSettings)` no lugar de `SYSTEM_PROMPT_EDITORIAL`:
  - `src/lib/ai/providers/openai.ts`
  - `src/lib/ai/providers/gemini.ts`
  - `src/lib/ai/providers/anthropic.ts`
  - `src/lib/ai/providers/openai-compatible.ts`
- Atualizar `processArticleWithAi` em `src/lib/ai.ts`:
  - Carregar `aiPromptSettings` do banco via `getConfig<PromptSettings>("aiPromptSettings")`.
  - Repassar o `promptSettings` para `provider.generateArticle({ ..., promptSettings })`.
- Sem configuração salva no banco, o fluxo deve funcionar com os defaults (retrocompatível).

## Definition of Done
- [x] `GenerateArticleInput` inclui `promptSettings?: PromptSettings`.
- [x] OpenAI provider usa `buildSystemPrompt(input.promptSettings)`.
- [x] Gemini provider usa `buildSystemPrompt(input.promptSettings)`.
- [x] Anthropic provider usa `buildSystemPrompt(input.promptSettings)`.
- [x] OpenAI-Compatible provider usa `buildSystemPrompt(input.promptSettings)`.
- [x] `processArticleWithAi` carrega `aiPromptSettings` do banco e repassa ao provider.
- [x] Sem config no banco → processamento funciona com prompt padrão (retrocompatível).
- [x] Com config no banco → prompt reflete área e estilos escolhidos.
- [x] TypeScript PASS.
- [x] Lint PASS.

## Evidence
- `GenerateArticleInput` em `src/lib/ai/types.ts` atualizado com `promptSettings?: PromptSettings`.
- Os 4 providers (`openai.ts`, `gemini.ts`, `anthropic.ts`, `openai-compatible.ts`) migrados para chamar `buildSystemPrompt(input.promptSettings)`.
- `processArticleWithAi` em `src/lib/ai.ts` atualizado para carregar `aiPromptSettings` da tabela `Configuration` e injetar em `generateArticle`.
- Script de teste de integração `scripts/test-dynamic-prompt-migration.ts` executado com 100% de sucesso em servidor mock:
  - Validados os 4 provedores com e sem `promptSettings`.
  - Validado `processArticleWithAi` com banco limpo (prompt padrão) e com preferências customizadas (prompt dinâmico).
- `npx tsc --noEmit`: PASS
- `npm run lint`: PASS

## Discovered Work
Nenhum.

