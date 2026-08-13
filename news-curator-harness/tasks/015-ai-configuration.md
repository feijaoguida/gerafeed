# Task 015. AI Configuration

## Status
DONE

## Objetivo
Criar tela visual para IA.

## Campos
- Provider
- API Key
- Base URL quando aplicável
- Model

## Definition of Done
- [x] Tela criada.
- [x] OpenAI selecionável.
- [x] Gemini selecionável.
- [x] Anthropic selecionável.
- [x] OpenAI Compatible selecionável.
- [x] Base URL condicional.
- [x] API Key criptografada.
- [x] Model salvo.
- [x] Configuração `aiProvider`.
- [x] Secret não retorna ao client.
- [x] TypeScript PASS.
- [x] Lint PASS.
- [x] Testes PASS.

## Evidence
- Interface visual de configuração implementada em `src/app/settings/ai/page.tsx` permitindo seleção entre OpenAI, Google Gemini, Anthropic Claude e OpenAI-Compatible.
- Endpoints de API `GET` e `POST` criados em `src/app/api/ai/config/route.ts`:
  - `GET /api/ai/config`: Retorna `provider`, `model`, `baseUrl` e flags de status (`isConfigured`, `hasApiKey`, `isFromEnv`), garantindo que nenhuma chave de API seja exposta.
  - `POST /api/ai/config`: Criptografa a `apiKey` via AES-256-GCM (`v1:iv:ciphertext:tag`) e salva sob a chave `aiProvider` na tabela `Configuration` no banco de dados.
- Formulário inteligente com campo condicional para `baseUrl` e placeholders dinâmicos por modelo (`gpt-4o-mini`, `gemini-1.5-flash`, `claude-3-5-haiku-20241022`, `deepseek-chat`).
- Script de teste de integração `scripts/test-ai-config.ts` executado validando a gravação cifrada e descriptografia em memória para os 4 provedores.
- Validações:
  - `npx tsc --noEmit`: PASS (0 erros)
  - `npm run lint`: PASS (0 erros, 0 avisos)
  - `npm run build`: PASS (compilação App Router gerando 16 rotas em 223ms)

## Discovered Work
Nenhum trabalho fora do escopo descoberto.

## Status
DONE
