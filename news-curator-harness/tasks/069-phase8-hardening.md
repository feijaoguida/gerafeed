# Task 069. Phase 8 Hardening

## Objetivo
Auditar segurança e consistência da nova arquitetura.

## Checklist
- [x] WordPressSite sempre tem workspaceId.
- [x] associação Feed/Site tenant-safe.
- [x] Article destination tenant-safe.
- [x] nenhum site de outro tenant aparece.
- [x] secrets nunca retornam.
- [x] configuração antiga não gera duplicação.
- [x] prompt resolution sem fallback indevido.
- [x] queries possuem filtro tenant.
- [x] TypeScript PASS.
- [x] Lint PASS.
- [x] Testes PASS.
- [x] Build PASS.

## Evidence
- `scripts/test-phase8-hardening.ts` implementado e executado realizando auditoria e testes de penetração multi-tenant na arquitetura da Fase 8:
  1. Criação e queries de `WordPressSite` exigem estritamente `workspaceId`.
  2. Associações `WordPressSiteSource` rejeitam cross-tenant de forma intransigente.
  3. Artigos e destinos WordPress nunca vazam para outros tenants.
  4. Credenciais e secrets sempre protegidos no client com sanitização (`hasPassword: true`, sem senha em texto plano).
  5. Migração legada estritamente idempotente e segura sem duplicação de instâncias.
  6. Hierarquia de resolução de prompt com isolamento multi-tenant completo.
  7. Todas as queries de banco de dados possuem filtros explícitos de `workspaceId`.
- Suite completa de testes automatizados da Fase 8 (`scripts/test-*.ts` tasks 060 a 069): PASS.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.

