# Task 269: Motor de Prompt Visual Contextualizado da Notícia

## Status
DONE

## Contexto
Criar o motor inteligente de engenharia de prompt para imagem em `src/lib/images/prompt-builder.ts`:
1. **Extração de Contexto**:
   - Analisar o título, o resumo e o conteúdo da notícia para identificar:
     - Personagens / figuras públicas / entidades relevantes.
     - Ação central e tema da matéria.
     - Cenário / ambiente / atmosfera do acontecimento.
     - Referência à foto de origem (se houver `originalImageUrl`).
2. **Mapeamento de Estilos Visuais**:
   - `REALISTIC`: "photorealistic, photojournalism style, natural lighting, high detail, 8k resolution, authentic news photography".
   - `CARTOON`: "vibrant 3D cartoon style, expressive characters, detailed animation background, warm cinematic lighting".
   - `DRAWING`: "artistic editorial illustration, hand-drawn vector elements, elegant textures, sophisticated color palette".
   - `SATIRICAL_CARTOON`: "editorial caricature cartoon, satirical political cartoon style, humorous exaggerated features, expressive newspaper editorial art".
   - `CUSTOM`: utiliza o estilo personalizado definido pelo usuário.
3. **Template de Prompt Flexível**:
   - Suporte a interpolação de variáveis: `{{title}}`, `{{characters}}`, `{{context}}`, `{{scene}}`, `{{style}}`.
   - Garantir que o prompt final gerado seja traduzido/estruturado em inglês fluente, pois modelos de difusão gráfica (DALL-E, Imagen, FLUX) possuem desempenho e fidelidade dramaticamente superiores com prompts em inglês.
   - Restrições éticas e de moderação para evitar termos banidos que causam rejeição em APIs de imagem.

## Critérios de Aceitação
- [x] Implementar `buildImagePrompt(input: ImagePromptInput): Promise<string>` em `src/lib/images/prompt-builder.ts`.
- [x] Mapear as diretrizes de estilo para os 5 estilos pré-definidos (`REALISTIC`, `CARTOON`, `DRAWING`, `SATIRICAL_CARTOON`, `CUSTOM`).
- [x] Extrair personagens, ação e cenário a partir do conteúdo do artigo.
- [x] Gerar prompt descritivo em inglês pronto para consumo pelos geradores de imagem.
- [x] Criar testes unitários em `scripts/phase33/test-prompt-builder.ts`.
- [x] `npx tsc --noEmit` PASS (0 erros).

## Evidências
- `src/lib/images/prompt-builder.ts`: Motor implementado com `extractKeyEntities`, `extractSceneContext` e `buildImagePrompt`.
- Suporte a interpolação de variáveis (`{{title}}`, `{{characters}}`, `{{context}}`, `{{scene}}`, `{{style}}`) com tradução e composição para inglês fluente.
- Aplicação de diretrizes universais de qualidade e moderação ("No text, no typography, no watermarks, no distorted faces").
- `scripts/phase33/test-prompt-builder.ts`: PASS (100% de sucesso testando extração de atores, cenários e todos os 5 estilos visuais).
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).

## Definition of Done
- Motor de prompt implementado com suporte a todos os estilos.
- Interpolação de contexto sem falhas.
- Testes cobrindo cada estilo visual.
- TypeScript sem erros.
