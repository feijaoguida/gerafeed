# Task 273: Contratos e Prompts dos 4 Níveis de Complemento de Matéria

## Status
DONE

## Contexto
Criar os contratos e o motor de prompts dedicados para os 4 níveis de complemento de matéria (`CompletionLevel`):
1. `FORMAT_ONLY` (**Formatar**): Não faz alteração no texto, somente formata, cria parágrafos etc. sem alterar o texto.
2. `LIGHT` (**Leve**): Faz a formatação, pequenas alterações dentro do estilo escolhido na configuração, e pode inserir pequenos trechos.
3. `MEDIUM` (**Média**): Faz a formatação, alterações mais pontuais dentro do estilo, podendo inserir trechos criados pela IA.
4. `LARGE` (**Grande**): Faz a formatação, alterações e complementação da matéria dentro do estilo, podendo inserir grandes partes de trechos criados pela IA.

## Critérios de Aceitação
- [x] Criar `src/lib/ai/manual-prompts.ts` com `CompletionLevel`, `COMPLETION_LEVEL_DEFINITIONS` e `buildManualArticlePrompts`.
- [x] Atualizar `GenerateArticleInput` e `buildArticlePrompts` em `src/lib/ai/types.ts` para suportar `completionLevel?: CompletionLevel`.
- [x] Atualizar `processArticleWithAi` em `src/lib/ai.ts` para suportar `completionLevel?: CompletionLevel`.
- [x] `npx tsc --noEmit` PASS.

## Evidências
- `src/lib/ai/manual-prompts.ts` criado com os 4 níveis (`FORMAT_ONLY`, `LIGHT`, `MEDIUM`, `LARGE`), `COMPLETION_LEVEL_DEFINITIONS`, `isValidCompletionLevel`, `buildManualSystemPrompt` e `buildManualArticlePrompts`.
- `src/lib/ai/types.ts`, `src/lib/ai/index.ts` e `src/lib/ai.ts` atualizados.
- `npx tsc --noEmit`: PASS (0 erros).
