# Task 204: Garantir Criação Idempotente do Customer Asaas

## Descrição
O método `ensureCustomer` deve buscar clientes existentes ou criar novos sem falhar silenciosamente, garantindo que CPF/CNPJ válidos estão sendo repassados ao Asaas e que o `customerId` (providerCustomerId) é sempre armazenado no banco local.

## Arquivos a alterar
- `src/lib/payments/asaas.ts`
- `src/app/api/billing/checkout/route.ts`

## Critérios de Aceite
1. Em `ensureCustomer` (`src/lib/payments/asaas.ts`), sanitizar CPF/CNPJ (apenas dígitos). Verificar se o customer existe antes de retornar, e persistir `providerCustomerId` em `BillingProfile.providerCustomerId` e `Workspace.asaasCustomerId`.
2. Incluir logs de debug no processo para facilitar observabilidade.
3. No checkout (`src/app/api/billing/checkout/route.ts`), validar se o `customerId` gerado pelo `ensureCustomer` não é vazio/nulo. Se for, retornar `400` antes de prosseguir com `createSubscription`.
4. Após criar a assinatura com sucesso, salvar `asaasSubscriptionId` na `Subscription` do Workspace.
5. Passar testes: `npx tsc --noEmit` e `npm run lint`.
