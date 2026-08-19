# Task 064. Feed Management + Quick Create

## Objetivo
Manter o cadastro de Feed global e permitir criação rápida a partir de um WordPress.

## Cadastro global
Campos:
- nome;
- RSS URL;
- Fonte/creditName;
- prompt default;
- active.

## Dentro do WordPress
A ação `+ Novo Feed` deve:
1. abrir formulário;
2. criar Source no Workspace;
3. criar associação WordPressSiteSource;
4. permitir definir override do prompt;
5. retornar à tela do site com feed selecionado.

## Definition of Done
- [x] cadastro global funciona.
- [x] quick create funciona.
- [x] associação automática.
- [x] prompt override.
- [x] tenant isolation.
- [x] testes.
- [x] TypeScript PASS.
- [x] Lint PASS.

## Evidence
- Cadastro global de Feed evoluído com `defaultPromptType` na API (`POST /api/sources`, `PATCH /api/sources/[id]`) e na interface visual (`src/app/(app)/settings/sources/page.tsx`).
- Quick Create `+ Novo Feed` operacional dentro do gerenciamento do site WordPress (`POST /api/wordpress/sites/[id]/sources` com `newSource`), criando a fonte no Workspace e associando-a imediatamente ao site WordPress com override opcional.
- `scripts/test-feed-management-quick-create.ts` executado com sucesso validando cadastro global, edição, quick create com associação e override, e isolamento multi-tenant.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.

