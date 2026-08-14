# MEMORY.md. Memória Permanente

## Produto
- News Curator é um SaaS multi-tenant.
- Usuários gerenciam Workspaces.
- Planos de assinatura (Free, Creator, Scale) limitam o uso e definem recursos.

## Banco de dados e ORM
- PostgreSQL + Prisma.
- **Novas Tabelas (Auth)**: `User`, `Account`, `Session`, `VerificationToken` (Padrão NextAuth).
- **Novas Tabelas (Tenant)**: `Workspace`, `WorkspaceUser` (relação N:N com role).
- **Novas Tabelas (Billing)**: `Plan`, `Subscription`, `Invoice`.
- **Isolamento**: `Source`, `Article`, `Configuration`, `WordPressCategory` agora possuem `workspaceId`.

## Autenticação
- NextAuth.js (v5 / Auth.js).
- Middleware do Next.js protege todas as rotas `/dashboard` e `/settings`.

## Gateway de Pagamentos
- Padrão Strategy: `PaymentProvider` (`AsaasProvider`, `StripeProvider`).
- Workspaces terão um `stripeCustomerId` ou `asaasCustomerId`.
