# Task 014. AI Provider Abstraction

## Status
DONE

## Objetivo
Desacoplar o negócio dos fornecedores.

## Escopo
- `AIProvider`
- tipos compartilhados
- factory/registry
- OpenAI
- Gemini
- Anthropic
- OpenAI Compatible

## Definition of Done
- [x] Interface criada.
- [x] Factory criada.
- [x] OpenAI adapter.
- [x] Gemini adapter.
- [x] Anthropic adapter.
- [x] OpenAI Compatible adapter.
- [x] Output comum.
- [x] Negócio não importa SDK específico.
- [x] TypeScript PASS.
- [x] Lint PASS.
- [x] Testes PASS.

## Evidence
- Interface desacoplada `AIProvider` e tipos comuns em `src/lib/ai/types.ts`.
- Fábrica `createAIProvider` em `src/lib/ai/factory.ts`.
- Adaptadores individuais construídos em `src/lib/ai/providers/`:
  - `OpenAIProvider` (`openai.ts`)
  - `GeminiProvider` (`gemini.ts`)
  - `AnthropicProvider` (`anthropic.ts`)
  - `OpenAICompatibleProvider` (`openai-compatible.ts`)
- Padronização de retorno `GeneratedArticle`: todos os 4 provedores processam requisições e retornam a mesma estrutura com relevância, score, título, resumo, conteúdo HTML, categoria e metadados Yoast SEO.
- Script de testes `scripts/test-ai-providers.ts` executado com sucesso:
  - Instanciação de todos os provedores via fábrica validada.
  - Mock da REST API do Gemini, Anthropic e OpenAI-Compatible executado validando requisições, parsing JSON e testes de conexão (`testConnection`).
- Validações:
  - `npx tsc --noEmit`: PASS (0 erros)
  - `npm run lint`: PASS (0 erros, 0 avisos)
  - `npm run build`: PASS (compilação produção Next.js App Router em 206ms)

## Discovered Work
Nenhum trabalho fora do escopo descoberto.

## Status
DONE
