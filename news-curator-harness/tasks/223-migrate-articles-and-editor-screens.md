# Task 223. Migrate Articles and Editor Screens

## Objetivo
Migrar a listagem de curadoria de matérias RSS e a tela de revisão e edição editorial individual para o novo Design System.

## Telas Afetadas
1. `src/app/(app)/articles/page.tsx`:
   - `PageHeader` com botão "Buscar Novas Notícias" (gradiente de marca).
   - Filtros de status em pílulas (`Todas`, `Pendentes`, `Publicadas`, etc.).
   - Cards de artigo com thumbnails, badges de status, data editorial e ações.
   - `EmptyState` nos filtros vazios.
2. `src/app/(app)/articles/[id]/page.tsx`:
   - Editor editorial: `PageHeader` com status e ações ("Publicar agora", "Reescrever com IA").
   - Formulários com `FormField`, `Input`, `Textarea`, `Select` (seleção de WordPress e categoria).
   - Painel lateral com status de conexão e métricas de originalidade.

## Critérios de Aceite
- [ ] Teste em Light Mode e Dark Mode.
- [ ] Preservação estrita de todas as chamadas de API e regras de IA.
- [ ] TypeScript PASS e Lint PASS.
