# News Curator. Phase 3

## 1. Objetivo
Evoluir o sistema para gerenciar mídias (imagens) de forma inteligente e garantir a devida atribuição (créditos) às fontes originais.

Nesta fase:
- Campo "Fonte" no cadastro de RSS.
- Configuração global de estratégia de imagens (Original vs. Processada/IA).
- Processamento de imagens (inversão, filtros sutis ou IA) para diferenciação.
- Comparação visual (Original x Alterada) na tela de aprovação.
- Inserção automática dos créditos no final do artigo gerado.

## 2. AI Provider e Processamento
O fluxo existente de `AIProvider` permanece. A novidade é a etapa de processamento de imagem que ocorre após a coleta e antes (ou durante) a aprovação.

## 3. Configuração central
Adicionar nova chave na tabela `Configuration`:
- `imageSettings` (JSON)
  Exemplo de valor: `{ "strategy": "MODIFIED", "modificationType": "FLIP_HORIZONTAL" }`

## 4. WordPress
A publicação no WordPress agora deve enviar a imagem escolhida (Original ou Alterada) como `featured_media`. O upload da imagem para o media library do WP deve ocorrer na aprovação, ou a URL externa deve ser usada (se o WP estiver configurado para aceitar).

## 5. Criptografia
Sem mudanças estruturais nesta fase.

## 6. Telas e UI
### Cadastro de RSS
Adicionar campo opcional "Fonte". Descrição: "Usado para informar no final das Matérias".

### Configurações de Imagem
Nova aba ou seção em Configurações para escolher a estratégia padrão de imagens.

### Editor de Aprovação
O painel de edição do artigo deve exibir:
- Imagem Original (com label).
- Imagem Alterada (com label).
Permitir que o usuário selecione qual versão será publicada (radio button ou seleção visual).

## 7. Geração e Atribuição
No momento de montar o conteúdo final para o WordPress, o sistema deve concatenar automaticamente:
`<br><br><p><em>Fonte: {Nome da Fonte}</em></p>` (ou formato equivalente) no final do `content`.

## 8. Definition of Done global (Phase 3)
- [x] Schema do Prisma atualizado (Source.creditName, Article.modifiedImageUrl).
- [x] Cadastro de RSS refatorado para incluir campo Fonte.
- [x] Configuração de Estratégia de Imagem criada no banco e na UI.
- [x] Pipeline de processamento de imagem implementado (Sharp para inversão/filtros ou integração IA).
- [x] Tela de aprovação exibindo as duas versões da imagem lado a lado.
- [x] Seleção de imagem final pelo usuário.
- [x] Artigo publicado contendo a atribuição (Fonte) no final do texto.
- [x] Imagem correta enviada ao WordPress.
- [x] TypeScript PASS, Lint PASS.

---

# News Curator — Phase 4: Prompt Customization

## 1. Objetivo
Permitir que o usuário personalize o prompt editorial da IA diretamente pela interface, sem necessidade de alterar código. O `SYSTEM_PROMPT_EDITORIAL`, atualmente uma constante fixa em `src/lib/ai/types.ts`, passará a ser construído dinamicamente com base nas preferências do usuário.

Nesta fase:
- Personalização da **área do portal** (ex: Tecnologia, Política, Humor, etc.).
- Seleção de até **3 estilos de escrita** (ex: Informativo, Atraente, Sério, etc.).
- Opção de informar valores personalizados (texto livre, máximo 100 caracteres) para área e estilo.
- Preview do prompt gerado na interface.
- O prompt sem configuração deve usar defaults retrocompatíveis (portal de tecnologia e negócios, estilo atraente).

## 2. Configuração central
Nova chave na tabela `Configuration`:
- `aiPromptSettings` (JSON)
  Exemplo de valor:
  ```json
  {
    "portalArea": "Tecnologia",
    "customPortalArea": "",
    "writingStyles": ["Informativo", "Atraente"],
    "customWritingStyle": ""
  }
  ```

Sem alterações no schema do Prisma — usa a tabela `Configuration` existente.

## 3. Opções pré-definidas

### Áreas do Portal
- Tecnologia
- Negócios
- Política
- Ciência
- Saúde
- Entretenimento
- Esportes
- Educação
- Humor
- Meio Ambiente
- Outro (texto livre, max 100 caracteres)

### Estilos de Escrita (selecionar até 3)
- Informativo
- Atraente
- Sério
- Alegre
- Humorístico
- Analítico
- Provocativo
- Casual
- Técnico
- Persuasivo
- Outro (texto livre, max 100 caracteres)

## 4. Prompt dinâmico
A constante `SYSTEM_PROMPT_EDITORIAL` deve ser transformada em uma função `buildSystemPrompt(settings?)` que:
- Sem argumentos: retorna o prompt padrão atual (retrocompatível).
- Com argumentos: injeta a área e os estilos escolhidos no texto do prompt.

Os 4 providers (OpenAI, Gemini, Anthropic, OpenAI-Compatible) devem usar a função em vez da constante.

A função `processArticleWithAi` em `src/lib/ai.ts` deve carregar `aiPromptSettings` do banco via `getConfig` e repassar ao provider.

## 5. Telas e UI
### Página de configurações de IA (`/settings/ai`)
A página existente deve ser refatorada em **2 abas**:

**Aba 1 — Conexão** (conteúdo atual, sem alteração funcional)
- Seleção do provedor, API Key, Model, Base URL.

**Aba 2 — Prompt Editorial** (nova)
- Seleção da área do portal (radio buttons + campo "Outro").
- Seleção de estilos de escrita (checkboxes, máximo 3 + campo "Outro").
- Preview read-only do trecho do prompt gerado.
- Botão "Salvar Configurações do Prompt".

## 6. API
Novo endpoint `GET/POST /api/ai/prompt-settings`:
- **GET**: Retorna as configurações salvas.
- **POST**: Valida (max 3 estilos, max 100 chars nos campos livres) e salva sob a chave `aiPromptSettings`.

## 7. Definition of Done global (Phase 4)
- [x] Endpoint `GET/POST /api/ai/prompt-settings` criado e funcional.
- [x] Configuração salva na chave `aiPromptSettings` da tabela `Configuration`.
- [x] `buildSystemPrompt(settings?)` gera prompt dinâmico.
- [x] Prompt sem configuração usa defaults (retrocompatível).
- [x] Todos os 4 providers usam `buildSystemPrompt` em vez da constante fixa.
- [x] Página `/settings/ai` com 2 abas (Conexão + Prompt Editorial).
- [x] Seleção de área do portal funcional com opção "Outro".
- [x] Seleção de até 3 estilos de escrita funcional com opção "Outro".
- [x] Campos "Outro" validados (max 100 caracteres).
- [x] Preview do prompt na UI.
- [x] TypeScript PASS, Lint PASS.

News Curator. Phase 5 (SaaS & Multi-tenant)
1. Objetivo
Transformar o News Curator em um SaaS comercial (B2B/Creators) com suporte a múltiplos inquilinos (multi-tenant), planos de assinatura e integração com gateways de pagamento.
Nesta fase:
Autenticação de usuários usando NextAuth.js (Auth.js).
Separação de dados por Workspace (Tenant).
Gestão de Planos (Starter, Creator, Scale).
Abstração de Gateway de Pagamento.
Integração com Asaas (principal) e preparação estrutural para Stripe.
Controle de limites por plano (ex: 10 artigos/mês no grátis).
2. Multi-tenant e Autenticação
O sistema deixará de ser single-user. Todo usuário pertence a pelo menos um `Workspace` (Inquilino). Fontes (Sources), Artigos (Articles) e Configurações (Configurations) pertencerão a um `Workspace`, garantindo isolamento total de dados.
Autenticação: NextAuth (Providers: Credentials, Email/Magic Link ou OAuth - Google).
3. Planos e Limites
Sistema Freemium/Tiers.
Planos definem cotas: `maxSources`, `maxArticlesPerMonth`, `maxWordpressSites`, `allowAIGeneration`, `requireBYOK`.
Uma camada de serviço de Billing interceptará ações (ex: aprovar artigo, criar fonte) para validar limites.
4. Pagamentos (Gateway Abstraction)
O negócio não pode ficar preso ao Asaas.
Criaremos a interface `PaymentProvider` com implementações: `AsaasProvider` e `StripeProvider`.
A configuração dirá qual provedor está ativo.
5. Criptografia
As credenciais (API Keys, senhas do WP) agora devem ser criptografadas levando em consideração o `workspaceId` para evitar acessos cruzados.
6. Definition of Done global (Phase 5)
- [x] NextAuth integrado.
- [x] Schema Prisma atualizado para suportar NextAuth, Workspaces, Plans e Subscriptions.
- [x] Todas as tabelas de negócio (Source, Article, Configuration) vinculadas a um Workspace.
- [x] Middlewares e Services refatorados para garantir Tenant Isolation (nunca vazar dados).
- [x] Abstração de Gateway de Pagamento (`PaymentProvider`).
- [x] Integração com Asaas implementada.
- [x] Validador de limites de assinatura funcional.

---

# News Curator. Phase 6 (Identidade Visual e Temas)

## 1. Objetivo
Padronizar a interface do sistema (GeraFeed) criando um Design System coerente baseado na Landing Page, implementando suporte completo a Temas Claro/Escuro (Light/Dark Mode) e adicionando um card informativo de plano no Dashboard.

## 2. Design System e Padronização
- Extrair variáveis de cores (Índigo/Azul Escuro, Cores de Destaque), tipografia e espaçamentos da Landing Page (`src/app/(public)/page.tsx`) e do Dashboard.
- Criar ou atualizar o arquivo global de estilos (`src/app/globals.css` ou equivalente) com as variáveis CSS de design.
- Garantir que a identidade visual comunique um aspecto de SaaS B2B "premium" em todas as telas.

## 3. Tema Claro e Escuro (Light/Dark Mode)
- Implementar um `ThemeProvider` (usando `next-themes` ou similar suportado no stack) no layout raiz da aplicação (`src/app/layout.tsx` ou equivalente).
- Assegurar que as seguintes telas respondam à troca de tema:
  - Landing Page (`/`)
  - Login (`/login`)
  - Cadastro (`/register`)
  - Dashboard Home (`/dashboard`)
  - Gerenciamento de Feeds/Fontes (`/dashboard/sources`)
  - Curadoria/Artigos (`/dashboard/articles`)
  - Configurações (`/dashboard/settings` ou equivalentes)
- Atualizar classes utilitárias e estilos globais para suportar variantes de dark mode (ex: cores de background, bordas, textos e sombras invertidas para temas escuros).

## 4. Novo Componente: Card de Informações do Plano
- Criar um novo componente de UI a ser incluído no menu lateral (sidebar) do layout do Dashboard (`src/app/(app)/layout.tsx`).
- O card deverá exibir:
  - O nome do plano atual (Starter, Creator, Pro, etc.).
  - Progresso do uso de artigos gerados no mês (ex: 45/100).
  - Data de renovação/vencimento ou status da assinatura.
  - Uma barra de progresso visual para rápida leitura.
- Os dados do card devem derivar do backend/`BillingService` ou usar placeholders estruturais e se conectar aos hooks/APIs apropriados de billing se já existentes.

## 5. Definition of Done global (Phase 6)
- [x] Design System (variáveis CSS globais) criado.
- [x] ThemeProvider integrado e funcional em todo o sistema.
- [x] Modo Claro e Modo Escuro validados em todas as telas públicas e logadas.
- [x] Card de Informações do Plano adicionado ao menu lateral do Dashboard e renderizado corretamente.
- [x] TypeScript PASS, Lint PASS.

---

# News Curator. Phase 7 (Bugfixes & Behavioral Corrections)

## 1. Objetivo
Corrigir 4 problemas comportamentais identificados em produção após a Phase 6, garantindo funcionamento correto do fluxo de curadoria.

## 2. Bugs Identificados e Correções

### Bug 1: UI não atualiza após "Reescrever com IA"
O handler `handleProcessAi` lia `data.title`, `data.summary` etc. diretamente da raiz da resposta, mas a API retorna `{ success, article, aiResult }`. Campos corretos estão em `data.article.*`.

### Bug 2: Imagem destacada não gera na Vercel
O `imageProcessor.ts` salvava no filesystem local (`public/media/`), que é read-only na Vercel (serverless). Substituído por retorno de Data URI base64 (`data:image/jpeg;base64,...`) armazenado no campo `modifiedImageUrl` do banco.

### Bug 3: Contagem de posts usa ingestão RSS em vez de reescrita IA
O `BillingService.checkLimit` contava todos os artigos criados no mês (`createdAt`). Adicionado campo `processedAt DateTime?` ao model Article, setado no momento da reescrita IA, e a contagem agora filtra por `processedAt >= startOfMonth`.

### Bug 4: RSS traz 5 notícias no total em vez de 5 por feed
O `processRssSources` aplicava `slice(0, limit)` globalmente sobre o pool de todos os feeds. Refatorado para aplicar o limit por source individualmente.

## 3. Definition of Done global (Phase 7)
- [x] `handleProcessAi` lê de `data.article.*` e atualiza UI sem reload.
- [x] `processAndStoreImage` retorna Data URI base64, sem dependência de filesystem.
- [x] Campo `processedAt` adicionado ao Article e setado na reescrita IA.
- [x] `BillingService.checkLimit("ARTICLES")` filtra por `processedAt`.
- [x] `processRssSources` aplica limit por feed.
- [x] TypeScript PASS, Lint PASS, Build PASS.