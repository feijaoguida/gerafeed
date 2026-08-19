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
- [x] Model criado.
- [x] Relação com Workspace.
- [x] Índice/uniqueness adequado dentro do tenant.
- [x] Password criptografável.
- [x] Migration aplicada.
- [x] Repository/service server-side.
- [x] Testes de isolamento.
- [x] TypeScript PASS.
- [x] Lint PASS.
- [x] Build PASS.

## Evidence
- `prisma/schema.prisma` atualizado com model `WordPressSite` e relação `Workspace.wordpressSites`.
- Migration `prisma/migrations/20260817110500_add_wordpress_site_model/migration.sql` criada e banco sincronizado.
- `src/lib/wordpress-sites.ts` criado com CRUD seguro, sanitização para client e criptografia AES-256-GCM.
- `scripts/test-wordpress-site-model.ts` executado com sucesso validando CRUD, criptografia, isolamento tenant, unicidade e sanitização.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.

