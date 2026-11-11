# PLAN — Phase 41: Performance e Escalabilidade SaaS Multi-Tenant (Auditoria dos 8 Pilares)

## 1. Contexto e Objetivo
Após a conclusão da Auditoria de Segurança de 20 Pontos (Phase 40), foi conduzida uma varredura arquitetural completa no **News Curator / GeraFeed** avaliando os **8 Pilares de Performance e Escalabilidade de Sistemas SaaS Multi-Tenant** dentro da stack atual (**Next.js 16 App Router + React 19 + Prisma 7 (`@prisma/adapter-pg` / `pg.Pool`) + PostgreSQL**), respeitando integralmente as restrições do `AGENTS.md` (sem adição de NestJS, Redis, RabbitMQ, BullMQ, Docker, Cron ou microserviços).

O objetivo da **Phase 41** é remediar todos os pontos classificados como `❌ Crítico` e `⚠️ Parcial`, garantindo latência previsível, proteção contra exaustão de memória/conexões, eliminação de queries N+1, timeouts estritos em integrações externas, paralelismo com `Promise.all`, feedback em tempo real via Streaming SSE na geração de IA, *debounce* nas buscas e otimizações de empacotamento/cache no Next.js.

---

## 2. Mapeamento dos 8 Pilares para a Arquitetura

| # | Pilar | Status Inicial | Meta Phase 41 | Solução Arquitetural na Stack Atual |
|---|---|---|---|---|
| **1** | **Banco de Dados (Índices Compostos Multi-Tenant + Pool)** | ⚠️ Parcial | ✅ Conforme | Adição de 14 índices compostos multi-tenant em `prisma/schema.prisma` (`Source`, `Article`, `Product`, `ProductOffer`, `Invoice`, `SystemErrorLog`, `PlanHistory`) iniciando por `workspaceId` + colunas de filtro/ordenação; ajuste de `idleTimeoutMillis: 15000` no Singleton `pg.Pool` (`src/lib/prisma.ts`). |
| **2** | **Queries (Paginação + Seleção Explícita + Zero N+1)** | ❌ Crítico | ✅ Conforme | Limite máximo (`take`) e `select` explícito (omitindo HTML/texto pesado na listagem) em `/api/articles` e `/api/billing/invoices`; eliminação de N+1 em `/api/backoffice/companies` via `prisma.article.groupBy` e `prisma.source.groupBy`; batching com `prisma.$transaction` em `syncWordPressCategories`; inclusão de `wordpressSiteSources` em `processRssSources` (`src/lib/rss.ts`); limites de segurança em `analytics-service.ts` e filtro SQL prévio em `publication-sync.ts`. |
| **3** | **Assincronismo (Tarefas Lentas e Desacoplamento)** | ⚠️ Parcial | ✅ Conforme | Desacoplamento de tarefas secundárias pós-resposta (como `markDependentArticlesForRepublish` em `src/lib/affiliate/offer-service.ts` utilizando `after()` do `next/server` com fallback seguro) e paralelização do pipeline de IA + imagem Sharp em `src/lib/ai.ts`. |
| **4** | **Integrações (Timeouts Estritos + `Promise.all`)** | ❌ Crítico | ✅ Conforme | `AbortSignal.timeout(...)` explícito em todas as chamadas HTTP externas (`AsaasGateway`, `wordpress.ts`, `woocommerce-publisher.ts`, provedores de IA OpenAI/Gemini/Anthropic/OpenAI-Compatible, DALL-E e ViaCEP) e timeouts de socket no `SmtpAdapter`; paralelização com `Promise.all` / `Promise.allSettled` em tags/mídias WordPress e WooCommerce, checagens de limites diários/mensais e refresh de ofertas. |
| **5** | **IA (Streaming de Respostas / Progresso SSE)** | ⚠️ Parcial | ✅ Conforme | Suporte a Server-Sent Events (`ReadableStream` / `text/event-stream` via `?stream=1` ou header `Accept: text/event-stream`) em `POST /api/articles/[id]/process-ai`, emitindo eventos de progresso em tempo real (`scraping`, `generating_text`, `processing_image`, `saving`, `done`) e mantendo compatibilidade 100% JSON por padrão. |
| **6** | **Frontend State (Deduplicação, Skeletons e Optimistic UI)** | ⚠️ Parcial | ✅ Conforme | Eliminação do loop de re-fetch a cada tecla no `AffiliateBlockManager` usando `useRef<Set<string>>` para IDs já consultados; aplicação de *Optimistic UI* na exclusão de ofertas (`OfferList`) e atualização cirúrgica de estado no refresh de produto (`ProductList`). |
| **7** | **Inputs (Debounce em Buscas e Filtros)** | ❌ Crítico | ✅ Conforme | Criação do hook `useDebounce<T>(value, delay = 400)` em `src/hooks/use-debounce.ts` e aplicação nos campos de busca e filtros de `ProductList`, `CompanyList`, `ErrorLogsViewer` e `RssPublishingQueue`. |
| **8** | **Infraestrutura e Rede (Configuração Next.js)** | ⚠️ Parcial | ✅ Conforme | Configuração de `compress: true`, `poweredByHeader: false`, `experimental.optimizePackageImports` (`lucide-react`, `framer-motion`) e header `Cache-Control: public, max-age=31536000, immutable` para `/modified-images/:path*` em `next.config.ts`. |

---

## 3. Sequência de Tasks da Phase 41

1. **Task 303 (`tasks/303-multi-tenant-composite-indexes-and-pool.md`)**:
   - **Pilar 1**: Índices Compostos Multi-Tenant no `prisma/schema.prisma`, sincronização com o banco PostgreSQL (`npx prisma db push` e `npx prisma generate`) e otimização do Pool de Conexões (`src/lib/prisma.ts`).
2. **Task 304 (`tasks/304-queries-pagination-select-and-n-plus-1.md`)**:
   - **Pilar 2**: Paginação Obrigatória e `select` Explícito em `/api/articles` e `/api/billing/invoices`, Eliminação de Queries N+1 com `groupBy` em `/api/backoffice/companies`, Batch `$transaction` na Sincronização de Categorias WordPress e Otimização de Queries em `src/lib/rss.ts`, `src/lib/affiliate/analytics-service.ts` e `src/lib/publisher/publication-sync.ts`.
3. **Task 305 (`tasks/305-integrations-timeouts-parallelism-and-async.md`)**:
   - **Pilares 3 e 4**: Timeouts Estritos (`AbortSignal.timeout` e timeouts SMTP) em todas as integrações externas (`Asaas`, `WordPress`, `WooCommerce`, `OpenAI`, `Gemini`, `Anthropic`, `OpenAI-Compatible`, `DALL-E`, `ViaCEP`), Paralelismo com `Promise.all` / `Promise.allSettled` e Desacoplamento Assíncrono pós-resposta.
4. **Task 306 (`tasks/306-ai-streaming-progress-sse.md`)**:
   - **Pilar 5**: Streaming SSE (`ReadableStream` / `text/event-stream`) de etapas e progresso na rota `POST /api/articles/[id]/process-ai` e helper de consumo progressivo no cliente, preservando compatibilidade JSON.
5. **Task 307 (`tasks/307-frontend-debounce-optimistic-ui-and-next-config.md`)**:
   - **Pilares 6, 7 e 8**: Hook `useDebounce` aplicado em todas as buscas e filtros digitáveis (`ProductList`, `CompanyList`, `ErrorLogsViewer`, `RssPublishingQueue`), Deduplicação de chamadas no `AffiliateBlockManager`, *Optimistic UI* em `OfferList`/`ProductList` e Otimizações de Rede/Cache no `next.config.ts`.
6. **Task 308 (`tasks/308-phase41-performance-8-pillars-e2e-and-hardening.md`)**:
   - **Verificação E2E dos 8 Pilares**: Suíte automatizada `scripts/phase41/test-performance-8-pillars-e2e.ts` auditando os 8 pilares, `npx tsc --noEmit`, `npm run lint`, `npm run build` e atualização de `PROGRESS.md` e `MEMORY.md`.

---

## 4. Critérios Globais de Aceite (Definition of Done Phase 41)
- Todos os 8 Pilares de Performance e Escalabilidade SaaS classificados como `[CONFORME]` pela suíte automatizada `scripts/phase41/test-performance-8-pillars-e2e.ts`.
- Nenhuma regressão nos fluxos funcionais ou nos 20 pontos de segurança da Phase 40.
- `npx tsc --noEmit` passando com 0 erros.
- `npm run lint` passando com 0 erros.
- `npm run build` gerando todas as rotas com sucesso.

