# Task 221. Migrate App Shell and Sidebar

## Objetivo
Atualizar o shell principal da área logada (`src/app/(app)/layout.tsx`) e substituir a implementação legada de `src/components/sidebar.tsx` pelas primitivas modulares de Sidebar do Design System.

## Telas / Componentes Afetados
1. `src/app/(app)/layout.tsx`: Fundo semântico `--background`, tipografia e suspense fallback.
2. `src/components/sidebar.tsx`: Reescrita com `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarSection`, `SidebarItem`, `SidebarFooter`.

## Critérios de Aceite
- [ ] Item ativo com gradiente suave ou cor primária da marca.
- [ ] Badges nos itens de menu (`PRO`, contadores) com variante semântica.
- [ ] Suporte a colapso mobile e acessibilidade.
- [ ] Modo Claro e Modo Escuro consistentes.
- [ ] TypeScript PASS e Lint PASS.
