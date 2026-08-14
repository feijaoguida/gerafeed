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
- Next.js App Router, TypeScript, Prisma, Tailwind.
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