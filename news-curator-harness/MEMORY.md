# MEMORY.md. Memória Permanente

## Produto
- News Curator coleta notícias via RSS, prepara conteúdo com IA, permite revisão humana e publica no WordPress.
- Nenhuma notícia publica sem aprovação explícita.
- **Fase 3 (Concluída)**: Artigos incluem créditos da fonte no final do post (`Fonte: Nome`) e mídia destacada selecionada (original ou processada via `sharp`).
- News Curator é um SaaS multi-tenant.
- Usuários gerenciam Workspaces.
- Planos de assinatura (Free, Creator, Scale) limitam o uso e definem recursos.

## Banco de dados
- PostgreSQL + Prisma.
- Tabela `Configuration` para settings (ex: `wordpressConnection`, `aiProvider`, `imageSettings`).
- A chave `imageSettings` armazena a estratégia padrão de imagens (`defaultStrategy: 'ORIGINAL' | 'MODIFIED'`).
- `Article.modifiedImageUrl` armazena o caminho relativo da imagem processada via `sharp` (`/media/modified-${articleId}.jpg`).
- `Article.selectedImage` armazena a escolha de imagem ativa para a matéria (`ORIGINAL` | `MODIFIED`).
- Novas Tabelas (Auth): `User`, `Account`, `Session`, `VerificationToken` (Padrão NextAuth).
- Novas Tabelas (Tenant): `Workspace`, `WorkspaceUser` (relação N:N com role).
- Novas Tabelas (Billing): `Plan`, `Subscription`, `Invoice`.
- Isolamento: `Source`, `Article`, `Configuration`, `WordPressCategory` agora possuem `workspaceId`.

## Fontes RSS
- Cadastradas na tabela `Source` (`name`, `rssUrl`, `active`, `creditName`).
- O campo `creditName String?` guarda o nome comercial de exibição utilizado na atribuição de créditos ao veículo original.

## Stack e Ferramentas Adicionais
- Next.js App Router, TypeScript, Prisma, Tailwind CSS v4.
- Processamento de Imagens: Biblioteca `sharp` no Node.js para transformações de imagem (`.flop()`, modulação de contraste e geração de JPEG/PNG).

## Segredos e Criptografia
- Segredos encriptados em AES-256-GCM (Phase 2).

## AI Provider
- Interface `AIProvider` agnóstica de fornecedor.
- **Phase 4 (Concluída)**: `buildSystemPrompt(settings?)` implementado para construção dinâmica do prompt com base nas preferências do usuário (área do portal e estilos de escrita). Todos os 4 provedores de IA (OpenAI, Gemini, Anthropic, OpenAI-Compatible) e o pipeline `processArticleWithAi` consomem as configurações de prompt salvas no banco.
- Nova chave `aiPromptSettings` na tabela `Configuration` armazena as preferências do prompt editorial (`portalArea`, `customPortalArea`, `writingStyles`, `customWritingStyle`).
- Endpoint `GET/POST /api/ai/prompt-settings` criado para gerenciar e validar as configurações.
- Página `/settings/ai` possui 2 abas: "Conexão" (credenciais do provedor) e "Prompt Editorial" (área do portal, estilos de escrita com limite de 3 seleções, opções livres e preview em tempo real).

## WordPress
- Publicação usa REST API nativa (`/wp-json/wp/v2/`).
- Envio de mídia para o WP (`/wp-json/wp/v2/media`) realiza o upload da imagem selecionada pelo editor (original ou modificada) e atribui o ID resultante à propriedade `featured_media` do post.
- Crédito da fonte (`Fonte: ${creditName}`) é automaticamente anexado ao final do conteúdo HTML.

## Autenticação
- NextAuth.js (v5 / Auth.js).
- Middleware do Next.js protege todas as rotas `/dashboard` e `/settings`.

## Gateway de Pagamentos
- Padrão Strategy: `PaymentProvider` (`AsaasProvider`, `StripeProvider`).
- Workspaces terão um `stripeCustomerId` ou `asaasCustomerId`.

## Identidade Visual e Temas (Phase 6)
- Gerenciamento de tema Claro/Escuro implementado via `next-themes` com `ThemeProvider` no RootLayout (`attribute="class"`, `defaultTheme="dark"`).
- Componente `ThemeToggle` (`src/components/theme-toggle.tsx`) utiliza `useSyncExternalStore` para compatibilidade SSR com React 19 sem hydration mismatches.
- Variáveis CSS globais padronizadas em `src/app/globals.css` para cores de fundo (`--background`), texto (`--foreground`), cards (`--card`), bordas (`--border`) e cor primária Índigo (`--primary`).
- Componente `PlanUsageCard` (`src/components/plan-usage-card.tsx`) integrado na Sidebar consome `/api/billing/subscription` exibindo nome do plano, progresso de posts gerados no mês, data de vencimento e link de upgrade.

## Processamento de Imagens (Serverless)
- `processAndStoreImage` retorna Data URI base64 (`data:image/jpeg;base64,...`) em vez de salvar arquivo no filesystem.
- Compatível com ambientes serverless (Vercel) onde o filesystem é read-only em runtime.
- O campo `Article.modifiedImageUrl` armazena o Data URI completo.

## Billing e Contagem de Artigos
- Campo `Article.processedAt DateTime?` registra o momento exato da reescrita pela IA.
- `BillingService.checkLimit("ARTICLES")` conta apenas artigos com `processedAt` não-nulo no mês corrente, não todos os artigos ingeridos via RSS.

## RSS — Limite por Feed
- `processRssSources(limitPerFeed, workspaceId)` aplica o limite individualmente por source ativa.
- Com N feeds ativos e limit=5, o sistema traz até N*5 artigos (5 de cada feed).
- O billing check foi removido da ingestão RSS; a validação de cota ocorre no momento da reescrita IA.