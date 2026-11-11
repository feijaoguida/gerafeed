# Task 306 — Streaming SSE de Progresso e Respostas de IA (Pilar 5)

## Objetivo
Implementar suporte a Streaming via Server-Sent Events (`ReadableStream` / `text/event-stream`) no fluxo de processamento de artigos com IA (`POST /api/articles/[id]/process-ai` e `src/lib/ai.ts`) para fornecer feedback progressivo em tempo real ao usuário durante etapas longas (extração de conteúdo, geração textual no LLM, processamento de imagem e persistência), mantendo 100% de compatibilidade com chamadas JSON tradicionais.

## Escopo Técnico

### 1. Callback de Progresso em `processArticleWithAi` (`src/lib/ai.ts`)
- Estender `processArticleWithAi(articleId: string, workspaceId?: string, onProgress?: (event: AiProgressEvent) => void)` onde `AiProgressEvent` informa `{ step: "loading" | "scraping" | "generating" | "saving" | "done" | "error", progress: number, message: string, article?: unknown }`.
- Emitir eventos em cada transição real do pipeline:
  1. `loading` (`10%`): Carregando configurações de prompt, categorias e provedor de IA.
  2. `scraping` (`30%`): Extraindo texto completo da matéria original quando necessário.
  3. `generating` (`60%`): Reescrevendo matéria com IA e processando imagem de capa em paralelo.
  4. `saving` (`85%`): Salvando artigo processado no banco de dados.
  5. `done` (`100%`): Artigo processado com sucesso.

### 2. Suporte a `ReadableStream` (`text/event-stream`) em `POST /api/articles/[id]/process-ai` (`src/app/api/articles/[id]/process-ai/route.ts`)
- Detectar se o cliente solicitou streaming via query param `?stream=1` ou header `Accept: text/event-stream`.
- Quando em modo streaming:
  - Retornar `new Response(stream, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" } })`.
  - Enviar eventos formatados como `data: ${JSON.stringify(event)}\n\n` a cada etapa do `onProgress`, encerrando o stream no evento `done` (com o `article` completo) ou `error`.
- Quando chamado sem `?stream=1` / `Accept: text/event-stream`:
  - Manter exatamente o retorno `NextResponse.json(article)` atual para não quebrar chamadas legadas ou scripts existentes.

## Critérios de Aceite (Definition of Done)
- [ ] `processArticleWithAi` emite eventos estruturados de progresso em cada fase do pipeline.
- [ ] `POST /api/articles/[id]/process-ai?stream=1` (ou `Accept: text/event-stream`) responde com `ReadableStream` (`Content-Type: text/event-stream`) transmitindo eventos em tempo real.
- [ ] Chamadas padrão `POST /api/articles/[id]/process-ai` continuam retornando JSON idêntico ao comportamento anterior.
- [ ] `npx tsc --noEmit` e `npm run lint` passando sem erros.

