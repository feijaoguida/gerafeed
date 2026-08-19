# Task 071. Backoffice Shell

## Objetivo
Criar área visual independente.

## Rotas
Sugestão:
- `/backoffice`
- `/backoffice/plans`
- `/backoffice/companies`

## Sidebar
- Dashboard
- Planos
- Empresas

Futuro:
- Configurações
- Auditoria

## Regras
Não misturar sidebar do Workspace com sidebar do Backoffice.

Não mostrar links de Backoffice a usuários comuns.

## Definition of Done
- [x] layout próprio.
- [x] sidebar própria.
- [x] proteção server-side.
- [x] responsive.
- [x] navegação.
- [x] TypeScript PASS.
- [x] Lint PASS.

## Evidence
- Criado layout visual independente do Backoffice em `src/app/(backoffice)/backoffice/layout.tsx` com verificação de autorização server-side (`isSuperAdminUser`).
- Criado componente de navegação dedicado `src/components/backoffice/backoffice-sidebar.tsx` com seções de Administração (Dashboard, Empresas, Planos) e Governança, além de botão para retorno ao App.
- Criadas páginas base do Backoffice:
  - `/backoffice` (`src/app/(backoffice)/backoffice/page.tsx`)
  - `/backoffice/companies` (`src/app/(backoffice)/backoffice/companies/page.tsx`)
  - `/backoffice/plans` (`src/app/(backoffice)/backoffice/plans/page.tsx`)
- Sidebar padrão do Workspace atualizada para exibir o link do Backoffice apenas quando o usuário for comprovadamente Superadmin.
- `scripts/test-backoffice-shell.ts` criado e executado com sucesso validando layout, proteção e consultas.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.

