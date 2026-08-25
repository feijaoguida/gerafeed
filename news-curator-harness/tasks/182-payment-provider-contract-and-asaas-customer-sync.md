# Task 182. PaymentProvider Contract & Asaas Customer Sync

## Status
DONE

## Objetivo

Evoluir PaymentProvider e implementar sincronização idempotente de Customer Asaas.

## PaymentProvider v2

Adicionar contratos/capabilities necessários para:
- customer;
- checkout;
- subscription;
- payments;
- webhooks.

Não quebrar código existente.

## Asaas Customer

Fluxo:

```text
BillingProfile
→ providerCustomerId existe?
├── sim: recuperar/atualizar
└── não:
    → procurar/reconciliar quando aplicável
    → criar
    → salvar ID
```

## externalReference

Enviar referência interna estável do Workspace.

## Duplicidade

Não criar customer a cada tentativa de checkout.

## Provider DTO

Normalizar resposta.

Não retornar payload cru Asaas ao client.

## Definition of Done

- [x] PaymentProvider v2 (evoluído com a flag `capabilities`).
- [x] capabilities (propriedade `readonly capabilities: PaymentProviderCapabilities` com flags `customer`, `checkout`, `subscription`, `payments`, `webhooks`).
- [x] AsaasProvider adaptado (implementa o contrato v2 com métodos `ensureCustomer` e `getCustomer`).
- [x] create/update customer (método `ensureCustomer` recupera, atualiza ou cria cliente de forma fluida).
- [x] providerCustomerId persistido (salva `providerCustomerId` no `BillingProfile` e `asaasCustomerId` no `Workspace`).
- [x] externalReference (associa o `workspaceId` em todas as chamadas de criação/atualização de cliente).
- [x] retry idempotente (múltiplas chamadas com o mesmo workspace reutilizam o mesmo ID de cliente sem criar duplicadas).
- [x] duplicate prevention (busca na API do Asaas por `externalReference` e por `cpfCnpj` limpo antes de criar um novo registro).
- [x] error normalization (mensagens de erro formatadas com o prefixo `[Asaas] <Descrição>`).
- [x] sandbox test (`scripts/test-asaas-customer-sync.ts` executado com 100% de sucesso).
- [x] TypeScript/Lint/Tests/Build PASS (`npx tsc --noEmit`: PASS, `npm run lint`: PASS, `scripts/test-asaas-customer-sync.ts`: PASS, `npm run build`: PASS).

## Evidence

- `PaymentGateway` evoluído em `src/lib/payments/PaymentGateway.ts` com `capabilities`, `ensureCustomer` e `getCustomer`.
- `MockPaymentGateway` atualizado em `src/lib/payments/mock.ts` conforme o contrato v2.
- `AsaasGateway` adaptado em `src/lib/payments/asaas.ts` implementando o fluxo completo de busca por ID, busca por `externalReference` (workspaceId), busca por `cpfCnpj` limpo, criação e sincronização com `Workspace.asaasCustomerId` e `BillingProfile.providerCustomerId`.
- Tratamento de erro normalizado com sanitização de tipos de conteúdo de resposta (`application/json`).
- Script de teste `scripts/test-asaas-customer-sync.ts` executado com sucesso:
  - Validação de contrato de capacidades dos gateways.
  - Teste de idempotência no `MockPaymentGateway`.
  - Teste de reconciliação de ID de cliente no banco de dados e sincronização no Workspace.
  - Captura e validação de erro normalizado `[Asaas]`.
- TypeScript (`npx tsc --noEmit`), Lint (`npm run lint`), Testes e Build de produção (`npm run build`): Todos PASS.

