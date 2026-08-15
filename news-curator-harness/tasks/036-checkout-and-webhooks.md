# Task: 036-checkout-and-webhooks

## Status: DONE

## Objetivo
Implementar os endpoints de checkout, consulta de planos e status de assinatura do workspace.

## Escopo
- Criar rota `GET /api/billing/plans` para listar planos disponíveis.
- Criar rota `GET /api/billing/subscription` para consultar plano ativo, uso atual e limites (`checkLimit`) do workspace.
- Criar rota `POST /api/billing/checkout` para iniciar checkout com o gateway ativo (`getPaymentGateway().getCheckoutUrl(...)` ou ativação instantânea para plano gratuito).

## Definition of Done
- [x] Endpoints `/api/billing/plans`, `/api/billing/subscription` e `/api/billing/checkout` funcionais.
- [x] TypeScript PASS (`npx tsc --noEmit`).
- [x] Lint PASS (`npm run lint`).
- [x] Build PASS (`npm run build`).

## Evidence
- `src/app/api/billing/plans/route.ts`: Endpoint GET retornando lista ordenada de planos ativos.
- `src/app/api/billing/subscription/route.ts`: Endpoint GET retornando assinatura e métricas de consumo de artigos e fontes em tempo real.
- `src/app/api/billing/checkout/route.ts`: Endpoint POST ativando plano gratuito instantaneamente ou gerando URL de checkout segura com o gateway ativo.
- `scripts/test-checkout-and-webhooks.ts`: PASS (todos os 3 endpoints de billing validados com sucesso).
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.

