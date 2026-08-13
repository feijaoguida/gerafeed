# MEMORY.md. Memória Permanente

## Produto
- News Curator coleta notícias via RSS, prepara conteúdo com IA, permite revisão humana e publica no WordPress.
- Processamento é manual, no máximo 5 notícias novas por execução.
- Nenhuma notícia publica sem aprovação explícita.

## Banco de dados
- O banco local em desenvolvimento roda em PostgreSQL na porta 5432 (`news_curator`).
- Utiliza Prisma 7 com o adaptador `@prisma/adapter-pg`.
- A tabela `Configuration` armazena pares de chave/valor JSON (`key` única) para persistência de configurações do sistema.

## Stack
- Next.js App Router
- TypeScript
- Prisma
- PostgreSQL
- Tailwind CSS
- shadcn/ui
- Vercel

## Configuração
Existe uma tabela central `Configuration`, com chaves estáveis para configurações administráveis.
Exemplos: `wordpressConnection` e `aiProvider`.

A configuração central deve evoluir sem criar uma tabela para cada preferência simples.

## Segredos e Criptografia
- Segredos (`DATABASE_URL`, `OPENAI_API_KEY`, `WORDPRESS_URL`, `WORDPRESS_USERNAME`, `WORDPRESS_APPLICATION_PASSWORD`, `ENCRYPTION_KEY`) nunca devem ir para o client ou logs.
- Senhas de aplicação e chaves de API persistidas no banco são criptografadas em AES-256-GCM (`src/lib/crypto.ts`) no formato `v1:iv:ciphertext:authTag`.

## AI Provider
- A aplicação utiliza a abstração `AIProvider` (`src/lib/ai/`) desacoplada de provedores específicos.
- Suporta 4 adaptadores: OpenAI (`OpenAIProvider`), Google Gemini (`GeminiProvider`), Anthropic Claude (`AnthropicProvider`) e OpenAI Compatible (`OpenAICompatibleProvider`).
- Todos os adaptadores aceitam `GenerateArticleInput` e retornam a mesma estrutura unificada `GeneratedArticle`.
- A configuração do provedor de IA (provedor ativo, API Key criptografada em AES-256-GCM, modelo e Base URL) é mantida na tabela `Configuration` sob a chave `aiProvider` com fallback para variáveis de ambiente.
- O teste de conexão com o provedor de IA é executado server-side (`POST /api/ai/test`) utilizando `getActiveAIProvider()` sem expor a API Key.
- O processamento editorial (`processArticleWithAi`) resolve o provedor ativo via `getActiveAIProvider()` e executa a reescrita do artigo utilizando a abstração `AIProvider.generateArticle()`.

## Segurança & Hardening
- Nenhuma Application Password ou API Key é exposta nas respostas das rotas da API (`/api/wordpress/config`, `/api/ai/config`, `/api/wordpress/test`, `/api/ai/test`).
- Nenhuma credencial é gravada em logs do servidor (`console.log` / `console.error`).
- `ENCRYPTION_KEY` é estritamente server-only. Criptografia AES-256-GCM utiliza IVs aleatórios de 12 bytes por chamada e Auth Tag de 16 bytes contra adulteração de dados.

## WordPress
- A integração com o WordPress utiliza a REST API nativa (`/wp-json/wp/v2/`).
- Autenticação via Basic Auth (`username` + `Application Password`).
- As configurações de conexão (URL, Username, Application Password criptografada) são armazenadas na tabela `Configuration` sob a chave `wordpressConnection`, mantendo fallback para o `.env`.
- As categorias do WordPress são sincronizadas com a tabela local `WordPressCategory`.
- `wordpressPostId` após publicação.

## Harness
`SPEC.md` = contrato do produto.
`AGENTS.md` = regras do agente.
`MEMORY.md` = contexto permanente.
`PROGRESS.md` = estado.
`tasks/` = unidades de trabalho.
`docs/decisions.md` = decisões arquiteturais.
