# Task 201: Seleção de Site WordPress e Categoria na Revisão Editorial

## Objetivo
Permitir que o usuário escolha para qual WordPress a notícia será enviada (e em qual categoria) durante a "Revisão Editorial". Além disso, permitir a definição de um site WordPress "Padrão" que virá pré-selecionado.

## Critérios de Aceite
- [ ] O banco de dados (Prisma) possui o campo `isDefault Boolean @default(false)` no model `WordPressSite`.
- [ ] A API de sites WordPress garante que apenas um site por Workspace possa ter `isDefault: true`.
- [ ] A interface de configurações de WordPress possui a funcionalidade (botão/checkbox) para marcar um site como padrão.
- [ ] A interface "Revisão Editorial" carrega os sites WordPress disponíveis e os lista em um dropdown "Site WordPress".
- [ ] O dropdown de categorias em "Revisão Editorial" filtra/carrega dinamicamente apenas as categorias do WordPress selecionado.
- [ ] O site WordPress definido como `isDefault` vem automaticamente selecionado ao revisar um artigo sem site pré-atribuído.
- [ ] A publicação de artigos utiliza o site escolhido no dropdown.

## Dependências
- 200-article-content-scraping-and-enrichment (Completa)

## Contexto
Quando o cliente possui mais de um WordPress configurado no workspace, ele precisa escolher facilmente para qual portal o artigo vai. A configuração atual permitia ver a categoria, mas não explicitava o site ou filtrava dinamicamente. Também faltava a capacidade de ter um "site preferido/padrão".
