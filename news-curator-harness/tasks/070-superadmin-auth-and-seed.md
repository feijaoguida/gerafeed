# Task 070. SuperAdmin Auth + Seed

## Objetivo
Criar autorização global de Backoffice.

## Schema
Adicionar em User, se não existir:

`isSuperAdmin Boolean @default(false)`

## Seed
Variáveis:
- SUPERADMIN_EMAIL
- SUPERADMIN_PASSWORD

Seed deve ser idempotente e usar o hash do mecanismo de autenticação já existente.

Nunca imprimir senha.

## Proteção
- páginas `/backoffice`;
- APIs `/api/backoffice/*`;
- Server Actions.

## Definition of Done
- [x] schema.
- [x] migration.
- [x] seed.
- [x] idempotente.
- [x] sem password em logs.
- [x] usuário comum bloqueado.
- [x] superAdmin permitido.
- [x] APIs protegidas.
- [x] testes.

## Evidence
- `prisma/schema.prisma` atualizado com o campo `isSuperAdmin Boolean @default(false)` no model `User`.
- `prisma/migrations/20260817113900_add_user_is_super_admin/migration.sql` criado e schema sincronizado no PostgreSQL remoto.
- `src/lib/superadmin.ts` criado contendo `seedSuperAdmin()`, `isSuperAdminUser()` e `requireSuperAdmin()`, garantindo que senhas nunca sejam expostas ou impressas em logs.
- `src/auth.ts` atualizado para autenticar credenciais de `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD` e injetar `isSuperAdmin` tipado na sessão e no JWT.
- Proteção de páginas com `src/app/(backoffice)/backoffice/layout.tsx` e proteção de APIs com `requireSuperAdmin()`.
- `scripts/test-superadmin-auth-and-seed.ts` criado e executado com 100% de sucesso comprovando: bloqueio de usuário comum, autorização de superadmin, seed idempotente e tratamento seguro de variáveis ausentes.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.

