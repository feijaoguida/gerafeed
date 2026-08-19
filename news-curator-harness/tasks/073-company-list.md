# Task 073. Company List

## Objetivo
Criar a tela de Empresas do Backoffice usando Workspace como entidade.

## Listagem
Mostrar:
- nome;
- plano;
- status;
- créditos/uso;
- sites WordPress;
- feeds;
- criação.

Ações:
- Inativar;
- Mais opções.

Filtros:
- busca;
- status;
- plano;
- paginação.

## Regras
Usar BillingService para uso/limite.

Não criar Company duplicada.

## Definition of Done
- [x] listagem.
- [x] busca.
- [x] filtros.
- [x] paginação.
- [x] dados de plano.
- [x] créditos/uso.
- [x] inativação segura.
- [x] SuperAdmin only.
- [x] testes.

## Evidence
- `prisma/schema.prisma` atualizado com o campo `active Boolean @default(true)` no model `Workspace`. Migration SQL criada e sincronizada.
- APIs REST do Backoffice implementadas com proteção `requireSuperAdmin()`:
  - `/api/backoffice/companies` (`GET` com busca, filtros de status/plano, paginação e cálculo de uso; `POST` para cadastro seguro de tenants com plano inicial)
  - `/api/backoffice/companies/[id]` (`GET`, `PATCH` para atualização de dados/plano/status e `DELETE` para inativação segura)
- Interface de listagem e controle implementada em `src/components/backoffice/company-list.tsx` e renderizada em `/backoffice/companies`, exibindo plano, status ativo/inativo, barra de uso de artigos (mês), contadores de feeds RSS e sites WordPress, modal de cadastro e toggle de inativação/ativação segura.
- `scripts/test-company-list.ts` executado com 100% de sucesso validando busca, filtros, inativação segura e cálculo de uso via `BillingService`.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.

