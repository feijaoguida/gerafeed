# Task: 033-billing-schema-limits

## Objetivo
Modelar os planos de assinatura e criar o validador de limites.

## Escopo
- Schema Prisma: model `Plan` (name, price, maxArticles, maxSources) e `Subscription` (status, validUntil, planId, workspaceId).
- Criar serviço `BillingService.checkLimit(workspaceId, 'ARTICLES')` que consulta o plano ativo e os artigos gerados no mês corrente.

## Definition of Done
- [ ] Prisma Schema atualizado.
- [ ] Serviço de Billing bloqueia ação se o limite for atingido.
