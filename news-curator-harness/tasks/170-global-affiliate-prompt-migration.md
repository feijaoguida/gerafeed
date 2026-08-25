# Task 170. Global Affiliate Prompt Migration

## Objetivo
Migrar resolver Affiliate de system default + workspace override para global-only. Preservar registros legados, não apagar automaticamente. Seed/identificar globals. Artigos novos guardam promptTemplateId/version.

## Definition of Done
- [x] migration strategy/global resolver
- [x] legacy preserved
- [x] workspace override ignored
- [x] audit fields
- [x] tests/TypeScript/Lint/Build PASS
