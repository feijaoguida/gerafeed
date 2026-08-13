# Task 006. Dashboard

## Status
DONE

## Objetivo
Criar o dashboard editorial principal.

## Escopo
- Dashboard.
- Contadores.
- Botão “Processar 5 notícias”.
- Lista de notícias.
- Status.
- Score.
- Fonte.
- Categoria sugerida.
- Navegação para edição.

## Fora do escopo
- Publicação.
- Autenticação.
- Analytics.

## Definition of Done
- [x] Dashboard carrega.
- [x] Contadores refletem banco.
- [x] Botão inicia processamento.
- [x] Loading é exibido.
- [x] Cliques repetidos são bloqueados durante processamento.
- [x] Notícias pendentes aparecem.
- [x] Erros são exibidos.
- [x] UI responsiva.
- [x] TypeScript PASS.
- [x] Lint PASS.

## Evidence
- Dashboard principal implementado em `src/app/page.tsx` com design responsivo alinhado à especificação da Stitch.
- Rotas de API criadas:
  - `GET /api/dashboard/stats` em `src/app/api/dashboard/stats/route.ts` (retorna pendentes, publicadas, rejeitadas e fontes ativas).
  - `GET /api/articles` em `src/app/api/articles/route.ts` (listagem com filtro por status e joins de fonte e categorias).
- Funcionalidades do Dashboard:
  - Cards com contadores em tempo real conectados ao PostgreSQL.
  - Botão "Processar 5 notícias" com estado de loading, spinner e bloqueio contra cliques duplos durante a execução.
  - Abas de filtro por status ("Pendentes", "Publicadas", "Rejeitadas", "Todas").
  - Exibição de cards de notícias contendo: fonte de origem, título editorial ou original, resumo, badge de score da IA, badge de categoria sugerida, link original e botão "Revisar".
  - Sidebar para gerenciamento de fontes RSS (cadastrar nova fonte, alternar status ativa/inativa e remover fonte).
  - Ação de sincronização rápida de categorias do WordPress.
- Script de teste `scripts/test-dashboard.ts` executado validando a integridade das estatísticas e listagens filtradas.
- Validações:
  - `npx tsc --noEmit`: PASS (0 erros)
  - `npm run lint`: PASS (0 erros, 0 avisos)
  - `npm run build`: PASS (compilação App Router com 11 rotas concluída com sucesso)

## Discovered Work
Nenhum trabalho fora do escopo descoberto.

## Status
DONE
