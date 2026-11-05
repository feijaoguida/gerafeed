# Task 278: Contratos de Imagem, Adapters Hugging Face & Pollinations e Engenharia de Prompt

## Status
DONE

## Contexto
Adicionar suporte aos provedores gratuitos de geração de imagens **Hugging Face (`huggingface`)** e **Pollinations.ai (`pollinations`)** mantendo todos os provedores existentes (`openai`, `gemini`, `openrouter`), e incorporar as diretrizes de engenharia de prompt por estilo visual:
1. **`ImageProviderType` (`src/lib/images/types.ts`)**:
   - Expandido para `"openai" | "gemini" | "openrouter" | "huggingface" | "pollinations"`.
   - Enriquecido `IMAGE_STYLE_DEFINITIONS`:
     - `REALISTIC`: inclui termos de fotografia macro/fotojornalismo, lente 35mm, iluminação natural, câmera DSLR, 8k e detalhes de superfície/pele visíveis.
     - `CARTOON`: inclui termos de estilo animação 3D Pixar, cores vibrantes, renderização suave/argila e personagens expressivos.
     - `DRAWING`: inclui termos de estilo desenho animado 2D / ilustração editorial, traços limpos, ilustração vetorial e flat design.
2. **`HuggingFaceFluxAdapter` (`src/lib/images/adapters/huggingface-flux.ts`)**:
   - Modelo padrão: `black-forest-labs/FLUX.1-schnell`.
   - Suporte híbrido autenticado com `Authorization: Bearer ${this.apiKey}`:
     - Execução via API ZeroGPU/Gradio oficial do Hugging Face (`https://black-forest-labs-flux-1-schnell.hf.space/gradio_api/call/infer`) para geração gratuita com token `hf_...`.
     - Suporte ao endpoint `https://router.huggingface.co/hf-inference/models/${model}` para modelos hospedados no `hf-inference` ou contas com créditos/PRO, fazendo fallback automático para o Space ZeroGPU quando retornar `400`, `402` ou `410`.
   - Converte a imagem retornada para Data URI (`data:image/...;base64,...`).
3. **`PollinationsFluxAdapter` (`src/lib/images/adapters/pollinations-flux.ts`)**:
   - Modelo padrão: `flux`.
   - Faz requisição para `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=${model}&width=1024&height=1024&nologo=true` (não exige chave de API) e converte o buffer retornado em Data URI.
4. **Resolução de Credenciais e Serviço (`src/lib/images/credentials.ts` e `src/lib/images/service.ts`)**:
   - Em `resolveImageCredentials`:
     - Se `provider === "pollinations"`, retorna credenciais válidas mesmo sem chave de API.
     - Se `provider === "huggingface"`, utiliza `customApiKey` descriptografada ou fallback `process.env.HUGGINGFACE_API_KEY`.
   - Em `createImageGenerator`: instanciados `HuggingFaceFluxAdapter` e `PollinationsFluxAdapter`.

## Critérios de Aceitação
- [x] Atualizar `src/lib/images/types.ts` com `"huggingface"` e `"pollinations"` em `ImageProviderType` e aprimorar `IMAGE_STYLE_DEFINITIONS`.
- [x] Criar `src/lib/images/adapters/huggingface-flux.ts` implementando `HuggingFaceFluxAdapter`.
- [x] Criar `src/lib/images/adapters/pollinations-flux.ts` implementando `PollinationsFluxAdapter`.
- [x] Atualizar `src/lib/images/credentials.ts`, `src/lib/images/service.ts` e `src/lib/images/index.ts`.
- [x] Preservar intactos os adapters `OpenAiDalleAdapter`, `GoogleImagenAdapter` e `OpenRouterFluxAdapter`.
- [x] `npx tsc --noEmit` PASS.

## Evidências
- `src/lib/images/types.ts` atualizado com `"huggingface" | "pollinations"` e descritores aprimorados para `REALISTIC`, `CARTOON` e `DRAWING`.
- `src/lib/images/adapters/huggingface-flux.ts` criado com fallback híbrido (ZeroGPU Space + Router API) e retorno em Data URI.
- `src/lib/images/adapters/pollinations-flux.ts` criado com suporte sem chave e retorno em Data URI.
- `src/lib/images/credentials.ts` e `src/lib/images/service.ts` atualizados com resolução de credenciais para Hugging Face e Pollinations.
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).
