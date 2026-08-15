# Task: 033-billing-schema-limits

## Status: DONE

## Objetivo
Modelar os planos de assinatura e criar o validador de limites.

## Escopo
- Schema Prisma: model `Plan` (name, slug, price, maxArticles, maxSources) e `Subscription` (status, validUntil, currentPeriodStart, currentPeriodEnd, asaasSubscriptionId, stripeSubscriptionId, planId, workspaceId).
- Criar serviço `BillingService.checkLimit(workspaceId, 'ARTICLES' | 'SOURCES')` que consulta o plano ativo e os artigos gerados no mês corrente ou fontes ativas.
- Implementar `BillingService.assertLimit(workspaceId, resource)` e `BillingService.ensureDefaultPlans()`.

## Definition of Done
- [x] Prisma Schema atualizado com `Plan`, `Subscription` e `SubscriptionStatus`.
- [x] Migração de banco de dados executada e sincronizada.
- [x] Serviço de Billing bloqueia ação se o limite for atingido.
- [x] TypeScript PASS (`npx tsc --noEmit`).
- [x] Lint PASS (`npm run lint`).
- [x] Build PASS (`npm run build`).

## Evidence
- `prisma/schema.prisma`: Adicionados modelos `Plan`, `Subscription` e enum `SubscriptionStatus`. Relacionamento com `Workspace` estabelecido.
- Migração `20260814192622_add_billing_plans_subscriptions` criada e aplicada no PostgreSQL.
- `src/lib/billing.ts`: Implementado `BillingService` com suporte a planos padrão (Free, Starter, Pro), `getWorkspaceSubscription`, `checkLimit` para contagem mensal de `ARTICLES` e total de `SOURCES` ativas, e `assertLimit`.
- Validador integrado em `src/app/api/sources/route.ts` e `src/lib/rss.ts`.
- Suíte automatizada de testes `scripts/test-billing-limits.ts`: PASS (validados limites de fontes, artigos, rejeição ao exceder limites e desbloqueio após upgrade de plano).
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.

