# Task 258: Visualizador de Logs de Erro no Backoffice com Filtros

## Status
DONE

## Contexto
O usuário solicitou:
"Esses Erros só serão visiveis pelo SuperAdmin, no modulo de backoffice, e neles é para vir identificado por tenant e ter no filtro o tenant.
Na listagem de erro quero um filtro para separar por modulo, usuário, data etc."

Precisamos de:
1. Endpoint `GET /api/backoffice/error-logs` restrito exclusivamente para SuperAdmins (`session.user.isSuperAdmin === true`).
2. Suporte a parâmetros de filtro: `workspaceId` (tenant), `module`, `userId` / `search` (por usuário ou texto), `startDate` / `endDate` (ou período pré-definido) e paginação.
3. Tela `/backoffice/audit/errors` (ou `/backoffice/errors`) integrada na sidebar do Backoffice sob "Governança & Logs".
4. Tabela de logs com badges de módulo, tenant identificado, usuário, data relativa/formatada, caminho e status.
5. Modal interativo "Detalhes do Erro":
   - Visualização da mensagem bruta/original que estourou antes do tratamento.
   - Stack trace completo formatado em bloco de código escuro com destaque.
   - Dados de entrada (Query / Payload / Caminho) para reproduzir o erro.
   - Identificação do tenant e do usuário.

## Critérios de Aceitação
- [x] Endpoint `GET /api/backoffice/error-logs` protegido por `isSuperAdmin` retornando logs paginados e filtrados.
- [x] Rota `/backoffice/audit/errors` e redirect `/backoffice/errors` com componentes seguindo o design system do GeraFeed.
- [x] Filtros funcionais:
  - Seleção de Tenant (todos, sem workspace/sistema ou workspace específico).
  - Seleção de Módulo (AI, RSS, BILLING, WORDPRESS, AFFILIATES, AUTH, BACKOFFICE, GENERAL).
  - Filtro por Usuário e busca textual (e-mail, nome, rota ou mensagem).
  - Filtro por Período de Data (Últimas 24h, 7 dias, 30 dias, 180 dias, todos).
- [x] Modal de detalhes exibindo mensagem original, payload formatado e stack trace para diagnóstico e simulação com botões de cópia.
- [x] Link na `BackofficeSidebar` adicionado em Governança & Logs.
- [x] `npx tsc --noEmit` e `npm run lint` PASS.

## Evidências
- `src/app/api/backoffice/error-logs/route.ts` criado com proteção server-side via `requireSuperAdmin()`, paginação, estatísticas (24h, 7d) e filtros múltiplos.
- `src/components/backoffice/error-logs-viewer.tsx` criado com filtros responsivos, cartões de métricas, tabela com badges e modal de inspeção com destaque de código.
- `src/app/(backoffice)/backoffice/audit/errors/page.tsx` e `src/app/(backoffice)/backoffice/errors/page.tsx` criados.
- `src/components/backoffice/backoffice-sidebar.tsx` atualizado com o item "Logs de Erro" e ícone `AlertTriangle`.
- `scripts/phase31/test-backoffice-logs.ts`: Teste automatizado validando filtros por tenant, módulo e busca textual executado com 100% de sucesso.
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).


## Definition of Done
- SuperAdmin consegue visualizar os erros com identificação clara de tenant.
- Todos os filtros solicitados funcionando corretamente.
- Modal de depuração exibe dados para simulação e identificação de causa raiz.
