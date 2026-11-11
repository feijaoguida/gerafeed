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

## 135. Hosted Checkout e URL da Fatura Asaas

Para pagamento, devemos preferir a fatura oficial do Asaas (`invoiceUrl`) atrelada à assinatura gerada. A `invoiceUrl` é a tela hospedada do Asaas que aceita Pix (QR Code), Cartão de Crédito e Boleto independentemente do `billingType` configurado na assinatura.

O `billingType` padrão para assinaturas deve ser `"BOLETO"` (a API do Asaas **não aceita** `"UNDEFINED"` em assinaturas). O Asaas gera automaticamente QR Code Pix no boleto quando aplicável. A `invoiceUrl` oferece todas as formas de pagamento ao cliente.

Não usar `paymentLinks` (`POST /v3/paymentLinks`) para checkout de assinaturas — esse endpoint é para links genéricos e exige domínio configurado na conta Asaas.

Fluxo:

```text
GeraFeed
→ recebe intenção de upgrade (`/api/billing/checkout`)
→ verifica se Dados Cadastrais estão completos (senão retorna `BILLING_PROFILE_REQUIRED`)
→ garante que Customer existe no Asaas (`ensureCustomer`) com CPF/CNPJ válido
→ cria Subscription no Asaas com `billingType = "BOLETO"` e valor exato
→ busca cobranças da assinatura (`GET /v3/subscriptions/{id}/payments?limit=1`)
→ extrai `invoiceUrl` da primeira cobrança
→ redireciona o cliente para a `invoiceUrl`
→ cliente paga no Asaas (escolhe Pix, Cartão ou Boleto na tela hospedada)
→ Asaas dispara Webhook `PAYMENT_CONFIRMED` / `PAYMENT_RECEIVED`
→ Webhook no GeraFeed ativa a assinatura (`ACTIVE`)
```

Jamais realizar redirecionamento cego para `checkout=success` se o `checkoutUrl` falhar.

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

## 137. Retorno do Checkout e Dados Cadastrais

- Se o usuário tentar iniciar um checkout sem os Dados Cadastrais completos, redirecionar para a página de `/settings/billing` com os parâmetros de intenção (`?redirect=upgrade&planId=...`).
- Após preencher, o sistema deve fornecer uma via rápida para continuar o checkout (botão "Continuar Contratação").
- O status de `checkout=success` só deve ser exibido se a URL da fatura for validada, oferecendo botão para "Abrir Fatura" pendente.

## 138. Asaas Subscription

Criar assinatura recorrente no Asaas via API (`POST /v3/subscriptions`) com:

```text
customer: (ID do Customer Asaas, obrigatório)
billingType: "BOLETO" (padrão; a invoiceUrl gerada aceita Pix/Cartão/Boleto)
value: (valor exato, obrigatório)
nextDueDate: (data do primeiro vencimento, formato YYYY-MM-DD)
cycle: "MONTHLY" ou "YEARLY"
description: "Assinatura GeraFeed - [Nome do Plano]"
externalReference: (workspaceId)
```

A API do Asaas **não aceita** `billingType: "UNDEFINED"` em assinaturas. Use `"BOLETO"` como padrão.

Após criar a assinatura, obrigatoriamente fazer fetch subsequente em `GET /v3/subscriptions/{subscriptionId}/payments?limit=1` para extrair a propriedade `invoiceUrl` do primeiro pagamento e usá-la como URL de Checkout. Se `invoiceUrl` não existir na resposta, montar fallback: `https://www.asaas.com/i/{paymentId}`.

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

---

# Phase 22. Design System GeraFeed (Fundação & Backoffice Showcase)

## 173. Objetivo
Criar a fundação do Design System proprietário do GeraFeed baseado na identidade visual oficial ("Conteúdo que flui. Inteligência que publica."), estruturado com tokens semânticos nativos para Modo Claro e Modo Escuro, tipografia Sora (títulos) e Inter (interface), componentes primitivos tipados via `class-variance-authority` (CVA), e uma vitrine/página interativa no Backoffice (`/backoffice/design-system`) para visualização de todos os componentes e tokens.

## 174. Regra Fundamental de Execução
**NÃO refatorar telas existentes nesta fase.** A Phase 22 cria exclusivamente a fundação de tokens, utilitários, componentes primitivos/compostos e a página de visualização no Backoffice. A migração das telas existentes só ocorrerá nas fases subsequentes após autorização expressa do usuário.

## 175. Pilares da Fundação
1. **Tokens Semânticos**: Variáveis CSS declaradas no `globals.css` integradas ao Tailwind CSS 4 via `@theme inline`. Cores neutras navy e superfícies contrastadas no Dark Mode, fundos limpos e bordas suaves no Light Mode.
2. **Tipografia Oficial**: Fontes `Sora` e `Inter` integradas via `next/font/google`.
3. **Utilitário Central**: `cn` em `src/lib/utils.ts` consolidando `clsx` e `tailwind-merge`.
4. **Componentes Primitivos com CVA**:
   - `Button`: Variantes (`default`, `secondary`, `outline`, `ghost`, `destructive`, `gradient`, `link`), tamanhos (`sm`, `md`, `lg`, `icon`), estados de loading com spinner, ícones Lucide.
   - `Badge`: Variantes semânticas (`default`, `secondary`, `success`, `warning`, `danger`, `info`, `purple`, `outline`).
   - `Card Primitives`: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` com variantes (`default`, `elevated`, `interactive`, `highlighted`).
   - `StatCard`: Métricas com títulos, valores, descrições, ícones, tendências e ações.
   - `Form Controls`: `Input`, `Textarea`, `Select`, `Switch`, `Label`, `FormField` (com suporte a error, required, helper text).
   - `Feedback & Layout`: `PageHeader`, `SectionHeader`, `EmptyState`, `Alert`, `Progress`, `Skeleton`, `IconButton`, `StatusIndicator`, `BrandDecoration`.
   - `Sidebar Primitives`: `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarSection`, `SidebarSectionLabel`, `SidebarItem`, `SidebarFooter`.
5. **Vitrine no Backoffice**: Rota `/backoffice/design-system` (com atalho `/design-system`) demonstrando todas as variantes, controles e alternância em tempo real entre Modo Claro e Escuro.

## 176. Definition of Done Phase 22
- [ ] Tokens semânticos criados no CSS e mapeados no Tailwind 4.
- [ ] Fontes Sora e Inter integradas com classes utilitárias de tipografia.
- [ ] Componente `Button` com CVA, gradient de marca e loading spinner.
- [ ] Componentes de `Card` e `StatCard` com suporte a Light e Dark mode.
- [ ] Componentes de formulário (`Input`, `Textarea`, `Select`, `Switch`, `FormField`) acessíveis.
- [ ] Componentes de navegação e layout (`PageHeader`, `SectionHeader`, `EmptyState`, `Progress`).
- [ ] Primitivas de `Sidebar` estruturadas e tipadas.
- [ ] Página de vitrine `/backoffice/design-system` (e `/design-system`) implementada e funcional.
- [ ] Nenhuma tela pré-existente alterada ou quebrada.
- [ ] `npx tsc --noEmit`: PASS.
- [ ] `npm run lint`: PASS.
- [ ] `npm run build`: PASS.

---

# Roadmap de Migração de Telas (Fases 23 a 27)

- **Phase 23**: Telas Públicas & Shell (Landing, Login, Registro, Shell da Aplicação e Sidebar).
- **Phase 24**: Dashboard, Curadoria & Publicação (`/dashboard`, `/articles`, `/articles/[id]`, `/publishing`).
- **Phase 25**: Módulo de Afiliados (`/affiliates/dashboard`, `/products`, `/offers`, `/import`, `/prompts`).
- **Phase 26**: Configurações & Billing (`/settings/wordpress`, `/settings/sources`, `/settings/ai`, `/settings/billing`, `/upgrade`).
- **Phase 27**: Backoffice SuperAdmin (`/backoffice`, `/companies`, `/plans`, `/affiliate-prompts`).

# Phase 28. SEO, Measurement & Organic Acquisition Foundation

## 230. Objetivo

Preparar tecnicamente o GeraFeed para descoberta, indexação, mensuração e aquisição orgânica.

A fase deve tratar quatro camadas separadas:

```text
Crawling / Indexing
        ↓
Metadata / Entity
        ↓
Measurement / Attribution
        ↓
Landing Pages / Blog
```

O foco é a infraestrutura. Conteúdo editorial em escala será operado depois sobre esta base.

## 231. Contexto atual

O produto usa Next.js App Router, TypeScript, Prisma, PostgreSQL, Tailwind CSS v4, Vercel e Auth.js.

A identidade visual oficial já existe e deve ser preservada:

- Primary Blue: #2563EB
- Primary Purple: #7C3AED
- Accent Teal: #00C2A8
- Dark / Ink: #0F172A
- Sora para títulos
- Inter para textos e interface
- gradiente de marca Blue → Purple

As telas públicas já passaram por migração para o Design System na Phase 23. Esta fase não recria o Design System.

## 232. Política de indexação

Criar uma política explícita de rotas.

### Indexáveis

Inicialmente:

```text
/
/como-funciona
/automacao-wordpress
/rss-para-wordpress
/curadoria-de-conteudo-com-ia
/para-agencias
/para-portais-de-noticias
/blog
/blog/[slug]
/termos
/privacidade
```

Observação: termos e privacidade podem ser indexáveis, mas não devem competir com landing pages. Não precisam entrar como prioridade comercial.

### Não indexáveis

Rotas de autenticação, aplicação e Backoffice não devem competir no Google:

```text
/login
/register
/settings/*
/dashboard
/articles/*
/publishing/*
/affiliates/*
/backoffice/*
/api/*
```

Usar `noindex` em páginas HTML que podem ser rastreadas. Não depender somente de `robots.txt` para retirar uma URL do índice.

Rotas privadas continuam protegidas por autenticação/autorização. SEO não é mecanismo de segurança.

## 233. Metadata

Definir metadata base no App Router com URL canônica do produto:

```text
https://www.gerafeed.com.br
```

A home deve ter metadata própria, não herdada por login/register.

Baseline sugerido para home:

### Title

```text
GeraFeed | Automação de Conteúdo com IA para WordPress
```

### H1

```text
Automatize a Curadoria e Publicação de Conteúdo no WordPress com IA
```

### Description

```text
Monitore feeds RSS, transforme pautas em artigos, revise com IA e publique em múltiplos sites WordPress. Automatize sua operação editorial com o GeraFeed.
```

Todas as futuras landing pages devem possuir title, description, canonical, Open Graph e social image coerentes com a intenção da página.

## 234. Sitemap

Implementar sitemap usando convenções do Next.js App Router.

Regras:

- conter apenas URLs indexáveis e canônicas;
- nunca listar login, registro, área autenticada, APIs ou Backoffice;
- refletir novas landing pages e posts do blog automaticamente;
- usar `lastModified` apenas quando houver valor real ou derivável;
- não inventar atualização diária para páginas que não mudaram;
- manter URL absoluta com HTTPS e host canônico `www.gerafeed.com.br`.

## 235. Robots

Implementar robots usando convenções do Next.js App Router.

Objetivos:

- declarar sitemap;
- permitir crawling das áreas públicas;
- evitar crawling inútil de APIs e áreas administrativas;
- nunca tratar robots.txt como proteção de dados;
- evitar bloquear páginas que precisam ser lidas pelo crawler para processar um `noindex`, especialmente páginas públicas de autenticação se elas já estiverem conhecidas pelo Google.

## 236. Canonical

Todo conteúdo público indexável deve possuir canonical consistente.

Regras:

- uma URL canônica por documento;
- sem parâmetros de tracking no canonical;
- preferir host oficial com `www`;
- não canonicalizar páginas diferentes para a home por conveniência;
- páginas do blog canonicalizam para seu próprio slug.

## 237. Dados estruturados

A home deve emitir JSON-LD válido para as entidades apropriadas.

Baseline:

- `Organization`
- `WebSite`
- `SoftwareApplication`

Regras:

- usar apenas dados factuais;
- não emitir `aggregateRating`, `review`, número de clientes ou estatísticas sem fonte real e verificável no produto;
- `sameAs` usa somente perfis sociais oficiais existentes;
- logo deve apontar para asset público estável;
- `applicationCategory` deve refletir software/SaaS de produtividade/editorial;
- preço em schema só deve existir se houver uma oferta pública clara e coerente com a página.

Posts do blog devem suportar `Article` ou `BlogPosting` quando a fundação do blog estiver pronta.

## 238. Google Tag Manager

O código da aplicação deve carregar um único container GTM em produção quando configurado.

Variável sugerida:

```text
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

Regras:

- não hardcodar ID;
- sem falha quando variável estiver ausente em desenvolvimento;
- evitar instalação duplicada;
- GA4 deve ser configurado dentro do GTM, não em uma segunda implementação direta paralela;
- carregar scripts de maneira compatível com performance do Next.js;
- validar via Tag Assistant/Preview externamente.

## 239. Consentimento

Criar fundação de preferências de consentimento para analytics.

Escopo inicial:

```text
necessary = always true
analytics = user choice
marketing = false / reservado para futuro
```

Antes de consentimento de analytics, estado padrão deve ser negado para armazenamento analítico quando a estratégia escolhida assim exigir.

A implementação deve:

- não quebrar navegação;
- ser acessível por teclado;
- usar Design System GeraFeed;
- persistir escolha de maneira adequada;
- permitir reabrir preferências;
- não usar dark patterns;
- integrar estado com GTM/Google Consent Mode quando GTM estiver configurado.

A adequação jurídica final à LGPD depende da política de privacidade e orientação jurídica da operação. O código não deve declarar conformidade legal absoluta.

## 240. Eventos de aquisição orgânica

Criar helper central de analytics baseado em `dataLayer`.

Proibir envio de PII.

Eventos mínimos:

```text
cta_click
sign_up_completed
wordpress_connected
rss_source_added
first_article_generated
first_article_published
begin_checkout
```

`purchase` ou `subscription_confirmed` só deve ser emitido de forma confiável quando existir um ponto real de confirmação financeira. Callback visual de checkout não é confirmação de pagamento.

Propriedades permitidas devem ser categóricas e não sensíveis, por exemplo:

```text
cta_location
page_path
plan_code_public
content_type
source_channel
```

Não enviar:

```text
email
name
cpfCnpj
userId
workspaceId
article body
affiliateUrl
API keys
```

## 241. Landing pages

Criar arquitetura pública SEO reaproveitando o Design System existente.

Landing pages iniciais:

1. `/como-funciona`
2. `/automacao-wordpress`
3. `/rss-para-wordpress`
4. `/curadoria-de-conteudo-com-ia`
5. `/para-agencias`
6. `/para-portais-de-noticias`

Cada página precisa:

- intenção de busca própria;
- title próprio;
- H1 único;
- descrição clara;
- blocos escaneáveis;
- links internos naturais;
- CTA para cadastro/teste;
- FAQ somente quando houver perguntas úteis, sem fabricar FAQ apenas para schema;
- screenshots/provas do produto quando disponíveis;
- sem alegações de resultados não comprovados.

Não criar páginas doorway com texto quase idêntico trocando uma keyword.

## 242. Linguagem de posicionamento

Evitar posicionamento centrado em "anti-plágio" ou promessa de tornar conteúdo de terceiros automaticamente original.

Preferir:

```text
curadoria editorial assistida por IA
monitoramento de fontes
transformação de pautas
contextualização
revisão humana
publicação multissite WordPress
operação editorial
```

Imagens devem ser tratadas como processamento/otimização e atribuição conforme regras do produto. Não prometer que crop/filtro elimina direitos autorais.

## 243. Blog

Criar `/blog` e `/blog/[slug]` com fundação estática/SSG compatível com Vercel.

Requisitos:

- escolher a solução mais simples compatível com dependências atuais;
- preferir solução filesystem Markdown/MDX se não houver CMS;
- não introduzir CMS externo nesta fase;
- frontmatter mínimo: title, description, slug, publishedAt, updatedAt opcional, author, category, tags, image opcional, draft;
- drafts não entram em sitemap;
- lista do blog com cards usando Design System;
- página de artigo com HTML semântico;
- heading hierarchy correta;
- canonical;
- Open Graph;
- JSON-LD BlogPosting/Article;
- links internos;
- imagens com alt significativo;
- data de publicação verdadeira;
- `updatedAt` somente quando realmente revisado.

## 244. Conteúdos iniciais

A infraestrutura deve ficar preparada para os cinco primeiros briefs:

1. Como automatizar um blog WordPress com RSS + IA sem prejudicar o SEO
2. Conteúdo com IA é penalizado pelo Google? Guia para WordPress
3. RSS para WordPress: como transformar feeds em posts completos
4. Como criar um portal de notícias no WordPress com automação editorial
5. Autoblogging WordPress: plugin, n8n ou plataforma SaaS?

A Phase 28 pode criar placeholders/drafts apenas se explicitamente solicitado. Não publicar conteúdo superficial automaticamente para completar a task.

## 245. Performance

Novas implementações não devem degradar a landing page de forma desnecessária.

Regras:

- scripts de terceiros controlados;
- imagens responsivas;
- sem JS client-side quando Server Component resolve;
- evitar dependências pesadas só para SEO;
- preservar acessibilidade;
- usar semantic HTML;
- validar build final.

## 246. Definition of Done Phase 28

- [ ] Política de indexação explícita.
- [ ] Metadata base corrigida.
- [ ] Home com title/description/OG próprios.
- [ ] Login/Register e áreas privadas não indexáveis.
- [ ] Canonicals consistentes.
- [ ] sitemap.xml funcional.
- [ ] robots.txt funcional e referenciando sitemap.
- [ ] Organization JSON-LD factual.
- [ ] WebSite JSON-LD factual.
- [ ] SoftwareApplication JSON-LD factual.
- [ ] GTM integrado por env, sem duplicação.
- [ ] Consent foundation implementada.
- [ ] Helper dataLayer central.
- [ ] Eventos orgânicos mínimos instrumentados.
- [ ] Seis landing pages públicas implementadas.
- [ ] Blog foundation implementada.
- [ ] Blog entra dinamicamente no sitemap.
- [ ] Rotas privadas não entram no sitemap.
- [ ] Nenhuma PII enviada ao analytics.
- [ ] Design System preservado.
- [ ] Light/Dark preservados onde aplicável.
- [ ] TypeScript PASS.
- [ ] Lint PASS.
- [ ] Tests PASS quando aplicável.
- [ ] Build PASS.
- [ ] Evidence registrada por task.

---

# Phase 29. Funil de Aquisição, Verificação de E-mail (OTP) e Onboarding de Checkout Asaas

## 1. Objetivo

Implementar a jornada completa de conversão do visitante desde a Home Page até a ativação da conta:
1. Conectar os botões do carrossel de planos na Home à página de cadastro, preservando a escolha do plano (`plan` e `cycle`).
2. Criar camada modular de envio de e-mails transacionais via Adapter Pattern (`resend`, `smtp` e `mock`), configurável via `.env`.
3. Validar a veracidade do e-mail do usuário através de um código numérico de 6 dígitos (OTP) inserido na própria tela de cadastro antes da criação definitiva da conta, prevenindo e-mails descartáveis ou forjados (como `teste@teste.com.br`).
4. Armazenar credenciais de acesso com hash criptográfico seguro (`bcryptjs`) e fator de trabalho (SALT rounds = 10) no banco de dados.
5. Conduzir o usuário cadastrado com plano pago para uma etapa de preenchimento de dados de faturamento (`BillingProfile`: CPF/CNPJ, Telefone, CEP/Endereço) e direcioná-lo automaticamente ao checkout hospedado do **Asaas**.
6. Manter o fluxo do plano gratuito simplificado (vai diretamente para o Dashboard após confirmação de e-mail e senha).

---

## 2. Motivação

Atualmente:
- Os cards de planos na Home apontam para `/register` sem nenhum parâmetro de contexto, descartando o plano que o usuário escolheu.
- A rota `/api/auth/register` cria usuários imediatamente sem qualquer comprovação de que o e-mail digitado existe e pertence ao usuário.
- O modelo `User` não armazena hash de senha, e o provedor de credenciais não autentica senhas de usuários comuns de forma segura.
- Usuários que desejam assinar um plano pago caem no plano gratuito por padrão e não são direcionados para preencher dados fiscais e pagar a assinatura no gateway Asaas.

A Phase 29 fecha o ciclo de aquisição com integridade de dados e alta conversão.

---

## 3. Regras de Arquitetura

### A. Camada de E-mail (Adapter Pattern)
- Localização: `src/lib/mail/`.
- Contrato: Interface `EmailAdapter` com método `sendMail(options: EmailOptions): Promise<SendMailResult>`.
- Provedores suportados:
  - `ResendAdapter`: consome a API do Resend via SDK oficial (`resend`), ideal para o limite free de 100 envios/dia.
  - `SmtpAdapter`: utiliza `nodemailer` para envio via servidores SMTP tradicionais.
  - `MockAdapter`: exibe o e-mail e o código OTP no terminal quando em ambiente local de desenvolvimento ou testes.
- Seleção: Controlada exclusivamente pela variável de ambiente `EMAIL_PROVIDER="resend" | "smtp" | "mock"`.
- Extensibilidade: A adição de provedores futuros (como Mailgun ou SendGrid) deve ocorrer criando uma nova classe que implementa `EmailAdapter`, sem alterações nas regras de negócio.

### B. Confirmação de E-mail via OTP de 6 Dígitos
- Reutilizar a tabela nativa `VerificationToken` no Prisma (`identifier`, `token`, `expires`).
- O código gerado deve ser numérico (6 dígitos) gerado via `crypto.randomInt(100000, 999999).toString()`.
- O hash do código (ou código seguro com expiração curta) tem validade de 15 minutos.
- A tela de cadastro deve validar o código inline, sem redirecionar o usuário para fora da aplicação.
- Mecanismo anti-flood: reenvio só é permitido após contagem regressiva de 60 segundos.

### C. Persistência de Senha com Salt
- O modelo `User` deve conter o campo `passwordHash String?`.
- Criptografia executada exclusivamente no servidor com `bcryptjs` (rounds = 10).
- Em `src/auth.ts`, o `authorize(credentials)` deve validar `await bcrypt.compare(password, user.passwordHash)`.
- Senhas fracas (menos de 6 caracteres) devem ser rejeitadas tanto no frontend quanto na API.

### D. Onboarding de Faturamento e Checkout Asaas
- Ao concluir a criação da conta:
  - Se `plan === "free"` ou ausente: sessão criada e redireciona para `/dashboard`.
  - Se plano pago (ex: `plan === "pro"`): exibe etapa de dados fiscais (CPF/CNPJ, Telefone celular, CEP com preenchimento automático, Logradouro, Número, Bairro, Cidade, Estado).
- Os dados são salvos em `BillingProfile`.
- A API `/api/billing/checkout` é invocada com `planId` e `cycle`.
- O usuário é redirecionado para a `checkoutUrl` retornada pelo gateway Asaas.

---

## 4. Tasks da Phase 29

- `240-email-adapter-foundation`: Camada de abstração de e-mails com Adapter Pattern (Resend, SMTP, Mock).
- `241-user-password-hash-security`: Migração do schema Prisma para `passwordHash`, rotinas de hash e validação no Auth.js.
- `242-otp-verification-api`: Geração criptográfica do código OTP de 6 dígitos, expiração no `VerificationToken` e endpoints de envio e checagem.
- `243-home-pricing-plan-selection`: Propagação do plano na Home (`pricing-carousel.tsx`) e memorização de intenção de compra.
- `244-register-stepper-otp-flow`: Interface de cadastro em passos com verificação OTP inline na mesma tela e criação segura da conta.
- `245-billing-onboarding-and-asaas-checkout`: Formulário de dados fiscais (`BillingProfile`) e redirecionamento para o checkout hospedado do Asaas.
- `246-acquisition-funnel-hardening-e2e`: Testes automatizados, validação de limites, auditoria de segurança (sem vazamento de senha/tokens), TypeScript, lint e build.

---

## 5. Definition of Done Phase 29

- [ ] Adapter de e-mail funcional com suporte a Resend, SMTP e Mock em desenvolvimento.
- [ ] Chaveamento por `EMAIL_PROVIDER` no `.env`.
- [ ] Código OTP de 6 dígitos gerado e enviado por e-mail com template responsivo do GeraFeed.
- [ ] Bloqueio de cadastros com e-mails inválidos, não verificados ou inexistentes.
- [ ] Modelo `User` com `passwordHash` e validação com salt rounds no login de credenciais.
- [ ] Home Page propagando plano e ciclo escolhidos para a página de registro.
- [ ] Cadastro com plano gratuito acessando o Dashboard imediatamente após criação.
- [ ] Cadastro com plano pago solicitando dados de cobrança e redirecionando para o Asaas.
- [ ] Proteção contra PII em logs e analytics.
- [ ] TypeScript PASS (`npx tsc --noEmit`).
- [ ] Lint PASS (`npm run lint`).
- [ ] Build PASS (`npm run build`).
- [ ] Evidências registradas em `PROGRESS.md`.



---

# Phase 30. Shopee, Imagens Originais e Blocos de Afiliados na Revisão

## 1. Estado e autorização

**Implementação parcial — tasks 247–251 DONE; 252–254 TODO.** Execução encerrada após a
task 251 por solicitação do usuário em 2026-10-03. O usuário autorizou executar
as tasks 247–254 em sequência, com testes e harness atualizado. Não publicar em produção.
A Phase 29 e suas evidências permanecem preservadas.

## 2. Objetivo e escopo

1. Importar produtos através de links de afiliados Shopee, mantendo Mercado Livre.
2. Usar imagens originais cadastradas no produto no corpo do artigo e nos cards; repetição permitida.
3. Repetir cards de recomendação no meio e no final dos novos artigos comerciais.
4. Atualizar Conteúdo & Pesquisa com linguagem amigável, atalho para review e artigos reais vinculados.
5. Na revisão, inserir um bloco para um ou vários produtos na posição do cursor.
6. Oferecer card com foto, card sem foto, grade, carrossel e botão com subtítulo.
7. Liberar ações de afiliados somente através do entitlement `AFFILIATE_MODULE`.

Aplica-se à revisão de notícias/RSS e artigos comerciais. Não alterar automaticamente posts
já publicados nem gerar/publicar conteúdo ao abrir o wizard.

## 3. Evidências da inspeção inicial (sem implementação)

- `src/lib/affiliate/factory.ts` registra apenas Mercado Livre.
- `src/lib/affiliate/seed.ts` contém apenas o programa Mercado Livre.
- `src/components/affiliate/affiliate-importer.tsx` não envia seleção de provider.
- Cards em `canonical-document.ts` e `publisher/wordpress-renderer.ts` não exibem a foto.
- `review-generator.ts` usa a primeira imagem como destaque e exige segunda/terceira imagem
  para certos blocos do corpo, deixando produtos com uma única imagem sem esses blocos.
- Conteúdo & Pesquisa em `product-detail.tsx` exibe placeholder fixo de artigos relacionados.
- O wizard não recebe produto inicial pela navegação do detalhe.
- O editor comercial salva `content`, enquanto a publicação pode preferir `canonicalContent`;
  as duas representações precisam ser sincronizadas para a edição chegar ao WordPress.
- Existem caminhos distintos de renderização: `wordpress.ts`, o adapter/renderer do publisher
  e o preview do editor. Todos precisam respeitar os mesmos contratos visuais e de referências.
- `ArticleProduct` tem unicidade por artigo/produto; ocorrências repetidas de um card não são
  novos vínculos nesta tabela.

Revalidar estes pontos ao iniciar, pois o repositório pode mudar entre planejamento e execução.

## 4. Importação Shopee

### Experiência

O importador apresenta Mercado Livre e Shopee, com seleção explícita de marketplace.
Texto sugerido: “Cole seu link de afiliado. Vamos buscar os dados disponíveis para você revisar.”
Fluxo: selecionar marketplace → colar link → buscar → revisar/completar → confirmar.
Ao trocar marketplace ou URL depois do preview, invalidar o preview anterior.

Preservar o link afiliado informado, incluindo parâmetros de atribuição. URL resolvida e URL
canônica são informações separadas e não substituem o link comercial.
Não gerar links afiliados, acessar contas ou solicitar login/senha Shopee.

### Provider e resolução

Implementar `ShopeeAffiliateProvider` pelo contrato existente; registrar factory e seed
idempotente. Resolver e atualizar metadados pelo provider associado à oferta, inclusive no refresh.
Domínios candidatos de links: `shopee.com.br` (incluindo `s.shopee.com.br`), `shope.ee` e `shp.ee`.
A lista definitiva deve ser validada com links reais e documentação oficial na task 248;
redirecionamentos legítimos fora dela exigem revisão explícita, nunca wildcard irrestrito.

Usar Safe Fetch/Resolver existente com validação de todos os redirects, DNS/IP, redes privadas,
protocolo, credenciais embutidas, timeout também durante leitura do corpo e limite de tamanho.
Não contornar login, CAPTCHA ou bloqueio de acesso. Sem endpoints privados não documentados.
Extrair somente dados públicos estruturados disponíveis, sem regras de Mercado Livre aplicadas
indevidamente à Shopee. Usar identidade de loja + item quando disponível para evitar colisões.

### Resultado e persistência

- `COMPLETE`: dados mínimos definidos na task disponíveis, com origem e data registradas.
- `PARTIAL`: link permitido, mas faltam dados ou o marketplace impediu a extração; permitir cadastro manual.
- `FAILED`: URL inválida/proibida ou redirecionamento inseguro; não confirmar o preview como importação válida.

Nunca importar título de página de login/challenge como nome do produto.
Campos ausentes permanecem ausentes. Preview não grava produto/oferta.
Confirmar no servidor provider, URL, workspace, categoria, limites e duplicidade; não confiar no preview do cliente.
Deduplicar por workspace + programa + identidade externa e por URLs normalizadas,
preservando parâmetros de atribuição do link salvo. Repetição ou corrida de confirmação
não pode criar duplicatas silenciosas. Atualização preserva campos editoriais conforme merge policy.

## 5. Imagens originais e distribuição dos cards

Usar `imageUrl` e `images` do catálogo como fonte; não pedir à IA para inventar URLs.
Uma única imagem pode aparecer na capa, no corpo e em cards repetidos.
Validar URLs e escapar atributos. Sem imagem, manter layout legível sem ícone quebrado.
Não aplicar transformação obrigatória. Não migrar imagens para um serviço novo nesta fase.

Nos novos reviews: manter a abertura existente e incluir uma ocorrência do produto no meio
editorial e outra ao final. Em comparativos/listas/guias, usar os produtos selecionados e
blocos em grupo para evitar repetição excessiva de todos os cards individuais.
O meio deve ser calculado por limites de parágrafos/seções, nunca cortando uma tag HTML.
As ocorrências ficam visíveis e editáveis na revisão, podendo ser removidas ou repetidas.
Respeitar imagens já presentes para não multiplicá-las acidentalmente ao salvar novamente.

Não inventar notas, vantagens, preço anterior, descontos ou experiência de teste físico.
CTAs padrão neutros: “Conferir oferta” ou “Ver preço atual”.
Artigos existentes não são reescritos em lote; os novos formatos podem ser inseridos manualmente.

## 6. Conteúdo & Pesquisa e wizard

Substituir referências técnicas como “Fase 12” e “grounding” por linguagem de produto.
Texto sugerido: “Transforme as informações deste produto em um review. Você poderá revisar tudo antes de publicar.”
Botão exato: **Gerar Review deste Produto**.

Abrir `/publishing/affiliate` com referência ao produto. O wizard deve:

- iniciar com `PRODUCT_REVIEW` e o produto previamente selecionado;
- carregar esse produto mesmo fora da primeira página do catálogo;
- validar workspace, entitlement e elegibilidade no servidor;
- tratar produto removido/arquivado ou ID inválido com mensagem e possibilidade de nova seleção;
- manter o fluxo normal sem parâmetro e exigir ação do usuário para gerar.

Listar artigos reais através de `ArticleProduct`, filtrando produto e artigo pelo workspace.
Mostrar título (fallback para título original), status, data pertinente e link para revisão.
Incluir pendentes, publicados e rejeitados com status explícito; não chamar todos de publicados.
Se existir URL publicada válida, oferecer também acesso ao post.
Paginar ou limitar com mecanismo de carregar mais; ordenação determinística, recentes primeiro.
Exibir estados de carregamento, erro e lista vazia; não usar exemplos estáticos.
Uma relação única deve representar um produto usado várias vezes no mesmo artigo.

## 7. Modelos visuais

| Modelo | Conteúdo | Quantidade |
|---|---|---|
| Card com foto | Imagem original, título, texto disponível e CTA | Um ou vários cards |
| Card de texto | Título, texto disponível e CTA | Um ou vários cards |
| Grade | Foto, título e CTA por produto | Um ou vários produtos |
| Carrossel | Foto, título e CTA por produto, rolagem horizontal | Um ou vários produtos |
| Botão | “Conferir oferta” e nome do produto menor abaixo, dentro do botão | Um ou vários botões |

Grade responsiva; carrossel utilizável por toque e teclado, sem autoplay e sem depender de
JavaScript externo para funcionar no WordPress. Cada produto aponta para sua própria oferta.
Nome abaixo do CTA também funciona como identificação acessível do destino.
Permitir ajustar o texto principal do CTA; não gerar promessas de desconto sem dados.
Layouts devem funcionar com textos longos, sem imagem e em telas pequenas.
UI administrativa reutiliza design system e temas claro/escuro; HTML publicado permanece
legível nos temas WordPress sem depender dos estilos administrativos.

## 8. Inserção no corpo e experiência de revisão

Na área “Corpo do Artigo (HTML)” e no editor comercial, disponibilizar **Inserir produto afiliado**
somente quando o plano liberar afiliados. O seletor permite buscar produtos, selecionar um ou
vários, escolher modelo e CTA, visualizar e confirmar.

Capturar a seleção/cursor antes de abrir o seletor e restaurar foco após inserir.
Inserir na posição escolhida, inclusive início, meio e final; não redirecionar silenciosamente
para o rodapé. Se estiver no meio de um parágrafo, preservar os dois trechos com HTML válido.
Seleção de texto não deve ser apagada acidentalmente; adotar inserção no início da seleção.
Posição dentro de tag, atributo ou marcador inválido exige orientação para reposicionar.
Cancelar não altera o corpo. Se o corpo mudar com o seletor aberto, invalidar a posição antiga
ou recalculá-la de forma segura; nunca inserir em índice obsoleto silenciosamente.

O usuário vê um preview do bloco com dados reais; IDs/JSON não substituem a apresentação visual.
No modo HTML podem existir marcadores internos, mas sua sintaxe não deve ser requisito para uso.
Permitir selecionar um bloco inserido para alterar modelo/produtos/CTA, duplicar e remover.
Ocorrências independentes podem referenciar o mesmo produto.
Salvar/recarregar e publicar devem manter ordem, imagens, escolha visual e texto revisado.
Usar componentes existentes; eventual dependência de editor requer justificativa na task 247.

## 9. Contrato de dados e integridade

`Product` e `ProductOffer` continuam sendo fontes dos dados comerciais.
Conteúdo persistido referencia IDs, nunca copia permanentemente o `affiliateUrl` nos blocos.
O contrato de ocorrência deve representar identidade estável, modelo, produtos ordenados,
CTA e posição/âncora ou posição no documento. Referência explícita de oferta é opcional.

Reutilizar `canonicalContent`, `ArticleAffiliatePlacement` e `ArticleProduct` conforme seu papel,
sem criar catálogo paralelo. A task 247 decide a representação compatível para RSS e comercial,
validação, migração/backward compatibility e sincronização atômica antes de implementar.
Não pré-aprovar nesta spec uma serialização baseada em comentários HTML.

`ArticleProduct` é a projeção de produtos vinculados, não o armazenamento de todas as ocorrências.
Manter vínculos explícitos editoriais e ocorrências em sincronia, com política documentada para
remoção do último uso sem apagar uma associação editorial ainda necessária.
Restrições de geração (review = um produto, comparação >= dois) não devem impedir a inserção
manual de recomendações adicionais na revisão. Distinguir produtos-base de geração dos
produtos recomendados no corpo; definir representação na task 247 sem enfraquecer o wizard.

Edição de texto deve atualizar o documento que será efetivamente publicado. Não sobrescrever
blocos comerciais ao atualizar `content`; não ignorar edições por preferir um canônico antigo.
Dados de outro workspace e ofertas incompatíveis são rejeitados antes de qualquer gravação.
Salvamento de corpo, blocos e vínculos deve ser atômico. Repetir salvamento não duplica ocorrências.

## 10. Preview, publicação e plano

Resolver ofertas ativas no momento de preview/publicação, no workspace autorizado.
Se uma oferta explícita ficar inválida, não trocar de marketplace silenciosamente.
Sem oferta explícita, adotar uma seleção determinística documentada e mostrar qual foi usada.
Sem oferta ativa, destacar a pendência na revisão e impedir nova publicação até corrigir ou
remover o bloco. Nunca publicar botão `href="#"`, link vazio ou oferta pausada/arquivada.

Preview e WordPress compartilham as regras de renderização. Validar todos os caminhos de
aprovar, republicar, publisher adapter e legado. Marcar publicação alterada para republicação
conforme mecanismo existente; não publicar automaticamente.
Links: HTTP(S) validado, conteúdo escapado e `rel="sponsored nofollow noopener"` com nova aba.
Disclosure comercial reutiliza configuração existente, sem duplicação por card.
Tracking existente deve reconhecer os novos modelos quando `AFFILIATE_ANALYTICS` permitir;
navegação não pode depender do sucesso da telemetria. Não medir clique como venda.

`AFFILIATE_MODULE` controla UI e APIs de importar, gerar, consultar produtos relacionados,
inserir/editar blocos, renderizar preview e publicar conteúdo com afiliados.
Sem entitlement: ocultar ação de inserção, rejeitar tentativas diretas no servidor com 403,
preservar dados existentes e permitir leitura do artigo e remoção de blocos para publicação sem afiliados.
Downgrade não altera remotamente posts já publicados, mas bloqueia nova publicação/republicação
com afiliados até adequação. Limites continuam pelo BillingService, sem nomes de planos hardcoded.

## 11. Fora do escopo e ideias futuras

Não implementar: API de vendas/comissões Shopee, geração automática de links, login marketplace,
cron, filas, microserviços, publicação em massa ou migração automática de artigos publicados.

Ideias para avaliação posterior, sem autorização de execução nesta fase:
- presets visuais de marca por workspace;
- comparação A/B de CTA baseada em cliques;
- relatório de produtos sem oferta ativa usados em posts;
- posicionamento automático sugerido pela IA e aprovado pelo editor.

## 12. Plano de tasks e Definition of Done

Sequência detalhada em `PLAN-phase30-affiliates.md` e `tasks/247-*.md` a `tasks/254-*.md`.
Uma task de implementação por vez, somente após autorização.

- [ ] Shopee e Mercado Livre importam com provider correto, dedupe e fallback manual seguro.
- [ ] Imagens originais aparecem, inclusive quando só há uma disponível.
- [ ] Novos artigos comerciais têm blocos no meio e fim sem duplicação no save.
- [ ] Botão de review abre wizard pré-selecionado; artigos relacionados vêm de ArticleProduct.
- [ ] Cinco modelos inseridos/editados/duplicados/removidos na posição escolhida.
- [ ] Texto editado e blocos persistem e são os mesmos enviados ao WordPress.
- [ ] Tenant, plano, ofertas, disclosure e tracking validados em todos os caminhos.
- [ ] Testes automatizados aplicáveis aprovados, com cenários negativos e regressão Mercado Livre.
- [ ] Integração em ambiente de teste validada; sem publicação de produção automática.
- [ ] `npx tsc --noEmit`, `npm run lint` e `npm run build`: PASS.
- [ ] Evidências objetivas registradas. Dependências externas indisponíveis registradas como pendência,
  sem declarar validação real a partir de mocks nem concluir task com critério não executado.

---

# Phase 31. Sistema de Log de Erros, Diagnóstico e Auditoria no Backoffice

## 1. Estado e autorização
Autorizada pelo usuário em 2026-10-04.
Em andamento: Task 255.

## 2. Objetivo e escopo
1. Criar sistema centralizado de logging de erros no banco de dados (`SystemErrorLog`) com captura de dados de diagnóstico ricos:
   - Usuário (`userId`, `userEmail`, `userName`)
   - Tela (`screen`)
   - Consulta / Payload de entrada (`query`, devidamente sanitizado)
   - Caminho / URL (`path`, `method`)
   - Módulo (`AI`, `RSS`, `BILLING`, `WORDPRESS`, `AFFILIATES`, `AUTH`, `BACKOFFICE`, `GENERAL`)
   - Mensagem original antes de mascarar (`errorMessage`)
   - Stack trace completo (`errorStack`)
   - Identificação do Tenant / Empresa (`workspaceId`)
   - Código HTTP e timestamp (`statusCode`, `createdAt`)
2. Manter a exibição de erros para os usuários finais mascarada e amigável, com pequenos popups nos cantos da tela (estilo Toast/notificação discreta).
3. Criar visualizador de logs no Backoffice exclusivo para SuperAdmin em `/backoffice/audit/errors`, com:
   - Filtro por Tenant/Empresa
   - Filtro por Módulo
   - Filtro por Usuário
   - Filtro por Data
   - Modal de inspeção e reprodução com mensagem original e stack trace formatado.
4. Criar tela de Configurações Gerais no Backoffice em `/backoffice/settings`:
   - Configuração de tempo de retenção em dias (padrão: 180 dias) persistida em `SystemSetting`.
   - Rotina de limpeza/expurgo de registros com mais de N dias com botão manual "Limpar logs antigos agora".

## 3. Plano de tasks e Definition of Done
Sequência detalhada em `news-curator-harness/PLAN-phase31-error-logs.md` e tasks 255 a 260.
- [x] Task 255: Modelos `SystemErrorLog` e `SystemSetting`, migration e seed default.
- [x] Task 256: Serviço central de logging e handler de API não-bloqueante com mascaramento.
- [x] Task 257: Módulo client de captura, endpoint de reporte e toast popup nos cantos.
- [x] Task 258: Tela Backoffice de logs com filtros (tenant, módulo, usuário, data) e modal de stack trace.
- [x] Task 259: Tela de Configurações Gerais no Backoffice, retenção (180 dias) e rotina de expurgo.
- [x] Task 260: Integração end-to-end, testes de regressão, lint, tipos e evidências.

# Phase 32. Recuperação de Senha ("Esqueceu a Senha") com Código de Segurança via E-mail

## 1. Estado e autorização
Autorizada pelo usuário em 2026-10-05.
Em andamento: Task 261 TODO.

## 2. Objetivo e escopo
1. Fornecer fluxo autônomo, seguro e amigável para que usuários que esqueceram sua senha possam redefini-la sem intervenção manual.
2. Reutilizar a infraestrutura de e-mail existente (`src/lib/mail/`) e o modelo `VerificationToken` do Prisma, aplicando isolamento estrito de tokens:
   - Identificador com propósito exclusivo: `password-reset:${cleanEmail}` para evitar colisões ou reuso de tokens de cadastro.
   - Código numérico criptográfico de 6 dígitos (`generateOtpCode()`).
   - Validade curta de 15 minutos (`expires`).
   - Cooldown anti-flood de 60 segundos entre solicitações.
   - Consumo único (remoção do token imediatamente após a troca de senha).
3. Prevenção de Enumeração de Usuários (Anti-User-Enumeration):
   - A resposta da API `POST /api/auth/forgot-password/send-code` é idêntica para e-mails cadastrados e não cadastrados, protegendo a privacidade dos usuários.
4. Criptografia Forte:
   - A nova senha é validada (mínimo de 6 caracteres) e salva como hash `bcryptjs` com custo 10 (`hashPassword`).
5. Interface Visual do Usuário:
   - Link "Esqueceu a senha?" adicionado na tela de login `/login`.
   - Nova página pública `/forgot-password` liberada no proxy (`src/proxy.ts`).
   - Fluxo intuitivo em 2 passos (Passo 1: Solicitar código via e-mail; Passo 2: Digitar código recebido, nova senha e confirmação, com timer regressivo de reenvio).
   - Feedback de sucesso e redirecionamento para `/login`.

## 3. Plano de tasks e Definition of Done
Sequência detalhada em `news-curator-harness/PLAN-phase32-password-recovery.md` e tasks 261 a 265.
- [x] Task 261: Template de e-mail de recuperação de senha e renderizador.
- [x] Task 262: Endpoints de API para solicitação e redefinição de senha (`/api/auth/forgot-password/send-code` e `/api/auth/forgot-password/reset`).
- [x] Task 263: Link "Esqueceu a senha?" no login e liberação de rota pública em `src/proxy.ts`.
- [x] Task 264: Página `/forgot-password` e componente de visualização em 2 passos com timer regressivo e UX GeraFeed.
- [x] Task 265: Integração end-to-end, testes de segurança (anti-flood, anti-enumeração, expiração), lint, tipos e evidências.

# Phase 33. Geração de Imagens com IA Baseada no Contexto da Notícia e Estratégia Visual

## 1. Estado e autorização
Autorizada pelo usuário em 2026-10-06.
Em andamento: Task 267 TODO.

## 2. Objetivo e escopo
1. Manter a funcionalidade existente de imagem original e imagem invertida (com Sharp) sem alterações.
2. Adicionar a opção de geração de nova imagem por IA (`AI_GENERATED`) em Estratégia de Imagens.
3. Extrair personagens, contexto factual, cenário e atmosfera da matéria a partir do conteúdo RSS/raspado, referenciando a imagem de origem.
4. Permitir que o usuário escolha o estilo visual da nova imagem:
   - `REALISTIC`: Fotográfico / Estilo fotojornalismo.
   - `CARTOON`: Cartoon 3D / Animação.
   - `DRAWING`: Ilustração artística / Desenho editorial.
   - `SATIRICAL_CARTOON`: Charge / Caricatura editorial satírica.
   - `CUSTOM`: Estilo customizado.
5. Regra de herança de chave da LLM de texto:
   - Se a LLM for **OpenAI**: usa a mesma chave e ativa **DALL-E 3**, com indicação visual clara e opção de chave dedicada.
   - Se a LLM for **Google Gemini**: usa a mesma chave e ativa **Google Imagen 3**, com indicação visual clara e opção de chave dedicada.
   - Se a LLM for **OpenRouter / OpenAI-Compatible**: usa a mesma chave e ativa **FLUX.1 via OpenRouter**, com indicação visual clara e opção de chave dedicada.
   - Se a LLM for **Anthropic**: nenhum provedor vem selecionado e um aviso/tooltip explica que Claude não gera imagens e orienta o cadastro de uma chave de imagem.
6. Regra de Ouro (Consumo Condicional de Tokens):
   - A imagem gerada por IA **só será criada se a estratégia `AI_GENERATED` estiver marcada** ou se solicitada via botão avulso no editor.
7. Editor e Publicação WordPress:
   - Suporte a 3 imagens no card de Mídia Destacada em `/articles/[id]` (Original, Invertida, Gerada por IA).
   - Envio automático de `AI_GENERATED` como `featured_media` ao publicar no WordPress.

## 3. Plano de tasks e Definition of Done
Sequência detalhada em `news-curator-harness/PLAN-phase33-ai-image-generation.md` e tasks 267 a 272:
- [x] Task 267: Schema Prisma (`generatedImageUrl`, `imagePrompt`), contratos de configuração de imagem e herança de chave.
- [x] Task 268: Serviço central de imagens (`src/lib/images/`) com adapters para DALL-E 3, Google Imagen 3 e OpenRouter FLUX.1.
- [x] Task 269: Motor de extração de contexto (personagens, cenário, notícia, foto de origem) e síntese de prompt visual.
- [x] Task 270: Processamento condicional no pipeline de IA (`src/lib/ai.ts`) e endpoint avulso de geração (`/api/articles/[id]/generate-image`).
- [x] Task 271: Interface em `/settings/images` com seletor de estilos, detecção de herança de chave da LLM e tooltip informativo para Anthropic.
- [x] Task 272: Mídia destacada com 3 opções em `/articles/[id]`, botão de geração avulsa, envio de `AI_GENERATED` para o WordPress, testes E2E, tsc e build.






---

# Phase 35. Criação Manual de Matérias (Pauta/Entrevista/Texto), 4 Níveis de Complemento com IA, Upload de Fotos e Geração de Imagens pela Matéria

## 1. Estado e autorização
Autorizada pelo usuário em 2026-11-03.
Concluída em 2026-11-03.

## 2. Objetivo e escopo
1. Permitir criar e publicar matérias com base em um texto ou pedaços de texto fornecidos pelo usuário (ex: ideias de pauta, anotações de entrevista, tópicos, rascunhos).
2. Disponibilizar **4 níveis de complemento ("Completar" o texto)**, cada um com seu próprio prompt especializado:
   - **`FORMAT_ONLY` (Formatar)**: Não faz alteração no texto, somente formata, cria parágrafos (`<p>`), listas e estrutura HTML sem alterar o texto original.
   - **`LIGHT` (Leve)**: Faz a formatação, pequenas alterações dentro do estilo escolhido na configuração do portal (`PromptSettings`), e pode inserir pequenos trechos de coesão/transição.
   - **`MEDIUM` (Média)**: Faz a formatação, alterações mais pontuais dentro do estilo configurado, podendo inserir trechos criados pela IA para conectar e enriquecer os pontos fornecidos.
   - **`LARGE` (Grande)**: Faz a formatação, alterações e complementação completa da matéria dentro do estilo configurado, podendo inserir grandes partes de trechos criados pela IA a partir das ideias/pauta.
3. **Enviar Fotos e Imagens para colocar na matéria**:
   - Permitir enviar (upload) foto de capa (Imagem Destacada) e fotos para o corpo da matéria (com legenda opcional), tanto na tela de criação da matéria quanto na tela de Revisão Editorial (`/articles/[id]`).
   - Validar segurança dos arquivos enviados (extensão, MIME type, limite de tamanho, verificação de magic bytes via Sharp, remoção de metadados EXIF).
   - No momento da publicação no WordPress, enviar automaticamente para a biblioteca de mídia (`/wp-json/wp/v2/media`) tanto a capa quanto imagens embutidas no corpo da matéria.
4. **Criar Fotos através da Matéria (IA)**:
   - Permitir gerar fotos com IA contextualizadas a partir do conteúdo da matéria (tanto como Imagem Destacada quanto para inserção no corpo do artigo), escolhendo o estilo visual desejado.

## 3. Plano de tasks e Definition of Done
Sequência detalhada em `news-curator-harness/PLAN-phase35-manual-article-creation.md` e tasks 273 a 277:
- [x] Task 273: Contratos e Prompts dos 4 Níveis de Complemento de Matéria (`FORMAT_ONLY`, `LIGHT`, `MEDIUM`, `LARGE`).
- [x] Task 274: Upload seguro de fotos/imagens (`/api/images/upload`), suporte a Data URI no Sharp e upload de imagens do corpo no WordPress.
- [x] Task 275: Endpoint `/api/articles/manual` e pipeline de criação de matéria manual com fotos e IA.
- [x] Task 276: Interface `/publishing/manual`, integração na Central de Publicação e melhorias de fotos/IA na Revisão Editorial (`/articles/[id]`).
- [x] Task 277: Testes E2E da Phase 35, validação de segurança (Security Scanner & Audit), `tsc --noEmit`, `npm run lint` e `npm run build`.

---

# Phase 36. Geração de Imagens com IA Gratuita (Hugging Face & Pollinations.ai), Configuração em `/settings/ai` e Seed

## 1. Estado e autorização
Planejada em 2026-11-04. Aguardando autorização para início da implementação (Task 278 TODO).

## 2. Diagnóstico Técnico de Gratuidade Validado
1. **Token Hugging Face (`HUGGINGFACE_API_KEY`)**:
   - Validado em `/api/whoami-v2` (usuário `feijaoguida`, token `gerafeed`, permissões `inference.serverless.write` e `inference.endpoints.infer.write`).
2. **Modelo `Freepik/flux.1-lite-8B`**:
   - Possui `inferenceProviderMapping: {}` no Hugging Face (a Freepik disponibilizou apenas os pesos de 8B para download local) e o Space oficial `Freepik/F-Lite` encontra-se `PAUSED`. Portanto, retorna `HTTP 400: Model not supported by provider hf-inference` na API serverless.
3. **Execução Gratuita Funcional no Hugging Face (`black-forest-labs/FLUX.1-schnell`)**:
   - A API antiga `api-inference.huggingface.co` foi descontinuada em favor de `router.huggingface.co`.
   - Para contas gratuitas (`isPro: false`, sem créditos pré-pagos), a geração gratuita com token `hf_...` funciona via endpoint oficial ZeroGPU/Gradio do Hugging Face (`https://black-forest-labs-flux-1-schnell.hf.space/gradio_api/call/infer`) autenticado com `Authorization: Bearer hf_...`, gerando imagens 1024x1024 em ~6 segundos, além de suportar `https://router.huggingface.co/hf-inference/models/...` quando houver créditos/suporte.
4. **Pollinations.ai (`model=flux`)**:
   - Endpoint `https://image.pollinations.ai/prompt/{prompt}?model=flux&width=1024&height=1024&nologo=true` validado com sucesso (`HTTP 200 image/jpeg`), operando gratuitamente e sem necessidade de chave de API.

## 3. Objetivo e escopo
1. **Preservar Provedores Existentes**:
   - Manter integralmente o suporte a **OpenAI (DALL-E 3)**, **Google Gemini (Imagen 3)** e **OpenRouter (FLUX.1 / FLUX.2)**.
2. **Adicionar Provedores Gratuitos (`huggingface` e `pollinations`)**:
   - Expandir `ImageProviderType` em `src/lib/images/types.ts` para `"openai" | "gemini" | "openrouter" | "huggingface" | "pollinations"`.
   - Criar `HuggingFaceFluxAdapter` (`src/lib/images/adapters/huggingface-flux.ts`) com modelo padrão `black-forest-labs/FLUX.1-schnell`, suportando autenticação `Bearer hf_...` via ZeroGPU Space API oficial e `router.huggingface.co/hf-inference`, convertendo a imagem gerada em Data URI.
   - Criar `PollinationsFluxAdapter` (`src/lib/images/adapters/pollinations-flux.ts`) com modelo padrão `flux` sem exigência de chave, convertendo o binário retornado em Data URI.
3. **Engenharia de Prompt por Estilo Visual**:
   - Aprimorar `IMAGE_STYLE_DEFINITIONS` em `src/lib/images/types.ts` com os descritores recomendados para modelos da família FLUX / Stable Diffusion:
     - `REALISTIC`: lente 35mm, iluminação natural, câmera DSLR, 8k, detalhes visíveis, fotojornalismo.
     - `CARTOON`: animação 3D estilo Pixar, cores vibrantes, renderização suave/argila, personagens expressivos.
     - `DRAWING`: desenho animado 2D / ilustração editorial, traços limpos, ilustração vetorial, flat design.
4. **Espaço para Configurar a IA de Imagens na Tela `/settings/ai`**:
   - Adicionar na tela **Configurações de Inteligência Artificial** (`/settings/ai`) um espaço/aba dedicado para **Configurar a IA de Imagens** (conectado a `/api/images/config` e `/api/images/test`), permitindo selecionar o provedor de imagem (`huggingface`, `pollinations`, `openai`, `gemini`, `openrouter`), informar a chave de API dedicada (`hf_...`), definir o modelo, escolher a estratégia padrão (`ORIGINAL`, `MODIFIED`, `AI_GENERATED`), o estilo visual e testar a geração de imagem.
   - Sincronizar também as opções no seletor de `/settings/images`.
5. **Configuração da Chave via Seed (`prisma/seed.ts`)**:
   - Configurar no `prisma/seed.ts` (e `.env` / `.env.example` via `HUGGINGFACE_API_KEY`) a chave do Hugging Face criptografada com AES-256-GCM em `imageSettings`, com `imageProvider: "huggingface"`, `useSameKeyAsTextAi: false` e `customModel: "black-forest-labs/FLUX.1-schnell"`.

## 4. Plano de tasks e Definition of Done
Sequência detalhada em `news-curator-harness/PLAN-phase36-huggingface-free-image-ai.md` e tasks 278 a 281:
- [x] Task 278: Contratos de Imagem, `HuggingFaceFluxAdapter`, `PollinationsFluxAdapter` e melhorias de Engenharia de Prompt por estilo (`src/lib/images/`).
- [x] Task 279: Espaço de Configuração da IA de Imagens em `/settings/ai`, atualização de `/settings/images`, `/api/images/config` e endpoint `/api/images/test`.
- [x] Task 280: Configuração da chave `HUGGINGFACE_API_KEY` no `.env`, `.env.example` e `prisma/seed.ts`.
- [x] Task 281: Testes E2E da Phase 36 (`scripts/phase36/test-huggingface-image-e2e.ts`), Security Audit (`run-security-scanner`), `npx tsc --noEmit`, `npm run lint` e `npm run build`.

---

# Phase 37. Descrição de Produto com IA Focada em Vendas e Publicação no WordPress (WooCommerce)

## 1. Estado e autorização
Planejada em 2026-11-04. Aguardando autorização para início da implementação (Task 282 TODO).

## 2. Objetivo e escopo
1. **Melhoria da Descrição na Importação + Copywriting com IA Focado em Vendas**:
   - Aprimorar `metadata-extractor.ts` e `shopee.ts` para preservar quebras de parágrafo, filtrar textos genéricos de cabeçalho do marketplace (ex: *"Frete grátis no dia..."*, *"Achadinho do Mercado"*) e estruturar um resumo rico a partir dos destaques e especificações técnicas.
   - Criar `ProductSalesCopyService` (`src/lib/affiliate/sales-copy-service.ts`) que solicita à IA configurada no Workspace a criação de uma descrição persuasiva com **foco em vendas (Framework AIDA — Atenção, Interesse, Desejo, Ação)**:
     - **`shortDescription` (Descrição Curta para WooCommerce)**: 2 a 3 frases magnéticas com proposta de valor e benefício principal.
     - **`description` (Descrição Completa Foco em Vendas)**: texto estruturado com gancho persuasivo, transformação de especificações técnicas reais em benefícios para o comprador, destaque de avaliações e chamada para ação (CTA).
     - **`pros` (Pontos Positivos)**: 3 a 5 vantagens reais extraídas dos metadados do produto.
   - **Guardrails de Fidelidade**: A IA tem foco em conversão, mas jamais inventa especificações técnicas, dimensões, garantias ou descontos inexistentes nos metadados extraídos. Possui fallback determinístico caso o Workspace não tenha IA ativa.
2. **Publicação de Produto no WordPress para Leitura pelo WooCommerce**:
   - Disponibilizar no **Importador de Produtos (`/affiliates/import`)** e no **Detalhe do Produto (`/affiliates/products/[id]`)** a opção de publicar o produto diretamente no WordPress para ser lido pelo **WooCommerce**.
   - Criar `WooCommercePublisherService` (`src/lib/affiliate/woocommerce-publisher.ts`):
     - Reaproveita as credenciais `WordPressSite` já configuradas no Workspace (Application Password).
     - Publica/atualiza via API oficial do WooCommerce (`/wp-json/wc/v3/products`) com fallback automático para `/wp-json/wp/v2/product` (Custom Post Type `product` + meta fields nativos `_regular_price`, `_sale_price`, `_price`, `_product_url`, `_button_text`, `_sku`).
     - Suporta tipo **`external` (Produto Externo / Afiliado — Padrão)**, onde o botão de compra no WooCommerce aponta para o `affiliateUrl` do afiliado com texto personalizável (ex: *"Comprar no Mercado Livre"*, *"Comprar na Shopee"*), e tipo **`simple` (Produto Simples)**.
     - Faz upload da imagem principal e galeria para a Biblioteca de Mídia do WordPress (`/wp-json/wp/v2/media`) e mapeia as especificações técnicas (`specs`) como atributos visíveis na ficha do produto no WooCommerce (`attributes`).
     - Grava em `Product` os campos `wordpressSiteId`, `woocommerceProductId`, `woocommerceProductUrl`, `woocommerceProductType` e `woocommerceLastSyncedAt`, garantindo atualização idempotente sem duplicar produtos na loja.

## 3. Plano de tasks e Definition of Done
Sequência detalhada em `news-curator-harness/PLAN-phase37-woocommerce-and-sales-ai.md` e tasks 282 a 285:
- [x] Task 282: Schema Prisma (`shortDescription` e campos `woocommerce*` em `Product`), melhoria de extração em `metadata-extractor.ts`, serviço `ProductSalesCopyService` e rota `POST /api/affiliate/import/sales-copy`.
- [x] Task 283: Serviço `WooCommercePublisherService` (`src/lib/affiliate/woocommerce-publisher.ts`), publicação opcional em `/api/affiliate/import/confirm` e rota `POST /api/affiliate/products/[id]/publish-woocommerce`.
- [x] Task 284: Interface em `AffiliateImporter` (`/affiliates/import`) e `ProductDetail` (`/affiliates/products/[id]`) para descrição vendedora com IA e publicação direta no WooCommerce.
- [x] Task 285: Testes E2E (`scripts/phase37/test-woocommerce-and-sales-ai-e2e.ts`), Security Audit (`run-security-scanner`), `npx tsc --noEmit`, `npm run lint` e `npm run build`.


# Phase 38. Chaves da API do WooCommerce nos Destinos WordPress (Multi-Site) com Guardrail de Plano de Afiliados

## 1. Estado e autorização
Concluída em 2026-11-04 (Tasks 286–289 DONE).

## 2. Objetivo e escopo
1. **Configuração de Chaves da API do WooCommerce por Destino WordPress**:
   - Disponibilizar na tela **Destinos WordPress (Multi-Site)** (`/settings/wordpress`) campos dedicados para inserir a **Consumer Key** (`ck_...`) e **Consumer Secret** (`cs_...`) da WooCommerce REST API.
   - Suporte tanto no formulário do site selecionado quanto no modal de criação de novo site.
   - Encriptação AES-256-GCM para o segredo do consumidor (`encryptedWooCommerceSecret`) e sanitização estrita para o client (`hasWooCommerceSecret: boolean` sem vazar a chave secreta).
2. **Restrição por Plano (Billing Entitlement)**:
   - Os campos de API do WooCommerce devem estar disponíveis/habilitados **somente se o Workspace tiver o Afiliado habilitado no seu plano** (`BillingService.hasFeature(workspaceId, AFFILIATE_FEATURES.MODULE)`).
   - Bloqueio suave na interface com aviso explicativo e badge informativo quando o plano não incluir o módulo.
   - Validação estrita no back-end (`assertFeature`) em `POST /api/wordpress/sites` e `PUT /api/wordpress/sites/[id]` para impedir envio indevido via API.
3. **Autenticação Híbrida e Teste de Conexão**:
   - Atualizar `WooCommercePublisherService` para priorizar autenticação direta via chaves WooCommerce (`Authorization: Basic base64(ck:cs)`) quando configuradas, mantendo fallback suave para `username:applicationPassword`.
   - Adicionar endpoint `POST /api/wordpress/sites/[id]/test-woocommerce` para validação de conectividade com a API do WooCommerce.

## 3. Plano de tasks e Definition of Done
Sequência detalhada em `news-curator-harness/PLAN-phase38-woocommerce-site-keys-and-plan-guard.md` e tasks 286 a 289:
- [x] Task 286: Schema & Backend de Credenciais WooCommerce em WordPressSite.
- [x] Task 287: Validação de Plano e Endpoint de Teste WooCommerce.
- [x] Task 288: Interface de Configuração em Destinos WordPress (`/settings/wordpress`).
- [x] Task 289: Autenticação no Publicador, Testes E2E Automatizados e Build.

---

# Phase 39. Cupons de Desconto, Ciclos Promocionais no Asaas, Histórico de Planos e Trava Anti-Fraude de Cadastro de Sites

## 1. Estado e autorização
Concluída em 2026-11-05. Todas as Tasks 290 a 296 concluídas com sucesso e validadas por suíte E2E, TypeScript, ESLint e build de produção.

## 2. Objetivo e escopo
1. **Cadastro e Gestão de Cupons de Desconto no Backoffice (`/backoffice/coupons`)**:
   - Permitir que o SuperAdmin crie, edite, ative/inative e acompanhe cupons promocionais de assinatura.
   - Suportar múltiplos planos por cupom (`CouponPlan` N:N), múltiplos tipos de desconto (`PERCENTAGE`, `FIXED_DISCOUNT`, `FIXED_PRICE`), duração configurável de `0` acima (`0` = Para Sempre, `1` = Primeiro Mês, `3` = 3 Primeiros Meses, $N$ = $N$ Primeiros Meses) e segmentação por Tipo de Cliente (`NEW` = Novo, `BASE` = Base, `BOTH` = Ambos).
   - Exemplo concreto de negócio: criar um cupom para quem assinar o **Plano Influencer** (R$ 89,90/mês) pagar **R$ 19,90 nos 3 primeiros meses**, voltando automaticamente para **R$ 89,90** a partir do 4º mês.
2. **Cupom na Criação da Conta (`/register` e `/checkout/billing`)**:
   - Campo para informar e validar cupom de desconto durante a criação da conta / onboarding fiscal.
   - Validar se o cupom existe, está ativo, dentro do prazo (`validUntil`), possui saldo de usos (`maxUses`), é elegível para **Cliente Novo** (`NEW` ou `BOTH`) e é compatível com o plano selecionado.
   - Aplicar o desconto na assinatura enviada ao **Asaas** e programar a transição automática de valor após os $N$ primeiros ciclos promocionais.
3. **Cupom em Plano & Cobrança (`/settings/billing` e `/settings/billing/upgrade`)**:
   - Campo para informar e aplicar cupom de desconto para clientes já existentes.
   - Validar se o cupom existe, está ativo, dentro do prazo (`validUntil`), ainda não foi consumido pelo mesmo workspace (`maxUsesPerWorkspace`), é compatível com o **plano do cliente** e é elegível para **Cliente Base** (`BASE` ou `BOTH`).
   - Aplicar o cupom imediatamente e sincronizar com o **Asaas** (`PUT /v3/subscriptions/{id}` com `"updatePendingPayments": true`) para efetuar as cobranças futuras (e pendentes ainda não pagas) com o valor promocional pelo período determinado.
4. **Histórico de Planos (`PlanHistory`)**:
   - Registrar trilha completa de auditoria de todas as contratações, ativações, upgrades, downgrades, aplicações de cupons, términos de ciclos promocionais, cancelamentos e reativações por Workspace.
   - Exibir o histórico tanto para o usuário em `/settings/billing` quanto para o SuperAdmin em `/backoffice/companies/[id]`.
5. **Histórico Perpétuo e Anti-Fraude de Cadastro de Sites (`SiteRegistrationHistory`)**:
   - Impedir que o mesmo usuário crie múltiplas contas (`email1`, `email2`, `email3`...) e vincule o mesmo site (`sitedoemail1`) repetidamente após o vencimento/cancelamento para obter benefícios de conta nova ou burlar o sistema.
   - Regra estrita de contagem de contas distintas por domínio/site normalizado:
     - **1ª vez (1ª conta)**: **OK** (permitido, gravado no histórico perpétuo).
     - **2ª vez (2ª conta distinta)**: **OK** (permitido, gravado no histórico perpétuo).
     - **3ª vez em diante (3ª conta distinta+)**: **BLOQUEADO!** Emite mensagem de alerta clara na interface, **não permite o cadastro desse site** e orienta o usuário a **procurar o suporte**.
   - A exclusão de um `WordPressSite` jamais apaga seu registro em `SiteRegistrationHistory`.
   - O SuperAdmin no Backoffice pode visualizar o histórico de domínios/tentativas e liberar manualmente um domínio caso o cliente comprove legitimidade junto ao suporte.
6. **Geração Obrigatória de Logs de Erro (`SystemErrorLog`)**:
   - Qualquer erro ou rejeição de regra de negócio (cupom inválido/expirado/inativo, tipo de cliente incompatível, plano incompatível, falha na API do Asaas, ou tentativa bloqueada de cadastro do mesmo site na 3ª conta em diante) **deve obrigatoriamente gerar registro detalhado em `SystemErrorLog`**.

---

## 3. Especificação Detalhada do Domínio de Cupons

### 3.1. Atributos do Cupom (`Coupon`)
- **`name` (Nome)**: Nome amigável/comercial da campanha (ex.: `"Promo Influencer 3 Meses por 19,90"`). Obrigatório.
- **`code` (Código do Cupom)**: Código único alfanumérico digitado pelo usuário (ex.: `"INFLUENCER19"`, `"BEMVINDO3M"`). Sempre higienizado e salvo em `UPPERCASE` sem espaços. Obrigatório e `@unique`.
- **`description` (Descrição)**: Explicação detalhada das condições do cupom. Opcional.
- **`validFrom` (Válido a partir de)**: Data/hora inicial opcional de vigência (default `now()`).
- **`validUntil` (Válido até)**: Data/hora limite para resgate do cupom. Quando preenchido, qualquer tentativa após `validUntil` é rejeitada como expirada. Quando `null`, não expira por data.
- **`plans` (Planos Elegíveis — Múltiplos Planos)**: Relação `N:N` via tabela `CouponPlan` ligando o cupom a um ou múltiplos registros de `Plan`. O cupom só é válido se o plano alvo estiver na lista de planos associados.
- **`discountType` (Tipo de Desconto)** e **`discountValue` (Valor)**:
  - `PERCENTAGE` (**Percentual**): Desconto de $X\%$ ($0 < X \le 100$) sobre o valor do plano (`finalPrice = planPrice * (1 - X/100)`).
  - `FIXED_DISCOUNT` (**Valor Fixo de Abatimento**): Desconto de $\text{R\$ } X$ subtraído do valor do plano (`finalPrice = max(0, planPrice - X)`).
  - `FIXED_PRICE` (**Valor Fixo Final Promocional**): Define diretamente que o cliente pagará exatamente $\text{R\$ } X$ (ex.: `R$ 19,90`) durante a vigência promocional do cupom, independentemente do preço cheio do plano (desde que $X < \text{planPrice}$ e $X > 0$).
  - > **Nota de Produto**: O modo `FIXED_PRICE` resolve de forma direta e à prova de erros o caso *"quem assinar o plano Influencer pague nos 3 primeiros meses R$ 19,90"*, enquanto `FIXED_DISCOUNT` e `PERCENTAGE` cobrem descontos clássicos em reais ou porcentagem. Na tela do Backoffice, o formulário mostra uma prévia em tempo real de quanto ficará a mensalidade em cada plano selecionado.
- **`durationMonths` (Quanto tempo)**: Inteiro $\ge 0$:
  - `0` = **Para Sempre** (desconto vitalício enquanto a assinatura permanecer ativa naquele plano).
  - `1` = **Primeiro Mês** (apenas a 1ª cobrança tem desconto; da 2ª em diante cobra o valor cheio).
  - `3` = **Os 3 Primeiros Meses** (as 3 primeiras cobranças têm desconto; da 4ª em diante cobra o valor cheio).
  - Qualquer inteiro positivo $N \ge 1$ representa **os $N$ primeiros ciclos/meses**.
- **`customerType` (Tipo de Cliente)**:
  - `NEW` (**Cliente Novo**): Válido exclusivamente na criação da conta / primeira contratação paga de um Workspace que nunca teve assinatura paga confirmada anteriormente.
  - `BASE` (**Cliente Base**): Válido exclusivamente na tela **Plano & Cobrança** (`/settings/billing` ou `/settings/billing/upgrade`) para contas já existentes na base.
  - `BOTH` (**Ambos**): Válido tanto na criação da conta quanto em Plano & Cobrança.
- **`maxUses` (Limite Global de Usos)** e **`usedCount`**:
  - Permite limitar o cupom a $M$ resgates globais (`null` = ilimitado).
- **`maxUsesPerWorkspace` (Limite por Conta/Workspace)**:
  - Padrão `1`: impede que o mesmo Workspace aplique o mesmo cupom repetidas vezes para renovar o período promocional.
- **`active` (Ativo/Inativo)**:
  - Booleano (`default: true`) que permite suspender o cupom imediatamente no Backoffice sem apagar o histórico de resgates.

---

## 4. Integração com a API v3 do Asaas e Ciclo de Vida das Cobranças

### 4.1. Regras da API do Asaas (`https://docs.asaas.com/docs/assinaturas-recorrência`)
1. No Asaas, uma assinatura (`Subscription`) possui o campo `value` que determina o valor da cobrança gerada a cada ciclo (`MONTHLY` ou `YEARLY`).
2. O Asaas **não possui** um array nativo de preços escalonados por mês em uma única chamada `POST /v3/subscriptions`.
3. O endpoint **`PUT /v3/subscriptions/{id}`** permite atualizar o `value` da assinatura e enviar **`"updatePendingPayments": true`**, o que atualiza imediatamente qualquer cobrança com status `PENDING` já emitida para o ciclo seguinte, preservando intactas as cobranças já pagas (`CONFIRMED` / `RECEIVED`).

### 4.2. Algoritmo de Cobrança Promocional ($N$ Primeiros Meses a R$ 19,90 e Demais a R$ 89,90)
1. **No Momento da Contratação (`POST /api/billing/checkout`) ou Aplicação em Cliente Base (`POST /api/billing/coupons/apply`)**:
   - Calcula-se server-side com `Prisma.Decimal`:
     - `originalPlanAmount`: valor cheio do plano (ex.: `89.90`).
     - `discountedAmount`: valor com o cupom aplicado (ex.: `19.90`).
   - **Se `durationMonths === 0` (Para Sempre)**:
     - Cria/atualiza a assinatura no Asaas com `value = 19.90`.
     - Salva em `Subscription`: `amount = 19.90`, `originalPlanAmount = 89.90`, `discountedAmount = 19.90`, `discountDurationMonths = 0`, `discountCyclesUsed = 0`, `couponId = coupon.id`.
   - **Se `durationMonths > 0` (ex.: `durationMonths = 3`)**:
     - Cria (`POST /v3/subscriptions`) ou atualiza (`PUT /v3/subscriptions/{id}` com `updatePendingPayments: true`) a assinatura no Asaas com **`value = 19.90`** e descrição indicando a promoção:
       `"Assinatura News Curator - Plano Influencer (Cupom INFLUENCER19: 3 primeiros meses por R$ 19,90, após R$ 89,90)"`.
     - Salva em `Subscription`:
       - `amount = 19.90`
       - `originalPlanAmount = 89.90`
       - `discountedAmount = 19.90`
       - `discountDurationMonths = 3`
       - `discountCyclesUsed = 0`
       - `couponId = coupon.id`
     - Cria registro em `CouponRedemption` (`status: "ACTIVE"`, `durationMonths: 3`, `cyclesUsed: 0`) e incrementa `Coupon.usedCount`.
     - Cria registro em `PlanHistory` (`eventType: "COUPON_APPLIED"`).

2. **Controle Automático de Ciclos Promocionais e Transição para o Valor Cheio (`R$ 89,90`)**:
   - Executado de forma determinística e idempotente no **Webhook do Asaas (`POST /api/webhooks/asaas`)** e na **Sincronização (`BillingService.syncWorkspaceWithGateway`)**:
   - Quando uma cobrança da assinatura com desconto temporário ativo (`discountDurationMonths > 0`) é confirmada/recebida (`PAYMENT_CONFIRMED` ou `PAYMENT_RECEIVED`):
     - Verifica-se se a cobrança (`providerPaymentId`) já foi contabilizada para evitar incremento duplicado em caso de `PAYMENT_CONFIRMED` seguido de `PAYMENT_RECEIVED` para a mesma fatura (contando faturas distintas pagas desde `appliedAt` ou gravando `discountCountedAt` na `Invoice`).
     - Incrementa-se `Subscription.discountCyclesUsed` (e `CouponRedemption.cyclesUsed`).
     - **Regra de Transição**:
       - Enquanto `discountCyclesUsed < discountDurationMonths` (ex.: pagou a 1ª ou a 2ª de 3): a assinatura no Asaas permanece em `value = 19.90` para gerar a próxima cobrança promocional.
       - **Assim que `discountCyclesUsed >= discountDurationMonths` (ex.: quando a 1ª cobrança é paga em um cupom de `1 mês`, ou quando a 3ª cobrança é paga em um cupom de `3 meses`)**:
         1. O sistema chama imediatamente `AsaasGateway.updateSubscription(asaasSubscriptionId, { value: originalPlanAmount, updatePendingPayments: true, description: "Assinatura News Curator - Plano Influencer" })`.
         2. Atualiza `Subscription.amount = originalPlanAmount` (`89.90`), marca `CouponRedemption.status = "COMPLETED"` (`completedAt = now()`) e registra no `PlanHistory` o evento `DISCOUNT_CYCLE_COMPLETED` (`chargedAmount: 89.90`).
   - **Salvaguarda Adicional em `PAYMENT_CREATED` (Boleto/Pix gerados antecipadamente)**:
     - Se o Asaas emitir um evento `PAYMENT_CREATED` e o número total de faturas emitidas (não canceladas) desde a aplicação do cupom ultrapassar `discountDurationMonths` (ou seja, é a $(N+1)$-ésima fatura gerada antes da confirmação da $N$-ésima), o sistema também dispara `PUT /v3/subscriptions/{id}` (`value: originalPlanAmount, updatePendingPayments: true`), garantindo que a $(N+1)$-ésima fatura nunca seja cobrada com o valor promocional.

---

## 5. Histórico e Trava Anti-Fraude de Cadastro de Sites (`SiteRegistrationHistory`)

### 5.1. Normalização Estrita de Domínio/Site
- Função utilitária central `normalizeSiteDomain(rawUrl: string): string` em `src/lib/site-antifraud.ts`:
  - Remove protocolo (`http://`, `https://`), credenciais, portas, prefixo `www.`, barras finais e sufixos administrativos do WordPress (`/wp-admin`, `/wp-login.php`, `/wp-json`, `/xmlrpc.php`, `/feed`).
  - Converte para `lowercase`.
  - Exemplo:
    - `https://www.SiteDoEmail1.com.br/` → `sitedoemail1.com.br`
    - `http://sitedoemail1.com.br/wp-json` → `sitedoemail1.com.br`
    - Se for subpasta multisite real (ex.: `meusite.com.br/portal2`), normaliza o host principal ou `host + pathname base` de forma consistente para impedir bypass por variação de URL.

### 5.2. Regra de Contagem de Contas (1ª Vez OK, 2ª Vez OK, 3ª Vez Bloqueia)
- Ao tentar cadastrar ou atualizar um site em:
  1. **Criação da Conta** (`POST /api/auth/register` e validação prévia no Passo 1 de `/register` quando o usuário informa o campo `website`);
  2. **Destinos WordPress** (`POST /api/wordpress/sites` e `PATCH /api/wordpress/sites/[id]` quando a URL é alterada):
- O serviço `SiteAntifraudService.checkAndRecordSiteRegistration` consulta `SiteRegistrationHistory` para o `normalizedDomain`:
  - Obtém a lista de **`workspaceId` distintos** que já tiveram registro `ALLOWED` para aquele `normalizedDomain`.
  - Se o `workspaceId` atual **já consta** entre os permitidos (ex.: o mesmo cliente editando ou recadastrando o site dentro da mesma conta), permite normalmente sem aumentar o contador de contas distintas.
  - Se é uma **nova conta (`workspaceId` distinto)**:
    - Calcula `distinctAccountCount = existingAllowedWorkspaces.size + 1`.
    - **Se `distinctAccountCount === 1` (1ª vez)**:
      - Grava em `SiteRegistrationHistory` com `attemptNumber: 1, status: "ALLOWED"`.
      - Permite o cadastro normalmente.
    - **Se `distinctAccountCount === 2` (2ª vez)**:
      - Grava em `SiteRegistrationHistory` com `attemptNumber: 2, status: "ALLOWED"`.
      - Permite o cadastro normalmente.
    - **Se `distinctAccountCount >= 3` (3ª vez em diante)**:
      - Grava em `SiteRegistrationHistory` com `attemptNumber: distinctAccountCount, status: "BLOCKED"`.
      - **Gera obrigatoriamente um Log de Erro em `SystemErrorLog`** (`module: "WORDPRESS"` ou `"AUTH"`, `statusCode: 403`) detalhando o domínio normalizado, a URL informada, o `workspaceId`/`userEmail` atual e os `workspaceId`s/`userEmail`s anteriores onde o site já foi utilizado.
      - **Bloqueia a operação (HTTP 403)** e retorna a mensagem de alerta:
        > *"Alerta de Segurança: O site informado já foi cadastrado anteriormente em outras contas e atingiu o limite máximo permitido pelo sistema. Não é possível vincular este site a uma nova conta. Por favor, entre em contato com o nosso Suporte para regularizar seu acesso."*
- **Persistência Perpétua**:
  - Quando `deleteWordPressSite` é chamado, o registro na tabela `WordPressSite` é removido, mas o registro em `SiteRegistrationHistory` **jamais é apagado**.
- **Gestão no Backoffice**:
  - O SuperAdmin poderá consultar o histórico de sites por empresa ou globalmente e, caso o cliente entre em contato com o suporte com uma justificativa legítima (ex.: agência que comprou um domínio usado), o SuperAdmin terá um botão `"Liberar Domínio (Resetar Bloqueio)"` que marca os registros antigos como `CLEARED_BY_SUPPORT` com auditoria.

---

## 6. Obrigatoriedade de Logs de Erros (`SystemErrorLog`)

Qualquer erro ou tentativa inválida nos fluxos desta fase **deve obrigatoriamente** invocar `logSystemError` / `handleApiError` (`src/lib/errors/service.ts`):
1. **Validação/Aplicação de Cupom (`/api/billing/coupons/validate`, `/api/billing/coupons/apply`, `/api/billing/checkout`)**:
   - Cupom não encontrado (`404`);
   - Cupom inativo (`400`);
   - Cupom expirado (`validUntil < now`) (`400`);
   - Limite de usos atingido (`maxUses` ou `maxUsesPerWorkspace`) (`400`);
   - Tipo de cliente incompatível (ex.: Cliente Base tentando usar cupom de Cliente Novo ou Cliente Novo tentando usar cupom de Cliente Base) (`403`);
   - Plano selecionado não faz parte dos planos permitidos pelo cupom (`400`);
   - Erro ao comunicar com o Asaas (`POST /v3/subscriptions` ou `PUT /v3/subscriptions/{id}`) (`502`/`500`).
2. **Webhook Asaas e Transição de Ciclos (`/api/webhooks/asaas` e `BillingService.syncWorkspaceWithGateway`)**:
   - Qualquer falha ao atualizar o valor da assinatura no Asaas após o término dos $N$ meses promocionais deve gerar log crítico em `SystemErrorLog` (`module: "BILLING"`, `screen: "Asaas Webhook / Ciclo de Cupom"`).
3. **Anti-Fraude de Cadastro de Sites (`/api/wordpress/sites`, `/api/wordpress/sites/[id]`, `/api/auth/register`)**:
   - Bloqueio na 3ª tentativa em diante gera log em `SystemErrorLog` (`module: "WORDPRESS"` ou `"AUTH"`, `statusCode: 403`) com metadados completos para o suporte.
4. **Backoffice de Cupons (`/api/backoffice/coupons`)**:
   - Tentativa de criar cupom com código duplicado, parâmetros inválidos ou falha de banco gera log em `SystemErrorLog` (`module: "BACKOFFICE"`).

---

## 7. Plano de Tasks e Definition of Done Phase 39

Sequência detalhada em `news-curator-harness/PLAN-phase39-coupons-plan-history-and-site-antifraud.md` e `news-curator-harness/tasks/290-*.md` a `296-*.md`:

- [x] **Task 290** (`tasks/290-coupons-plan-history-and-site-antifraud-schema.md`): Schema Prisma (`Coupon`, `CouponPlan`, `CouponRedemption`, `PlanHistory`, `SiteRegistrationHistory`, campos em `Subscription` e `BillingCheckoutSession`), migração do banco e serviços de domínio (`CouponService`, `PlanHistoryService`, `SiteAntifraudService`) com logging integrado em `SystemErrorLog`.
- [x] **Task 291** (`tasks/291-site-antifraud-guard-and-history.md`): Normalização de domínio/URL e trava anti-fraude (1ª conta OK, 2ª conta OK, 3ª conta em diante Bloqueada com alerta pedindo para procurar o suporte + `SystemErrorLog`) em `/api/wordpress/sites`, `/api/wordpress/sites/[id]`, `/settings/wordpress`, `/api/auth/register` e `/register`.
- [x] **Task 292** (`tasks/292-backoffice-coupons-and-history-management.md`): Tela e APIs de Cupons de Desconto no Backoffice (`/backoffice/coupons`) com Nome, Código, Descrição, Válido até, Múltiplos Planos, Tipo de Desconto (Percentual, Desconto Fixo ou Preço Fixo), Quanto Tempo (`0` = Para Sempre, `1` = 1º Mês, `3` = 3 Primeiros Meses...), Tipo de Cliente (`Novo`, `Base`, `Ambos`), além de visualização do Histórico de Planos e Histórico/Liberação de Sites no Backoffice.
- [x] **Task 293** (`tasks/293-asaas-subscription-discount-lifecycle.md`): Evolução de `AsaasGateway` (`updateSubscription` via `PUT /v3/subscriptions/{id}` com `updatePendingPayments: true`), automação do ciclo de vida do desconto temporário no Webhook do Asaas (`/api/webhooks/asaas`) e no `BillingService.syncWorkspaceWithGateway` (cobrando ex.: R$ 19,90 nas 3 primeiras e atualizando automaticamente para R$ 89,90 nas demais).
- [x] **Task 294** (`tasks/294-register-and-onboarding-coupon-flow.md`): Campo e validação de Cupom de Desconto na Criação da Conta (`/register` e `/checkout/billing`), endpoint `POST /api/billing/coupons/validate`, validação para Cliente Novo, resumo visual do desconto e envio ao Asaas em `/api/billing/checkout` com logs de erro.
- [x] **Task 295** (`tasks/295-billing-settings-base-coupon-and-plan-history-ui.md`): Opção de informar e aplicar Cupom de Desconto em **Plano & Cobrança** (`/settings/billing` e `/settings/billing/upgrade`), endpoint `POST /api/billing/coupons/apply` validando cupom ativo/válido/plano do cliente/Cliente Base e atualizando a assinatura no Asaas, além da exibição do **Histórico de Planos** na tela.
- [x] **Task 296** (`tasks/296-phase39-e2e-tests-and-hardening.md`): Testes E2E automatizados (`scripts/phase39/test-coupons-history-and-site-antifraud-e2e.ts`), auditoria de segurança (`run-security-scanner`), `npx tsc --noEmit`, `npm run lint`, `npm run build` e atualização de `PROGRESS.md` e `MEMORY.md`.

---

# Phase 40. Hardening de Segurança Pré-Produção (Auditoria de 20 Pontos)

## 1. Estado e autorização
Planejada em 2026-11-10 a partir da Auditoria Completa de Segurança e Confiabilidade de 20 Pontos.
Concluída: Tasks 297 a 302 DONE.

## 2. Objetivo e escopo
Remediar integralmente os itens classificados como `[VULNERÁVEL]` ou `[ALERTA]` na auditoria pré-publicação, elevando todos os 20 pontos de verificação ao status `[CONFORME]`:

1. **Autenticação Robusta e Bloqueio de Senha Nula (`src/auth.ts`)**:
   - Impedir login via `Credentials` para qualquer usuário cujo `passwordHash` seja `null` ou vazio (`if (!regularUser.passwordHash) return null;`).
   - Substituir igualdade direta de strings (`===`) na verificação de `SUPERADMIN_PASSWORD` e `ADMIN_PASSWORD` por comparação criptográfica em tempo constante (`crypto.timingSafeEqual` sobre digest SHA-256).
   - Desativar o fallback legado `ADMIN_EMAIL` / `ADMIN_PASSWORD` quando `NODE_ENV === "production"`, exigindo contas com `passwordHash` bcrypt ou `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD`.
2. **Autorização no Servidor, Proxy Guard e Proteção de Layout (`src/proxy.ts` e `src/app/(app)/layout.tsx`)**:
   - No `src/proxy.ts`, inspecionar ativamente a sessão (`await auth()`) para todas as rotas cobertas pelo `matcher` (preservando públicas: `/`, `/login`, `/register`, `/forgot-password`, landing pages de SEO, `/blog*`, `/sitemap.xml`, `/robots.txt`, `/api/auth/*`, `/api/billing/coupons/validate`, `/api/webhooks/*`).
   - Retornar `HTTP 401` JSON para requisições `/api/*` sem sessão válida e redirecionar páginas privadas (`/(app)/*`, `/backoffice/*`) para `/login`.
   - Em `src/app/(app)/layout.tsx`, exigir `session?.user?.id` com `redirect("/login")`.
3. **Isolamento Multi-Tenant Estrito e Prevenção a IDOR (`src/lib/workspace.ts`)**:
   - Remover o fallback automático para `DEFAULT_WORKSPACE_ID` em requisições não autenticadas.
   - Lançar `UnauthorizedWorkspaceError` (`status: 401`) quando `getSessionWorkspaceId()` for chamado sem sessão válida em produção (permitindo fallback para `TEST_WORKSPACE_ID || DEFAULT_WORKSPACE_ID` apenas em scripts locais de teste fora de produção).
   - Garantir que `getAuthenticatedWorkspace()` retorne `null` quando não autenticado ou em caso de erro.
   - Integrar `UnauthorizedWorkspaceError` ao `handleApiError` (`src/lib/errors/service.ts`) para responder `HTTP 401`.
4. **Rate Limiting, Anti-Brute Force de OTP/Login e Webhook Asaas Fail-Closed (`src/lib/security/rate-limit.ts` e `src/lib/payments/asaas.ts`)**:
   - Criar `src/lib/security/rate-limit.ts` em memória (sem dependência de Redis) com controle de tentativas falhas e bloqueio temporário (`HTTP 429`).
   - Em `POST /api/auth/verify-code`, `POST /api/auth/forgot-password/reset` e `POST /api/auth/register`: limitar a **5 tentativas incorretas** por e-mail; ao atingir a 5ª falha, **deletar imediatamente o `VerificationToken` no banco**, bloquear por 15 minutos (`HTTP 429`) e registrar em `SystemErrorLog` (`module: "AUTH"`, `statusCode: 429`).
   - Em `AsaasGateway.handleWebhook` (`src/lib/payments/asaas.ts`): adotar política **Fail-Closed**, rejeitando com `401` se `ASAAS_WEBHOOK_TOKEN` não estiver configurado ou se o header `asaas-access-token` não corresponder em tempo constante, registrando a tentativa em `SystemErrorLog`.
5. **Sanitização contra Stored XSS e Proteção contra SSRF em RSS/Scraper (`src/lib/security/sanitize-html.ts`, `src/lib/rss.ts`, `src/lib/scraper.ts`)**:
   - Criar `sanitizeHtml` em `src/lib/security/sanitize-html.ts` removendo `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, atributos de evento `on*` (`onerror`, `onload`, `onclick`, etc.) e protocolos `javascript:` / `vbscript:` / `data:text/html`, preservando HTML editorial e `data:image/*`.
   - Aplicar `sanitizeHtml` antes de qualquer `dangerouslySetInnerHTML` em `affiliate-article-editor.tsx`, `affiliate-block-manager.tsx` e no salvamento de artigos em `article-persistence-service.ts`.
   - Reutilizar e expandir a proteção anti-SSRF (`src/lib/affiliate/ssrf.ts` → `validateSafeRemoteUrl`) para validar URLs de feeds em `POST /api/sources`, `PATCH /api/sources/[id]`, `fetchAndParseRss` (`src/lib/rss.ts`) e `scrapeArticleContent` (`src/lib/scraper.ts`), bloqueando `localhost`, `127.0.0.1`, `::1`, `169.254.169.254` e faixas privadas RFC 1918.
6. **Security Headers (`next.config.ts`), Mascaramento Seguro de Erros e Higienização de Logs (`src/lib/errors/service.ts`)**:
   - Configurar `headers()` em `next.config.ts` com `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` e `Permissions-Policy`.
   - Criar `getSafeClientErrorMessage` em `src/lib/errors/service.ts` para impedir que erros internos do Prisma/banco vazem nomes de tabelas, constraints ou stack traces em respostas JSON `500`, mantendo os detalhes restritos ao `SystemErrorLog`.
   - Higienizar `console.log` com PII (nomes, e-mails, documentos) em `asaas.ts`, `webhooks/asaas/route.ts` e `mock-adapter.ts` em produção.

## 3. Plano de Tasks e Definition of Done Phase 40
Sequência detalhada em `news-curator-harness/PLAN-phase40-security-hardening-and-pre-production-audit.md` e `news-curator-harness/tasks/297-*.md` a `302-*.md`:

- [x] **Task 297** (`tasks/297-auth-hardening-and-proxy-route-guard.md`): Autenticação Robusta (`src/auth.ts`), Bloqueio de Senha Nula, Comparação Constant-Time, Proxy Guard (`src/proxy.ts`) e Proteção do Layout Autenticado (`src/app/(app)/layout.tsx`).
- [x] **Task 298** (`tasks/298-multi-tenant-workspace-isolation-and-idor-guard.md`): Blindagem de Isolamento Multi-Tenant (`src/lib/workspace.ts`), Remoção de Fallback Anônimo para `DEFAULT_WORKSPACE_ID` e Prevenção a IDOR.
- [x] **Task 299** (`tasks/299-rate-limiting-brute-force-and-webhook-fail-closed.md`): Rate Limiting e Anti-Brute Force de OTP/Login (`src/lib/security/rate-limit.ts`) e Política *Fail-Closed* no Webhook Asaas (`src/lib/payments/asaas.ts`).
- [x] **Task 300** (`tasks/300-xss-html-sanitization-and-ssrf-rss-scraper-guard.md`): Sanitização HTML contra Stored XSS (`src/lib/security/sanitize-html.ts`) e Proteção contra SSRF na Coleta RSS (`src/lib/rss.ts`) e Scraper (`src/lib/scraper.ts`).
- [x] **Task 301** (`tasks/301-security-headers-error-masking-and-log-hygiene.md`): Security Headers no `next.config.ts`, Mascaramento Seguro de Erros Internos nas APIs e Higienização de PII em Logs de Console.
- [x] **Task 302** (`tasks/302-phase40-security-audit-e2e-and-hardening.md`): Suíte E2E de Testes de Segurança (20 Pontos & Abuse Cases), Validação TypeScript, ESLint, Build de Produção e Registro de Evidências.

---

# Phase 41. Performance e Escalabilidade SaaS Multi-Tenant (Auditoria dos 8 Pilares)

## 1. Estado e autorização
Planejada e executada em 2026-11-11 a partir do Diagnóstico Técnico One-Shot dos 8 Pilares de Performance e Escalabilidade de Sistemas SaaS Multi-Tenant.
Concluída: Tasks 303 a 308 DONE com 100% de conformidade validada em suíte E2E.

## 2. Objetivo e escopo
Elevar todos os **8 Pilares de Performance de Arquitetura SaaS** ao status `[CONFORME]` dentro da stack existente (Next.js 16 App Router + React 19 + Prisma 7 `@prisma/adapter-pg` + PostgreSQL), sem introduzir infraestrutura proibida pelo `AGENTS.md`:

1. **Pilar 1 — Banco de Dados (Índices Compostos Multi-Tenant + Pool de Conexões)**:
   - Adicionar 14 índices compostos multi-tenant em `prisma/schema.prisma`:
     - `Source`: `@@index([workspaceId, active])`, `@@index([workspaceId, createdAt(sort: Desc)])`
     - `Article`: `@@index([workspaceId, status, createdAt(sort: Desc)])`, `@@index([workspaceId, processedAt])`, `@@index([workspaceId, sourceId, status])`, `@@index([workspaceId, wordpressSiteId, status])`, `@@index([workspaceId, originalPublishedAt])`
     - `Product`: `@@index([workspaceId, status, updatedAt(sort: Desc)])`, `@@index([workspaceId, categoryId, status])`
     - `ProductOffer`: `@@index([workspaceId, status, price])`, `@@index([productId, status, price])`
     - `Invoice`: `@@index([workspaceId, createdAt(sort: Desc)])`, `@@index([subscriptionId, status])`
     - `SystemErrorLog`: `@@index([workspaceId, module, createdAt(sort: Desc)])`
     - `PlanHistory`: `@@index([workspaceId, createdAt(sort: Desc)])`
   - Ajustar `idleTimeoutMillis: 15000` no Singleton `pg.Pool` em `src/lib/prisma.ts`.
2. **Pilar 2 — Queries (Paginação Obrigatória + Seleção Explícita + Zero N+1)**:
   - Em `GET /api/articles` (`src/app/api/articles/route.ts`): adicionar `take` (default `50`, máximo travado em `100`), `skip` paginado e `select` explícito (omitindo `originalContent`, `content`, `canonicalContent` na listagem geral a menos que `?includeContent=true`).
   - Em `GET /api/billing/invoices` (`src/app/api/billing/invoices/route.ts`): adicionar `take` máximo travado em `100` (default `50`).
   - Em `GET /api/backoffice/companies` (`src/app/api/backoffice/companies/route.ts`): travar `pageSize <= 50` e substituir o N+1 de `article.count` e `source.count` por 2 queries agregadas `groupBy`.
   - Em `processRssSources` (`src/lib/rss.ts`): incluir `wordpressSiteSources` no `findMany` inicial e filtrar `existingArticles` por `workspaceId`.
   - Em `syncWordPressCategories` (`src/lib/wordpress.ts` e `/api/wordpress/sites/[id]/categories/sync`): substituir `upsert` sequencial em loop por `prisma.$transaction`.
   - Em `AffiliateAnalyticsService.getDashboardStats` (`src/lib/affiliate/analytics-service.ts`) e `markDependentArticlesForRepublish` (`src/lib/publisher/publication-sync.ts`): limitar leitura em memória e filtrar previamente no banco.
3. **Pilares 3 e 4 — Assincronismo, Timeouts Estritos e Paralelismo (`Promise.all`)**:
   - Configurar `AbortSignal.timeout(...)` em todas as chamadas HTTP externas: `src/lib/payments/asaas.ts`, `src/lib/wordpress.ts`, `src/lib/affiliate/woocommerce-publisher.ts`, `src/lib/ai/providers/openai.ts`, `gemini.ts`, `anthropic.ts`, `openai-compatible.ts` e `src/lib/images/adapters/openai-dalle.ts`.
   - Configurar `connectionTimeout`, `greetingTimeout` e `socketTimeout` em `src/lib/mail/adapters/smtp-adapter.ts`.
   - Paralelizar chamadas independentes com `Promise.all` / `Promise.allSettled` em `src/app/api/articles/[id]/process-ai/route.ts`, `src/lib/ai.ts`, `src/lib/wordpress.ts`, `src/lib/affiliate/woocommerce-publisher.ts` e `src/lib/affiliate/refresh-service.ts`.
   - Desacoplar `markDependentArticlesForRepublish` em `src/lib/affiliate/offer-service.ts` usando `after()` do `next/server` (com fallback seguro).
4. **Pilar 5 — IA (Streaming de Progresso SSE)**:
   - Adicionar callback `onProgress` em `processArticleWithAi` (`src/lib/ai.ts`) e suporte a `ReadableStream` (`text/event-stream` via `?stream=1` ou header `Accept: text/event-stream`) em `POST /api/articles/[id]/process-ai`, mantendo retorno JSON padrão para compatibilidade retroativa.
5. **Pilares 6, 7 e 8 — Frontend State, Debounce em Buscas e Infraestrutura Next.js**:
   - Criar `src/hooks/use-debounce.ts` (`useDebounce<T>(value, delay = 400)`) e aplicar em `product-list.tsx`, `company-list.tsx`, `error-logs-viewer.tsx` e `rss-publishing-queue.tsx`.
   - Eliminar o loop de re-fetch a cada tecla em `src/components/affiliate/affiliate-block-manager.tsx` via `useRef<Set<string>>` e aplicar *Optimistic UI* em `src/components/affiliate/offer-list.tsx`.
   - Configurar `compress: true`, `poweredByHeader: false`, `experimental.optimizePackageImports` (`lucide-react`, `framer-motion`) e `Cache-Control: public, max-age=31536000, immutable` para `/modified-images/:path*` em `next.config.ts`.

## 3. Plano de Tasks e Definition of Done Phase 41
Sequência detalhada em `news-curator-harness/PLAN-phase41-performance-and-scalability-8-pillars.md` e `news-curator-harness/tasks/303-*.md` a `308-*.md`:

- [x] **Task 303** (`tasks/303-multi-tenant-composite-indexes-and-pool.md`): Índices Compostos Multi-Tenant (`prisma/schema.prisma`), sincronização com o PostgreSQL (`npx prisma db push`) e otimização do Pool de Conexões (`src/lib/prisma.ts`).
- [x] **Task 304** (`tasks/304-queries-pagination-select-and-n-plus-1.md`): Paginação Obrigatória, Seleção Explícita (`select`) e Eliminação de Queries N+1 (`groupBy` em `/api/backoffice/companies`, `$transaction` em categorias WordPress, `include` em `rss.ts` e filtros em `publication-sync.ts`).
- [x] **Task 305** (`tasks/305-integrations-timeouts-parallelism-and-async.md`): Timeouts Estritos (`AbortSignal.timeout` e SMTP), Paralelismo com `Promise.all` / `Promise.allSettled` e Desacoplamento Assíncrono pós-resposta.
- [x] **Task 306** (`tasks/306-ai-streaming-progress-sse.md`): Streaming SSE (`ReadableStream` / `text/event-stream`) de progresso em tempo real no processamento de artigos com IA (`POST /api/articles/[id]/process-ai` e `src/lib/ai.ts`).
- [x] **Task 307** (`tasks/307-frontend-debounce-optimistic-ui-and-next-config.md`): Hook `useDebounce` aplicado em buscas/filtros (`ProductList`, `CompanyList`, `ErrorLogsViewer`, `RssPublishingQueue`), Deduplicação no `AffiliateBlockManager`, *Optimistic UI* em `OfferList` e Otimizações de Rede/Cache no `next.config.ts`.
- [x] **Task 308** (`tasks/308-phase41-performance-8-pillars-e2e-and-hardening.md`): Suíte E2E de Auditoria dos 8 Pilares de Performance SaaS (`scripts/phase41/test-performance-8-pillars-e2e.ts`), Validação TypeScript, ESLint, Build de Produção e Registro de Evidências.




