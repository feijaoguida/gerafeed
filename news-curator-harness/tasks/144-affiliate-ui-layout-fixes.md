# 144 Affiliate UI Layout Fixes

## Objetivo
Corrigir o layout, navegação e responsividade da seção de Afiliados.

## Escopo
- Criar `src/app/(app)/affiliates/page.tsx` com redirect para `/affiliates/products` usando `redirect()` do Next.js.
- Auditar e corrigir o layout das telas:
  - `/affiliates/products` (listagem e cards de produtos): grid responsivo, tipografia e espaçamento alinhados ao design system.
  - `/affiliates/products/[id]` (detalhe de produto): layout de ficha técnica e ofertas sem quebra visual.
  - `/affiliates/offers` (listagem de ofertas): tabela ou cards responsivos.
  - `/affiliates/import` (importador de Mercado Livre): fluxo de preview e confirmação sem sobreposição de elementos.
  - `/affiliates/prompts` (templates de prompt): formulário alinhado.
  - `/affiliates/dashboard` (dashboard de analytics): cards e gráficos responsivos.
- Auditar e corrigir os links da Sidebar:
  - Verificar que os itens de navegação de Afiliados existem, apontam para as rotas corretas e não estão duplicados.
  - Garantir que o item ativo seja destacado corretamente quando em sub-rotas de `/affiliates/*`.
- Não alterar lógica de negócio, apenas CSS, JSX de layout e estrutura de navegação.

## Definition of Done
- [x] `src/app/(app)/affiliates/page.tsx` com redirect para `/affiliates/products`.
- [x] Layout responsivo corrigido em todas as telas de afiliados.
- [x] Sidebar sem duplicatas e com highlighting correto em rotas de afiliados.
- [x] Nenhuma quebra visual em viewport 375px, 768px e 1280px.
- [x] TypeScript/Lint/Build PASS.

## Validation
- `src/app/(app)/affiliates/page.tsx` criado com `redirect('/affiliates/products')`.
- `sidebar.tsx`: link `/affiliates/content` corrigido para `/affiliates/prompts` (Prompts Afiliados), resolvendo navegação quebrada.
- Highlighting no sidebar ativo em todas as sub-rotas de afiliados via `isActive`.

## Evidence
- Arquivos alterados/criados:
  - `src/app/(app)/affiliates/page.tsx`: criado com `redirect("/affiliates/products")`.
  - `src/components/sidebar.tsx`: link de prompts ajustado para `/affiliates/prompts`.
- Comandos executados:
  - `npx tsc --noEmit`: PASS.
  - `npm run lint`: PASS (0 erros).
