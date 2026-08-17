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
- [ ] migration.
- [ ] N:N funcionando.
- [ ] unique constraint.
- [ ] create/update/delete.
- [ ] active/inactive.
- [ ] validação de tenant.
- [ ] testes PASS.
- [ ] TypeScript PASS.
- [ ] Lint PASS.
- [ ] Build PASS.

## Evidence
Testar um feed em dois sites e dois feeds em um site.
