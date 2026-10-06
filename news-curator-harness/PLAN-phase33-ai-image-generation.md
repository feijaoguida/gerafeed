# Plano Phase 33 — Geração de Imagens com IA Baseada no Contexto da Notícia e Estratégia Visual

## Estado
Autorizada pelo usuário em 2026-10-06.
Em andamento: Task 267 TODO.

## Resultado esperado
Permitir que o usuário configure e utilize geração de novas imagens com inteligência artificial para as matérias coletadas via RSS, mantendo o controle total sobre custos e consumo de tokens:
1. **Preservação do Comportamento Atual**:
   - Manter as opções de Imagem Original e Imagem Invertida (via Sharp com flip horizontal e modulação).
2. **Nova Estratégia de Geração por IA (`AI_GENERATED`)**:
   - Geração de imagem contextualizada lendo os personagens da notícia, o contexto factual, o cenário e a imagem de origem.
   - Seleção de estilos visuais pré-definidos: **Realista** (fotojornalismo), **Cartoon** (3D/animação), **Desenho** (ilustração artística), **Sátira Cartoon** (charge/caricatura editorial) e **Personalizado** (prompt livre).
   - Template de prompt de imagem configurável pelo usuário.
3. **Herança Inteligente de Chaves da LLM**:
   - Se a LLM de texto ativa for **OpenAI**, herda a mesma chave e usa **OpenAI DALL-E 3**, com indicação visual clara e opção de informar chave separada se desejado.
   - Se a LLM de texto ativa for **Google Gemini**, herda a mesma chave e usa **Google Imagen 3**, com indicação visual clara e opção de chave separada.
   - Se a LLM de texto ativa for **OpenRouter / OpenAI-Compatible**, herda a mesma chave e usa **FLUX.1 (OpenRouter)**, com indicação visual clara e opção de chave separada.
   - Se a LLM de texto ativa for **Anthropic (Claude)**, nenhum provedor de imagem vem pré-selecionado e um tooltip/alerta explicativo orienta o usuário a configurar uma chave de API de imagem (OpenAI, Gemini ou OpenRouter), pois a Anthropic não gera imagens.
4. **Regra de Ouro (Consumo Condicional de Tokens)**:
   - A imagem por IA **só será gerada se a estratégia estiver configurada para `AI_GENERATED`** ou por solicitação manual explícita no editor. Notícias processadas com estratégia `ORIGINAL` ou `MODIFIED` não realizam chamadas à API de imagens.
5. **Revisão no Artigo e Publicação WordPress**:
   - O card de Mídia Destacada em `/articles/[id]` permite alternar entre **Original**, **Invertida** e **Gerada por IA**.
   - Botão avulso para gerar/regenerar a imagem por IA diretamente no editor do artigo.
   - Na publicação WordPress, a imagem selecionada (`AI_GENERATED`) é enviada à biblioteca de mídia do WordPress como imagem destacada (*Featured Media*).

## Fonte da verdade
- Requisitos: [SPEC.md, Phase 33](SPEC.md#phase-33-geração-de-imagens-com-ia-baseada-no-contexto-da-notícia-e-estratégia-visual).
- Regras de execução: [AGENTS.md](AGENTS.md).
- Status/evidências: [PROGRESS.md](PROGRESS.md).
- Decisões arquiteturais: [docs/decisions.md](docs/decisions.md), ADR-093.

## Sequência de execução

| Task | Entrega | Depende de |
|---|---|---|
| [267](tasks/267-image-strategy-schema-and-contracts.md) | Schema Prisma (`generatedImageUrl`, `imagePrompt`), contratos de configuração de imagem e herança de chave | Autorização |
| [268](tasks/268-image-generation-service-and-adapters.md) | Serviço central de imagens (`src/lib/images/`) com adapters para DALL-E 3, Google Imagen 3 e OpenRouter FLUX.1 | 267 |
| [269](tasks/269-context-aware-image-prompt-engine.md) | Motor de extração de contexto (personagens, cenário, notícia, foto de origem) e síntese de prompt visual | 268 |
| [270](tasks/270-conditional-image-processing-pipeline.md) | Processamento condicional no pipeline de IA (`src/lib/ai.ts`) e endpoint avulso de geração (`/api/articles/[id]/generate-image`) | 268, 269 |
| [271](tasks/271-image-strategy-settings-ui.md) | Interface em `/settings/images` com seletor de estilos, detecção de herança de chave da LLM e tooltip informativo para Anthropic | 267, 268 |
| [272](tasks/272-article-editor-wordpress-and-e2e.md) | Mídia destacada com 3 opções em `/articles/[id]`, botão de geração avulsa, envio de `AI_GENERATED` para o WordPress, testes E2E, tsc e build | 270, 271 |

## Estratégia de validação

| Área | Cenários essenciais |
|---|---|
| Schema & Migração | Campos `generatedImageUrl` e `imagePrompt` em `Article`, suporte a `selectedImage = "AI_GENERATED"`, migração sem perda de dados |
| Configuração & Herança | Herança automática de chaves (OpenAI, Gemini, OpenRouter), comportamento de aviso desmarcado para Anthropic, suporte a chave dedicada para imagens |
| Consumo Condicional | Execução com `ORIGINAL` e `MODIFIED` não chama provedor de imagem nem gera custo de tokens; execução com `AI_GENERATED` gera a imagem e grava prompt e URL |
| Síntese de Prompt | Prompt enriquecido com personagens, contexto, cenário e estilo selecionado (Realista, Cartoon, Desenho, Sátira Cartoon) |
| Interface & UX | Seleção de estilos com preview visual, indicação da chave ativa, feedback de carregamento no botão avulso do artigo |
| WordPress | Upload correto da imagem em formato Data URI / URL remota na API `/wp-json/wp/v2/media` com vinculação de `featured_media` |
| Não-regressão | TypeScript estrito (`tsc --noEmit`), lint sem erros, rotas e páginas existentes funcionando normalmente |
