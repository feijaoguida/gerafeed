# Task 065. Article Destination and Filters

## Objetivo
Associar artigos ao WordPressSite e adicionar filtros na listagem.

## Article
Garantir `wordpressSiteId` quando o destino estiver definido.

## Filtros
- data inicial;
- data final;
- Feed;
- WordPress.

A data editorial deve utilizar `originalPublishedAt` quando o objetivo for filtrar a data da notícia.

## Regras
Filtros devem respeitar `workspaceId`.

## Definition of Done
- [x] Article guarda destino.
- [x] filtro data.
- [x] filtro feed.
- [x] filtro WordPress.
- [x] filtros combináveis.
- [x] reset.
- [x] paginação mantém filtros.
- [x] tenant isolation.
- [x] tests.

## Evidence
- `Article.wordpressSiteId` adicionado ao schema do Prisma com relação a `WordPressSite`, foreign keys e índices de performance (`workspaceId`, `sourceId`, `wordpressSiteId`, `originalPublishedAt`).
- `prisma/migrations/20260817112500_add_article_wordpress_site_destination/migration.sql` criado.
- `GET /api/articles` e `GET /api/articles/[id]` atualizados para suportar filtros combinados (`startDate`, `endDate` sobre `originalPublishedAt`, `sourceId`, `wordpressSiteId`, `status`) com validação estrita de isolamento multi-tenant por `workspaceId`.
- `src/app/(app)/dashboard/page.tsx` enriquecido com painel completo de filtros (intervalo de datas, seleção de fonte RSS, seleção de site WordPress, abas de status, botão de reset e badges visuais de destino nos cards).
- `scripts/test-article-destination-and-filters.ts` executado com sucesso validando persistência do destino, todos os filtros isolados e combinados, e segurança multi-tenant.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.

