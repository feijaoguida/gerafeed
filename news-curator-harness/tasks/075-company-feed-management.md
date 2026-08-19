# Task 075. Company Feed Management

## Objetivo
Permitir que SuperAdmin administre feeds de uma empresa.

## Ações
- listar;
- pesquisar;
- criar;
- editar;
- ativar/desativar;
- definir creditName;
- definir prompt default;
- associar WordPress.

## Regras
Não permitir manipulação de outro Workspace por IDs inválidos.

## Definition of Done
- [x] CRUD.
- [x] prompts.
- [x] associações.
- [x] tenant validation.
- [x] testes.

## Evidence
- Endpoints do Backoffice implementados em:
  - `src/app/api/backoffice/companies/[id]/feeds/route.ts` (`GET` com busca por nome/crédito/URL; `POST` com validação de limites `BillingService` e criação de vínculos WordPress)
  - `src/app/api/backoffice/companies/[id]/feeds/[feedId]/route.ts` (`PATCH` com atualização de atributos, prompt default e associações WP; `DELETE` com exclusão em cascata)
- Validação estrita de isolamento multi-tenant garantindo que `source.workspaceId === id`, rejeitando cross-tenant access.
- Interface de gerenciamento completa integrada na aba "Feeds RSS" em `src/components/backoffice/company-details.tsx` com busca, modal de cadastro/edição, seletor de prompt default, multi-select de sites WordPress e toggle direto de status.
- `scripts/test-company-feed-management.ts` executado com 100% de sucesso validando CRUD, custom prompt, WordPress associations, status toggle, rejeição cross-workspace e cascade delete.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.

