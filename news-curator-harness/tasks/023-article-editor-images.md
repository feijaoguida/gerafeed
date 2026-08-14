# Task: 023-article-editor-images

## Status
DONE

## Objetivo
Exibir as opções de imagem na tela de aprovação para decisão humana.

## Contexto
O usuário precisa ver a imagem original e a alterada lado a lado e confirmar qual será enviada ao WordPress.

## Escopo
- Atualizar a tela de Aprovação (`app/articles/[id]`).
- Adicionar uma seção "Mídia Destacada".
- Renderizar as duas imagens (se a processada existir).
- Adicionar um Radio Button / seletor visual para definir `selectedImage` (Original ou Alterada).
- Salvar a seleção ao clicar em "Salvar Rascunho" ou "Aprovar".

## Definition of Done
- [x] Imagens renderizadas lado a lado na UI.
- [x] Seletor funcional atualizando o estado.
- [x] Preferência do usuário enviada no payload de aprovação.

## Evidence
- Interface `ArticleDetail` em `src/app/articles/[id]/page.tsx` com suporte a `originalImageUrl`, `modifiedImageUrl` e `selectedImage`.
- Painel "Mídia Destacada" renderizado com seletores visuais lado a lado e estado `selectedImage`.
- Rotas `PATCH /api/articles/[id]` e `POST /api/articles/[id]/approve` atualizadas para receber e atualizar `selectedImage`.
- Script de teste [`scripts/test-article-editor-images.ts`](file:///home/feijao/projetos/news-curator/scripts/test-article-editor-images.ts) executado com sucesso validando persistência do parâmetro `selectedImage`.
- Validações:
  - `npx tsc --noEmit`: PASS (0 erros)
  - `npm run lint`: PASS (0 erros, 0 avisos)
  - `npm run build`: PASS (compilação produção Next.js App Router em 635ms)

## Status
DONE
