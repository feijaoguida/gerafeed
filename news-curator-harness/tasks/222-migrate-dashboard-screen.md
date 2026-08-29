# Task 222. Migrate Dashboard Screen

## Objetivo
Refatorar a tela de visão geral (`src/app/(app)/dashboard/page.tsx`) e o componente de consumo do plano (`src/components/plan-usage-card.tsx`) para usar os novos blocos `PageHeader`, `StatCard`, `Card` e `Progress`.

## Telas / Componentes Afetados
1. `src/app/(app)/dashboard/page.tsx`:
   - `PageHeader` com título e ações.
   - Grid responsiva de `StatCard` para métricas (Pendentes, Publicados, Feeds, Cliques, Sites).
   - Containers de gráficos e atividades recentes em `Card`.
2. `src/components/plan-usage-card.tsx`:
   - Reuso das primitivas de `Card`, `Badge` e `Progress` eliminando classes ad-hoc.

## Critérios de Aceite
- [ ] Eliminar classes arbitrárias de cores e tamanhos.
- [ ] Paridade de métricas e gráficos em Light Mode e Dark Mode.
- [ ] TypeScript PASS e Lint PASS.
