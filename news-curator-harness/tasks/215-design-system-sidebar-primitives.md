# Task 215. Design System Sidebar Primitives

## Objetivo
Criar as primitivas arquiteturais e visuais da Sidebar em `src/components/layout/sidebar.tsx` sem substituir ou alterar a sidebar em produção ainda.

## Requisitos
1. **Primitivas de Layout**:
   - `Sidebar`: Container com suporte a temas, colapso responsivo e largura consistente.
   - `SidebarHeader`: Logo oficial GeraFeed com tipografia Sora e badge de versão/ambiente.
   - `SidebarContent`: Área de rolagem com espaçamento vertical padronizado.
   - `SidebarSection`: Agrupamento de itens com título de seção.
   - `SidebarSectionLabel`: Rótulo de seção com estilo overline.
   - `SidebarItem`: Item navegável com suporte a `icon`, `label`, `href`, `active`, `badge`, `disabled` e estado ativo com sutil gradiente/primário.
   - `SidebarFooter`: Área para perfil de usuário, tema e ações de saída.
2. **Isolamento**:
   - Manter a `src/components/sidebar.tsx` atual intocada para evitar quebras em produção.
   - As novas primitivas residem em `src/components/layout/sidebar-primitives.tsx`.

## Definition of Done
- [ ] Primitivas criadas em `src/components/layout/sidebar-primitives.tsx`.
- [ ] Suporte completo a navegação por teclado e leitor de tela.
- [ ] `npx tsc --noEmit`: PASS.
- [ ] `npm run lint`: PASS.
