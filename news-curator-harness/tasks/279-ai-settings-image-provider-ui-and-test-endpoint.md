# Task 279: Espaço de Configuração de IA de Imagens em `/settings/ai`, `/settings/images` e Endpoint de Teste

## Status
DONE

## Contexto
Criar na tela **Configurações de Inteligência Artificial** (`/settings/ai`) um espaço dedicado para configurar a **IA de Imagens**, sincronizado com `/api/images/config`, atualizar `/settings/images` com os novos provedores (`huggingface` e `pollinations`) e disponibilizar endpoint de teste de geração de imagem (`POST /api/images/test`).

1. **API `/api/images/config` (`src/app/api/images/config/route.ts`)**:
   - Aceitar `"huggingface"` e `"pollinations"` em `validProviders`.
   - Indicar se há chave configurada no banco ou via variável de ambiente (`HUGGINGFACE_API_KEY`).
2. **Endpoint de Teste `/api/images/test` (`src/app/api/images/test/route.ts`)**:
   - Rota autenticada por sessão/workspace (`getSessionWorkspaceId`) que testa a geração de uma imagem simples com o provedor de imagem configurado no workspace e retorna `{ success: true, provider, model, imageUrl, message }`.
3. **Tela `/settings/ai` (`src/app/(app)/settings/ai/page.tsx`)**:
   - Criada aba dedicada de **IA de Imagens (Hugging Face / DALL-E)** diretamente em `/settings/ai`:
     - Seleção do Provedor de Imagens (`huggingface`, `pollinations`, `openai`, `gemini`, `openrouter`).
     - Opção de herdar a mesma chave da IA de texto.
     - Campo de API Key com indicação de chave salva no banco ou `.env`.
     - Campo de modelo dinâmico com placeholder por provedor.
     - Estratégia de imagem padrão (`AI_GENERATED`, `ORIGINAL`, `MODIFIED`) e estilo visual.
     - Botão "Testar IA de Imagens" com preview imediato da imagem gerada.
4. **Tela `/settings/images` (`src/app/(app)/settings/images/page.tsx`)**:
   - Incluídas as opções **Hugging Face (FLUX.1 Schnell — Gratuito com Token HF)** e **Pollinations.ai (FLUX — Gratuito Sem Chave)** no seletor de provedores de imagem, com tratamento especial sem chave para Pollinations e botão de teste direto com preview.

## Critérios de Aceitação
- [x] Atualizar `src/app/api/images/config/route.ts` para suportar `huggingface` e `pollinations`.
- [x] Criar `src/app/api/images/test/route.ts` para testar o provedor de imagens ativo.
- [x] Atualizar `src/app/(app)/settings/ai/page.tsx` adicionando o espaço de configuração e teste da IA de Imagens.
- [x] Atualizar `src/app/(app)/settings/images/page.tsx` com as novas opções `huggingface` e `pollinations`.
- [x] Garantir que nenhuma chave de API seja exposta ao client.
- [x] `npx tsc --noEmit` e `npm run lint` PASS.

## Evidências
- `src/app/api/images/config/route.ts` atualizado para aceitar `huggingface` e `pollinations` em `validProviders` e retornar status de `isFromEnv` para `HUGGINGFACE_API_KEY`.
- `src/app/api/images/test/route.ts` criado chamando `ImageGenerationService.generateImage`.
- `src/app/(app)/settings/ai/page.tsx` atualizado com aba de IA de Imagens, formulário de credenciais, modelo, estratégias e botão de teste com preview.
- `src/app/(app)/settings/images/page.tsx` atualizado com `huggingface` e `pollinations`, sem chave exigida para Pollinations e botão de teste com preview.
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).
