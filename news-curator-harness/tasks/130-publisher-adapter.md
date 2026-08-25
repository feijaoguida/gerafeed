# 130 Publisher Adapter

## Objetivo
Desacoplar publicação do WordPress.

## Escopo
Criar PublisherAdapter com testConnection/createDraft/publish/update. Implementar WordPressPublisherAdapter usando serviços existentes sem quebrar notícias.

## Definition of Done
- [x] Interface/factory.
- [x] WordPress adapter.
- [x] Legacy publish PASS.
- [x] TypeScript/Lint/Tests PASS.

## Validation
Executar testes automatizados em `scripts/test-publisher-adapter.ts`, tsc, lint e build.

## Evidence
- `src/lib/publisher/types.ts`:
  - Definida a interface `PublisherAdapter` (`name`, `type`, `testConnection`, `createDraft`, `publish`, `update`, `uploadMedia`) e tipos de payload.
- `src/lib/publisher/wordpress-adapter.ts`:
  - Implementado `WordPressPublisherAdapter` com suporte completo a autenticação básica, upload de mídia, tags, metadados Yoast SEO e publicação.
- `src/lib/publisher/factory.ts`:
  - Implementado `PublisherFactory` para instanciação direta ou resolução automática por workspace/site.
- `src/lib/publisher/index.ts`:
  - Re-export de types, adapter e factory.
- Validações:
  - `npx tsx scripts/test-publisher-adapter.ts`: PASS (3/3 checks).
  - `npx tsc --noEmit`: PASS.
  - `npm run lint`: PASS (0 erros, 0 avisos).

