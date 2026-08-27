# Task 180. Plan Monthly & Annual Pricing

## Status
DONE

## Objetivo

Evoluir o cadastro de Plan para suportar preço mensal e desconto anual.

## Contexto

O Backoffice já possui CRUD de Planos e Feature/PlanFeature.

Não criar outro modelo de plano.

Inspecionar o schema atual antes de migrar campos legados como `price`/`periodicity`.

## Regra comercial

Plan:

```text
monthlyPrice
annualDiscountPercent
```

Cálculo:

```text
annualBase = monthlyPrice * 12
annualDiscount = annualBase * annualDiscountPercent / 100
annualAmount = annualBase - annualDiscount
```

## Monetário

Usar Decimal.

Criar helper central, por exemplo:

```ts
calculateAnnualPlanPrice(...)
calculateAnnualSavings(...)
```

Não duplicar fórmula em React.

## UI Backoffice

Adicionar:
- preço mensal;
- desconto anual;
- preview anual;
- economia anual.

Exemplo:

```text
Preço mensal: R$ 29,90
Desconto anual: 16,42%
Preço anual calculado: R$ 299,90
Economia: R$ 58,90
```

## Compatibilidade

Se o schema possuir `price` e `billingCycle` antigos:
- analisar dados existentes;
- migrar de forma segura;
- não apagar campo/dados antes de confirmar compatibilidade.

## Validação

```text
monthlyPrice >= 0
annualDiscountPercent >= 0
annualDiscountPercent < 100
```

Plano gratuito:
- preço 0 permitido.

## Fora do escopo

- Customer Asaas.
- Checkout.
- Subscription recorrente.

## Definition of Done

- [ ] schema de Plan atualizado.
- [ ] migration segura.
- [ ] helper monetário.
- [ ] Decimal utilizado.
- [ ] UI Backoffice atualizada.
- [ ] preview mensal/anual.
- [ ] validação de desconto.
- [ ] plano FREE não quebra.
- [ ] dados antigos preservados.
- [ ] testes de arredondamento.
- [ ] TypeScript PASS.
- [ ] Lint PASS.
- [ ] Tests PASS.
- [ ] Build PASS.

## Validation Cases

1. 29.90 e 0%.
2. 29.90 e desconto que resulte próximo de 299.90.
3. 0 e 0%.
4. desconto negativo bloqueado.
5. 100% bloqueado.

## Evidence

Registrar migration, fórmulas e outputs dos casos.
