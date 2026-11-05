# Plano Phase 36 — Geração de Imagens com IA Gratuita (Hugging Face & Pollinations.ai), Configuração em `/settings/ai` e Seed

## Estado
Planejado em 2026-11-04.
Aguardando autorização do usuário para início da execução (Task 278 TODO).

## Resultado esperado
Permitir o uso de modelos gratuitos de geração de imagens com IA (**Hugging Face** e **Pollinations.ai**), mantendo todos os provedores já existentes (**OpenAI DALL-E 3**, **Google Gemini Imagen 3** e **OpenRouter FLUX**), disponibilizando um espaço dedicado para configurar a IA de Imagens dentro da tela de Configurações de IA (`/settings/ai`) e já deixando a chave do Hugging Face configurada automaticamente através do `prisma/seed.ts`.

### Validação Técnica de Gratuidade (Executada em 2026-11-04)
1. **Token Hugging Face (`HUGGINGFACE_API_KEY`)**:
   - Validado via `/api/whoami-v2` (usuário `feijaoguida`, token `gerafeed`, permissões `inference.serverless.write` e `inference.endpoints.infer.write`).
2. **Modelo `Freepik/flux.1-lite-8B`**:
   - O repositório `Freepik/flux.1-lite-8B` possui `inferenceProviderMapping: {}` no Hugging Face (apenas pesos para download local; retorna `HTTP 400: Model not supported by provider hf-inference` na API serverless), e o Space oficial `Freepik/F-Lite` está `PAUSED`.
3. **Execução Gratuita Funcional no Hugging Face com a Chave `hf_...`**:
   - O modelo oficial **`black-forest-labs/FLUX.1-schnell`** via API ZeroGPU/Gradio do Hugging Face (`https://black-forest-labs-flux-1-schnell.hf.space/gradio_api/call/infer`) autenticado com `Authorization: Bearer hf_...` gera imagens `1024x1024` gratuitamente em ~6 segundos usando a cota gratuita da conta Hugging Face.
   - O adapter também suportará `https://router.huggingface.co/hf-inference/models/{model}` para contas PRO/créditos ou modelos compatíveis com `hf-inference`.
4. **Pollinations.ai (`model=flux`)**:
   - O endpoint `https://image.pollinations.ai/prompt/{prompt}?model=flux&width=1024&height=1024&nologo=true` foi validado com sucesso (`HTTP 200 image/jpeg`), gerando imagens gratuitamente sem exigir chave ou cadastro.

## Fonte da verdade
- Requisitos: [SPEC.md, Phase 36](SPEC.md#phase-36-geração-de-imagens-com-ia-gratuita-hugging-face--pollinationsai-configuração-em-settingsai-e-seed).
- Regras de execução: [AGENTS.md](AGENTS.md).
- Status/evidências: [PROGRESS.md](PROGRESS.md).
- Decisões arquiteturais: [docs/decisions.md](docs/decisions.md), ADR-094.

## Sequência de execução

| Task | Entrega | Depende de |
|---|---|---|
| [278](tasks/278-huggingface-and-pollinations-image-adapters.md) | Contratos `ImageProviderType` (`huggingface`, `pollinations`), `HuggingFaceFluxAdapter`, `PollinationsFluxAdapter`, resolução de credenciais e melhorias de Engenharia de Prompt por estilo em `src/lib/images/` | Autorização |
| [279](tasks/279-ai-settings-image-provider-ui-and-test-endpoint.md) | Espaço de configuração da IA de Imagens na tela `/settings/ai`, atualização de `/settings/images`, `/api/images/config` e criação do endpoint `/api/images/test` | 278 |
| [280](tasks/280-seed-huggingface-image-key-and-env.md) | Configuração da chave `HUGGINGFACE_API_KEY` em `.env`, `.env.example` e `prisma/seed.ts` (criptografada com AES-256-GCM em `imageSettings`) | 278, 279 |
| [281](tasks/281-phase36-e2e-tests-and-security-audit.md) | Testes E2E (`scripts/phase36/test-huggingface-image-e2e.ts`), Automated Security Check (`run-security-scanner`), `npx tsc --noEmit`, `npm run lint` e `npm run build` | 278, 279, 280 |

## Estratégia de validação e Segurança

| Área | Cenários essenciais |
|---|---|
| Adapters Gratuitos | `HuggingFaceFluxAdapter` gerando imagem Data URI via ZeroGPU (`FLUX.1-schnell`) e `router.huggingface.co`; `PollinationsFluxAdapter` gerando imagem Data URI sem chave |
| Preservação de Provedores | `OpenAiDalleAdapter`, `GoogleImagenAdapter` e `OpenRouterFluxAdapter` funcionando sem regressão |
| Engenharia de Prompt | Estilos `REALISTIC`, `CARTOON` e `DRAWING` enriquecidos com descritores fotográficos (lente 35mm, DSLR, 8k) e artísticos (2D vetorial, 3D Pixar) |
| Interface `/settings/ai` e `/settings/images` | Configuração de provedor de imagem, chave dedicada, modelo, estratégia e botão de teste direto em `/settings/ai` |
| Seed & Criptografia | `prisma/seed.ts` grava `imageSettings` com `imageProvider: "huggingface"` e `customApiKey` criptografada via AES-256-GCM; chave nunca vaza para o client |
| Automated Security Check | Execução do `run-security-scanner` em todos os arquivos criados/modificados e geração do relatório de auditoria (`generate-security-audit-report`) |
| Não-regressão | `npx tsc --noEmit` PASS, `npm run lint` PASS, `npm run build` PASS |
