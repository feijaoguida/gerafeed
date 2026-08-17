# Architectural Decisions

## ADR-030. Múltiplos Sites WordPress em Tabela Própria
Status: Accepted

### Contexto
Um cliente pode querer postar notícias de política em um blog e humor em outro, gerenciando ambos no mesmo Workspace.

### Decisão
Migrar a configuração `wordpressConnection` do JSON genérico para um Model `WordPressSite`. O model `Source` (RSS Feed) receberá uma FK `wordPressSiteId`. A configuração de prompt da IA passará a ser suportada individualmente em cada WP Site (override do prompt global).

### Consequência
Refatoração necessária no fluxo de aprovação e postagem para ler as credenciais do `WordPressSite` atrelado ao Feed/Artigo, e não mais da tabela `Configuration`.

## ADR-031. Backoffice Super Admin
Status: Accepted

### Contexto
Necessidade de gestão administrativa da plataforma SaaS (Planos, Empresas, Troubleshooting).

### Decisão
Criaremos um layout e escopo de rotas isolado `/admin`. A autorização será via flag `isSuperAdmin` no Model `User`. O administrador poderá "entrar" nos dados da empresa para ajustar feeds e prompts.

### Consequência
Qualquer API de CRUD de entidades do domínio precisará verificar: O usuário atual é dono do Workspace? OU O usuário é SuperAdmin operando naquele Workspace? Isso requer ajustes pontuais em server actions/API routes.
