# Task 004. WordPress

## Status
DONE

## Objetivo
Implementar conexão com WordPress, teste de autenticação e sincronização de categorias.

## Escopo
- Cliente WordPress server-side.
- Configuração por environment variables.
- Endpoint de teste.
- Consulta de `/wp-json/wp/v2/categories`.
- Persistência local das categorias.
- Endpoint de sincronização.

## Fora do escopo
- Publicação.
- Tags automáticas.
- Yoast.

## Definition of Done
- [x] Conexão real com WordPress funciona.
- [x] Application Password funciona.
- [x] Credenciais não aparecem no client.
- [x] Categorias são lidas.
- [x] Categorias são persistidas.
- [x] Sincronização pode ser repetida sem duplicar categorias.
- [x] TypeScript PASS.
- [x] Lint PASS.
- [x] Testes aplicáveis PASS.

## Evidence
- Módulo `src/lib/wordpress.ts` criado com `testWordPressConnection`, `fetchWordPressCategories` e `syncWordPressCategories`.
- Endpoints REST criados:
  - `GET /api/wordpress/test` em `src/app/api/wordpress/test/route.ts`
  - `POST /api/wordpress/categories/sync` em `src/app/api/wordpress/categories/sync/route.ts`
  - `GET /api/wordpress/categories` em `src/app/api/wordpress/categories/route.ts`
- Credenciais mantidas estritamente no ambiente do servidor (`.env`).
- Script de testes `scripts/test-wordpress.ts` executado com sucesso:
  - Autenticação HTTP Basic com Application Password validada.
  - Conexão e leitura de usuário `/wp-json/wp/v2/users/me` validadas.
  - Categorias lidas da API e sincronizadas na tabela `WordPressCategory`.
  - Re-execução da sincronização validada: 0 categorias duplicadas (idempotência via `wordpressId @unique`).
- Validações:
  - `npx tsc --noEmit`: PASS (0 erros)
  - `npm run lint`: PASS (0 erros, 0 avisos)
  - `npm run build`: PASS (compilação App Router com 3 rotas do WordPress)

## Discovered Work
Nenhum trabalho fora do escopo descoberto.

## Status
DONE
