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
isDefault
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

`isDefault`
- Flag booleana indicando se este é o site WordPress padrão do Workspace.
- Mutuamente exclusivo: se um for definido como true, os outros do mesmo Workspace devem ser false.

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
- ativo/inativo;
- Definir como Padrão (isDefault).

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

Na tela de "Revisão Editorial", o usuário deve poder alterar ou definir o `wordpressSiteId` do artigo antes de publicar. 
Ao selecionar um site WordPress diferente, a lista de categorias disponíveis para o artigo deve ser atualizada para mostrar apenas as categorias daquele site específico.
O dropdown de site WordPress deve vir pré-selecionado com o site que possuir `isDefault === true`, caso o artigo não tenha um site previamente atribuído.

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

---
# Phase 10. Affiliate Foundation & Mercado Livre Import

## 41. Objetivo
Criar o primeiro módulo Affiliate do GeraFeed usando Mercado Livre como provider inicial. O usuário fará a curadoria no próprio Mercado Livre, gerará o link afiliado e colará esse link no GeraFeed. O sistema deve resolver o destino, importar dados públicos confiáveis, apresentar preview e só persistir após confirmação.

## 42. Pré-condições
Assumir conta de afiliado e canal/site já configurados/validados externamente, além do WordPressSite já operacional no GeraFeed. Não criar workflow de cadastro/aprovação de canal no Mercado Livre.

## 43. Features de plano
Criar/reutilizar: `AFFILIATE_MODULE`, `AFFILIATE_ANALYTICS`, `AFFILIATE_MAX_PRODUCTS`, `AFFILIATE_MAX_PROGRAMS`. Toda API Affiliate valida entitlement server-side.

## 44. AffiliateProgram
```text
AffiliateProgram
- id
- code
- name
- providerType
- active
- createdAt
- updatedAt
```
Seed inicial: `MERCADO_LIVRE`.

## 45. AffiliateProvider
```ts
interface AffiliateProvider {
  code: string;
  capabilities(): AffiliateProviderCapabilities;
  validateAffiliateUrl(url: string): Promise<AffiliateUrlValidationResult>;
  resolveAffiliateUrl(url: string): Promise<ResolvedAffiliateLink>;
  fetchProductMetadata(input: ProductMetadataInput): Promise<ProductMetadataResult>;
}
```
Mercado Livre: geração automática de link = false; importação de link = true; importação de metadados = true; trackingLabel = true.

## 46. Affiliate URL como entrada
Entrada do importador: `affiliateUrl`. Saída do resolver: affiliateUrl, resolvedUrl, canonicalUrl opcional, externalProductId opcional e provider. Não exigir URL original manualmente quando for possível derivá-la.

## 47. Safe URL Resolver
Obrigatório: http/https, allowlist de hosts por provider, bloqueio de localhost/private/link-local, validação DNS/IP, validação de cada redirect, máximo de redirects, timeout, limite de body, sem cookies ou Authorization do GeraFeed. Nunca `fetch(userUrl)` sem proteção.

## 48. Importação de metadados
Pipeline: affiliateUrl → resolver seguro → URL final → externalProductId → fonte oficial/provider quando disponível → fallback isolado para metadados públicos estruturados → `NormalizedProductImport`.

Não acessar Portal do Afiliado autenticado nem endpoint privado não documentado.

## 49. NormalizedProductImport
```ts
type ProductImportStatus = "COMPLETE" | "PARTIAL" | "FAILED";
interface NormalizedProductImport {
  status: ProductImportStatus;
  externalProductId?: string;
  affiliateUrl: string;
  resolvedUrl?: string;
  canonicalUrl?: string;
  name?: string;
  brand?: string;
  description?: string;
  imageUrl?: string;
  specs?: Record<string,string>;
  seller?: string;
  price?: number;
  oldPrice?: number;
  currency?: string;
  metadataSource: string;
  fetchedAt: Date;
  warnings: string[];
}
```

## 50. Preview antes de persistir
`POST import` retorna preview. Usuário revisa, escolhe categoria, corrige campos e confirma. Somente então transaction cria/atualiza Product + ProductOffer.

## 51. Product
Produto conceitual, independente do marketplace. Campos sugeridos: workspaceId, categoryId, name, slug, brand, description, imageUrl, specs, pros, cons, rating, status, timestamps.

## 52. ProductOffer
Oferta concreta: workspaceId, productId, affiliateProgramId, externalProductId?, originalUrl?, resolvedUrl?, affiliateUrl, seller?, price?, oldPrice?, currency?, trackingLabel?, metadataSource?, metadataLastFetchedAt?, status, timestamps. `affiliateUrl` é obrigatório.

## 53. Deduplicação
Priorizar `workspaceId + affiliateProgramId + externalProductId`. Também comparar affiliateUrl/resolvedUrl normalizadas. Se já existir, oferecer atualizar/cancelar. Nunca duplicar silenciosamente.

## 54. Preço
Preço é snapshot e sempre deve possuir contexto de atualização (`metadataLastFetchedAt`). Conteúdo deve preferir CTA `Ver preço atual` em vez de transformar preço importado em verdade permanente.

## 55. Importação parcial
Em PARTIAL, usuário completa manualmente. IA não inventa fatos ausentes.

## 56. Definition of Done Phase 10
- [ ] Entitlements.
- [ ] AffiliateProgram Mercado Livre.
- [ ] AffiliateProvider.
- [ ] Safe resolver + SSRF protection.
- [ ] affiliateUrl como entrada.
- [ ] resolvedUrl/externalProductId quando possível.
- [ ] metadata import COMPLETE/PARTIAL/FAILED.
- [ ] preview.
- [ ] fallback manual.
- [ ] Product + ProductOffer transaction.
- [ ] dedupe.
- [ ] tenant isolation.
- [ ] TypeScript/Lint/Tests/Build PASS.

---
# Phase 11. Affiliate Catalog Management

## 57. Objetivo
Gerenciar produtos e ofertas importadas.

## 58. ProductCategory
Taxonomia própria do Workspace. Não reutilizar WordPressCategory.

## 59. Catálogo
Tela com busca, categoria, status, programa, possui oferta ativa e data de importação.

## 60. Produto
Detalhe com dados gerais, imagem, specs, pros/cons, ofertas e conteúdos relacionados.

## 61. Ofertas
Adicionar affiliateUrl, reimportar metadados, editar seller/trackingLabel, pausar/arquivar e selecionar oferta preferencial quando aplicável.

## 62. Refresh manual
Botão `Atualizar dados do Mercado Livre`. Sem cron nesta fase.

## 63. Billing
Criação de Product valida `AFFILIATE_MAX_PRODUCTS`.

## 64. Definition of Done Phase 11
Categorias, catálogo, busca/filtros, detalhe, ofertas, refresh manual, dedupe, limite de plano, tenant isolation e TypeScript/Lint/Tests/Build PASS.

---
# Phase 12. Affiliate Content Engine

## 65. Tipos
`PRODUCT_REVIEW`, `COMPARISON`, `BEST_PRODUCTS`, `BUYING_GUIDE`, `PROBLEM_SOLUTION`, `DEALS`, `SEASONAL`.

## 66. PromptTemplate
Cada tipo possui template próprio. Não reutilizar o prompt de notícias como solução única. Permitir default do sistema e override por Workspace.

## 67. ArticleProduct
Relaciona Article a Product/Offer com position, badge, score e recommendation opcionais.

## 68. Dados estruturados
IA recebe somente produtos selecionados e seus dados. Não pode adicionar produtos inexistentes nem inventar specs, seller ou preços.

## 69. Review
Não afirmar experiência física/teste real sem evidência.

## 70. Comparison
Comparar apenas atributos disponíveis/comuns.

## 71. Canonical Content Document
Conteúdo Affiliate novo usa blocos: RICH_TEXT, HEADING, PRODUCT_CARD, PRODUCT_COMPARISON, PROS_CONS, CTA, AFFILIATE_DISCLOSURE, IMAGE. Blocos referenciam IDs, não affiliateUrl.

## 72. Definition of Done Phase 12
Tipos, PromptTemplate, relações, Review, Comparison, Best Products, Buying Guide, Canonical Document, editor, human review e TypeScript/Lint/Tests/Build PASS.

---
# Phase 13. Publisher Abstraction & Affiliate Analytics

## 73. PublisherAdapter
```ts
interface PublisherAdapter {
  testConnection(): Promise<PublisherConnectionResult>;
  createDraft(input: PublishDocumentInput): Promise<PublicationResult>;
  publish(input: PublishDocumentInput): Promise<PublicationResult>;
  update(externalPublicationId: string, input: PublishDocumentInput): Promise<PublicationResult>;
}
```
Primeiro adapter: WordPress. Futuro: Blogger e Custom.

## 74. Renderer
Canonical Document → target renderer → PublisherAdapter. Renderer resolve ProductOffer ativa no publish.

## 75. Links
Links comerciais gerados com `rel="sponsored nofollow"`, target blank quando apropriado, CTA padrão `Ver preço atual`.

## 76. Disclosure
Conteúdo Affiliate recebe disclosure configurável pelo Workspace.

## 77. Publication Sync
Publication registra hash, lastPublishedAt e needsRepublish. Mudança relevante de ProductOffer marca publicações dependentes como desatualizadas sem reescrever documento canônico.

## 78. AffiliateClick
Registrar workspaceId, articleId, productId, offerId, publicationId, component, position, eventToken, createdAt.

## 79. Tracking
Href direto para affiliateUrl. Evento via sendBeacon/fetch keepalive. Falha de analytics não bloqueia navegação. Endpoint usa token opaco/assinado, não IDs arbitrários do client.

## 80. Dashboard
Mostrar produtos, ofertas, artigos Affiliate, cliques, top produtos, top artigos e top sites. Não exibir vendas/comissões/conversão como fatos sem integração oficial confiável.

## 81. Definition of Done Phase 13
PublisherAdapter, WordPress renderer, sponsored/disclosure, sync, click tracking, secure event token, dashboard, entitlement analytics e TypeScript/Lint/Tests/Build PASS.

---
# Phase 14. Limites de Plano, Restrições de IA & Correções de UX

## 82. Limite de Sites WordPress por Plano

O modelo `Plan` recebe o campo `maxWordPressSites` (inteiro). Padrão gratuito: 1. O `BillingService.checkLimit` deve suportar o recurso `WORDPRESS_SITES`. A rota `POST /api/wordpress/sites` deve validar o limite antes de criar um novo site. O Backoffice deve exibir e permitir editar `maxWordPressSites` no CRUD de Planos.

## 83. Limite Diário de Artigos por Plano

O modelo `Plan` recebe o campo `maxDailyArticles` (inteiro). Padrão gratuito: 5. O `BillingService.checkLimit` deve suportar o recurso `ARTICLES_DAILY` contando artigos com `processedAt` dentro do dia corrente (00:00 até 23:59 horário do servidor) para o workspace. A rota de processamento de IA deve bloquear com mensagem clara quando o limite diário OU mensal for atingido. O Backoffice deve exibir e permitir editar `maxDailyArticles` no CRUD de Planos. A resposta de limite atingido deve indicar qual limite foi violado (diário ou mensal) e quando ele será renovado.

## 84. Restrição de Áreas de Atuação do Portal por Plano

Feature chave: `ai_unlimited_niches` (BOOLEAN). Quando a feature estiver desabilitada no plano, a tela `/settings/ai` exibe apenas 3 áreas habilitadas para seleção: **Política**, **Negócios** e **Meio Ambiente**. As demais aparecem desabilitadas visualmente com um badge "Upgrade" e tooltip explicativo. Planos com `ai_unlimited_niches: true` exibem todas as áreas sem restrição. O servidor deve validar a área selecionada na rota `POST /api/ai/prompt-settings` e rejeitar com 403 se a área não estiver permitida para o plano.

## 85. Restrição de Estilos de Escrita por Plano

Feature chave: `ai_unlimited_styles` (BOOLEAN). Quando a feature estiver desabilitada no plano, a tela `/settings/ai` exibe apenas 4 estilos habilitados para seleção: **Sério**, **Informativo**, **Alegre** e **Atraente**. Os demais aparecem desabilitados visualmente com badge "Upgrade". O servidor deve validar os estilos selecionados na rota `POST /api/ai/prompt-settings` e rejeitar com 403 se qualquer estilo não estiver na lista permitida para o plano.

## 86. Restrição de Provedores de IA por Plano

Feature chave: `ai_advanced_providers` (BOOLEAN). Quando a feature estiver desabilitada no plano, a tela `/settings/ai` exibe apenas **OpenAI** e **OpenAI-Compatible** como opções selecionáveis de provedor. Os demais provedores (Gemini, Anthropic) aparecem desabilitados com badge "Upgrade". O servidor deve validar o provedor selecionado na rota `POST /api/ai/config` e rejeitar com 403 se o provedor não estiver na lista permitida para o plano.

## 87. Remoção do Preview de System Prompt

A seção "Preview do System Prompt Gerado" deve ser removida integralmente da tela `/settings/ai`, incluindo o cálculo live via `useMemo`. A importação de `buildSystemPrompt` deve ser mantida somente se utilizada em outro lugar; caso contrário, remover também.

## 88. Correções Visuais na Seção de Afiliados

A rota `/affiliates` deve redirecionar para `/affiliates/products` ou exibir uma tela de entrada coerente quando acessada diretamente. O layout de cards de produtos, ofertas e importador deve estar responsivo e sem quebras visuais em telas menores. A navegação lateral (Sidebar) deve exibir os links da seção de Afiliados de forma coerente e sem itens duplicados ou desalinhados. Tipografia, espaçamentos e bordas nas telas de afiliados devem seguir o design system do projeto.

## 89. Definition of Done Phase 14
Limites de WordPress/Artigos (diário+mensal) implementados e validados, features de restrição de nicho/estilo/provedor funcionando com bloqueio client+server, preview de prompt removido, layout de afiliados corrigido, Backoffice com campos novos, TypeScript/Lint/Tests/Build PASS.

---
# Phase 17. Affiliate Product Enrichment & Research

## 90. Objetivo
Enriquecer importação Mercado Livre e melhorar grounding do catálogo.

## 91. NormalizedProductImport v2
Adicionar quando disponível: sourceDescription, brand, marketplaceCategoryId/name, sourceSpecs, sourceRating, sourceReviewCount, reviewSamples, seller, price, oldPrice, currency. A importação continua COMPLETE/PARTIAL/FAILED e nunca inventa dados.

## 92. Source Description x Editorial Description
`sourceDescription` representa o marketplace. `description` representa edição editorial. Primeiro cadastro pode oferecer cópia explícita. Refresh nunca sobrescreve `description`.

## 93. Source Specs x Editorial Specs
`sourceSpecs` representa provider. `specs` é editorial. A UI pode oferecer `Copiar especificações importadas`.

## 94. Categoria externa
Guardar marketplaceCategoryId/name. Não substituir ProductCategory. Pode sugerir categoria interna, sempre com confirmação.

## 95. Oferta
Seller/preço/oldPrice/currency permanecem na ProductOffer e carregam metadataLastFetchedAt. Preço é snapshot.

## 96. ProductReviewSample
Criar entidade com id, workspaceId, productId, provider, rating?, text, sourceUrl?, capturedAt, createdAt. Importar no máximo 5 amostras públicas. Não guardar PII desnecessária. IA deve saber que são amostras qualitativas.

## 97. ProductReferenceSource
Criar entidade: id, workspaceId, productId, url, normalizedUrl, title?, summary?, status, fetchedAt?, errorCode?, timestamps. Status PENDING/PROCESSING/READY/FAILED.

Fluxo: URL → Safe Fetch → readable extraction → AI summary → READY. Reutilizar SSRF protection. Não persistir artigo completo sem necessidade.

## 98. Product Detail UI
Produto & Editorial: nome, marca, categoria interna, categoria ML, source/editorial description, source/editorial rating, pros/cons. Especificações: importadas/editoriais. Ofertas: seller, preço, oldPrice, refresh. Avaliações: até 5 samples. Conteúdos Relacionados: artigos internos + reference sources.

## 99. Refresh Merge Policy
Atualiza sourceDescription, sourceSpecs, marketplaceCategory, sourceRating/count, reviews, seller, preços e source image metadata. Preserva description, specs, pros, cons, rating editorial e ProductCategory.

## 100. Definition of Done Phase 17
- [ ] description source
- [ ] seller/preço
- [ ] marca/categoria externa
- [ ] specs source
- [ ] rating/count
- [ ] até 5 review samples
- [ ] source/editorial separados
- [ ] ProductReferenceSource + resumo IA
- [ ] refresh merge policy
- [ ] tenant isolation
- [ ] TypeScript/Lint/Tests/Build PASS

---
# Phase 18. Publishing Center & RSS Monetization

## 101. Objetivo
Dashboard passa a ser informativo. Criar `Publicar Posts` com dois fluxos: `Notícia/RSS` e `Conteúdo de Afiliado`.

## 102. Dashboard
Mostrar métricas, uso do plano, pendências, publicados, produtos, ofertas, cliques, sites, alerts e needsRepublish. Não concentrar formulários operacionais completos.

## 103. Fluxo RSS
WordPressSite → feeds/artigos → notícia → gerar/revisar → opcional Affiliate → categoria → publicar.

## 104. Monetização RSS
Se AFFILIATE_MODULE: toggle `Inserir produtos afiliados`. Ações: `Sugerir produtos com IA` e `Selecionar manualmente`.

## 105. Sugestão por IA
Input contém artigo e catálogo ACTIVE do Workspace. Output estruturado: productId, offerId?, confidence, reason, suggestedPlacement. IA só pode devolver IDs fornecidos; servidor valida. Sugestão exige aprovação humana.

## 106. ArticleAffiliatePlacement
Criar entidade com workspaceId, articleId, productId, offerId?, placementType, paragraphIndex?, position, label?. Tipos iniciais: PRODUCT_CARD, INLINE_CTA, AFTER_PARAGRAPH, TOP_RECOMMENDATION. Renderer resolve ProductOffer no publish.

## 107. Fluxo Affiliate
Escolher template → preencher inputs → escolher categoria/produtos conforme regra → título manual ou sugerido → gerar → revisar → escolher WordPressSite/category → publicar.

## 108. Regras de seleção
Centralizar `selectionMode`, `minProducts`, `maxProducts`, `requiresCategory`, `allowsSuggestedTitle`.

Defaults: PRODUCT_REVIEW = EXACT_ONE 1/1. COMPARISON = MULTIPLE min2. BEST_PRODUCTS = CATEGORY_AND_PRODUCTS. BUYING_GUIDE = CATEGORY com produtos conforme template.

## 109. Geração
Input: global PromptTemplate, Workspace AI context, type, title/keyword, category, products/offers, source/editorial metadata, reviews e reference summaries. Output: Canonical Content Document + SEO + ArticleProduct. Links não são escritos pela IA.

## 110. WordPress
Antes de publicar: destino, categoria, imagem, SEO, produtos, links resolvidos, disclosure quando aplicável.

## 111. Definition of Done Phase 18
- [ ] dashboard informativo
- [ ] Publicar Posts
- [ ] fluxo RSS
- [ ] RSS monetizado manual/IA
- [ ] placements estruturados
- [ ] fluxo Affiliate
- [ ] template input rules
- [ ] título sugerido
- [ ] canonical generation
- [ ] WordPress publish
- [ ] entitlement/tenant
- [ ] TypeScript/Lint/Tests/Build PASS

---
# Phase 19. Global Affiliate Prompt Governance

## 112. Objetivo
Prompts Affiliate passam a ser globais e administrados somente por SuperAdmin no Backoffice.

## 113. Regra substituída
A regra anterior `system default + workspace override` para Affiliate deixa de valer. Templates Affiliate ativos usados em geração são globais. Workspace não edita prompt.

## 114. Backoffice
Criar `/backoffice/affiliate-prompts`. SuperAdmin pode listar, editar, versionar, ativar/inativar e testar preview.

## 115. Template global
Campos: type, name, description, systemPrompt, userPromptTemplate, active, version, selectionMode, minProducts, maxProducts?, requiresCategory, allowsSuggestedTitle, variables.

## 116. Versionamento
Artigo Affiliate registra promptTemplateId e promptTemplateVersion para auditoria.

## 117. Variáveis
Validar placeholders suportados: product.name, product.brand, product.description, product.sourceDescription, product.specs, product.reviews, products, category.name, referenceSummaries e outros registrados. Variável desconhecida gera erro explícito.

## 118. Área funcional
Usuário comum pode selecionar template e ver nome/descrição, mas não editar systemPrompt/userPromptTemplate. Rota antiga de edição deve ser removida, redirecionada ou read-only. API de escrita tenant deve ser removida/bloqueada.

## 119. Workspace AI Context
Nicho, estilo, idioma e contexto editorial podem entrar como input permitido no template global, sem alterar o template persistido.

## 120. Definition of Done Phase 19
- [x] prompts Affiliate globais
- [x] override Workspace descontinuado
- [x] Backoffice manager
- [x] SuperAdmin server-side
- [x] constraints/variables
- [x] versioning/audit
- [x] preview
- [x] user read-only/select
- [x] global resolver
- [x] legacy preservado/migrado
- [x] TypeScript/Lint/Tests/Build PASS

---

# Phase 20. Billing Asaas Production Ready

## 121. Objetivo

Evoluir o billing existente para um fluxo SaaS funcional de produção usando Asaas como provider inicial.

O produto deverá permitir:

- criar Planos com preço mensal;
- configurar percentual de desconto anual;
- contratar plano mensal;
- contratar plano anual;
- recorrência sem fidelidade;
- cartão sem armazenar dados do cartão;
- boleto;
- Pix quando validado pelo contrato real do Asaas;
- histórico de pagamentos;
- controle de clientes;
- cancelamento de renovação;
- inadimplência/grace period;
- Backoffice financeiro operacional;
- reconciliação manual;
- Webhooks idempotentes.

A abstração `PaymentProvider` existente permanece obrigatória.

## 122. Princípio de responsabilidade

```text
GERAFEED
├── Plan
├── Pricing
├── BillingProfile
├── Subscription
├── Invoice / Payment Ledger
├── Entitlements
├── Access State
└── Audit
        │
        v
PaymentProvider
        │
        v
Asaas
├── Customer
├── Subscription
├── Payment
├── Checkout
└── Webhooks
```

O Asaas não é a fonte de verdade das regras de produto.

## 123. Plano mensal e anual

Plan deve suportar campos equivalentes a:

```text
monthlyPrice
annualDiscountPercent
```

Exemplo:

```text
monthlyPrice = 29.90
annualDiscountPercent = 16.4164...
```

Para o produto, a UI pode permitir percentual com precisão definida pelo projeto.

O cálculo anual:

```text
base = monthlyPrice * 12
discount = base * annualDiscountPercent / 100
annualAmount = base - discount
```

Para o exemplo comercial:

```text
29,90 * 12 = 358,80
annualAmount desejado = 299,90
```

O percentual correspondente pode ser calculado pela UI, mas a regra principal solicitada é que o operador informe o percentual.

## 124. Decimal e arredondamento

Usar `Decimal`/Prisma Decimal ou mecanismo monetário equivalente.

Não usar ponto flutuante binário como fonte de verdade.

Arredondar somente no ponto definido da regra monetária.

Valor enviado ao gateway deve possuir duas casas quando a API exigir.

## 125. annualPrice

Não tornar `annualPrice` um segundo valor editável independente nesta fase.

O valor anual deriva de:
- monthlyPrice;
- annualDiscountPercent.

A UI deve exibir preview:

```text
Mensal:
R$ 29,90 / mês

Anual:
R$ 299,90 / ano
Economia:
R$ 58,90
```

## 126. Backoffice de Planos

Evoluir o cadastro já existente.

Campos:

```text
Nome
Slug
Descrição
Preço mensal
Desconto anual (%)
Ativo
Destaque
Features
Limites
```

Preview automático do preço anual.

Validação:

```text
monthlyPrice >= 0
annualDiscountPercent >= 0
annualDiscountPercent < 100
```

Plano gratuito pode ter preço 0 e não gerar checkout.

## 127. Snapshot do contrato

Subscription não depende do Plan atual para descobrir quanto o cliente contratou.

Persistir snapshot equivalente a:

```text
planId
billingCycle
amount
annualDiscountPercentSnapshot?
planNameSnapshot?
provider
providerSubscriptionId?
currentPeriodStart
currentPeriodEnd
nextDueDate?
```

Se o administrador alterar o Plan depois:

```text
assinatura existente
!=
alterada automaticamente
```

Alteração de preço para clientes existentes deve ser feature futura ou operação explícita.

## 128. BillingCycle

Criar enum interno:

```text
MONTHLY
YEARLY
```

Mapeamento Asaas:

```text
MONTHLY -> MONTHLY
YEARLY  -> YEARLY
```

## 129. BillingMethod

Enum de domínio:

```text
CREDIT_CARD
BOLETO
PIX
```

O provider decide se uma combinação é suportada.

Não habilitar combinação não testada.

## 130. Observação importante sobre Pix

A documentação pública atual do Asaas apresenta informações não totalmente uniformes:

- FAQ de Assinaturas informa suporte a boleto, Pix e cartão;
- outra documentação de formas de cobrança orienta recorrência tradicional com boleto/cartão e Pix via QR Code do boleto;
- Pix Automático é um produto diferente, com autorização e controle de recorrência próprios.

Portanto:

### Phase 20

- CREDIT_CARD: suportado.
- BOLETO: suportado.
- PIX: implementar capability e contrato, mas habilitar somente após teste de sandbox da conta/API usada pelo projeto.
- PIX_AUTOMATIC: fora de escopo.

Se o sandbox não suportar assinatura `billingType=PIX`, a UI não deve fingir suporte.

Uma opção operacional aceitável é boleto recorrente com QR Code Pix quando aplicável pelo Asaas.

## 131. BillingProfile

Criar/reutilizar entidade de dados cadastrais de cobrança do Workspace.

Modelo sugerido:

```text
BillingProfile
--------------
id
workspaceId
name
cpfCnpj
email
mobilePhone?
postalCode?
address?
addressNumber?
complement?
province?
city?
providerCustomerId?
createdAt
updatedAt
```

`workspaceId` único.

Não duplicar dados existentes se Workspace/User já possuir campos apropriados. Inspecionar antes.

## 132. Customer Asaas

Antes de criar Subscription:

```text
Workspace
↓
BillingProfile
↓
Asaas Customer
↓
Subscription
```

Persistir:

```text
providerCustomerId
```

Para Asaas:

```text
cus_...
```

Enviar `externalReference` equivalente ao `workspaceId`/identificador interno estável.

## 133. Prevenção de Customer duplicado

Prioridade:

1. reutilizar `providerCustomerId` já persistido;
2. validar externalReference/cpfCnpj conforme provider;
3. somente criar Customer quando realmente não existir.

Nunca criar um novo Customer Asaas a cada checkout.

## 134. Dados de cartão

O GeraFeed não persiste:

```text
cardNumber
cvv
expirationMonth
expirationYear
```

O GeraFeed também não deve receber esses dados em Route Handler próprio na arquitetura preferida.

## 135. Hosted Checkout

Para cartão, preferir Asaas Checkout hospedado.

Fluxo:

```text
GeraFeed
→ cria Checkout
→ recebe link
→ redirect
→ cliente paga no Asaas
→ callback volta para GeraFeed
→ GeraFeed mostra "processando/confirmando"
→ Webhook confirma estado
```

Callback não libera plano.

## 136. BillingCheckoutSession

Criar modelo se necessário para correlação:

```text
BillingCheckoutSession
----------------------
id
workspaceId
planId
billingCycle
billingMethod
amount
provider
providerCheckoutId
externalReference
status
expiresAt?
createdAt
updatedAt
```

Não transformar CheckoutSession em Invoice.

## 137. Boleto/Pix sem cartão

Para meios que não exigem coleta de cartão no GeraFeed, `AsaasProvider` pode criar Subscription diretamente quando o contrato da API permitir.

O Customer deve estar sincronizado antes.

A aplicação deve retornar ao usuário os dados/link da cobrança gerada, não dados internos sensíveis.

## 138. Asaas Subscription

Criar assinatura recorrente com:

```text
customer
billingType
value
nextDueDate
cycle
description
externalReference
```

Não informar `endDate` ou limite de pagamentos quando a intenção for recorrência contínua sem fidelidade.

A recorrência termina quando o usuário cancela renovação/assinatura.

## 139. Sem fidelidade

Política interna:

```text
cancelAtPeriodEnd = true
```

Ao cancelar:

1. impedir futura renovação no provider;
2. guardar `canceledAt`;
3. preservar `currentPeriodEnd`;
4. manter acesso até o fim do período pago.

Mensal e anual seguem a mesma lógica.

Não implementar reembolso proporcional automático.

## 140. Upgrade/Downgrade

Nesta Phase 20:

- mudança de plano pode ser agendada para o próximo ciclo;
- não implementar pró-rata complexo;
- mudança imediata só se a implementação existente já tiver regra segura.

Se necessário, registrar `pendingPlanId`.

Não duplicar cobranças no mesmo período.

## 141. Subscription local

Evoluir modelo existente em vez de criar outro paralelo.

Campos esperados conforme necessidade:

```text
workspaceId
planId
provider
providerCustomerId?
providerSubscriptionId?
billingCycle
billingMethod
amount
annualDiscountPercentSnapshot?
status
currentPeriodStart
currentPeriodEnd
nextDueDate?
cancelAtPeriodEnd
canceledAt?
gracePeriodEndsAt?
createdAt
updatedAt
```

## 142. Status interno

Usar estados de domínio equivalentes:

```text
PENDING
ACTIVE
PAST_DUE
SUSPENDED
CANCELED
EXPIRED
```

Não copiar automaticamente todos os status do Asaas para o enum interno.

Guardar status bruto do provider separadamente quando útil.

## 143. Payment / Invoice

A assinatura agenda cobranças.

Quem tem status financeiro são as cobranças.

Evoluir `Invoice` existente ou entidade equivalente.

Campos:

```text
id
workspaceId
subscriptionId
provider
providerPaymentId
amount
billingMethod
status
dueDate
confirmedAt?
receivedAt?
overdueAt?
refundedAt?
providerStatus?
invoiceUrl?
createdAt
updatedAt
```

Nunca armazenar dados completos do cartão.

## 144. Histórico

Cliente deve conseguir visualizar:

```text
Data
Competência/período
Valor
Forma
Status
Vencimento
Pago/confirmado em
```

Quando houver URL segura do provider:

```text
Ver cobrança
```

Não expor URL secreta/tokenizada sem necessidade.

## 145. PAYMENT_CONFIRMED

Para política de acesso:

```text
PAYMENT_CONFIRMED
```

pode ativar/liberar o período contratado.

Não esperar obrigatoriamente:

```text
PAYMENT_RECEIVED
```

pois esse segundo evento representa liquidação/recebimento pelo recebedor.

Guardar ambos quando ocorrerem.

## 146. PAYMENT_OVERDUE

Ao receber overdue:

```text
Invoice = OVERDUE
Subscription = PAST_DUE
```

Mas o acesso passa por grace period.

## 147. Grace Period

Configuração:

```text
BILLING_GRACE_PERIOD_DAYS
```

Default sugerido:

```text
3
```

Fluxo:

```text
OVERDUE
↓
PAST_DUE
↓
gracePeriodEndsAt
↓
se não regularizar
SUSPENDED
```

Pagamento confirmado dentro do período:

```text
ACTIVE
```

## 148. Webhooks

Criar endpoint dedicado, por exemplo:

```text
POST /api/webhooks/asaas
```

ou seguir convenção existente.

Validar:

```text
asaas-access-token
```

Token diferente da API Key.

Environment:

```text
ASAAS_WEBHOOK_TOKEN
```

## 149. WebhookEvent

Persistir processamento idempotente:

```text
ProviderWebhookEvent
--------------------
id
provider
providerEventId
eventType
resourceId?
status
receivedAt
processedAt?
errorCode?
createdAt
```

Unique:

```text
provider + providerEventId
```

## 150. Idempotência

Fluxo:

```text
receber evento
↓
autenticar
↓
providerEventId já existe?
├── sim → responder 2xx
└── não
    ↓
    registrar
    ↓
    processar transaction
    ↓
    marcar processed
```

O mesmo evento duas vezes não cria:
- duas invoices;
- dois períodos;
- dois cancelamentos;
- dois créditos.

## 151. Eventos de pagamento

Cobrir pelo menos:

```text
PAYMENT_CREATED
PAYMENT_UPDATED
PAYMENT_CONFIRMED
PAYMENT_RECEIVED
PAYMENT_OVERDUE
PAYMENT_REFUNDED
PAYMENT_PARTIALLY_REFUNDED
PAYMENT_DELETED
PAYMENT_CREDIT_CARD_CAPTURE_REFUSED
PAYMENT_CHARGEBACK_REQUESTED
```

A lista concreta deve ser validada contra a documentação/API vigente durante a implementação.

Parser deve ignorar eventos desconhecidos com logging seguro, sem derrubar a fila.

## 152. Eventos de Subscription

Cobrir:

```text
SUBSCRIPTION_CREATED
SUBSCRIPTION_UPDATED
SUBSCRIPTION_INACTIVATED
SUBSCRIPTION_DELETED
```

Mapear para domínio sem apagar histórico.

## 153. Não depender da ordem

Evento pode chegar fora de ordem.

Services devem comparar:
- provider IDs;
- timestamps quando disponíveis;
- estado local;
- estado atual consultado quando necessário.

## 154. PaymentProvider v2

Evoluir interface para capacidades equivalentes:

```ts
interface PaymentProvider {
  createOrUpdateCustomer(...): Promise<...>;

  createCheckout(...): Promise<...>;

  createSubscription(...): Promise<...>;
  getSubscription(...): Promise<...>;
  updateSubscription(...): Promise<...>;
  cancelSubscription(...): Promise<...>;

  getPayment(...): Promise<...>;
  listSubscriptionPayments(...): Promise<...>;

  parseWebhook(...): Promise<...>;

  capabilities(): PaymentProviderCapabilities;
}
```

Não obrigar todos providers futuros a suportarem todos recursos sem capabilities.

## 155. AsaasProvider

Implementação Asaas traduz DTO externo para DTO interno.

Nunca devolver payload cru diretamente ao domínio/client.

## 156. BillingService e acesso

BillingService deve resolver:

```text
Workspace
→ Subscription
→ Current Period
→ Billing State
→ Entitlements
```

Plano pago não é liberado apenas porque `Subscription.status` do Asaas é ACTIVE.

O pagamento e período contratado precisam estar coerentes.

## 157. Cliente. Área de cobrança

Criar/atualizar:

```text
Configurações
└── Plano e cobrança
```

Mostrar:

- plano atual;
- mensal/anual;
- valor contratado;
- próxima cobrança;
- status;
- forma;
- cancelamento agendado;
- histórico.

Ações:

```text
Alterar plano
Cancelar renovação
Reativar, quando possível
Atualizar dados cadastrais
Ver cobrança
```

## 158. Checkout de contratação

Fluxo:

```text
Planos
→ escolher plano
→ Mensal | Anual
→ mostrar preço
→ escolher meio disponível
→ validar BillingProfile
→ criar/sincronizar Customer
→ checkout/subscription
→ aguardar Webhook
```

Para plano FREE:
- não criar Asaas Customer/Subscription sem necessidade.

## 159. Tela de sucesso

Após callback:

Não mostrar:

```text
Pagamento confirmado
```

sem confirmação real.

Mostrar algo como:

```text
Recebemos seu retorno.
Estamos confirmando o pagamento.
```

E consultar o estado local atualizado por Webhook/reconciliation.

## 160. Backoffice Billing

Dentro da Empresa/Workspace:

```text
Plano e cobrança
```

Mostrar:

- BillingProfile;
- providerCustomerId mascarado/parcial quando útil;
- plano;
- ciclo;
- valor;
- provider subscription;
- status;
- nextDueDate;
- currentPeriodEnd;
- cancelAtPeriodEnd;
- grace;
- invoices/payments.

## 161. Ações SuperAdmin

Permitir:

```text
Sincronizar Customer
Sincronizar Subscription
Sincronizar Payments
Cancelar renovação
Reativar, quando suportado
Agendar troca de plano
```

Ações financeiras críticas exigem confirmação.

Não permitir editar status para "PAID" manualmente sem uma operação de override auditável e explicitamente projetada.

## 162. Auditoria

Registrar ações administrativas relevantes:

```text
actorUserId
workspaceId
action
entity
entityId
metadata segura
createdAt
```

Nunca guardar:
- API Key;
- card;
- CVV;
- token sensível.

## 163. Reconciliação manual

Webhook é primário, mas criar:

```text
Sincronizar com Asaas
```

Fluxo:

```text
provider customer
provider subscription
provider payments
↓
normalizar
↓
comparar
↓
corrigir local
↓
audit
```

Sem Cron nesta fase.

## 164. Falhas e recuperação

Tratar:

- Customer duplicado;
- checkout expirado;
- cartão recusado;
- payment overdue;
- webhook duplicado;
- webhook fora de ordem;
- subscription não encontrada;
- payment desconhecido;
- provider indisponível;
- timeout;
- cancelamento.

## 165. Sandbox obrigatório

Antes de ativar produção:

Testar no sandbox Asaas:

### Customer
- criação;
- reutilização;
- externalReference.

### MONTHLY
- cartão;
- boleto;
- Pix se disponível.

### YEARLY
- cartão;
- boleto;
- Pix se disponível.

### Webhook
- confirmed;
- received;
- overdue;
- subscription update/inactivation.

### Cancelamento
- cancelAtPeriodEnd interno;
- provider sem nova renovação.

## 166. Pix capability gate

Durante integração:

```text
asaasProvider.capabilities().recurringPix
```

deve refletir o comportamento realmente validado.

Se false:

- não mostrar PIX recorrente tradicional;
- não enviar billingType PIX;
- oferecer meios suportados.

Não implementar Pix Automático implicitamente.

## 167. Segurança

- API Key Asaas server-only.
- Webhook token server-only.
- webhook token diferente da API key.
- compare token de forma segura.
- PII somente ao Workspace/SuperAdmin.
- nenhum card data no banco/log.
- callbacks não alteram pagamento.
- provider DTOs validados.

## 168. Definition of Done Phase 20

- [ ] monthlyPrice.
- [ ] annualDiscountPercent.
- [ ] cálculo anual.
- [ ] snapshot contratual.
- [ ] BillingProfile.
- [ ] Customer Asaas sem duplicação.
- [ ] PaymentProvider v2.
- [ ] Hosted Checkout para cartão.
- [ ] Monthly Subscription.
- [ ] Yearly Subscription.
- [ ] Boleto.
- [ ] Pix capability validada em sandbox.
- [ ] Subscription local.
- [ ] Invoice/Payment ledger.
- [ ] Webhook token.
- [ ] idempotência.
- [ ] payment events.
- [ ] subscription events.
- [ ] PAYMENT_CONFIRMED libera corretamente.
- [ ] overdue/grace/suspension.
- [ ] cancelAtPeriodEnd.
- [ ] customer billing UI.
- [ ] backoffice billing.
- [ ] manual reconciliation.
- [ ] audit.
- [ ] nenhum dado de cartão persistido.
- [ ] tenant isolation.
- [ ] TypeScript PASS.
- [ ] Lint PASS.
- [ ] Tests PASS.
- [ ] Build PASS.

---

# Phase 21. Article Content Enrichment & Scraping

## 169. Objetivo
Permitir que o News Curator extraia o conteúdo textual completo das matérias originais a partir das URLs fornecidas pelos feeds RSS, salvando em `Article.originalContent` e repassando esse conteúdo aos provedores de IA (OpenAI, Gemini, Anthropic, OpenAI-Compatible) durante a reescrita de notícias.

## 170. Motivação
Feeds RSS geralmente disponibilizam apenas snippets curtos (~1-2 frases). Isso limita a capacidade da IA de produzir artigos ricos, detalhados e otimizados para SEO. A extração automatizada da matéria original supre a IA com todas as especificações técnicas, declarações e contexto do texto original sem inventar fatos.

## 171. Requisitos
- Schema: campo `originalContent` opcional (`@db.Text`) no modelo `Article`.
- Scraper: módulo seguro (`src/lib/scraper.ts`) com timeout de 10s, sanitização de HTML, remoção de scripts/nav/footer/aside e limite de caracteres de segurança.
- RSS Ingestion: ao processar fontes RSS em `processRssSources`, buscar o conteúdo completo de cada novo artigo antes ou logo após a persistência.
- Provedores de IA: alimentar o user prompt com o conteúdo completo original e instruir o modelo a usá-lo como base factual prioritária.
- Fallback gracioso: caso a página retorne erro (403, 404, paywall), o fluxo continua sem quebras usando a descrição do RSS.

## 172. Definition of Done Phase 21
- [ ] Campo `originalContent` no modelo `Article`.
- [ ] Módulo `scraper.ts` implementado.
- [ ] Integração com `src/lib/rss.ts` na coleta RSS.
- [ ] Atualização dos providers de IA com `originalContent`.
- [ ] Ajuste no prompt editorial.
- [ ] TypeScript PASS, Lint PASS, Build PASS.

