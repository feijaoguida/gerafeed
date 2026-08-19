# Task 076. Company WordPress Management

## Objetivo
Permitir administrar WordPressSites da empresa.

## Ações
- listar;
- criar;
- editar;
- ativar/desativar;
- testar conexão;
- sincronizar categorias;
- associar feeds.

## Segurança
Nunca exibir Application Password.

Para atualizar:
`Nova Application Password`

## Definition of Done
- [x] CRUD.
- [x] conexão.
- [x] categorias.
- [x] feeds.
- [x] secret protegido.
- [x] tenant validation.
- [x] testes.

## Evidence
- Endpoints do Backoffice implementados em:
  - `src/app/api/backoffice/companies/[id]/wordpress/route.ts` (`GET` com sanitização total de credenciais e vínculos de feeds; `POST` com criptografia AES-256-GCM via `encrypt()`)
  - `src/app/api/backoffice/companies/[id]/wordpress/[siteId]/route.ts` (`GET`, `PATCH` com suporte a `Nova Application Password` sem sobrescrever desnecessariamente, `DELETE` com exclusão em cascata)
  - `src/app/api/backoffice/companies/[id]/wordpress/[siteId]/test/route.ts` (`POST` para teste de conexão REST com o endpoint `/wp-json/wp/v2/users/me`)
  - `src/app/api/backoffice/companies/[id]/wordpress/[siteId]/sync/route.ts` (`POST` para sincronização completa de categorias)
- Interface rica integrada na aba "Sites WordPress" em `src/components/backoffice/company-details.tsx` permitindo teste de conexão, sincronização de categorias, vinculação de feeds e edição segura de senhas.
- `scripts/test-company-wordpress-management.ts` executado com 100% de sucesso validando CRUD, criptografia, sanitização, nova senha, categorias, isolamento e exclusão em cascata.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.

