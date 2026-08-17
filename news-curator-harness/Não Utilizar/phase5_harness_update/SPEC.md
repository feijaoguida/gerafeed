# News Curator. Phase 5 (SaaS & Multi-tenant)

## 1. Objetivo
Transformar o News Curator em um SaaS comercial (B2B/Creators) com suporte a múltiplos inquilinos (multi-tenant), planos de assinatura e integração com gateways de pagamento.

Nesta fase:
- Autenticação de usuários usando NextAuth.js (Auth.js).
- Separação de dados por Workspace (Tenant).
- Gestão de Planos (Starter, Creator, Scale).
- Abstração de Gateway de Pagamento.
- Integração com Asaas (principal) e preparação estrutural para Stripe.
- Controle de limites por plano (ex: 10 artigos/mês no grátis).

## 2. Multi-tenant e Autenticação
O sistema deixará de ser single-user. Todo usuário pertence a pelo menos um `Workspace` (Inquilino). Fontes (Sources), Artigos (Articles) e Configurações (Configurations) pertencerão a um `Workspace`, garantindo isolamento total de dados.
Autenticação: NextAuth (Providers: Credentials, Email/Magic Link ou OAuth - Google).

## 3. Planos e Limites
Sistema Freemium/Tiers.
- Planos definem cotas: `maxSources`, `maxArticlesPerMonth`, `maxWordpressSites`, `allowAIGeneration`, `requireBYOK`.
- Uma camada de serviço de *Billing* interceptará ações (ex: aprovar artigo, criar fonte) para validar limites.

## 4. Pagamentos (Gateway Abstraction)
O negócio não pode ficar preso ao Asaas. 
Criaremos a interface `PaymentProvider` com implementações: `AsaasProvider` e `StripeProvider`.
A configuração dirá qual provedor está ativo.

## 5. Criptografia
As credenciais (API Keys, senhas do WP) agora devem ser criptografadas levando em consideração o `workspaceId` para evitar acessos cruzados.

## 6. Definition of Done global (Phase 5)
- [ ] NextAuth integrado.
- [ ] Schema Prisma atualizado para suportar NextAuth, Workspaces, Plans e Subscriptions.
- [ ] Todas as tabelas de negócio (Source, Article, Configuration) vinculadas a um Workspace.
- [ ] Middlewares e Services refatorados para garantir Tenant Isolation (nunca vazar dados).
- [ ] Abstração de Gateway de Pagamento (`PaymentProvider`).
- [ ] Integração com Asaas implementada.
- [ ] Validador de limites de assinatura funcional.
