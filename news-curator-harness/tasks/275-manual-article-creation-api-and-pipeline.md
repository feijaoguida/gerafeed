# Task 275: API de Criação Manual de Matéria e Pipeline de IA

## Status
DONE

## Contexto
Criar o endpoint `POST /api/articles/manual` para criação de matérias com base em texto, pedaços de texto, ideias de pauta ou entrevistas, suportando os 4 níveis de complemento, envio de fotos (capa e corpo) e criação de foto através da matéria com IA.

## Critérios de Aceitação
- [x] Criar `src/app/api/articles/manual/route.ts` com validação multi-tenant, verificação de limites (`BillingService`), processamento com IA no `completionLevel` escolhido, inserção de fotos no corpo da matéria e geração opcional de foto com IA.
- [x] Atualizar `src/app/api/articles/[id]/process-ai/route.ts` para aceitar `completionLevel` ao reprocessar uma matéria existente.
- [x] `npx tsc --noEmit` PASS.

## Evidências
- `src/app/api/articles/manual/route.ts` criado suportando `completionLevel` (`FORMAT_ONLY`, `LIGHT`, `MEDIUM`, `LARGE`), `coverImage`, `bodyImages` (com distribuição automática entre os parágrafos), `generateAiImage`, `imageStyle`, `customImageStyle`, `customImagePrompt` e `insertAiImageInBody`.
- `src/app/api/articles/[id]/process-ai/route.ts` atualizado para repassar `completionLevel` a `processArticleWithAi`.
- `npx tsc --noEmit`: PASS (0 erros).
