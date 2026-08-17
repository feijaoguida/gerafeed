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
- [ ] CRUD Plan.
- [ ] CRUD Feature se necessário.
- [ ] vincular Feature.
- [ ] enabled.
- [ ] limit.
- [ ] validação.
- [ ] SuperAdmin only.
- [ ] testes.
