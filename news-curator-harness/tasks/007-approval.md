# Task 007. Approval

## Status
DONE

## Objetivo
Criar o editor de revisão e o fluxo de aprovação/rejeição.

## Escopo
Permitir editar:
- título;
- resumo;
- conteúdo;
- categoria;
- tags;
- focus keyword;
- meta title;
- meta description.

Permitir:
- rejeitar;
- aprovar e publicar.

## Fora do escopo
- publicação efetiva no WordPress se ainda não estiver pronta;
- automação.

## Definition of Done
- [x] Editor abre uma notícia PENDING.
- [x] Campos podem ser editados.
- [x] Categoria pode ser selecionada entre categorias sincronizadas.
- [x] Rejeição altera status para REJECTED.
- [x] Aprovação valida os campos necessários.
- [x] Aprovação chama o fluxo de publicação.
- [x] Erros não removem a notícia da fila.
- [x] TypeScript PASS.
- [x] Lint PASS.

## Evidence
- Editor de revisão e aprovação implementado em `src/app/articles/[id]/page.tsx`.
- Rotas REST da API criadas:
  - `GET /api/articles/[id]` e `PATCH /api/articles/[id]` em `src/app/api/articles/[id]/route.ts`
  - `POST /api/articles/[id]/reject` em `src/app/api/articles/[id]/reject/route.ts`
  - `POST /api/articles/[id]/approve` em `src/app/api/articles/[id]/approve/route.ts`
- Módulo `publishArticleToWordPress` atualizado em `src/lib/wordpress.ts` para validação e envio.
- Funcionalidades do Editor de Revisão:
  - Edição de 8 campos editoriais e de SEO (título, resumo, conteúdo HTML, categoria, tags, focus keyword, meta title, meta description).
  - Seleção de categorias sincronizadas do WordPress com indicação da sugestão da IA.
  - Rejeição de notícia alterando status para `REJECTED`.
  - Validação estrita de aprovação: impede publicação se título, conteúdo ou categoria não estiverem preenchidos.
  - Garantia de fila: se a publicação falhar, o erro é exibido e a notícia é preservada com status `PENDING` sem ser removida da fila.
- Script de teste `scripts/test-approval.ts` executado validando a edição de rascunhos, rejeição, falhas de validação tratadas e fluxo de aprovação/publicação.
- Validações:
  - `npx tsc --noEmit`: PASS (0 erros)
  - `npm run lint`: PASS (0 erros, 0 avisos)
  - `npm run build`: PASS (compilação App Router com 14 rotas operacionais)

## Discovered Work
Nenhum trabalho fora do escopo descoberto.

## Status
DONE
