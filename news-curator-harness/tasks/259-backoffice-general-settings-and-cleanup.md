# Task 259: Configurações Gerais do Sistema e Rotina de Limpeza de Logs

## Status
DONE

## Contexto
O usuário solicitou:
"Quero uma rotina de limpar registros que tenha mais de 180 dias para que não fique uma tabela muito grande (na verdade quero uma configuração para definir esse tempo - na configuração Geral)"

Precisamos de:
1. Implementar a página `/backoffice/settings` (que já existe como link na `BackofficeSidebar`, mas ainda não tem página).
2. Endpoints:
   - `GET /api/backoffice/settings`: retorna as configurações gerais do sistema (incluindo `error_log_retention_days`, default 180).
   - `PATCH /api/backoffice/settings`: atualiza as configurações gerais (apenas SuperAdmin).
   - `POST /api/backoffice/settings/cleanup-logs`: executa a rotina de expurgo de logs mais antigos que o tempo configurado (ou aceita override opcional de dias), retornando a contagem de registros deletados.
3. Interface em `/backoffice/settings`:
   - Seção "Políticas de Retenção e Logs".
   - Campo para configurar a retenção de logs de erro em dias (padrão 180).
   - Botão para acionar a rotina de limpeza manual ("Executar Limpeza Agora") com confirmação e exibição do total de registros excluídos.
   - Indicador do total de logs armazenados atualmente e data do log mais antigo.

## Critérios de Aceitação
- [x] Implementar `src/app/(backoffice)/backoffice/settings/page.tsx` e `src/components/backoffice/system-settings-view.tsx` com visual alinhado ao Design System.
- [x] Endpoints de leitura, atualização de configurações e acionamento da rotina de limpeza (`GET /api/backoffice/settings`, `PATCH /api/backoffice/settings`, `POST /api/backoffice/settings/cleanup-logs`).
- [x] Ação de limpeza deleta apenas registros com `createdAt < now - N dias`.
- [x] Validações de segurança: apenas SuperAdmin pode acessar e executar a limpeza (`requireSuperAdmin`).
- [x] Teste automatizado cobrindo a rotina de limpeza e alteração da configuração.
- [x] `npx tsc --noEmit` e `npm run lint` PASS.

## Evidências
- `src/app/api/backoffice/settings/route.ts` criado com suporte a leitura e atualização de `error_log_retention_days` e cálculo de estatísticas em tempo real.
- `src/app/api/backoffice/settings/cleanup-logs/route.ts` criado, executando o expurgo com cutoff dinâmico baseado nos dias configurados.
- `src/components/backoffice/system-settings-view.tsx` e `src/app/(backoffice)/backoffice/settings/page.tsx` criados com formulário de configuração e acionador manual com confirmação e métricas.
- `scripts/phase31/test-settings-and-cleanup.ts`: Teste automatizado validando a criação de registro antigo (>200 dias) e recente, execução do expurgo (exclusão de 1 registro antigo e preservação do recente) executado com 100% de sucesso.
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).


## Definition of Done
- SuperAdmin define dias de retenção (padrão 180) na tela de Configurações Gerais.
- Rotina de limpeza expurga com segurança apenas os registros antigos.
- Interface responsiva com feedback claro do número de registros limpos.
