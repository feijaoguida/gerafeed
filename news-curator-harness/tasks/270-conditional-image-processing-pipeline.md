# Task 270: Pipeline Condicional de Processamento de Imagens e Endpoint Sob Demanda

## Status
DONE

## Contexto
Integrar a geração de imagem ao fluxo de notícias de forma estritamente condicional:
1. **Regra de Ouro (Zero Desperdício de Tokens)**:
   - Em `src/lib/ai.ts` (`processArticleWithAi` e `applyAiResultToArticle`), ler a estratégia ativa (`imageSettings.defaultStrategy`).
   - Se a estratégia for `ORIGINAL` ou `MODIFIED`, **NUNCA chamar a API de imagem por IA**.
   - Apenas se a estratégia for `AI_GENERATED`, sintetizar o prompt com `buildImagePrompt` e chamar `ImageGenerationService.generateImage()`.
   - Caso a geração de imagem falhe por qualquer motivo transitório (ex: limite de quota, erro da API do provedor), registrar o aviso sem travar o processamento textual do artigo (fallback gracioso com log e `selectedImage = "ORIGINAL"` ou `MODIFIED`).
2. **Endpoint de Geração Sob Demanda**:
   - Criar rota `POST /api/articles/[id]/generate-image` para permitir gerar ou regenerar a imagem por IA avulsa diretamente pelo editor de notícias, mesmo que o artigo tenha sido importado originalmente com outra estratégia.
   - O endpoint aceita opcionalmente override de `style` ou `customPrompt`.
   - Atualiza `Article.generatedImageUrl`, `Article.imagePrompt` e define `selectedImage = "AI_GENERATED"`.

## Critérios de Aceitação
- [x] Atualizar `src/lib/ai.ts` para verificar condicionalmente a estratégia de imagem.
- [x] Garantir que processamento com `ORIGINAL` ou `MODIFIED` não execute chamadas de API de imagem.
- [x] Criar endpoint `POST /api/articles/[id]/generate-image` com autenticação de sessão e tenant isolado.
- [x] Testar persistência de `generatedImageUrl`, `imagePrompt` e `selectedImage`.
- [x] Criar testes de validação em `scripts/phase33/test-conditional-pipeline.ts`.
- [x] `npx tsc --noEmit` PASS (0 erros).

## Evidências
- `src/lib/ai.ts`: `processArticleWithAi` e `applyAiResultToArticle` verificam `defaultStrategy === "AI_GENERATED"`. Para `ORIGINAL` ou `MODIFIED`, zero chamadas de IA de imagem ocorrem (Zero Token Waste).
- `src/app/api/articles/[id]/generate-image/route.ts`: Rota implementada com autenticação de sessão, isolamento por workspace, parâmetros opcionais de estilo/prompt e persistência em banco.
- `scripts/phase33/test-conditional-pipeline.ts`: 100% PASS validando estratégia ORIGINAL (0 chamadas), MODIFIED (0 chamadas), AI_GENERATED (prompt construído, adapter acionado com fallback gracioso e dados persistidos no Postgres).
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).

## Definition of Done
- Pipeline condicional implementado e validado.
- Endpoint sob demanda funcional.
- Zero consumo de tokens quando não solicitado.
- TypeScript sem erros.
