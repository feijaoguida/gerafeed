# Task 268: Serviço Central de Geração de Imagens e Adapters

## Status
DONE

## Contexto
Implementar o subsistema de geração de imagens com IA em `src/lib/images/` desacoplado por adapters:
1. Resolução de credenciais e provedor:
   - Se `useSameKeyAsTextAi === true`:
     - Se o provedor de texto for `openai` -> usa **OpenAI DALL-E 3** com a mesma API Key da LLM de texto.
     - Se o provedor de texto for `gemini` -> usa **Google Imagen 3** com a mesma API Key da LLM de texto.
     - Se o provedor de texto for `openai-compatible` (ex: OpenRouter) -> usa **FLUX.1 via OpenRouter** com a mesma API Key.
     - Se o provedor de texto for `anthropic` -> lança erro amigável se não houver chave dedicada de imagem configurada, pois Anthropic não tem gerador de imagens.
   - Se `useSameKeyAsTextAi === false`:
     - Utiliza a chave dedicada e provedor selecionado (`customApiKey` e `imageProvider`).
2. Adapters:
   - **OpenAI DALL-E 3 Adapter**: chamada via SDK oficial da OpenAI (`client.images.generate({ model: "dall-e-3", prompt, size: "1024x1024", quality: "standard" })`).
   - **Google Imagen 3 Adapter**: chamada REST para a API Google Generative Language (`models/imagen-3.0-generate-002:predict` ou endpoint equivalente).
   - **OpenRouter FLUX Adapter**: chamada REST para o endpoint do OpenRouter com o modelo `black-forest-labs/flux-1-schnell` ou `black-forest-labs/flux-1-dev`.
3. Padronização de Retorno:
   - O serviço baixa a imagem remota temporária e a converte em Data URI (`data:image/jpeg;base64,...` ou `data:image/png;base64,...`) para garantir persistência imutável e compatibilidade imediata com o WordPress e Vercel (sistema serverless read-only).

## Critérios de Aceitação
- [x] Criar contratos `ImageGeneratorProvider`, `GenerateImageInput`, `GeneratedImageResult` em `src/lib/images/types.ts`.
- [x] Implementar `resolveImageCredentials` em `src/lib/images/credentials.ts` com suporte à herança da LLM e chave dedicada.
- [x] Implementar `OpenAiDalleAdapter`, `GoogleImagenAdapter` e `OpenRouterFluxAdapter`.
- [x] Implementar `ImageGenerationService.generateImage()` unificado com timeout seguro e tratamento de erros.
- [x] Criar script de teste automatizado com mocks dos adapters em `scripts/phase33/test-image-adapters.ts`.
- [x] `npx tsc --noEmit` PASS (0 erros).

## Evidências
- `src/lib/images/credentials.ts`: Resolução de credenciais com detecção de herança (OpenAI -> DALL-E 3, Gemini -> Imagen 3, OpenRouter -> FLUX.1) e proteção amigável quando texto for Anthropic sem chave de imagem.
- `src/lib/images/adapters/openai-dalle.ts`: Adapter DALL-E 3 com retorno em Data URI (`b64_json` ou download seguro).
- `src/lib/images/adapters/gemini-imagen.ts`: Adapter Google Imagen 3 via endpoint REST oficial com conversão de `bytesBase64Encoded`.
- `src/lib/images/adapters/openrouter-flux.ts`: Adapter OpenRouter FLUX com timeout e download de buffer para Data URI imutável.
- `src/lib/images/service.ts`: `createImageGenerator` factory e `ImageGenerationService.generateImage` unificado.
- `scripts/phase33/test-image-adapters.ts`: PASS (100% dos 5 cenários aprovados, incluindo herança dos 3 provedores, disparo de erro no Anthropic e chave dedicada).
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).

## Definition of Done
- Provedores desacoplados implementados.
- Resolução de chaves transparente.
- Testes unitários com mocks passando 100%.
- TypeScript sem erros.
