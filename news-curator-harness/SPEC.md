# News Curator. Phase 8 e Phase 9

> **Nota de versionamento:** o arquivo recebido já registra a Phase 7 como concluída, referente a Bugfixes & Behavioral Corrections. Para não apagar histórico, as duas novas fases solicitadas são numeradas internamente como **Phase 8** e **Phase 9**. A Phase 8 corresponde à funcionalidade solicitada como “Fase 7” pelo produto, e a Phase 9 corresponde à funcionalidade solicitada como “Fase 8”.

---

# Phase 8. Multi-WordPress, Feeds e Prompt por Destino

## 1. Objetivo

Evoluir o News Curator para permitir que um mesmo Workspace possua múltiplas configurações/sites WordPress, cada um representando um destino editorial diferente.

Exemplos:

- Site de Humor
- Site de Política
- Site de Tecnologia
- Site de Notícias Gerais

Os feeds continuam cadastrados no Workspace, porém devem poder ser associados a um ou vários sites WordPress.

Cada feed deve possuir uma configuração de prompt padrão. A associação Feed ↔ WordPress deve permitir um override de prompt para aquele destino.

---

## 2. Motivação

Hoje a configuração WordPress e os feeds estão conceitualmente próximos de uma instalação única.

Isso não é suficiente para um SaaS onde uma empresa poderá operar vários portais.

A nova arquitetura deve separar claramente:

```text
Workspace
   |
   +-- Sources / Feeds
   |
   +-- WordPressSites
   |      |
   |      +-- Feed assignments
   |      +-- Prompt override
   |
   +-- Articles
   +-- AI configuration
   +-- Billing
```

---

## 3. Regra de arquitetura

Não criar uma segunda tabela chamada “ConfigurationWordPress” apenas para representar um site.

Criar uma entidade de domínio própria:

```text
WordPressSite
```

Ela representa um destino WordPress do Workspace.

A tabela `Configuration` continua existindo para configurações gerais/estruturadas, inclusive configurações de IA e outras preferências que não justificam uma entidade própria.

A antiga configuração `wordpressConnection` deve ser migrada para a nova entidade quando necessário.

---

## 4. Modelo WordPressSite

Criar ou evoluir uma entidade equivalente a:

```text
WordPressSite
---------------------------
id
workspaceId
name
url
username
encryptedApplicationPassword
active
createdAt
updatedAt
```

### Campos

`workspaceId`
- Tenant obrigatório.

`name`
- Nome amigável do site.
- Exemplo: `Portal Política`.

`url`
- URL base do WordPress.

`username`
- Usuário da REST API.

`encryptedApplicationPassword`
- Application Password criptografada com o helper da Phase 2.

`active`
- Permite desativar o destino sem apagar histórico.

---

## 5. Configuração central e WordPress

A antiga chave:

```text
wordpressConnection
```

não deve continuar representando o único WordPress quando a nova entidade estiver ativa.

Pode existir uma fase de compatibilidade/migração, mas o novo código deve trabalhar com:

```text
WordPressSite
```

A configuração visual de cada site deve carregar suas próprias credenciais, categorias e estado de sincronização.

---

## 6. Modelo Source / Feed

`Source` continua pertencendo ao Workspace.

Campos já existentes devem ser preservados, incluindo:

```text
id
workspaceId
name
rssUrl
active
creditName
```

Adicionar o conceito de prompt padrão do feed, se ele ainda não estiver representado por uma configuração equivalente.

Sugestão:

```text
defaultPromptType
```

O nome exato pode seguir a convenção existente no código.

Esse prompt padrão vale para todas as configurações WordPress que utilizarem aquele feed, salvo quando houver override.

---

## 7. Relação Feed ↔ WordPress

Um feed pode alimentar vários sites.

Um site pode possuir vários feeds.

Portanto, usar relação N:N através de uma entidade de associação.

Sugestão:

```text
WordPressSiteSource
---------------------------
id
workspaceId
wordpressSiteId
sourceId
active
promptTypeOverride
createdAt
updatedAt
```

### Regras

- `workspaceId` obrigatório.
- `wordpressSiteId` deve pertencer ao mesmo Workspace.
- `sourceId` deve pertencer ao mesmo Workspace.
- Um mesmo feed não pode ser associado duas vezes ao mesmo WordPress.
- `promptTypeOverride` é opcional.

---

## 8. Resolução do prompt

A ordem de precedência deve ser:

```text
Override do vínculo Feed ↔ WordPress
        ↓
Prompt padrão do Feed
        ↓
Configuração padrão global do Workspace
```

Exemplo:

```text
Feed: G1
Prompt padrão: INFORMATIVE

WordPress: Portal Humor
Override: HUMORISTIC

Resultado:
HUMORISTIC
```

Outro destino:

```text
WordPress: Portal Política
Sem override

Resultado:
INFORMATIVE
```

Criar uma função/service central para essa resolução. Não espalhar regras de prioridade pelo frontend.

---

## 9. Cadastro de Feed

O cadastro global de Feed/RSS deve continuar permitindo:

- nome;
- URL RSS;
- ativo/inativo;
- Fonte/creditName;
- tipo de prompt padrão.

O usuário não é obrigado a escolher um WordPress nessa tela.

Um feed pode existir no Workspace antes de ser atribuído a qualquer destino.

---

## 10. Configuração WordPress

A tela de cada WordPress deve permitir:

### Dados básicos
- nome do site;
- URL;
- usuário;
- Application Password;
- ativo/inativo.

### Conexão
- testar conexão;
- sincronizar categorias.

### Feeds associados
Mostrar lista de feeds do Workspace:

```text
[✓] G1
[✓] UOL
[ ] Reuters
[✓] Canaltech
```

Permitir:

- associar feed existente;
- remover associação;
- ativar/desativar associação;
- escolher prompt override.

### Criar Feed
Dentro da tela WordPress deve existir uma ação:

```text
+ Novo Feed
```

Ela permite cadastrar um novo Feed e já associá-lo ao WordPress atual.

---

## 11. Prompt na configuração WordPress

No nível do site WordPress deve existir uma seção de configuração editorial.

Ela pode definir:

```text
Prompt padrão deste site
```

Porém a precedência final permanece:

```text
Feed ↔ WordPress override
→ Feed default
→ Site default
→ Workspace default
```

> Caso a implementação atual não possua um “prompt padrão do site”, essa capacidade deve ser adicionada nessa fase porque resolve o caso de um portal ter identidade editorial diferente.

A ordem de precedência deve ser documentada no código.

---

## 12. Conflito de requisitos de prompt

A aplicação deve distinguir:

```text
Prompt global do Workspace
Prompt padrão do WordPress
Prompt padrão do Feed
Override Feed ↔ WordPress
```

Não duplicar o conteúdo inteiro do prompt em cada registro. Armazenar somente o identificador/tipo/opções necessárias para resolver a configuração.

---

## 13. Processamento de Artigos

Ao processar uma notícia, o artigo deve estar associado ao destino WordPress que receberá o conteúdo.

Portanto, o processamento deve conhecer:

```text
workspaceId
sourceId
wordpressSiteId
```

O prompt deve ser resolvido através do serviço central de prioridade.

Um artigo não deve usar aleatoriamente a configuração do Workspace quando seu destino já estiver definido.

---

## 14. Article e destino

Adicionar, se ainda não existir:

```text
wordpressSiteId
```

ao Article.

Motivo:

- saber para qual site aquela curadoria foi criada;
- filtrar por configuração WordPress;
- recuperar o prompt correto;
- publicar no destino correto;
- permitir auditoria histórica.

A relação deve respeitar o Workspace.

---

## 15. Listagem de notícias

A tela de artigos/feeds processados deve possuir filtros:

### Data

Permitir pelo menos:

- data inicial;
- data final.

Usar a data editorial do feed (`originalPublishedAt`) quando o objetivo for filtrar pela data da notícia.

Não confundir com `createdAt`, que representa o momento em que o sistema ingeriu o registro.

### Feed

Dropdown/select com Sources do Workspace.

### Configuração WordPress

Dropdown/select com WordPressSites ativos/inativos conforme a necessidade da tela.

---

## 16. Card de notícia

Todo card deve exibir a data do feed.

Exemplo:

```text
Nova ferramenta de IA é lançada

Fonte: Canaltech
Feed: Canaltech
Data: 16/08/2026 14:30
Destino: Portal Tecnologia

[Editar]
```

A data mostrada como “Data” deve preferencialmente ser `originalPublishedAt`.

Se a fonte não fornecer data, mostrar um estado explícito como:

```text
Data não informada pela fonte
```

---

## 17. Processamento manual

O botão existente de processamento deve continuar manual.

O processamento deve respeitar os feeds atribuídos ao WordPress selecionado.

Não buscar uma notícia de um feed que não esteja associado ao destino, salvo uma ação explicitamente global que siga as regras existentes.

---

## 18. Isolamento multi-tenant

Todas as entidades novas devem possuir `workspaceId` quando são entidades de domínio do tenant.

A relação `WordPressSiteSource` também deve ser tenant-aware.

Nunca aceitar apenas IDs fornecidos pelo client sem validar pertencimento ao Workspace da sessão.

---

## 19. Compatibilidade / Migração

Se o sistema atual possui uma única configuração `wordpressConnection`, criar task específica de migração.

Estratégia esperada:

```text
Config antiga
     ↓
criar WordPressSite default
     ↓
migrar credenciais
     ↓
associar feeds existentes
     ↓
validar
     ↓
manter compatibilidade temporária se necessária
```

Não apagar dados antigos antes de confirmar a migração.

---

# Phase 9. Backoffice e SuperAdmin

## 20. Objetivo

Criar um Backoffice separado da área funcional do SaaS para operação administrativa da plataforma.

O Backoffice deve ser acessível somente por usuários marcados como `superAdmin`.

A área deve possuir layout, navegação, APIs e autorização próprias.

Ela utiliza os mesmos dados e serviços do sistema, mas não deve depender da UI do Workspace.

---

## 21. Separação

A aplicação terá duas áreas principais:

```text
Área funcional
/dashboard
/settings
...

Backoffice
/backoffice
/backoffice/plans
/backoffice/companies
...
```

O Backoffice não deve aparecer no menu do usuário comum.

---

## 22. SuperAdmin

Adicionar no modelo `User`, caso ainda não exista:

```text
isSuperAdmin Boolean @default(false)
```

Esse atributo é global e não depende de Workspace.

Ter `WorkspaceUser.role = ADMIN` não significa `superAdmin`.

Somente:

```text
User.isSuperAdmin === true
```

autoriza o acesso ao Backoffice.

---

## 23. Proteção de acesso

Criar autorização server-side para `/backoffice`.

Não confiar apenas em esconder links.

Acesso direto deve retornar:

- redirect para login quando não autenticado;
- forbidden/redirect quando autenticado sem `isSuperAdmin`.

APIs `/api/backoffice/*` também devem validar `isSuperAdmin`.

Server Actions utilizadas pelo Backoffice devem usar a mesma regra.

---

## 24. Seed SuperAdmin

Criar seed do Prisma para um usuário SuperAdmin.

Nunca hardcodar senha real.

Usar environment variables:

```text
SUPERADMIN_EMAIL
SUPERADMIN_PASSWORD
```

O seed deve:

1. validar as variáveis;
2. criar ou atualizar o usuário;
3. definir `isSuperAdmin = true`;
4. gerar hash da senha usando o mecanismo de autenticação existente;
5. não imprimir a senha em logs.

A seed deve ser idempotente.

---

## 25. Backoffice. Dashboard

Criar dashboard operacional com indicadores úteis.

Mínimo:

```text
Empresas
Planos
Assinaturas ativas
Notícias processadas no período
```

Não criar analytics complexos sem requisito.

---

## 26. Backoffice. Planos

Criar menu:

```text
Planos
```

Funcionalidades:

- listar planos;
- criar plano;
- editar plano;
- ativar/inativar;
- ordenar/exibir destaque quando aplicável;
- selecionar Features;
- definir quantidades/limites.

---

## 27. Modelo de Feature

Como os planos precisam selecionar Features e quantidades, a modelagem deve separar:

```text
Feature
PlanFeature
```

Exemplo:

```text
Feature
----------------
id
key
name
description
valueType
active
```

```text
PlanFeature
----------------
planId
featureId
enabled
limit
```

`valueType` pode representar:

```text
BOOLEAN
QUANTITY
```

Se o sistema já possuir mecanismo de features equivalente, reutilizá-lo em vez de duplicar.

---

## 28. Plano

O formulário de plano deve permitir:

```text
Nome
Slug
Descrição
Preço
Periodicidade
Ativo
Destaque
```

E uma seção:

```text
Features

[✓] Geração com IA
    Limite: 100

[✓] Fontes RSS
    Limite: 10

[✓] Sites WordPress
    Limite: 3

[ ] Recurso X
```

Os nomes concretos das features devem reutilizar as keys já existentes quando disponíveis.

---

## 29. Backoffice. Empresas

No produto, “Empresa” representa o `Workspace` atual.

Não criar uma entidade `Company` duplicada sem necessidade.

Menu:

```text
Empresas
```

Tela de listagem:

- busca por nome;
- busca por email/identificador quando aplicável;
- filtro por status;
- filtro por plano;
- paginação;
- ordenação.

---

## 30. Card/linha da Empresa

A listagem deve mostrar:

```text
Empresa
Plano
Status
Créditos/uso
Sites WordPress
Feeds
Data de criação
```

Ações:

```text
Inativar
Mais opções
```

O saldo/uso de créditos deve ser calculado através do BillingService existente quando possível.

Não duplicar a regra de cálculo de limites no Backoffice.

---

## 31. Inativar Empresa

“Inativar” não deve apagar dados.

A operação deve alterar o status da empresa/Workspace para um estado inativo já suportado ou criar um status equivalente.

Antes de inativar:

- exigir confirmação;
- impedir operação acidental.

O estado inativo deve ser respeitado pela área funcional.

---

## 32. Mais opções. Área interna da Empresa

Ao clicar em `Mais opções`, abrir uma área interna do Backoffice específica do Workspace.

Exemplo:

```text
/backoffice/companies/[workspaceId]
```

A página deve possuir abas/seções:

```text
Visão geral
Plano e cobrança
Créditos / uso
Feeds
WordPress
IA
Prompts
Configurações
```

---

## 33. Operação sobre a Empresa

O operador SuperAdmin poderá visualizar e, quando permitido, alterar:

### Geral
- nome;
- status;
- dados básicos;
- identificadores.

### Plano
- plano atual;
- status da assinatura;
- limites;
- datas relevantes.

### Créditos
- saldo;
- uso;
- possibilidade de ajuste manual, se o domínio atual permitir.

### Feeds
- listar;
- criar;
- editar;
- ativar/desativar;
- atribuir WordPress;
- editar prompt default.

### WordPress
- listar sites;
- criar;
- editar;
- testar conexão;
- sincronizar categorias;
- atribuir feeds.

### IA
- visualizar provider;
- alterar provider;
- alterar modelo;
- alterar Base URL;
- substituir API Key;
- testar conexão.

Secrets nunca devem ser exibidos em plaintext, nem mesmo para SuperAdmin.

### Prompts
- editar área do portal;
- estilos;
- configurações de prompt;
- overrides.

---

## 34. Regra de segurança do Backoffice

SuperAdmin possui capacidade operacional elevada, mas não pode receber secrets descriptografados na UI.

Quando um segredo precisar ser substituído:

```text
[Senha/API Key atual configurada]

Nova credencial:
[_______________]

[Salvar]
```

Nunca:

```text
Senha atual: ******** -> valor descriptografado
```

---

## 35. Auditoria mínima

Operações destrutivas ou administrativas importantes devem possuir logs de auditoria estruturados quando houver infraestrutura existente para isso.

Mínimo recomendado:

```text
actorUserId
workspaceId
action
entity
entityId
createdAt
```

Não registrar secrets.

Se auditoria não existir no projeto, criar uma task específica somente se necessária para cumprir os critérios de segurança do Backoffice.

---

## 36. APIs do Backoffice

Sugestão:

```text
/api/backoffice/dashboard
/api/backoffice/plans
/api/backoffice/features
/api/backoffice/companies
/api/backoffice/companies/:id
/api/backoffice/companies/:id/feeds
/api/backoffice/companies/:id/wordpress
/api/backoffice/companies/:id/ai
/api/backoffice/companies/:id/prompts
```

Todos devem aplicar autorização `superAdmin` server-side.

---

## 37. Isolamento

Mesmo o SuperAdmin deverá acessar Workspaces explicitamente identificados.

As consultas devem validar:

```text
workspaceId
```

antes de alterar dados.

A diferença é que a origem do `workspaceId` pode ser uma seleção administrativa feita no Backoffice em vez da sessão comum do tenant.

Não remover o isolamento tenant-per-row.

---

## 38. Definition of Done da Phase 8

- [ ] WordPressSite criado.
- [ ] Múltiplos WordPress por Workspace.
- [ ] Credenciais criptografadas.
- [ ] Migration da configuração WordPress antiga.
- [ ] Source continua global no Workspace.
- [ ] Feed ↔ WordPress N:N.
- [ ] Feed pode ser criado dentro do WordPress.
- [ ] Prompt default no Feed.
- [ ] Prompt default no WordPress.
- [ ] Override Feed ↔ WordPress.
- [ ] Resolução de prompt centralizada.
- [ ] Article referencia WordPressSite.
- [ ] Filtro por data.
- [ ] Filtro por Feed.
- [ ] Filtro por WordPress.
- [ ] Card mostra data do feed.
- [ ] Multi-tenant preservado.
- [ ] TypeScript PASS.
- [ ] Lint PASS.
- [ ] Testes PASS.
- [ ] Build PASS.

---

## 39. Definition of Done da Phase 9

- [ ] Backoffice isolado em layout/rotas.
- [ ] SuperAdmin criado no User.
- [ ] Proteção de páginas.
- [ ] Proteção de APIs.
- [ ] Seed idempotente.
- [ ] Dashboard.
- [ ] CRUD de Planos.
- [ ] CRUD de Features quando necessário.
- [ ] PlanFeature com enabled/limit.
- [ ] Listagem de Empresas/Workspaces.
- [ ] Busca e filtros.
- [ ] Plano e créditos/uso na listagem.
- [ ] Inativação.
- [ ] Área interna da Empresa.
- [ ] Feeds administráveis.
- [ ] WordPress administrável.
- [ ] IA administrável.
- [ ] Prompts administráveis.
- [ ] Secrets protegidos.
- [ ] Isolamento tenant preservado.
- [ ] TypeScript PASS.
- [ ] Lint PASS.
- [ ] Testes PASS.
- [ ] Build PASS.

---

# 40. Princípio de implementação

O sistema continua sendo um monólito Next.js.

Não introduzir:

- microserviço;
- fila;
- Redis;
- RabbitMQ;
- Cron;
- Docker obrigatório;

apenas para implementar estas fases.

O Backoffice é uma segunda área da mesma aplicação, não um segundo sistema.
