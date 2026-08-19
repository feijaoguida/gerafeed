# Task 072. Feature and Plan Management

## Objetivo
Permitir que SuperAdmin cadastre e configure Planos e Features.

## Models
Reutilizar existentes quando possível.

Quando necessário:

`Feature`
- id
- key
- name
- description
- valueType
- active

`PlanFeature`
- planId
- featureId
- enabled
- limit

## UI de Plano
Campos:
- nome;
- slug;
- descrição;
- preço;
- periodicidade;
- ativo;
- destaque.

Features com:
- enabled;
- limit quando QUANTITY.

## Regra
BillingService continua responsável pelo cálculo de uso/limite.

## Definition of Done
- [x] CRUD Plan.
- [x] CRUD Feature se necessário.
- [x] vincular Feature.
- [x] enabled.
- [x] limit.
- [x] validação.
- [x] SuperAdmin only.
- [x] testes.

## Evidence
- `prisma/schema.prisma` atualizado com o enum `FeatureValueType`, models `Feature`, `PlanFeature` e novos campos em `Plan` (`description`, `periodicity`, `active`, `highlight`). Migration SQL criada e sincronizada.
- APIs REST do Backoffice implementadas com proteção `requireSuperAdmin()`:
  - `/api/backoffice/plans` (`GET`, `POST`)
  - `/api/backoffice/plans/[id]` (`GET`, `PATCH`, `DELETE`)
  - `/api/backoffice/features` (`GET`, `POST`)
  - `/api/backoffice/features/[id]` (`PATCH`, `DELETE`)
- Interface interativa de gestão criada em `src/components/backoffice/plan-manager.tsx` e integrada em `/backoffice/plans` com modal de cadastro/edição, limites de artigos/fontes, destaques e toggle de features com limites numéricos.
- `scripts/test-feature-and-plan-management.ts` executado com 100% de sucesso comprovando criação, edição, vinculação com limites, unicidade e integração com `BillingService`.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.

