# Task 200. Article Content Scraping and Enrichment

## Status
DONE

## Objetivo
Implementar a extração (scraping) do conteúdo completo das matérias originais a partir da URL do feed RSS, salvando no banco de dados e repassando o conteúdo enriquecido para os provedores de IA, garantindo matérias reescritas completas e de alta qualidade jornalística e SEO.

## Escopo
- Adicionar campo `originalContent` (String @db.Text) ao modelo `Article` no Prisma.
- Criar módulo `src/lib/scraper.ts` para buscar via fetch seguro e extrair o texto principal da página HTML da matéria original (com limpeza de scripts, tags e elementos secundários).
- Atualizar `src/lib/rss.ts` para executar a extração de conteúdo na coleta RSS (com fallback gracioso caso a página não permita scraping) e remover limite artificial de 1000 caracteres no snippet.
- Atualizar interfaces de IA (`GenerateArticleInput` em `src/lib/ai/types.ts`) e o fluxo de processamento (`src/lib/ai.ts`).
- Atualizar os provedores de IA (`OpenAIProvider`, `GeminiProvider`, `AnthropicProvider`, `OpenAICompatibleProvider`) para injetar `originalContent` no prompt quando disponível.
- Ajustar orientações no System Prompt para priorizar o conteúdo original completo quando fornecido.

## Fora do escopo
- Dependências pesadas como Puppeteer ou Chromium headless.
- Scraping de páginas protegidas por paywall rígido ou Cloudflare Turnstile avançado (fallback silencioso para descrição RSS).

## Definition of Done
- [x] Campo `originalContent` adicionado no schema e banco atualizado.
- [x] Módulo `src/lib/scraper.ts` implementado com sanitização, timeout e remoção de boilerplate HTML.
- [x] `src/lib/rss.ts` executa extração do conteúdo completo de cada nova notícia coletada.
- [x] `src/lib/ai.ts` e todos os providers (OpenAI, Gemini, Anthropic, OpenAI-Compatible) passam `originalContent` no user prompt.
- [x] `buildSystemPrompt` instrui o uso prioritário do conteúdo completo.
- [x] Script de teste ou validação executa extração real com sucesso (5.119 caracteres extraídos na matéria de teste).
- [x] `npx tsc --noEmit`: PASS.
- [x] `npm run lint`: PASS.
- [x] Evidências registradas em PROGRESS.md e neste arquivo.

## Evidence
- Campo `originalContent` adicionado ao model `Article` em `prisma/schema.prisma` e sincronizado via `npx prisma db push` e `npx prisma generate`.
- Módulo `src/lib/scraper.ts` criado com:
  - User-Agent realista e timeout seguro de 10s.
  - Limpeza profunda de HTML (scripts, estilos, SVG, noscript, iframes, nav, aside, header, footer).
  - Extração de containers prioritários (`<article>`, `<main>`, seletores de matéria ou fallback ao body).
  - Conversão em plaintext legível preservando estrutura e pontuação.
  - Limite de segurança de 15.000 caracteres para proteção de contexto de tokens.
  - Tratamento de erro 100% gracioso com retorno de `null` em falhas.
- `src/lib/rss.ts` atualizado para extrair e persistir `originalContent` de novos itens na ingestão e remoção da restrição de 1000 caracteres no snippet.
- `src/lib/ai.ts` atualizado para passar `originalContent` aos provedores e realizar scraping sob demanda caso uma notícia antiga ainda não tenha o conteúdo em cache.
- Provedores `OpenAIProvider`, `GeminiProvider`, `AnthropicProvider` e `OpenAICompatibleProvider` atualizados para incorporar o bloco `Conteúdo Completo da Matéria Original` no user prompt.
- `buildSystemPrompt` atualizado na seção 4 (Conteúdo) para instruir a estruturação rica com subtítulos `<h2>` e `<h3>`, números, especificações e declarações extraídas da matéria completa.
- Script de teste automatizado `scripts/test-article-content-scraping.ts` executado com 100% de sucesso (9 PASS, 0 FAIL), extraindo 5.119 caracteres da matéria real da Abril/Philco.
- Verificações técnicas:
  - `npx tsc --noEmit`: PASS
  - `npm run lint`: PASS (0 erros)
  - `npm run build`: PASS (compilação Turbopack de todas as 67 rotas com sucesso)
