# Task 216. Design System Backoffice Showcase

## Objetivo
Criar uma vitrine interativa para visualização e teste de todos os componentes e tokens do Design System, acessível no Backoffice (`/backoffice/design-system`) e via atalho direto (`/design-system`).

## Requisitos
1. **Página de Demonstração**:
   - Localização: `src/app/(backoffice)/backoffice/design-system/page.tsx` com re-export/redirecionamento em `src/app/design-system/page.tsx`.
   - Seção 1: **Cores & Tokens**: Paleta principal, gradiente oficial e superfícies nos modos Light e Dark.
   - Seção 2: **Tipografia**: Sora e Inter em todas as escalas semânticas (display, headings, body, caption).
   - Seção 3: **Botões & Interatividade**: Todas as variantes do Button (`default`, `gradient`, `outline`, etc.), tamanhos, botões de ícone e estados de carregamento.
   - Seção 4: **Badges & Status**: Status do sistema (`ACTIVE`, `PENDING`, `PUBLISHED`, `REJECTED`, etc.).
   - Seção 5: **Cards & Métricas**: Exemplos reais de `StatCard`, `Card` com título/conteúdo/rodapé.
   - Seção 6: **Formulários**: Inputs, Textareas, Selects, Switches e FormFields com estados de erro e validação.
   - Seção 7: **Feedback & Layout**: PageHeader, SectionHeader, Alerts e EmptyState interativos.
   - Alternador de tema embutido para visualização imediata nos dois modos.
2. **Link na Sidebar do Backoffice**:
   - Adicionar link discreto "Design System" na sidebar do Backoffice (`src/app/(backoffice)/backoffice/layout.tsx` ou componente de navegação).

## Definition of Done
- [ ] Rota `/backoffice/design-system` renderizando todos os componentes.
- [ ] Alternância de tema Light/Dark testada na vitrine.
- [ ] `npx tsc --noEmit`: PASS.
- [ ] `npm run lint`: PASS.
