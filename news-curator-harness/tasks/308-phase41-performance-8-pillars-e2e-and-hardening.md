# Task 308 — Suíte E2E de Auditoria dos 8 Pilares de Performance SaaS e Hardening Final

## Objetivo
Construir e executar uma suíte automatizada de ponta a ponta (`scripts/phase41/test-performance-8-pillars-e2e.ts`) que valide programaticamente o cumprimento dos **8 Pilares de Performance e Escalabilidade SaaS Multi-Tenant**, além de validar TypeScript estrito, ESLint, build de produção e atualizar `PROGRESS.md` e `MEMORY.md`.

## Escopo Técnico

### 1. Suíte Automatizada `scripts/phase41/test-performance-8-pillars-e2e.ts`
Validar com asserções estritas:
1. **Pilar 1 (Banco de Dados — Índices Compostos Multi-Tenant + Pool)**:
   - Verificar em `prisma/schema.prisma` e no catálogo `pg_indexes` do PostgreSQL a existência dos 14 novos índices compostos multi-tenant (`Source`, `Article`, `Product`, `ProductOffer`, `Invoice`, `SystemErrorLog`, `PlanHistory`).
   - Verificar Singleton e `idleTimeoutMillis: 15000` em `src/lib/prisma.ts`.
2. **Pilar 2 (Queries — Paginação, Seleção Explícita e Zero N+1)**:
   - Verificar limite máximo (`take <= 100`) e `select` explícito em `/api/articles` e `/api/billing/invoices`.
   - Verificar uso de `groupBy` em `/api/backoffice/companies` (sem `article.count` / `source.count` em loop).
   - Verificar `prisma.$transaction` em `syncWordPressCategories` e inclusão de `wordpressSiteSources` em `src/lib/rss.ts`.
3. **Pilar 3 (Assincronismo — Desacoplamento Pós-Resposta)**:
   - Verificar desacoplamento não-bloqueante de `markDependentArticlesForRepublish` em `src/lib/affiliate/offer-service.ts`.
4. **Pilar 4 (Integrações — Timeouts Estritos + `Promise.all`)**:
   - Verificar `AbortSignal.timeout` em `asaas.ts`, `wordpress.ts`, `woocommerce-publisher.ts`, provedores de IA (`openai.ts`, `gemini.ts`, `anthropic.ts`, `openai-compatible.ts`) e `openai-dalle.ts`, além de timeouts no `smtp-adapter.ts`.
   - Verificar paralelismo (`Promise.all` / `Promise.allSettled`) em `process-ai/route.ts`, `ai.ts`, `wordpress.ts`, `woocommerce-publisher.ts` e `refresh-service.ts`.
5. **Pilar 5 (IA — Streaming de Respostas / Progresso SSE)**:
   - Verificar suporte a `ReadableStream` e `text/event-stream` em `src/app/api/articles/[id]/process-ai/route.ts` e callbacks de progresso em `src/lib/ai.ts`.
6. **Pilar 6 (Frontend State — Deduplicação e Optimistic UI)**:
   - Verificar guarda de deduplicação `useRef` em `src/components/affiliate/affiliate-block-manager.tsx` e *Optimistic UI* em `src/components/affiliate/offer-list.tsx`.
7. **Pilar 7 (Inputs — Debounce em Buscas e Filtros)**:
   - Verificar `src/hooks/use-debounce.ts` e seu uso em `product-list.tsx`, `company-list.tsx`, `error-logs-viewer.tsx` e `rss-publishing-queue.tsx`.
8. **Pilar 8 (Infraestrutura e Rede — `next.config.ts`)**:
   - Verificar `compress: true`, `poweredByHeader: false`, `optimizePackageImports` e header `Cache-Control: public, max-age=31536000, immutable` para `/modified-images/:path*`.

### 2. Validação Global e Documentação
- Executar `npx tsx scripts/phase41/test-performance-8-pillars-e2e.ts`.
- Executar `npx tsc --noEmit`.
- Executar `npm run lint`.
- Executar `npm run build`.
- Atualizar `news-curator-harness/SPEC.md`, `news-curator-harness/PROGRESS.md` e `news-curator-harness/MEMORY.md` com as evidências verificáveis da Phase 41.

## Critérios de Aceite (Definition of Done)
- [ ] `npx tsx scripts/phase41/test-performance-8-pillars-e2e.ts`: PASS (8/8 Pilares `[CONFORME]`).
- [ ] `npx tsc --noEmit`: PASS (0 erros).
- [ ] `npm run lint`: PASS (0 erros).
- [ ] `npm run build`: PASS.
- [ ] `SPEC.md`, `PROGRESS.md` e `MEMORY.md` atualizados.

