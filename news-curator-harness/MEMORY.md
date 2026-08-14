# MEMORY.md. Memória Permanente

## Produto
- News Curator coleta notícias via RSS, prepara conteúdo com IA, permite revisão humana e publica no WordPress.
- Nenhuma notícia publica sem aprovação explícita.
- **Fase 3 (Concluída)**: Artigos incluem créditos da fonte no final do post (`Fonte: Nome`) e mídia destacada selecionada (original ou processada via `sharp`).

## Banco de dados
- PostgreSQL + Prisma.
- Tabela `Configuration` para settings (ex: `wordpressConnection`, `aiProvider`, `imageSettings`).
- A chave `imageSettings` armazena a estratégia padrão de imagens (`defaultStrategy: 'ORIGINAL' | 'MODIFIED'`).
- `Article.modifiedImageUrl` armazena o caminho relativo da imagem processada via `sharp` (`/media/modified-${articleId}.jpg`).
- `Article.selectedImage` armazena a escolha de imagem ativa para a matéria (`ORIGINAL` | `MODIFIED`).

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
- **Phase 4 (Planejada)**: `SYSTEM_PROMPT_EDITORIAL` será transformado em função `buildSystemPrompt(settings?)` para construção dinâmica do prompt com base nas preferências do usuário (área do portal e estilos de escrita).
- Nova chave `aiPromptSettings` na tabela `Configuration` armazena as preferências do prompt editorial (`portalArea`, `customPortalArea`, `writingStyles`, `customWritingStyle`).
- Endpoint `GET/POST /api/ai/prompt-settings` para gerenciar as configurações.
- Página `/settings/ai` terá 2 abas: "Conexão" (existente) e "Prompt Editorial" (nova).

## WordPress
- Publicação usa REST API nativa (`/wp-json/wp/v2/`).
- Envio de mídia para o WP (`/wp-json/wp/v2/media`) realiza o upload da imagem selecionada pelo editor (original ou modificada) e atribui o ID resultante à propriedade `featured_media` do post.
- Crédito da fonte (`Fonte: ${creditName}`) é automaticamente anexado ao final do conteúdo HTML.
