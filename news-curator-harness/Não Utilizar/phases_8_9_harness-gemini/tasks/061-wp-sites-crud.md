# Task: 061-wp-sites-crud

## Objetivo
Criar interface para gerenciar múltiplos sites WordPress.

## Escopo
- Alterar `/settings/wordpress` para listar sites.
- Tela de criação/edição do WordPressSite (Url, credenciais).
- Incluir na tela de edição do WP Site a opção de definir Prompt Específico (Área do portal, estilos) que sobrepõe o global.
- Criptografia: Continuar usando o Helper AES-256-GCM para a `applicationPassword` salvando com base no workspaceId.

## Definition of Done
- [ ] CRUD funcional de WordPressSite na UI do Dashboard.
- [ ] Prompt específico sendo salvo.
