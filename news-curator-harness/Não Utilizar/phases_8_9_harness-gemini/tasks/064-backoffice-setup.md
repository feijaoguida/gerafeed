# Task: 064-backoffice-setup

## Objetivo
Estruturar o Backoffice e o CRUD de Planos.

## Escopo
- Criar grupo de rotas `app/(admin)` com layout próprio (Menu lateral diferente do dashboard do cliente).
- Middleware: Proteger `/admin` e redirecionar se `!session.user.isSuperAdmin`.
- Tela `/admin/plans`: CRUD do model `Plan` (Nome, features, limites).

## Definition of Done
- [ ] Middleware bloqueando usuário comum.
- [ ] SuperAdmin acessa `/admin`.
- [ ] Cadastro de planos operante.
