# Task 229. Migrate Backoffice Screens (SuperAdmin)

## Objetivo
Migrar a área administrativa do Backoffice (`src/app/(backoffice)/`) para os padrões visuais e componentes do GeraFeed.

## Telas Afetadas
1. `src/app/(backoffice)/backoffice/layout.tsx`: Layout com navegação administrativa e indicador visual de SuperAdmin.
2. `src/app/(backoffice)/backoffice/page.tsx`: Visão geral administrativa com `StatCard` de receita e total de empresas.
3. `src/app/(backoffice)/backoffice/companies/page.tsx`: Gestão de empresas em tabela padronizada.
4. `src/app/(backoffice)/backoffice/companies/[id]/page.tsx`: Detalhes da empresa, sincronização manual de faturamento e membros.
5. `src/app/(backoffice)/backoffice/plans/page.tsx`: Configuração de planos e limites.
6. `src/app/(backoffice)/backoffice/affiliate-prompts/page.tsx`: Gestor central de templates de prompt com editor e validações.

## Critérios de Aceite
- [ ] Light Mode e Dark Mode consistentes.
- [ ] TypeScript PASS e Lint PASS.
