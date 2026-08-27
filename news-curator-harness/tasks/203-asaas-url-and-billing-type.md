# Task 203: Corrigir URL Base e billingType do Asaas

## Descrição
A URL base para o sandbox do Asaas precisa usar `/api/v3` em vez de apenas `/v3`. Além disso, a criação de assinatura estava enviando `billingType: "UNDEFINED"`, o que não é suportado pelo Asaas. Devemos usar `"BOLETO"` como padrão, visto que a fatura gerada com esse tipo aceita nativamente Pix (via QR Code), Boleto e Cartão de Crédito. Também devemos remover o endpoint de `paymentLinks` do fluxo de assinaturas.

## Arquivos a alterar
- `src/lib/payments/asaas.ts`

## Critérios de Aceite
1. Em `src/lib/payments/asaas.ts`, confirmar que `getApiUrl()` retorna `https://sandbox.asaas.com/api/v3` para sandbox e `https://api.asaas.com/v3` para produção.
2. No método `createSubscription()`, substituir `billingType: "UNDEFINED"` ou parametrizado para forçar `billingType: "BOLETO"`.
3. No método `getCheckoutUrl()`, o fallback usando `paymentLinks` deve ser removido ou não ser utilizado quando for uma assinatura. O método deve preferencialmente buscar as cobranças da assinatura via `GET /v3/subscriptions/{id}/payments?limit=1`, e extrair a `invoiceUrl`. Se `invoiceUrl` não vier, construir `https://www.asaas.com/i/{paymentId}`.
4. Passar testes: `npx tsc --noEmit` e `npm run lint`.
