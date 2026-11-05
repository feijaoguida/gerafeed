# Task 276: Interface de Criação Manual de Matéria e Melhorias na Revisão Editorial

## Status
DONE

## Contexto
Construir a experiência completa do usuário para:
1. Criar matéria com base em texto/pauta/entrevista em `/publishing/manual` escolhendo entre os 4 níveis de complemento (**Formatar**, **Leve**, **Média**, **Grande**).
2. Enviar fotos (para capa e para o corpo da matéria) e criar fotos através da matéria (IA).
3. Acessar o fluxo a partir da Central de Publicação (`/publishing`), da fila de artigos (`/articles`) e da Sidebar.
4. Na tela de Revisão Editorial (`/articles/[id]`), permitir escolher o nível de complemento ao reescrever com IA, enviar/inserir fotos no corpo da matéria ou na capa, e criar fotos através da matéria com IA.

## Critérios de Aceitação
- [x] Criar componente `src/components/publishing/manual-article-creator.tsx` e página `src/app/(app)/publishing/manual/page.tsx`.
- [x] Atualizar `src/app/(app)/publishing/page.tsx`, `src/components/publishing/rss-publishing-queue.tsx` e `src/components/sidebar.tsx` com acesso direto à criação de matéria por texto/pauta.
- [x] Atualizar `src/app/(app)/articles/[id]/page.tsx` com seletor dos 4 níveis de complemento, upload de foto de capa, upload/inserção de fotos no corpo da matéria e criação de fotos através da matéria com IA.
- [x] Reativar opções de geração de imagem por IA em `src/app/(app)/settings/images/page.tsx`.
- [x] `npx tsc --noEmit` e `npm run lint` PASS.

## Evidências
- `src/components/publishing/manual-article-creator.tsx` e `src/app/(app)/publishing/manual/page.tsx` criados.
- `src/app/(app)/publishing/page.tsx`, `src/components/publishing/rss-publishing-queue.tsx` e `src/components/sidebar.tsx` atualizados.
- `src/app/(app)/articles/[id]/page.tsx` e `src/app/(app)/settings/images/page.tsx` atualizados.
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).
