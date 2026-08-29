# Task 214. Design System Layout and Feedback (PageHeader, SectionHeader, EmptyState, Alert, BrandDecoration)

## Objetivo
Implementar os blocos de cabeçalho, alertas informativos e estados vazios com elementos discretos da identidade visual do GeraFeed.

## Requisitos
1. **`src/components/design-system/page-header.tsx`**:
   - Cabeçalho de página com suporte a breadcrumbs, ícone de marca/seção, título em Sora, descrição e área de botões de ação (actions).
2. **`src/components/design-system/section-header.tsx`**:
   - Cabeçalho para seções internas e painéis de configuração com título, descrição e ações contextuais.
3. **`src/components/ui/alert.tsx`**:
   - Primitiva de alerta informativo com variantes CVA: `default`, `info`, `success`, `warning`, `destructive` com ícones Lucide.
4. **`src/components/ui/empty-state.tsx`**:
   - Estado vazio amigável com ícone centralizado, título, descrição e botões de ação primária e secundária.
5. **`src/components/design-system/brand-decoration.tsx`**:
   - Elemento gráfico sutil (ondas de feed ou brilho de IA) para ser utilizado pontualmente em cards de destaque sem prejudicar legibilidade.

## Definition of Done
- [ ] Componentes criados em `components/design-system/` e `components/ui/`.
- [ ] Responsividade testada em mobile e desktop.
- [ ] `npx tsc --noEmit`: PASS.
- [ ] `npm run lint`: PASS.
