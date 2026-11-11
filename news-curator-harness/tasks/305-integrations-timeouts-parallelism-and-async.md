# Task 305 — Timeouts Estritos, Paralelismo com `Promise.all` e Desacoplamento Assíncrono (Pilares 3 e 4)

## Objetivo
Garantir que todas as integrações externas (Asaas, WordPress, WooCommerce, provedores de IA, DALL-E, SMTP e ViaCEP) possuam timeouts explícitos para evitar travamento em cascata de workers Node.js, paralelizar chamadas independentes com `Promise.all` / `Promise.allSettled` e desacoplar efeitos colaterais lentos pós-resposta.

## Escopo Técnico

### 1. Timeouts Estritos em Clientes HTTP e SMTP (Pilar 4)
- **Asaas (`src/lib/payments/asaas.ts`)**:
  - Adicionar `signal: AbortSignal.timeout(15000)` em todas as chamadas `fetch` para a API do Asaas (`findOrCreateCustomer`, `createCreditCardSubscription`, `createPixOrBoletoSubscription`, `getSubscriptionPayments`, `getPixQrCode`, `cancelSubscription`, `updateSubscription`, `updateSubscriptionCreditCard`, `syncWorkspaceSubscription`).
- **WordPress (`src/lib/wordpress.ts`)**:
  - Adicionar `signal: AbortSignal.timeout(15000)` nas requisições REST de teste, categorias, tags e posts, e `signal: AbortSignal.timeout(25000)` no upload binário de mídia (`uploadMediaToWordPress`).
- **WooCommerce (`src/lib/affiliate/woocommerce-publisher.ts`)**:
  - Adicionar `signal: AbortSignal.timeout(20000)` em todas as chamadas REST do WooCommerce e upload de mídia WordPress.
- **Provedores de IA e Imagens (`src/lib/ai/providers/openai.ts`, `gemini.ts`, `anthropic.ts`, `openai-compatible.ts` e `src/lib/images/adapters/openai-dalle.ts`)**:
  - Adicionar `signal: AbortSignal.timeout(10000)` nos métodos `testConnection()` e `signal: AbortSignal.timeout(45000)` nos métodos `generateArticle()`, `generate()` e geração de imagem DALL-E.
- **SMTP (`src/lib/mail/adapters/smtp-adapter.ts`)**:
  - Configurar `connectionTimeout: 10000`, `greetingTimeout: 10000` e `socketTimeout: 15000` no `nodemailer.createTransport`.

### 2. Paralelismo com `Promise.all` e `Promise.allSettled` (Pilar 4)
- **`src/app/api/articles/[id]/process-ai/route.ts`**:
  - Executar `LimitControlService.checkLimit(workspaceId, "ARTICLES_DAILY")` e `LimitControlService.checkLimit(workspaceId, "ARTICLES")` em paralelo via `Promise.all`.
- **`src/lib/ai.ts` (`processArticleWithAi`)**:
  - Carregar `prisma.wordPressCategory.findMany`, `prisma.aiPromptSettings.findFirst`, `prisma.imageSettings.findFirst` e `getActiveAIProvider(article.workspaceId)` em paralelo com `Promise.all`.
  - Executar o processamento da imagem de capa (`processAndStoreImage` / `generateAndStoreAiImage`) em paralelo com a geração textual do artigo (`provider.generateArticle(...)`) via `Promise.all`.
- **`src/lib/wordpress.ts`**:
  - Em `getOrCreateWordPressTagIds`: resolver as tags com `Promise.all` em vez de `for...of` sequencial.
  - Em `publishArticleToWordPress`: executar `uploadMediaToWordPress` e `getOrCreateWordPressTagIds` em paralelo com `Promise.all`.
- **`src/lib/affiliate/woocommerce-publisher.ts`**:
  - Paralelizar o upload das imagens da galeria (`imagesToUpload.slice(0, 5)`) usando `Promise.all`.
- **`src/lib/affiliate/refresh-service.ts` (`refreshProduct`)**:
  - Substituir o loop `for (const offer of product.offers)` sequencial por `Promise.allSettled(product.offers.map(...))`, reduzindo o tempo total de refresh de $N \times T$ para $\max(T)$.

### 3. Desacoplamento Assíncrono Pós-Resposta (Pilar 3)
- **`src/lib/affiliate/offer-service.ts`**:
  - Nas operações `createOffer`, `updateOffer` e `deleteOffer`, agendar `markDependentArticlesForRepublish` de forma não-bloqueante utilizando `after()` do `next/server` (com fallback assíncrono seguro `Promise.resolve().then(...).catch(...)` quando executado fora de um contexto de request do Next.js, como em scripts de teste).

## Critérios de Aceite (Definition of Done)
- [ ] Todas as chamadas `fetch` em `asaas.ts`, `wordpress.ts`, `woocommerce-publisher.ts`, provedores de IA e DALL-E possuem `AbortSignal.timeout`.
- [ ] `SmtpAdapter` configurado com `connectionTimeout`, `greetingTimeout` e `socketTimeout`.
- [ ] Operações independentes em `process-ai/route.ts`, `ai.ts`, `wordpress.ts`, `woocommerce-publisher.ts` e `refresh-service.ts` paralelizadas com `Promise.all` / `Promise.allSettled`.
- [ ] `offer-service.ts` desacoplado para não bloquear a resposta HTTP na varredura de artigos dependentes.
- [ ] `npx tsc --noEmit` e `npm run lint` passando sem erros.

