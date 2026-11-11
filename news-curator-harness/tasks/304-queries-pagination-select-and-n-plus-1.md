# Task 304 — Paginação Obrigatória, Seleção Explícita e Eliminação de Queries N+1 (Pilar 2)

## Objetivo
Eliminar retornos de listas sem limite máximo (`take`), remover projeções implícitas de colunas pesadas (`SELECT *` trazendo HTML/JSON completo sem necessidade) em rotas de listagem e substituir queries executadas dentro de loops (problema de N+1) por agregações em lote (`groupBy`, `include` e `prisma.$transaction`).

## Escopo Técnico

### 1. Listagem de Artigos (`src/app/api/articles/route.ts`)
- Suportar parâmetros de paginação `page` (default `1`), `limit` (default `50`, máximo travado em `100`: `Math.min(100, Math.max(1, Number(limit) || 50))`).
- Aplicar `take: limit` e `skip: (page - 1) * limit` na query `prisma.article.findMany`.
- Substituir o `include` aberto por um `select` explícito na listagem que traga todos os metadados necessários para a fila de curadoria e cards da UI (`id`, `workspaceId`, `sourceId`, `wordpressSiteId`, `title`, `originalTitle`, `originalUrl`, `excerpt`, `featuredImageUrl`, `processedImageUrl`, `status`, `wordpressPostId`, `wordpressPostUrl`, `wordpressCategoryIds`, `tags`, `errorMessage`, `originalPublishedAt`, `processedAt`, `publishedAt`, `createdAt`, `updatedAt`, `source: { select: { id: true, name: true } }`, `wordpressSite: { select: { id: true, name: true, baseUrl: true } }`), omitindo colunas de texto pesado (`originalContent`, `content`, `canonicalContent`) a menos que `?includeContent=true` seja solicitado explicitamente.
- Manter compatibilidade total com clientes existentes: retornar o array de artigos por padrão (ou `{ articles, pagination }` quando `?paginated=true`).

### 2. Listagem de Faturas (`src/app/api/billing/invoices/route.ts`)
- Adicionar limite seguro `take: Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50))` em `prisma.invoice.findMany`.

### 3. Eliminação de N+1 no Backoffice de Empresas (`src/app/api/backoffice/companies/route.ts`)
- Travar `pageSize` com limite máximo (`Math.min(50, Math.max(1, Number(searchParams.get("pageSize")) || 20))`).
- Substituir o loop `Promise.all(workspaces.map(async (ws) => { prisma.article.count(...); prisma.source.count(...); }))` por duas consultas agregadas em lote (`prisma.article.groupBy({ by: ["workspaceId"], where: { workspaceId: { in: workspaceIds }, processedAt: { gte: startOfMonth } }, _count: { _all: true } })` e `prisma.source.groupBy({ by: ["workspaceId"], where: { workspaceId: { in: workspaceIds }, active: true }, _count: { _all: true } })`), reduzindo de $2N + 2$ queries para exatamente 4 queries independentemente do tamanho da página.

### 4. Eliminação de N+1 na Coleta RSS (`src/lib/rss.ts`)
- Em `processRssSources`: incluir `wordpressSiteSources: { orderBy: { createdAt: "asc" }, take: 1, select: { wordpressSiteId: true } }` diretamente no `prisma.source.findMany` inicial, eliminando a query `prisma.wordPressSiteSource.findFirst` dentro do loop de fontes.
- Filtrar `existingArticles` por `workspaceId: source.workspaceId` além de `originalUrl: { in: urls }`.

### 5. Batching Transacional na Sincronização de Categorias WordPress (`src/lib/wordpress.ts` e `src/app/api/wordpress/sites/[id]/categories/sync/route.ts`)
- Substituir os loops `for (const cat of categories) { await prisma.wordPressCategory.upsert(...) }` por uma única transação em lote `await prisma.$transaction(categories.map((cat) => prisma.wordPressCategory.upsert(...)))`.

### 6. Proteção de Memória em Analytics e Sincronização de Publicação (`src/lib/affiliate/analytics-service.ts` e `src/lib/publisher/publication-sync.ts`)
- Em `AffiliateAnalyticsService.getDashboardStats`: aplicar limite superior seguro (`take: 5000`) e `select: { clickedAt: true }` na busca de `clicksInPeriod` para evitar leitura ilimitada de linhas em memória.
- Em `markDependentArticlesForRepublish` (`src/lib/publisher/publication-sync.ts`): filtrar previamente no banco (`OR: [{ canonicalContent: { contains: productId } }, { content: { contains: productId } }]`) e selecionar apenas `{ id: true, canonicalContent: true }`, evitando carregar o HTML de todos os artigos publicados do tenant em memória.

## Critérios de Aceite (Definition of Done)
- [ ] `/api/articles` e `/api/billing/invoices` com paginação/limite máximo travado e `select` otimizado.
- [ ] Zero queries dentro de loops em `/api/backoffice/companies`, `src/lib/rss.ts`, `src/lib/wordpress.ts` e `/api/wordpress/sites/[id]/categories/sync`.
- [ ] `analytics-service.ts` e `publication-sync.ts` otimizados contra leitura irrestrita em memória.
- [ ] `npx tsc --noEmit` e `npm run lint` passando sem erros.

