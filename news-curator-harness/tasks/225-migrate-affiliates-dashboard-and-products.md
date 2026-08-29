# Task 225. Migrate Affiliates Dashboard and Products Screens

## Objetivo
Migrar o painel do módulo de afiliados e as telas de catálogo e manutenção de produtos.

## Telas Afetadas
1. `src/app/(app)/affiliates/dashboard/page.tsx` & `src/app/(app)/affiliates/page.tsx`:
   - Dashboard de afiliados com `StatCard` e gráficos de métricas.
2. `src/app/(app)/affiliates/products/page.tsx`:
   - Catálogo de produtos com filtros de busca, cards e badges de status.
3. `src/app/(app)/affiliates/products/new/page.tsx`:
   - Formulário de criação de produto com `FormField`, `Input`, `Textarea`, `Select`.
4. `src/app/(app)/affiliates/products/[id]/page.tsx`:
   - Edição e detalhe de produto com tabs, painéis laterais e galerias de imagem.

## Critérios de Aceite
- [ ] Light Mode e Dark Mode verificados.
- [ ] TypeScript PASS e Lint PASS.
