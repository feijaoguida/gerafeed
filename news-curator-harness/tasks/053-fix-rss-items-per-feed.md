# Task 053 — Fix RSS to Fetch N Items Per Feed

## Problema
`processRssSources` coleta itens de todos os feeds, junta num pool único e aplica `slice(0, limit)` globalmente. Resultado: 5 notícias no total (geralmente de um único feed).

## Escopo
- Refatorar `processRssSources` para aplicar o `limit` **por feed**: para cada source ativa, buscar até `limit` itens novos (não duplicados no banco).
- Com 3 feeds e limit=5, o sistema deve trazer até 15 notícias.

## Definition of Done
- [ ] `processRssSources` aplica limit por source.
- [ ] Com N feeds ativos e limit=5, até N*5 artigos são criados.
- [ ] Deduplicação por `originalUrl` preservada (dentro do workspace).
- [ ] Billing check (se existir) aplicado por artigo.
- [ ] TypeScript PASS.
- [ ] Lint PASS.
