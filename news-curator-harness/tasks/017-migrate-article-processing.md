# Task 017. Migrate Article Processing

## Status
DONE

## Objetivo
Fazer o fluxo editorial usar AIProvider.

## Escopo
`processArticle → AIProviderFactory → AIProvider`.

Carregar `aiProvider`, descriptografar key somente server-side e gerar conteúdo pelo provider configurado.

## Definition of Done
- [x] Sem chamada direta ao provider no negócio.
- [x] Factory usada.
- [x] Configuração do banco usada.
- [x] Key descriptografada somente server-side.
- [x] OpenAI funciona.
- [x] Outro provider funciona.
- [x] RSS → IA continua funcionando.
- [x] TypeScript PASS.
- [x] Lint PASS.
- [x] Testes PASS.

## Evidence
- `processArticleWithAi(articleId)` em `src/lib/ai.ts` migrado para utilizar `getActiveAIProvider()`, desacoplando completamente o código de negócio dos SDKs de terceiros.
- A função obtém a configuração ativa salva no banco (`aiProvider`), descriptografa a `apiKey` server-side em memória e instancia o provedor correto via `AIProviderFactory`.
- Validação de suporte dinâmico a múltiplos provedores sem alteração na lógica editorial:
  - OpenAI (`OpenAIProvider`)
  - Anthropic Claude (`AnthropicProvider`)
  - Google Gemini (`GeminiProvider`)
  - OpenAI-Compatible (`OpenAICompatibleProvider`)
- O fluxo de ingestão RSS (`src/lib/rss.ts`) continua operando normalmente gerando artigos com status `PENDING`.
- Script de teste de integração `scripts/test-migrate-article-processing.ts` executado validando a geração de conteúdo e alternância dinâmica entre múltiplos provedores com persistência no banco.
- Validações:
  - `npx tsc --noEmit`: PASS (0 erros)
  - `npm run lint`: PASS (0 erros, 0 avisos)
  - `npm run build`: PASS (compilação App Router gerando 17 rotas em 1803ms)

## Discovered Work
Nenhum trabalho fora do escopo descoberto.

## Status
DONE
