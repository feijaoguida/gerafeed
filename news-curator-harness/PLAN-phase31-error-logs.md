# Plano Phase 31 — Sistema de Log de Erros, Diagnóstico e Auditoria no Backoffice

## Estado
Autorizada pelo usuário em 2026-10-04.
Em andamento: Task 255 TODO -> IN_PROGRESS.

## Resultado esperado
Criar um sistema robusto e centralizado de log e tratamento de erros para o GeraFeed/News Curator.
Os erros continuarão sendo mascarados de forma elegante e amigável para os usuários finais com pequenas notificações nos cantos da tela, enquanto todas as informações brutas essenciais para diagnóstico (usuário, tela, rota/caminho, consulta/payload de entrada, tenant, módulo, mensagem original não tratada e stack trace) serão salvas no banco de dados.
No Backoffice, o SuperAdmin poderá filtrar os logs por tenant, módulo, usuário e data, inspecionar a causa raiz e reproduzir os problemas. O sistema também disponibilizará uma configuração geral de retenção de dados (padrão de 180 dias) e uma rotina de expurgo de logs antigos.

## Fonte da verdade
- Requisitos: [SPEC.md, Phase 31](SPEC.md#phase-31-sistema-de-log-de-erros-diagnóstico-e-auditoria-no-backoffice).
- Regras de execução: [AGENTS.md](AGENTS.md).
- Status/evidências: [PROGRESS.md](PROGRESS.md).
- Decisões arquiteturais: [docs/decisions.md](docs/decisions.md), ADR-091.

## Sequência de execução

| Task | Entrega | Depende de |
|---|---|---|
| [255](tasks/255-error-log-and-system-settings-schema.md) | Modelos `SystemErrorLog` e `SystemSetting`, migration e seed inicial | Autorização |
| [256](tasks/256-server-error-logger-and-api-handler.md) | Serviço central de logging e handler de API não-bloqueante com mascaramento | 255 |
| [257](tasks/257-client-error-boundary-and-toast-system.md) | Módulo client de captura, endpoint de reporte e toast popup nos cantos | 256 |
| [258](tasks/258-backoffice-error-logs-viewer.md) | Tela Backoffice de logs com filtros (tenant, módulo, usuário, data) e modal de stack trace | 255, 256 |
| [259](tasks/259-backoffice-general-settings-and-cleanup.md) | Tela de Configurações Gerais no Backoffice, retenção (180 dias) e rotina de expurgo | 255, 258 |
| [260](tasks/260-phase31-integration-and-hardening.md) | Integração end-to-end, testes de regressão, lint, tipos e evidências | 255–259 |

## Estratégia de validação

| Área | Cenários essenciais |
|---|---|
| Schema & Persistência | Criação dos modelos `SystemErrorLog` e `SystemSetting`, tipos estritos Prisma, chaves estrangeiras opcionais para não falhar com erros anônimos ou sem tenant |
| Logging no Servidor | Erros com contexto completo (user, tenant, rota, query, stack), não-bloqueante (falha no banco de log não interrompe a API), mascaramento de senhas/tokens no payload |
| Cliente & Popups | Erros no client enviados para `/api/error-logs`, toast minimalista no canto da tela sem travar a UI e com mensagem amigável |
| Backoffice & Filtros | Apenas SuperAdmin acessa (`isSuperAdmin: true`), filtro por tenant (Workspace), módulo, data e usuário; modal com stack trace formatado |
| Retenção & Expurgo | Configuração de retenção (padrão 180 dias), execução manual da rotina de limpeza apagando somente registros anteriores ao limiar |
| Não-regressão | TypeScript estrito (`tsc --noEmit`), lint sem erros, rotas e páginas existentes funcionando normalmente |
