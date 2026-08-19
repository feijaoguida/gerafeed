# Task 067. Legacy WordPress Migration

## Objetivo
Migrar a configuração WordPress antiga para `WordPressSite` sem perder dados.

## Estratégia
```text
Configuration.wordpressConnection
→ WordPressSite default
→ migrar credenciais
→ associar feeds existentes
→ validar conexão
→ preservar compatibilidade temporária se necessário
```

## Regras
- não apagar configuração antiga antes de validar;
- migration deve ser idempotente;
- registrar ausência de configuração antiga como caso válido;
- credenciais continuam criptografadas.

## Definition of Done
- [x] dados migrados.
- [x] feeds associados.
- [x] credencial recuperável server-side.
- [x] migração idempotente.
- [x] rollback/documentação se necessário.
- [x] testes.

## Evidence
- `src/lib/wordpress-migration.ts` implementado com funções `migrateLegacyWordPressConfig` e `migrateAllWorkspacesLegacyWordPress`.
- A migração converte `Configuration.wordpressConnection` para o modelo `WordPressSite`, mantém credenciais encriptadas com AES-256-GCM, associa automaticamente todos os feeds (`Source`) existentes no Workspace e migra categorias e artigos pendentes sem site.
- A linha original de `Configuration` é preservada garantindo capacidade de rollback e retrocompatibilidade.
- Casos sem configuração legada são tratados suavemente como `NO_LEGACY_CONFIG`.
- `scripts/test-legacy-wordpress-migration.ts` executado com sucesso validando migração completa, descriptografia segura server-side, idempotência (nenhuma duplicação em reexecuções) e isolamento multi-tenant.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.

