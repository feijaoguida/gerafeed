# Task 060. WordPressSite Model

## Objetivo
Criar a entidade de domínio que representa cada configuração/site WordPress de um Workspace.

## Contexto
O sistema já possui uma configuração WordPress única. A evolução para vários portais exige entidade própria.

## Escopo
Criar/evoluir `WordPressSite` com:
- id
- workspaceId
- name
- url
- username
- encryptedApplicationPassword
- active
- createdAt
- updatedAt

Adicionar relações necessárias.

## Segurança
Application Password deve seguir o helper de criptografia existente.

## Migration
Se a configuração anterior estiver em `Configuration`, preparar estrutura para migração sem perder credenciais ou dados.

## Fora do escopo
- UI completa;
- associação de feeds;
- Backoffice.

## Definition of Done
- [ ] Model criado.
- [ ] Relação com Workspace.
- [ ] Índice/uniqueness adequado dentro do tenant.
- [ ] Password criptografável.
- [ ] Migration aplicada.
- [ ] Repository/service server-side.
- [ ] Testes de isolamento.
- [ ] TypeScript PASS.
- [ ] Lint PASS.
- [ ] Build PASS.

## Evidence
Registrar migration, model e testes de tenant isolation.
