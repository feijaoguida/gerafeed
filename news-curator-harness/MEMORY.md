# MEMORY.md. Memória Permanente do Projeto

## Produto
- News Curator é um SaaS multi-tenant para curadoria de notícias.
- Usuários trabalham dentro de Workspaces.
- Workspaces possuem planos, limites, fontes RSS, configurações, artigos e sites WordPress.
- Publicação exige aprovação explícita.
- Processamento RSS é manual e limitado pelo billing conforme as regras existentes.

## Stack
- Next.js App Router.
- TypeScript.
- Prisma.
- PostgreSQL.
- Tailwind CSS v4.
- Vercel.
- NextAuth/Auth.js.

## Multi-tenant
- `Workspace` é o tenant.
- `WorkspaceUser` conecta usuários ao tenant.
- Dados de domínio usam `workspaceId`.
- O isolamento tenant-per-row é obrigatório.

## WordPress. Nova arquitetura
A partir da Phase 8:

- `WordPressSite` representa um destino WordPress.
- Um Workspace pode possuir vários WordPressSites.
- `Source` continua sendo global dentro do Workspace.
- Feed e WordPress possuem relação N:N.
- A relação deve possuir override de prompt por destino.
- `Article` deve conhecer o `wordpressSiteId` quando o artigo tiver destino definido.

A antiga configuração `wordpressConnection` é tratada como legado/migração e não como representação permanente de múltiplos sites.

## Prompt
Há configuração global de prompt no Workspace.

A Phase 8 acrescenta:

- prompt default do WordPress;
- prompt default do Feed;
- override Feed ↔ WordPress.

Precedência:

`Feed ↔ WordPress override → Feed default → WordPress default → Workspace default`.

A regra deve ser centralizada.

## Feeds
`Source` contém, entre outros:
- name
- rssUrl
- active
- creditName
- defaultPromptType, se adotado na implementação.

A associação a WordPress ocorre por entidade N:N.

O cadastro de Feed pode ser global e também pode ser iniciado dentro da tela de um WordPress, criando e associando em uma operação.

Na listagem de artigos, filtros obrigatórios da Phase 8:
- data;
- Feed;
- WordPressSite.

O card deve exibir a data editorial do feed, preferencialmente `originalPublishedAt`.

## Billing
Já existem Plan, Subscription, Invoice e BillingService.

A Phase 9 deve reutilizar o BillingService para calcular limites/uso sempre que possível.

## Backoffice
- Backoffice é uma área administrativa da mesma aplicação.
- Usuários comuns não podem acessá-lo.
- `User.isSuperAdmin` é a autorização global.
- `WorkspaceUser.role` não substitui SuperAdmin.
- O Backoffice administra Workspaces exibidos como Empresas.
- Não criar `Company` duplicada sem necessidade.

## Planos
A Phase 9 adiciona administração de Features/limites.

Modelo sugerido:
- `Feature`
- `PlanFeature`

`PlanFeature` deve permitir enabled e limit quando aplicável.

## SuperAdmin
Seed idempotente com:

`SUPERADMIN_EMAIL`
`SUPERADMIN_PASSWORD`

Senha nunca deve ser impressa em logs.

## Segurança
- Secrets continuam criptografados com AES-256-GCM.
- Nunca exibir secrets descriptografados no Backoffice.
- APIs do Backoffice validam `isSuperAdmin` server-side.
- Toda alteração de Workspace/Empresa deve validar o alvo no servidor.

# Phase 10+. Affiliate Platform

## Direção
O GeraFeed evolui para plataforma central de catálogo, conteúdo afiliado e publicação multicanal. WordPress permanece como destino, não fonte da verdade.

## Mercado Livre MVP
- conta e canal já validados externamente;
- curadoria é feita no Mercado Livre;
- `affiliateUrl` é colado no GeraFeed;
- sistema resolve e importa metadados;
- sem scraping do Portal do Afiliado;
- sem credenciais Mercado Livre no GeraFeed.

## Importação
Guardar `affiliateUrl`, `resolvedUrl`, `externalProductId` quando disponível, `metadataSource` e `metadataLastFetchedAt`. Resultado pode ser COMPLETE/PARTIAL/FAILED. Dados ausentes nunca são inventados.

## Segurança
Resolver de links possui proteção SSRF e valida todos os redirects.

## Domínio
`AffiliateProgram` representa programa/marketplace. `Product` é o produto conceitual (com ficha técnica, specs, prós/contras e avaliação). `ProductOffer` é a oferta comercial concreta e contém o link de afiliado, seller, preço e carimbos de sincronização. `ProductCategory` provê taxonomia hierárquica por workspace com reparenting seguro na exclusão.

## Catálogo e Merge Policy
- Refresh de produtos e ofertas é estritamente manual/on-demand (sem cron jobs).
- Merge policy preserva rigorosamente alterações editoriais manuais (`description`, `specs`, `pros`, `cons`, `rating`) ao atualizar snapshots de preços e disponibilidade das ofertas.
- Slugs de produtos e categorias possuem unicidade isolada por Workspace (`[workspaceId, slug]`).

## Entitlements
- AFFILIATE_MODULE
- AFFILIATE_ANALYTICS
- AFFILIATE_MAX_PRODUCTS
- AFFILIATE_MAX_PROGRAMS

## Conteúdo
Tipos: PRODUCT_REVIEW, COMPARISON, BEST_PRODUCTS, BUYING_GUIDE, PROBLEM_SOLUTION, DEALS, SEASONAL. Cada tipo pode usar PromptTemplate próprio.

## Conteúdo canônico
Conteúdo comercial novo deve ser estruturado e independente de WordPress. Renderer resolve ProductOffer no momento da publicação.

## Publisher
Criar `PublisherAdapter`. Primeiro: WordPress. Futuro: Blogger e destinos próprios.

## Analytics
Inicialmente somente `AffiliateClick`. Vendas/comissões dependem de fonte oficial/importação confiável.

# Phase 14. Limites de Plano, Restrições de IA & Correções de UX

## Limites de plano expandidos
O modelo `Plan` possui `maxArticles` (mensal) e `maxDailyArticles` (diário) e `maxWordPressSites`. O `BillingService` suporta os recursos `ARTICLES`, `ARTICLES_DAILY` e `WORDPRESS_SITES`. Ao processar artigos, ambos os limites (diário e mensal) devem ser verificados. A resposta de limite deve indicar qual foi violado e quando ele será renovado.

## Features de restrição de IA
Três features booleanas novas controlam restrições do plano na tela de configurações de IA:
- `ai_unlimited_niches`: quando `false`, somente Política, Negócios e Meio Ambiente ficam habilitados como área de atuação.
- `ai_unlimited_styles`: quando `false`, somente Sério, Informativo, Alegre e Atraente ficam habilitados como estilos de escrita.
- `ai_advanced_providers`: quando `false`, somente OpenAI e OpenAI-Compatible ficam habilitados como provedores.

A validação é feita tanto no client (UI desabilita visualmente com badge "Upgrade") quanto no servidor (endpoint rejeita com 403 se o valor escolhido não for permitido para o plano).

## Preview de System Prompt removido
O bloco de preview live do system prompt foi removido da tela `/settings/ai`. A função `buildSystemPrompt` continua existindo para uso interno no processamento de IA; somente o componente de exibição foi removido.

## Afiliados: rota raiz e navegação
A rota `/affiliates` redireciona para `/affiliates/products`. A Sidebar exibe links de afiliados de forma coerente sem duplicação. O layout das telas de afiliados segue o design system.

# Phase 17+. Product Intelligence & Publishing

## Importação enriquecida
Mercado Livre importa de forma estruturada:
- Valor: preço atual e preço anterior (`price`, `oldPrice`).
- Vendedor / Loja Oficial (`seller`).
- Cor e variações selecionadas (`specs.Cor`).
- Bloco "O que você precisa saber sobre este produto" (`specs["O que você precisa saber"]`).
- Especificações / Tabela de características completas (marca, modelo, capacidade, formato de venda, unidades por kit, dimensões, forma).
- Descrição detalhada (`description`, `sourceDescription`).
- Opiniões do produto (`sourceRating`, `sourceReviewCount`, resumo de IA e até 5 amostras de reviews públicos).

## Source x Editorial
Product mantém dados editoriais separados de source metadata. Marketplace category é sugestão, não ProductCategory interna.

## ProductReferenceSource
Produto pode ter URLs externas. Sistema faz Safe Fetch e resumo por IA; resumos entram como grounding de Reviews/Comparações/Guias.

## Publicar Posts
Dashboard fica informativo. Central de Publicação possui RSS/Notícias e Conteúdo Affiliate.

## RSS Affiliate
Notícias podem receber ArticleAffiliatePlacement com produtos sugeridos pela IA e aprovados pelo usuário. Renderer resolve ProductOffer no publish.

## Prompts Affiliate
Prompts passam a ser globais e gerenciados no Backoffice. Workspace não edita PromptTemplate Affiliate. Contexto de nicho/estilo do Workspace pode continuar como input permitido.

# Phase 20. Billing Asaas Production Ready

## Estado existente

O projeto já possui:
- Plan;
- Subscription;
- Invoice;
- BillingService;
- PaymentProvider;
- AsaasProvider;
- Backoffice de Planos/Empresas;
- Feature/PlanFeature.

A Phase 20 evolui essa base. Não criar um segundo domínio de billing em paralelo.

## Plan Pricing

Plan passa a suportar:
- `monthlyPrice`;
- `annualDiscountPercent`.

Preço anual é derivado:

```text
monthlyPrice * 12 * (1 - annualDiscountPercent / 100)
```

Não persistir annualPrice como fonte primária, salvo necessidade técnica justificada.

## Billing Cycle

Ciclos comerciais:
- MONTHLY;
- YEARLY.

Asaas usa ciclos equivalentes.

## Snapshot

Subscription guarda o valor efetivamente contratado.

Mudança no preço do Plan não altera automaticamente assinaturas existentes.

## Sem fidelidade

Cancelamento interrompe renovação futura.

Acesso permanece até o fim do período já pago.

Não há pró-rata/reembolso automático nesta fase.

## BillingProfile

Workspace possui dados cadastrais necessários para cobrança e `asaasCustomerId`.

- O modelo `BillingProfile` armazena dados cadastrais de cobrança por Workspace com relação `1:1` (`workspaceId @unique`).
- O `providerCustomerId` no `BillingProfile` é automaticamente mantido em sincronia com `workspace.asaasCustomerId`.
- Módulo `src/lib/billing-profile-validation.ts` contém validação matemática pura de CPF/CNPJ e mascaramento PII, isolado de importações do Prisma para permitir importação segura em Client Components sem vazar módulos nativos do Node.js (`net`, `fs`, `tls`).
- Endpoints e formulários de cobrança rejeitam estritamente qualquer campo relativo a cartão de crédito (número, CVV, validade).
- `PaymentGateway` v2 expõe a propriedade `capabilities` (`customer`, `checkout`, `subscription`, `payments`, `webhooks`).
- `AsaasGateway.ensureCustomer` é 100% idempotente: reconcilia por ID salvo no banco, por `externalReference` (workspaceId) e por `cpfCnpj` limpo antes de criar novos clientes no Asaas.
- O checkout de contratação exige `BillingProfile` prévio. O cálculo do `amount` é 100% server-side e grava uma `BillingCheckoutSession` em status `PENDING`. O retorno do navegador no callback (`?checkout=success`) exibe aviso de pendência financeira e não ativa planos antes do evento de Webhook.

Usar `workspaceId` como `externalReference` ou referência equivalente do provider sempre que possível.

Evitar duplicar Customer no Asaas.

## Payment Methods

MVP:
- CREDIT_CARD;
- BOLETO;
- PIX, somente após contrato testado em sandbox.

Cartão:
- preferir Hosted Checkout Asaas;
- GeraFeed não recebe dados brutos de cartão.

Pix Automático é fora de escopo da Phase 20.

## Asaas Subscription

Subscription do Asaas agenda cobranças.

Payments gerados pela assinatura representam cada competência/período.

## Invoice / Payment Ledger

O GeraFeed mantém histórico local de:
- valor;
- vencimento;
- forma;
- status;
- providerPaymentId;
- confirmedAt;
- receivedAt;
- refundedAt;
- subscriptionId.

Não armazenar dados de cartão.

## Webhook

- `asaas-access-token`;
- token distinto da API Key;
- idempotência por event.id;
- evento duplicado retorna sucesso sem duplicar efeitos;
- campos desconhecidos não quebram o parser.

## Access Control

BillingService passa a considerar:
- plano;
- subscription local;
- currentPeriodEnd;
- cancelAtPeriodEnd;
- payment state;
- grace period.

## Reconciliation

Backoffice possui ação manual de sincronização com Asaas.

Sem cron nesta fase.

## Backoffice

Empresa/Workspace deve mostrar:
- plano;
- ciclo;
- valor;
- forma;
- status;
- próxima cobrança;
- cancelamento;
- pagamentos.

SuperAdmin nunca vê cartão/CVV.

## Checkout

Retorno do navegador não é confirmação financeira.

Webhook/reconciliation é a fonte financeira.
