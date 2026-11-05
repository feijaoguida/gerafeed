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

## Asaas Hosted Checkout (invoiceUrl)

A contratação de planos no Asaas deve ser feita gerando a assinatura (`POST /v3/subscriptions`) e, em seguida, capturando a `invoiceUrl` do primeiro pagamento (`GET /v3/subscriptions/{id}/payments`). Isso garante que o cliente seja direcionado à página oficial de pagamento do Asaas, que suporta Cartão de Crédito, Pix (QR Code/Copia e Cola) e Boleto de forma nativa e associada corretamente à assinatura gerada para aquele cliente. A tela de Upgrade deve tratar o redirecionamento com cuidado, e nunca enviar o cliente para a tela de "sucesso" se o `checkoutUrl` estiver ausente.

## Design System GeraFeed (Phase 22+)
- **Identidade**: "Conteúdo que flui. Inteligência que publica."
- **Paleta**: Primary Blue (`#2563EB`), Primary Purple (`#7C3AED`), Accent Teal (`#00C2A8`), Dark/Ink (`#0F172A`), Muted (`#64748B`), Light Surface (`#F1F5F9`).
- **Gradiente**: `linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)`.
- **Tipografia**: Sora (Títulos/Destaques) e Inter (Interface/Textos) via `next/font/google`.
- **Tema**: Suporte estrito a Light Mode e Dark Mode sem duplicar componentes JSX.
- **Tokens Semânticos**: Uso estrito de variáveis CSS (`--background`, `--foreground`, `--surface`, `--primary`, `--muted`, etc.) mapeadas no Tailwind CSS 4 via `@theme inline`.
- **Componentes Primitivos**: `class-variance-authority` (CVA), `clsx`, `tailwind-merge`.
- **Acessibilidade**: Foco visível obrigatório (`focus-visible:ring-2`), rótulos associados e contraste WCAG.
- **Isolamento de Fases**: A Phase 22 é restrita à fundação e vitrine (`/backoffice/design-system`). A migração de telas existentes é realizada nas Fases 23 a 27 sob autorização.

# Phase 28+. SEO & Organic Acquisition

- O domínio público canônico do GeraFeed é `https://www.gerafeed.com.br`.
- SEO técnico é implementado usando recursos do Next.js App Router sempre que possível.
- Rotas autenticadas e Backoffice não fazem parte do sitemap.
- Login e cadastro não devem herdar metadata comercial da home e devem permanecer fora do índice.
- Google Search Console deve preferir propriedade de domínio validada por DNS.
- GTM é a camada única de deployment das tags Google na Phase 28.
- GA4 é configurado dentro do GTM para evitar disparo duplicado.
- Analytics nunca recebe PII ou secrets.
- Consentimento analítico deve ter escolha explícita e possibilidade de alteração.
- Structured data nunca inventa reviews, ratings, clientes, preços ou métricas.
- Posicionamento comercial recomendado: curadoria editorial assistida por IA, automação editorial WordPress e publicação multissite.
- Evitar promessa de "anti-plágio" como eixo de SEO/marketing.
- Landing pages iniciais: como-funciona, automacao-wordpress, rss-para-wordpress, curadoria-de-conteudo-com-ia, para-agencias, para-portais-de-noticias.
- Blog usa fundação simples compatível com Vercel, preferencialmente filesystem Markdown/MDX se não existir CMS.

# Phase 29. Funil de Aquisição, Email OTP & Checkout Asaas

- **Email Service Desacoplado**:
  - `src/lib/mail/` centraliza todo envio de e-mails via `EmailAdapter`.
  - A aplicação suporta `resend`, `smtp` (Nodemailer) e `mock` via `EMAIL_PROVIDER`.
  - Mecanismo de Fallback Automático: se `EMAIL_PROVIDER="resend"` e o envio falhar (ex: cota excedida), tenta automaticamente via SMTP como contingência de alta disponibilidade.
  - Novos provedores (ex: Mailgun) só exigem uma nova classe que implementa o contrato `EmailAdapter`.
- **Validação de E-mail Anti-Fake (OTP 6 dígitos)**:
  - O código numérico OTP de 6 dígitos é gerado de forma criptográfica e gravado em `VerificationToken` com 15 minutos de validade.
  - A verificação é inline (na própria tela de cadastro), evitando perda de conversão e mantendo a aba aberta.
  - Nenhuma conta é criada sem validação prévia de e-mail.
- **Segurança de Credenciais**:
  - Senhas são armazenadas como hash seguro via `bcryptjs` com fator de custo (SALT) de 10 rounds em `User.passwordHash`.
  - O `authorize` em `src/auth.ts` valida via `bcrypt.compare`.
- **Funil de Compra e Onboarding de Cobrança**:
  - O carrossel de planos na Home propaga parâmetros de plano (`plan` e `cycle`).
  - Plano Free: segue direto para `/dashboard` após cadastro.
  - Planos Pagos: o usuário preenche dados fiscais (`BillingProfile`) e é redirecionado para a `checkoutUrl` retornada pela rota `/api/billing/checkout` integrada ao Asaas.


# Phase 30 — Shopee e edição de afiliados (Concluída)

- **Escopo e Arquitetura Entregues**:
  - Integração Shopee com parsing resiliente de shortlinks/URLs canônicas, preview read-only e importação com fallback manual quando a extração for parcial (`PARTIAL`).
  - Cinco layouts visuais de afiliados (`PRODUCT_CARD`, `PRODUCT_GROUP` [GRID e LIST], `COMPARISON_TABLE`, `BADGE`, `BUTTON_ONLY`) compartilhados entre preview e publicação WordPress.
  - Tabela de comparação renderizada em HTML semântico com colunas responsivas e safe sponsored links (`rel="sponsored nofollow noopener"`).
  - Preservação de imagens originais de produtos nos templates comerciais com cards posicionados deterministicamente no meio e final do artigo.
  - Inserção de blocos de recomendação no cursor do editor com split seguro de HTML sem quebrar tags inline ou parágrafos, modal intuitivo e round-trip sem perdas.
  - Aba de gestão "Conteúdo & Pesquisa" no catálogo com atalho direto para geração de reviews com produto pré-selecionado (`/publishing/affiliate?productId=...`).
- **Persistência Atômica e Entitlements (`ArticlePersistenceService`)**:
  - Salva em transação atômica (`prisma.$transaction`), sincronizando `canonicalContent` JSON, marcadores HTML `<!-- gerafeed-block:... -->` e relações `ArticleProduct`.
  - Produtos-base de geração são preservados via `meta.baseProductIds`, mesmo se blocos forem removidos do corpo.
  - Produtos adicionados manualmente via editor de blocos criam vínculos em `ArticleProduct` e são removidos quando o último bloco do produto for excluído.
  - Bloqueio rígido em salvamentos com blocos de afiliados para planos sem `AFFILIATE_MODULE` (HTTP 403 Forbidden). Leitura permanece permitida; salvamento após remoção de todos os blocos é permitido.
  - Validação estrita de tenant (HTTP 404 para produtos/artigos de outro workspace) e integridade de ofertas (HTTP 409 para ofertas que não pertencem ao produto).
- **Publicação e Ciclo de Vida WordPress**:
  - Injeção obrigatória de um único bloco de disclosure de afiliados no topo do post (`nc-affiliate-disclosure`).
  - Script não-bloqueante de rastreamento de cliques com tokens seguros HMAC por ocorrência e deduplicação (`__nc_tracking_initialized`).
  - Edição posterior de artigos publicados marca `needsRepublish: true` sem republicar automaticamente.
  - Republicação via `PublicationSyncService.republishArticle` regenera o HTML, envia ao WordPress e limpa a flag `needsRepublish`.
- **Ambiente de Testes**:
  - Testes Phase 30 usam dados temporários no PostgreSQL local com rollback/cleanup próprio.
  - Variável `process.env.TEST_WORKSPACE_ID` permite execução de rotas e serviços em rotinas de teste automatizadas fora da sessão HTTP de cookies do NextAuth.

# Phase 31 — Sistema de Log de Erros, Diagnóstico e Auditoria no Backoffice

- **Modelos de Diagnóstico no Banco de Dados**:
  - `SystemErrorLog`: armazena `id`, `workspaceId` (opcional), `userId`, `userEmail`, `userName`, `screen`, `path`, `method`, `query` (JSON sanitizado sem credenciais), `module` (enum/string: AI, RSS, BILLING, WORDPRESS, AFFILIATES, AUTH, BACKOFFICE, GENERAL), `errorMessage` (bruta original), `errorStack` (stack trace completo), `statusCode`, `ipAddress`, `userAgent` e `createdAt`.
  - `SystemSetting`: tabela global para chave/valor do sistema (`error_log_retention_days = 180` por padrão).
- **Diretriz de Mascaramento e Logging**:
  - Usuários finais recebem mensagens amigáveis mascaradas e notificação popup pequena no canto da tela (toast minimalista).
  - Desenvolvedor e suporte acessam os dados brutos e stack trace completo no Backoffice para simulação e reprodução de incidentes.
  - Logging no servidor é não-bloqueante: uma falha ao persistir o log nunca derruba a requisição.

# Phase 32 — Recuperação de Senha ("Esqueceu a Senha") com Código de Segurança via E-mail

- **Isolamento de Escopo e Segurança de Tokens**:
  - `VerificationToken` é reutilizado com prefixo de propósito: `identifier: password-reset:${cleanEmail}` para evitar colisão ou reuso cruzado com tokens de cadastro.
  - O código numérico OTP de 6 dígitos gerado via `generateOtpCode()` possui validade estrita de 15 minutos e expiração atômica após o uso (`single-use`).
- **Resistência contra User Enumeration**:
  - A rota `POST /api/auth/forgot-password/send-code` retorna HTTP 200 e resposta idêntica independentemente do e-mail existir ou não na base de dados, prevenindo enumeração de contas.
  - Proteção anti-flood impõe cooldown de 60 segundos entre solicitações para o mesmo e-mail (HTTP 429).
- **Interface e Rotas Públicas**:
  - Rota `/forgot-password` liberada no matcher do Next.js Proxy (`src/proxy.ts`).
  - Tela de login possui link direto "Esqueceu a senha?".
  - A página `/forgot-password` opera com layout split Dark Mode, fluxo em 2 passos (solicitação de e-mail e validação de OTP + nova senha com confirmação), timer regressivo de reenvio e feedback visual de conclusão.




## Prompts de afiliados — Review e Comparativo (Task 266)
- Instruções padrão ficam em `src/lib/affiliate/editorial-prompts.ts`; o template
  global ativo no banco continua tendo precedência sobre o default em código.
- Geradores de review/comparativo enviam `GenerateArticleInput.systemPrompt`
  resolvido no servidor. `buildArticlePrompts` preserva RSS quando ele está ausente.
- Alterar defaults não atualiza registros existentes. No banco local, usar
  `scripts/update-affiliate-editorial-prompts.ts --apply` para versionar somente
  esses dois formatos; demais ambientes via Backoffice SuperAdmin.
- Referências visuais são exemplos de estrutura, não evidência de teste físico.
  Notas, selos e vencedores não devem ser atribuídos automaticamente.


# Phase 35 — Criação Manual de Matérias (Pauta/Entrevista/Texto), 4 Níveis de Complemento, Upload de Fotos e Geração de Fotos pela Matéria

- **4 Níveis de Complemento (`CompletionLevel` em `src/lib/ai/manual-prompts.ts`)**:
  - `FORMAT_ONLY` (**Formatar**): Não altera o texto do usuário; apenas organiza parágrafos (`<p>`), listas e subtítulos existentes, preenchendo SEO/Resumo/Tags. Possui fallback determinístico (`formatRawTextToHtmlParagraphs`) caso nenhum provedor de IA esteja configurado.
  - `LIGHT` (**Leve**): Formata, faz pequenas alterações dentro do estilo configurado (`PromptSettings`) e insere pequenos trechos de transição.
  - `MEDIUM` (**Média**): Formata, faz alterações pontuais dentro do estilo configurado e insere trechos criados pela IA.
  - `LARGE` (**Grande**): Formata, faz alterações e complementação ampla da matéria dentro do estilo configurado, inserindo grandes partes de trechos criados pela IA.
- **Upload de Fotos e Imagens (`POST /api/images/upload` e `src/lib/imageProcessor.ts`)**:
  - Suporta envio de Foto de Capa (com geração automática da versão invertida Sharp) e Fotos do Corpo da Matéria (distribuídas entre os parágrafos via `distributeImagesInHtmlContent` ou inseridas sob demanda na tela de revisão `/articles/[id]`).
  - Na publicação para o WordPress (`publishArticleToWordPress`), imagens inline em formato Data URI no corpo do HTML são enviadas automaticamente para a Biblioteca de Mídia do WordPress (`/wp-json/wp/v2/media`) via `replaceInlineDataUriImagesWithWordPressMedia` e substituídas pela URL pública (`source_url`).
- **Criar Fotos através da Matéria (IA)**:
  - Disponível tanto na tela de criação (`/publishing/manual`) quanto na tela de Revisão Editorial (`/articles/[id]`), permitindo escolher o estilo visual (`REALISTIC`, `CARTOON`, `DRAWING`, `SATIRICAL_CARTOON`, `CUSTOM`), definir como capa (`AI_GENERATED`) e/ou inserir no corpo do texto.


# Phase 36 — Geração de Imagens com IA Gratuita (Hugging Face & Pollinations.ai)

- **Diagnóstico Técnico do Hugging Face (2026-11-04)**:
  - O domínio legado `api-inference.huggingface.co` foi substituído por `router.huggingface.co`.
  - O repositório `Freepik/flux.1-lite-8B` possui `inferenceProviderMapping: {}` (apenas pesos para download local; retorna HTTP 400 na API serverless), e o Space `Freepik/F-Lite` está `PAUSED`.
  - Para contas gratuitas no Hugging Face com token `hf_...` (`inference.serverless.write`), a geração gratuita de imagens funciona via API ZeroGPU/Gradio oficial (`https://black-forest-labs-flux-1-schnell.hf.space/gradio_api/call/infer`) autenticada com `Authorization: Bearer hf_...` (~6s para 1024x1024), além de suportar `https://router.huggingface.co/hf-inference/models/...` quando houver créditos/suporte.
- **Pollinations.ai**:
  - Endpoint `https://image.pollinations.ai/prompt/{prompt}?model=flux&width=1024&height=1024&nologo=true` gera imagens FLUX gratuitamente sem necessidade de chave de API.
- **Preservação de Provedores**:
  - Os provedores `openai` (DALL-E 3), `gemini` (Imagen 3) e `openrouter` (FLUX) permanecem ativos ao lado de `huggingface` e `pollinations`.


# Phase 37 — Descrição de Produto com IA Focada em Vendas e Publicação no WordPress (WooCommerce)

- **Copywriting Persuasivo AIDA para Produtos (`ProductSalesCopyService`)**:
  - O framework AIDA (Atenção, Interesse, Desejo, Ação) é aplicado na importação de produtos de afiliados e na tela de detalhes do produto.
  - A IA gera simultaneamente:
    1. `shortDescription`: Resumo de impacto magnético (2-3 frases) com foco no gancho de atenção e benefício principal, posicionado no topo da página do WooCommerce ao lado do botão de compra.
    2. `description`: Descrição completa estruturada em HTML semântico (`<p>`, `<h3>`, `<ul>`, `<li>`, `<strong>`), convertendo especificações frias em benefícios práticos.
    3. `pros`: Destaques e pontos fortes reais do produto para rápida assimilação visual.
  - O fallback determinístico (`generateDeterministicSalesCopy`) produz copy rica sem alucinar especificações técnicas ou inventar dados falsos.
  - Limpeza de texto (`cleanDescriptionText`) remove automaticamente ruídos e boilerplates de marketplaces (garantias de vendedor, devoluções, menções a frete grátis, etc.).
- **Publicação no WordPress / WooCommerce (`WooCommercePublisherService`)**:
  - Utiliza os Application Passwords do WordPress via Basic Auth segura para acessar a REST API oficial do WooCommerce (`/wp-json/wc/v3/products`).
  - Suporta produtos do tipo `external` (perfeito para afiliados: botão customizado redireciona diretamente para o link de afiliado `external_url`) e do tipo `simple`.
  - Envia preços formatados com duas casas decimais (`regular_price`, `sale_price`), imagens de produto via upload no WordPress Media (`/wp-json/wp/v2/media`) e especificações técnicas mapeadas como atributos visíveis (`attributes`).
  - Idempotência: caso o produto já possua `woocommerceProductId`, o serviço envia `PUT /wp-json/wc/v3/products/{id}` atualizando o registro existente sem duplicar.
  - Fallback transparente: quando `/wc/v3/products` não está habilitado (HTTP 404), o serviço faz fallback automático para o Custom Post Type `/wp-json/wp/v2/product` gravando meta-fields do WooCommerce (`_regular_price`, `_sale_price`, `_product_url`, `_button_text`).
  - Campos persistidos no model `Product`: `shortDescription`, `wordpressSiteId`, `woocommerceProductId`, `woocommerceProductUrl`, `woocommerceProductType` e `woocommerceLastSyncedAt`.


# Phase 38 — Chaves da API do WooCommerce nos Destinos WordPress (Multi-Site) com Guardrail de Plano de Afiliados

- **Chaves de API do WooCommerce por Destino WordPress (`WordPressSite`)**:
  - As chaves de API da WooCommerce REST API (`Consumer Key` no formato `ck_...` e `Consumer Secret` no formato `cs_...`) são configuradas individualmente por site WordPress na tela `/settings/wordpress`.
  - O segredo (`Consumer Secret`) é criptografado em repouso no PostgreSQL via AES-256-GCM (`v1:...`) através de `encryptedWooCommerceSecret`, e nunca trafega para o navegador do cliente. O helper `sanitizeWordPressSite` expõe apenas `woocommerceConsumerKey: string | null` e o indicador booleano `hasWooCommerceSecret: boolean`.
- **Guardrail de Plano de Afiliados (`BillingService`)**:
  - Tanto o backend (`POST /api/wordpress/sites` e `PATCH /api/wordpress/sites/[id]`) quanto o frontend (`src/app/(app)/settings/wordpress/page.tsx`) verificam se o Workspace possui o módulo de Afiliados ativo via `BillingService.hasFeature(workspaceId, AFFILIATE_FEATURES.MODULE)`.
  - Se um Workspace sem o módulo de afiliados tentar salvar ou atualizar credenciais do WooCommerce, a requisição é rejeitada com HTTP 403 Forbidden. Na interface, exibe-se um card com badge explicativo orientando o upgrade de plano.
- **Endpoint de Teste e Diagnóstico WooCommerce**:
  - Endpoint dedicado `POST /api/wordpress/sites/[id]/test-woocommerce` testa a conectividade chamando `/wp-json/wc/v3/system_status` (com fallback para `/wp-json/wc/v3/products?per_page=1` para roles com permissão restrita).
  - Retorna diagnósticos em linguagem clara para 401 (chaves inválidas/permissões), 404 (WooCommerce inativo ou permalinks não configurados) e 403 (permissões de usuário).
- **Publicação com Autenticação Híbrida Inteligente (`WooCommercePublisherService`)**:
  - Ao publicar produtos do catálogo de afiliados para o WooCommerce, o serviço utiliza `Basic base64(ck:cs)` como autenticação primária para a REST API `/wp-json/wc/v3/products`.
  - Para uploads de arquivos de imagem na biblioteca de mídia do WordPress (`/wp-json/wp/v2/media`), continua utilizando as credenciais de usuário WordPress (`username:applicationPassword`), pois a REST API de mídia do core do WordPress não aceita credenciais do WooCommerce.

