# Task: 065-backoffice-workspaces

## Objetivo
Listagem e gestão rápida de Empresas (Workspaces).

## Escopo
- Tela `/admin/workspaces`.
- Tabela de Workspaces: Nome, Plano Atual, Qtd Créditos/Consumo de IA no mês, Status.
- Ação para inativar/ativar a empresa (setar `isActive`). Se `isActive=false`, a empresa não pode logar/processar nada.
- Botão "Mais opções" que leva para `/admin/workspaces/[id]`.

## Definition of Done
- [ ] Tabela renderiza Workspaces do banco.
- [ ] Toggle Ativar/Inativar Empresa salva no banco e bloqueia acesso do cliente se inativo.
