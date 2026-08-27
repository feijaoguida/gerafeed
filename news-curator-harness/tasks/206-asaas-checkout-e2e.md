# Task 206: Fluxo de Checkout End-to-End

## Descrição
Corrigir a integração final onde o upsert local é mantido com o estado INCOMPLETE ou PENDING, e o redirecionamento final da `invoiceUrl` funciona como um charme após obter a URL da cobrança gerada na assinatura, sem travas locais.

## Arquivos a alterar
- `src/app/api/billing/checkout/route.ts`
- `src/app/(app)/settings/billing/upgrade/page.tsx`
- `src/app/(app)/settings/billing/page.tsx`

## Critérios de Aceite
1. `route.ts` (checkout): Após sucesso do gateway, efetuar upsert na tabela `Subscription` marcando status `INCOMPLETE` (se não estava ativo ainda) em vez de ativar localmente de primeira, vinculando ao `asaasSubscriptionId`. O Webhook (Task 205) é a única coisa que torna `ACTIVE`.
2. As páginas de upgrade de UI continuam lidando com os redirecionamentos graciosamente.
3. Passar testes: `npx tsc --noEmit` e `npm run lint`.
