# Task 181. Billing Profile & Customer Data

## Status
DONE

## Objetivo

Criar/reutilizar o perfil cadastral de cobrança de cada Workspace sem armazenar dados de cartão.

## Inspeção obrigatória

Antes de criar tabela:
- verificar campos existentes em Workspace;
- verificar User;
- verificar Subscription;
- verificar billing já implementado.

Evitar duplicação.

## Modelo sugerido

```text
BillingProfile
id
workspaceId @unique
name
cpfCnpj
email
mobilePhone?
postalCode?
address?
addressNumber?
complement?
province?
city?
state?
providerCustomerId?
createdAt
updatedAt
```

## PII

- CPF/CNPJ deve ser protegido na UI quando não houver necessidade de exibição completa.
- não logar documento completo.
- validar tenant.
- SuperAdmin pode consultar via Backoffice.
- usuário comum só vê Workspace atual.

## UI

`Configurações > Plano e cobrança > Dados de cobrança`

Campos cadastrais.

Não incluir:
- cartão;
- CVV;
- validade.

## Definition of Done

- [x] schema/reuse decidido (`BillingProfile` model criado com relação `1:1` via `workspaceId @unique`).
- [x] migration quando necessária (`npx prisma db push` e `npx prisma generate` executados com sucesso).
- [x] 1 profile por Workspace.
- [x] create/update/read (`BillingProfileService` com `getProfile` e `upsertProfile`).
- [x] validation CPF/CNPJ conforme política existente (módulo `src/lib/billing-profile-validation.ts` com validação matemática de dígitos verificadores e formato para CPF/CNPJ).
- [x] tenant isolation (`getSessionWorkspaceId` garante isolamento estrito por workspace).
- [x] masking quando aplicável (`maskCpfCnpj` para mascaramento de PII: ex: `529.***.***-25` ou `00.***.***/0001-91`).
- [x] sem card fields (rotas e formulários rejeitam e ignoram qualquer campo relativo a cartão).
- [x] tests (`scripts/test-billing-profile-and-customer-data.ts` executado com 100% de sucesso).
- [x] TypeScript/Lint/Build PASS (`npx tsc --noEmit`: PASS, `npm run lint`: PASS, `npm run build`: PASS).

## Evidence

- Modelo `BillingProfile` adicionado em `prisma/schema.prisma` com relação `1:1` cascata ao `Workspace`.
- Módulo `src/lib/billing-profile-validation.ts` implementado para validação pura e mascaramento de PII.
- Serviço `src/lib/billing-profile.ts` implementado para CRUD seguro com sincronização automática do `providerCustomerId` com `workspace.asaasCustomerId`.
- Endpoint de API `GET/PUT /api/billing/profile` implementado com sanitização, isolamento multi-tenant e bloqueio ativo de campos de cartão de crédito.
- Endpoint do Backoffice `/api/backoffice/companies/[id]/billing` expandido para consulta e atualização de `BillingProfile` pelo SuperAdmin.
- Interface `src/components/settings/billing-profile-form.tsx` e rota de página `src/app/(app)/settings/billing/page.tsx` criadas com consumo do plano e formulário completo de dados de cobrança.
- Link "Plano & Cobrança" adicionado ao menu `Sidebar`.
- Execução de `scripts/test-billing-profile-and-customer-data.ts`: PASS.
- Verificação técnica: `npx tsc --noEmit` (PASS), `npm run lint` (PASS), `npm run build` (PASS com rota estática e dinâmica compiladas sem erros).

