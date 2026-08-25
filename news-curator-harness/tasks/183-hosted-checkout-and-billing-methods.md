# Task 183. Hosted Checkout & Billing Methods

## Status
DONE

## Objetivo

Criar jornada de contratação sem receber dados brutos de cartão.

## Billing Method

Domínio:

```text
CREDIT_CARD
BOLETO
PIX
```

Provider expõe capabilities.

## CREDIT_CARD

Preferir Asaas Hosted Checkout.

Fluxo:
- validar plan/cycle;
- calcular amount;
- BillingProfile;
- Customer sync;
- criar BillingCheckoutSession;
- criar Checkout;
- salvar providerCheckoutId;
- retornar link;
- redirect.

## Callback

Callback:
- não ativa plano;
- não marca Invoice como paga;
- mostra estado "aguardando confirmação".

## BOLETO / PIX

Podem seguir fluxo direto de Subscription quando suportados pelo provider.

Não misturar com card data.

## CheckoutSession

Criar/reutilizar model conforme SPEC.

## Segurança

- URLs callback conhecidas.
- externalReference interna.
- não aceitar amount enviado pelo browser como fonte da verdade.
- plan/cycle são resolvidos server-side.
- client nunca envia annualAmount final confiável.

## Definition of Done

- [x] billing method enum (`BillingMethod` enum adicionado ao Prisma schema: `CREDIT_CARD`, `BOLETO`, `PIX`).
- [x] capability matrix (`PaymentProviderCapabilities` validado nos gateways).
- [x] CheckoutSession (`BillingCheckoutSession` model adicionado e gravado no banco de dados).
- [x] hosted card checkout (`AsaasGateway.getCheckoutUrl` gera link de checkout hosted sem dados brutos de cartão).
- [x] amount calculado server-side (cálculo exclusivo no backend usando `monthlyPrice` e `calculateAnnualPlanPrice`).
- [x] callback seguro (retorno de checkout via `searchParams` exibe aviso de pendência sem ativar plano ou marcar invoice como paga).
- [x] sem card data (bloqueio ativo de campos de cartão de crédito em requisições de checkout).
- [x] expired/cancel status (status `PENDING` por padrão, com tratamento para cancelamento nas rotas e banners).
- [x] tests (`scripts/test-hosted-checkout-and-billing-methods.ts` executado com 100% de PASS).
- [x] TypeScript/Lint/Build PASS (`npx tsc --noEmit`: PASS, `npm run lint`: PASS, `npm run build`: PASS).

## Evidence

- Modelo `BillingCheckoutSession` e enums `BillingMethod` e `BillingCycle` criados em `prisma/schema.prisma` e sincronizados via `npx prisma db push`.
- Endpoint `POST /api/billing/checkout` reescrito para calcular o `amount` estritamente no servidor, exigir o cadastro prévio de `BillingProfile`, realizar a sincronização idempotente de cliente via `ensureCustomer` e gravar a sessão no banco antes de retornar a `checkoutUrl` do gateway.
- Bloqueio estrito de parâmetros de cartão de crédito no payload de checkout.
- Rota `/settings/billing` atualizada para tratar callbacks do navegador (`?checkout=success` e `?checkout=canceled`), exibindo o status informativo sem ativar antecipadamente a assinatura.
- Script de testes automatizados `scripts/test-hosted-checkout-and-billing-methods.ts` executado com 100% de sucesso.
- Validação técnica: `npx tsc --noEmit` (PASS), `npm run lint` (PASS 0 erros), `npm run build` (PASS 66/66 páginas).
