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
- [ ] Article guarda destino.
- [ ] filtro data.
- [ ] filtro feed.
- [ ] filtro WordPress.
- [ ] filtros combináveis.
- [ ] reset.
- [ ] paginação mantém filtros.
- [ ] tenant isolation.
- [ ] tests.
