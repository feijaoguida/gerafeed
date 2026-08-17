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
