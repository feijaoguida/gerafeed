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
- [ ] schema.
- [ ] migration.
- [ ] seed.
- [ ] idempotente.
- [ ] sem password em logs.
- [ ] usuário comum bloqueado.
- [ ] superAdmin permitido.
- [ ] APIs protegidas.
- [ ] testes.
