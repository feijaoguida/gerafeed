# Task: 066-backoffice-impersonation

## Objetivo
Tela de detalhes do Workspace no Backoffice permitindo alteração de regras do cliente.

## Escopo
- Criar a view `/admin/workspaces/[id]`.
- Exibir os dados da empresa. Permitir trocar o plano atrelado manualmente.
- Seção para manipular configurações daquele cliente: O Super Admin poderá adicionar/editar Feeds, configurações de IA e Prompts em nome do cliente.
- Dica: Reutilizar componentes do dashboard ou APIs, adaptando-os para aceitar um `overrideWorkspaceId` no payload caso a requisição venha de um admin.

## Definition of Done
- [ ] Super Admin consegue trocar o plano do cliente.
- [ ] Super Admin consegue editar Feeds e configurações do Workspace alvo.
