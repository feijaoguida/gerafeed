# Task 063. WordPress Settings UI

## Objetivo
Evoluir Configurações WordPress para múltiplos sites.

## UI
Listar sites:
- nome;
- URL;
- ativo;
- status conexão.

Permitir:
- criar;
- editar;
- ativar/inativar;
- testar conexão;
- sincronizar categorias.

## Tela do Site
Seções:
1. Dados básicos.
2. Conexão.
3. Prompt padrão do site.
4. Feeds associados.
5. Ação `+ Novo Feed`.

Credencial atual nunca deve ser exibida.

## Definition of Done
- [x] lista multi-site.
- [x] CRUD.
- [x] teste conexão.
- [x] categorias por site.
- [x] prompt default.
- [x] feeds associados.
- [x] responsive.
- [x] autorização tenant-safe.
- [x] testes.

## Evidence
- `src/app/api/wordpress/sites/route.ts` e `src/app/api/wordpress/sites/[id]/route.ts` criados com CRUD seguro e isolamento por workspaceId.
- `src/app/api/wordpress/sites/[id]/test/route.ts` criado para teste de conexão individual com REST API.
- `src/app/api/wordpress/sites/[id]/categories/sync/route.ts` criado para sincronização de categorias por site.
- `src/app/api/wordpress/sites/[id]/sources/route.ts` criado para vinculação/desvinculação de fontes e quick-create `+ Novo Feed`.
- `src/app/(app)/settings/wordpress/page.tsx` totalmente evoluído com listagem multi-site, edição/gestão, visualização de status, configuração de prompt default, gestão de feeds associados e design responsivo com segurança de credenciais (Application Password nunca exposta em plaintext).
- `scripts/test-wordpress-settings-ui.ts` executado com sucesso validando CRUD de sites, testes de isolamento multi-tenant, vínculo N:N de feeds com override e sincronização de categorias.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.

