# Task 061. Source ↔ WordPress Assignment

## Objetivo
Permitir que um Feed seja associado a um ou vários WordPressSites.

## Modelo
Criar `WordPressSiteSource` ou equivalente:
- id
- workspaceId
- wordpressSiteId
- sourceId
- active
- promptTypeOverride nullable
- createdAt
- updatedAt

## Regras
- mesmo feed não pode ser associado duas vezes ao mesmo site;
- site e feed devem pertencer ao mesmo Workspace;
- vínculo deve ser tenant-safe;
- desativar vínculo não remove o Feed.

## Definition of Done
- [x] migration.
- [x] N:N funcionando.
- [x] unique constraint.
- [x] create/update/delete.
- [x] active/inactive.
- [x] validação de tenant.
- [x] testes PASS.
- [x] TypeScript PASS.
- [x] Lint PASS.
- [x] Build PASS.

## Evidence
- `prisma/schema.prisma` atualizado com model `WordPressSiteSource`, `Source.defaultPromptType` e relações N:N.
- Migration `prisma/migrations/20260817111000_add_wordpress_site_source_assignment/migration.sql` criada e banco sincronizado.
- `src/lib/wordpress-site-sources.ts` criado com métodos de associação, atualização, remoção e listagem N:N respeitando isolamento multi-tenant.
- `scripts/test-source-wordpress-assignment.ts` executado com sucesso validando: 1 feed associado a 2 sites (1:N), 2 feeds associados a 1 site (N:1), constraint de unicidade via upsert, ativação/inativação de vínculo sem afetar o Feed original, e proteção contra violações cross-tenant.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.

