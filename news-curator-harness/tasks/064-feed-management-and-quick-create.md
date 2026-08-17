# Task 064. Feed Management + Quick Create

## Objetivo
Manter o cadastro de Feed global e permitir criação rápida a partir de um WordPress.

## Cadastro global
Campos:
- nome;
- RSS URL;
- Fonte/creditName;
- prompt default;
- active.

## Dentro do WordPress
A ação `+ Novo Feed` deve:
1. abrir formulário;
2. criar Source no Workspace;
3. criar associação WordPressSiteSource;
4. permitir definir override do prompt;
5. retornar à tela do site com feed selecionado.

## Definition of Done
- [ ] cadastro global funciona.
- [ ] quick create funciona.
- [ ] associação automática.
- [ ] prompt override.
- [ ] tenant isolation.
- [ ] testes.
- [ ] TypeScript PASS.
- [ ] Lint PASS.
