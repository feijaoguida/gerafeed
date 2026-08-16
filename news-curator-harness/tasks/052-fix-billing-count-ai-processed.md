# Task 052 — Fix Billing Count (AI-Processed Only)

## Problema
`BillingService.checkLimit` conta todos os artigos criados no mês (ingestão RSS), mas deveria contar apenas artigos processados pela IA (reescrita). O `PlanUsageCard` exibe "Posts gerados" baseado nessa contagem incorreta.

## Escopo
- Adicionar campo `processedAt DateTime?` ao model `Article` no schema Prisma.
- Criar migration.
- Setar `processedAt = now()` em `processArticleWithAi` quando a reescrita é concluída.
- Alterar `BillingService.checkLimit("ARTICLES")` para contar apenas artigos com `processedAt` não-nulo no mês corrente.
- Validar limite no momento do processamento IA (em vez de na ingestão RSS).

## Definition of Done
- [ ] Campo `processedAt` adicionado ao model Article.
- [ ] Migration criada e aplicada.
- [ ] `processArticleWithAi` seta `processedAt` ao concluir.
- [ ] `BillingService.checkLimit("ARTICLES")` filtra por `processedAt >= startOfMonth`.
- [ ] `PlanUsageCard` exibe contagem correta de posts reescritos.
- [ ] TypeScript PASS.
- [ ] Lint PASS.
