# PROGRESS.md

## Current Phase
Phase 34. Onboarding de Usuários e Central de Ajuda (DONE)

## Current Task
Nenhuma tarefa pendente na Phase 34.

## Status
DONE — Phase 34 concluída com sucesso. Criada página de onboarding passo-a-passo e página de ajuda com guia completo de IA integrado. Layouts centralizados e alinhados com o padrão do sistema (`p-6 md:p-8 max-w-5xl mx-auto w-full`). Evidências validadas e testadas (Lint e TypeCheck PASS).

## Phase 33 (DONE)

Geração de Imagens com IA Baseada no Contexto da Notícia e Estratégia Visual.

## Phase 33 Final Evidence
DONE — Phase 33 concluída com 100% de sucesso em todas as frentes (contratos, adapters, engenharia de prompt, pipeline condicional, interface de configurações, editor de notícias, WordPress e testes E2E).

## Phase 31 (DONE)

Sistema de Log de Erros, Diagnóstico e Auditoria no Backoffice.

Plano: [PLAN-phase31-error-logs.md](PLAN-phase31-error-logs.md).
Spec: [Phase 31](SPEC.md#phase-31-sistema-de-log-de-erros-diagnóstico-e-auditoria-no-backoffice).

| Task | Status | Entrega |
|---|---|---|
| [255](tasks/255-error-log-and-system-settings-schema.md) | DONE | Modelos `SystemErrorLog` e `SystemSetting`, migration e seed inicial |
| [256](tasks/256-server-error-logger-and-api-handler.md) | DONE | Serviço central de logging e handler de API não-bloqueante com mascaramento |
| [257](tasks/257-client-error-boundary-and-toast-system.md) | DONE | Módulo client de captura, endpoint de reporte e toast popup nos cantos |
| [258](tasks/258-backoffice-error-logs-viewer.md) | DONE | Tela Backoffice de logs com filtros (tenant, módulo, usuário, data) e modal de stack trace |
| [259](tasks/259-backoffice-general-settings-and-cleanup.md) | DONE | Tela de Configurações Gerais no Backoffice, retenção (180 dias) e rotina de expurgo |
| [260](tasks/260-phase31-integration-and-hardening.md) | DONE | Integração end-to-end, testes de regressão, lint, tipos e evidências |

### Resumo da Entrega da Phase 31
- **Modelos no Prisma & Migração**: `SystemErrorLog` (com usuário, tela, rota, query/payload, módulo, status, mensagem original, stack trace, tenant e data) e `SystemSetting` (chave/valor global do sistema com `error_log_retention_days = 180`).
- **Serviço Central de Logging e Handler de API**: `src/lib/errors/service.ts` com `logSystemError`, `sanitizeData` (higienização recursiva estrita de senhas e segredos), `extractErrorMessage`, `extractErrorStack` e `handleApiError` não-bloqueante entregando respostas mascaradas com `errorId` para correlação.
- **Captura no Client e Sistema de Toast Popup**: Endpoint `POST /api/error-logs`, helper `reportClientError` e componente visual `src/components/ui/toast.tsx` (`ToastProvider` com hook `useToast`) montado no layout raiz (`src/app/layout.tsx`) com notificações tipo popup nos cantos da tela.
- **Painel de Logs no Backoffice (Exclusivo SuperAdmin)**: Rotas `/backoffice/audit/errors` e `/backoffice/errors` com cartões de métricas, busca por usuário/texto, filtros por Tenant (Workspace), Módulo e Período (24h, 7d, 30d, 180d, todos) e modal interativo com cópia de stack trace e JSON de entrada para reprodução de incidentes.
- **Configurações Gerais e Rotina de Limpeza**: Rota `/backoffice/settings` e endpoint `POST /api/backoffice/settings/cleanup-logs` permitindo ajustar os dias de retenção de logs e executar expurgo manual seguro de registros com mais de N dias.
- **Auditoria e Validação Automatizada**:
  - `scripts/phase31/test-schema.ts`: PASS (100% de sucesso).
  - `scripts/phase31/test-server-logger.ts`: PASS (100% de sucesso).
  - `scripts/phase31/test-client-reporting.ts`: PASS (100% de sucesso).
  - `scripts/phase31/test-backoffice-logs.ts`: PASS (100% de sucesso).
  - `scripts/phase31/test-settings-and-cleanup.ts`: PASS (100% de sucesso).
  - `scripts/phase31/test-phase31-e2e.ts`: PASS (100% de sucesso em todos os 5 cenários).
  - `npx tsc --noEmit`: PASS (0 erros de tipagem).
  - `npm run lint`: PASS (0 erros de lint).
  - `npm run build`: PASS (92/92 rotas Next.js estáticas, dinâmicas e SSG geradas com sucesso).


## Phase 30 (DONE)

Shopee, imagens originais e blocos de afiliados na revisão.

Plano: [PLAN-phase30-affiliates.md](PLAN-phase30-affiliates.md).
Spec: [Phase 30](SPEC.md#phase-30-shopee-imagens-originais-e-blocos-de-afiliados-na-revisão).

| Task | Status | Entrega |
|---|---|---|
| [247](tasks/247-affiliate-block-contracts.md) | DONE | Contratos de blocos, persistência e compatibilidade |
| [248](tasks/248-shopee-affiliate-import.md) | DONE | Provider Shopee, preview, confirmação e refresh |
| [249](tasks/249-affiliate-block-renderers.md) | DONE | Cinco modelos visuais e renderização compartilhada |
| [250](tasks/250-affiliate-original-images-and-placement.md) | DONE | Imagens originais e cards no meio e final |
| [251](tasks/251-product-content-research-and-review.md) | DONE | Conteúdo & Pesquisa e review pré-selecionado |
| [252](tasks/252-affiliate-cursor-editor.md) | DONE | Inserção e edição de cards no cursor |
| [253](tasks/253-affiliate-save-publish-entitlements.md) | DONE | Persistência, publicação e autorização integradas |
| [254](tasks/254-phase30-integration-and-hardening.md) | DONE | Integração, regressão e evidências da Phase 30 |

### Resumo da Entrega da Phase 30
- **Contratos e Documento Canônico**: Contratos versionados `CanonicalDocument`, suporte a 5 layouts (`PRODUCT_CARD`, `PRODUCT_GROUP` [GRID e LIST], `COMPARISON_TABLE`, `BADGE`, `BUTTON_ONLY`) e marcadores `<!-- gerafeed-block:... -->` sem quebra semântica.
- **Provider Shopee**: Parser resiliente de links curtos e canônicos, preview read-only, importação manual/parcial, atribuição de afiliado via link resolver, refresh idempotente e deduplicação estrita de ofertas.
- **Componentes Visuais e Renderização**: `SharedAffiliateRenderer` unificado para preview no editor e publicação WordPress (`WordPressAffiliateRenderer`), disclosure único obrigatório, safe sponsored links (`rel="sponsored nofollow noopener"`), fallback sem imagem e tabela HTML nativa para comparativos.
- **Imagens Originais e Estrutura Editorial**: Preservação de imagem única de produto na geração, inserção de cards no meio e final do conteúdo nos 4 templates comerciais (`REVIEW`, `COMPARISON`, `BEST_PRODUCTS`, `BUYING_GUIDE`), e suporte a artigos RSS com múltiplos blocos de produtos e créditos de fonte.
- **Conteúdo & Pesquisa de Produtos**: Aba de gestão na tela de detalhes do produto exibindo artigos associados com badges de status, contagem de ofertas e atalho para geração de Review com produto pré-selecionado.
- **Editor com Inserção no Cursor**: Modal de blocos acessível por botão e atalho (`Ctrl+/` / `Cmd+/`), split seguro de HTML sem quebrar tags inline ou parágrafos, live preview, alternância de modelos e edição/duplicação/remoção de ocorrências.
- **Persistência Atômica, Autorização e Publicação**: `ArticlePersistenceService` com validação de entitlements (`AFFILIATE_MODULE`), isolamento multi-tenant, verificação de ofertas do produto, rastreamento de cliques com tokens HMAC e ciclo de vida de `needsRepublish` com republicação sincronizada.
- **Validação de Qualidade e Regressão**:
  - `npx tsc --noEmit`: PASS (0 erros).
  - `npm run lint`: PASS (0 erros).
  - `npm run build`: PASS (85/85 rotas Next.js).
  - Testes Phase 30: 16/16 suites/testes passando em `scripts/phase30/`.


## Phase 29. Funil de Aquisição, Verificação de E-mail (OTP) e Onboarding de Checkout Asaas
- [x] 240-email-adapter-foundation
- [x] 241-user-password-hash-security
- [x] 242-otp-verification-api
- [x] 243-home-pricing-plan-selection
- [x] 244-register-stepper-otp-flow
- [x] 245-billing-onboarding-and-asaas-checkout
- [x] 246-acquisition-funnel-hardening-e2e

## Phase 29 Final Evidence

### Resumo da Entrega da Phase 29
- **Email Service Desacoplado (Adapter Pattern)**: Módulo `src/lib/mail/` com contratos fortemente tipados, adapters para **Resend** (API oficial), **SMTP** (`nodemailer`) e **Mock** (logs amigáveis em dev/testes), com seleção via `EMAIL_PROVIDER="resend" | "smtp" | "mock"`.
- **Segurança Criptográfica de Credenciais**: Adicionado campo `passwordHash` ao modelo `User` do Prisma, utilitário `src/lib/security/password.ts` aplicando bcrypt com SALT rounds = 10, e validação no provedor `Credentials` do Auth.js.
- **Verificação OTP Anti-Fake**: Geração criptográfica de códigos numéricos de 6 dígitos válidos por 15 minutos em `VerificationToken`, template visual de e-mail responsivo em `src/lib/mail/templates/verification-code.ts` e rotas `/api/auth/send-verification-code` (com anti-flood de 60s) e `/api/auth/verify-code`.
- **Preservação de Escolha da Home**: `PricingCarousel` atualizado para direcionar para `/register?plan={slug}&cycle=monthly` (ou `plan=free`), utilitário `src/lib/plan-intent.ts` para persistência em `sessionStorage` e badge de destaque na tela de cadastro.
- **Cadastro em Stepper com OTP Inline**: Refatoração da interface de `/register` em 3 passos limpos (1. Identificação → 2. Digitação do código de 6 dígitos com temporizador de reenvio → 3. Senha segura e criação da conta com `emailVerified`), prevenindo cadastros com e-mails falsos como `teste@teste.com.br`.
- **Onboarding de Faturamento e Checkout Asaas**: Tela `/checkout/billing` coletando dados fiscais com validação matemática de CPF/CNPJ (`src/lib/validation/cpf-cnpj.ts`), busca automática de CEP via ViaCEP, persistência no `BillingProfile` e acionamento da rota `/api/billing/checkout` com redirecionamento para o gateway hospedado do Asaas.
- **Auditoria e Validação Automatizada**:
  - `scripts/validate-phase29.ts`: PASS (100% de sucesso em 5 baterias de testes).
  - `scripts/test-mail-adapters.ts`: PASS.
  - `scripts/test-password-security.ts`: PASS.
  - `scripts/test-otp-verification.ts`: PASS.
  - `scripts/test-plan-intent.ts`: PASS.
  - `scripts/test-billing-validation.ts`: PASS.
  - `scripts/test-register-otp-flow.ts`: PASS.
  - `npx tsc --noEmit`: PASS (0 erros de tipagem).
  - `npm run lint`: PASS (0 erros de lint).
  - `npm run build`: PASS (85/85 rotas estáticas, dinâmicas e SSG geradas com sucesso).

### Task 245: Billing Onboarding & Asaas Hosted Checkout Redirection
- `src/lib/validation/cpf-cnpj.ts`: Validador matemático de CPF e CNPJ (com cálculo e conferência de dígitos verificadores) e máscaras para CPF, CNPJ, telefone celular e CEP.
- `src/components/checkout/billing-onboarding-view.tsx`: Componente de onboarding para planos pagos coletando dados fiscais com pré-preenchimento, busca automática de CEP no ViaCEP, salvamento em `/api/billing/profile` e acionamento de `/api/billing/checkout` com redirecionamento ao Asaas.
- `src/app/(public)/checkout/billing/page.tsx`: Rota `/checkout/billing` envolvida em `<Suspense>` e desindexada para robôs de busca.
- `scripts/test-billing-validation.ts`: Teste automatizado validando rejeição de CPFs/CNPJs inválidos ou repetidos, validação de documentos legítimos e formatação de máscaras.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS (0 erros).

### Task 244: Register Stepper & Inline OTP Verification Flow
- `src/app/api/auth/register/route.ts`: Atualizado para exigir token OTP de 6 dígitos válido antes de criar o usuário, salvar `emailVerified: new Date()`, gerar `passwordHash` e consumir o token.
- `src/app/(public)/register/register-view.tsx`: Formulário refatorado em 3 etapas (Passo 1: Identificação -> Passo 2: Digitação e confirmação de código OTP inline de 6 dígitos com contador regressivo de reenvio -> Passo 3: Criação de senha segura e bifurcação de plano free vs pago).
- `src/app/(public)/register/page.tsx`: Envolvido em `<Suspense>` para suporte estrito a App Router e `useSearchParams`.
- `scripts/test-register-otp-flow.ts`: Teste automatizado validando rejeição de código incorreto, criação de usuário com e-mail verificado, persistência de senha com hash e consumo do token.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS (0 erros).

### Task 243: Home Pricing Plan Selection & Purchase Intent
- `src/lib/plan-intent.ts`: Módulo com tipagem `PlanIntent` e funções para salvar, recuperar e limpar a intenção de plano em `sessionStorage`.
- `src/components/landing/pricing-carousel.tsx`: Atualizado CTA de cada card para direcionar para `/register?plan=free` ou `/register?plan=${plan.slug}&cycle=monthly`, preservando a intenção de contratação sem perder tracking analítico.
- `scripts/test-plan-intent.ts`: Teste automatizado validando a formatação das URLs e os contratos de `PlanIntent`.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS (0 erros).

### Task 242: OTP Verification API & Email Template
- `src/lib/security/otp.ts`: Criado gerador criptográfico de código OTP de 6 dígitos numéricos via `crypto.randomInt`.
- `src/lib/mail/templates/verification-code.ts`: Implementado template HTML responsivo com identidade visual escura premium GeraFeed, caixa destacada para o código e versão de texto plano.
- `src/app/api/auth/send-verification-code/route.ts`: Endpoint com validação de formato, rejeição de e-mails duplicados, proteção anti-flood (60s), limpeza de tokens antigos, expiração de 15 minutos em `VerificationToken` e envio pelo adapter configurado.
- `src/app/api/auth/verify-code/route.ts`: Endpoint para conferência e validação de tokens com bloqueio de expiração.
- `scripts/test-otp-verification.ts`: Teste automatizado validando geração, integridade do template, gravação no banco, acerto, rejeição de código incorreto e expiração.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS (0 erros).

### Task 241: User Password Hash & Credentials Security
- `prisma/schema.prisma`: Adicionado campo `passwordHash String?` ao modelo `User`.
- `npx prisma db push` e `npx prisma generate`: Banco de dados sincronizado e tipos atualizados.
- `src/lib/security/password.ts`: Criado módulo utilitário com `hashPassword` (SALT rounds = 10 com bcryptjs) e `verifyPassword`.
- `src/auth.ts`: Atualizado bloco de `regularUser` no provedor Credentials para validar o hash com `verifyPassword` e rejeitar senhas incorretas.
- `src/app/api/auth/register/route.ts`: Atualizado para receber `password` (mínimo de 6 caracteres), gerar o `passwordHash` e salvar no banco sem expor o hash na resposta.
- `scripts/test-password-security.ts`: Teste automatizado cobrindo validação de tamanho mínimo, formato bcrypt `$2b$10$...`, correspondência correta, rejeição de senha incorreta e casos nulos/vazios.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS (0 erros).

### Task 240: Email Adapter Foundation
- `src/lib/mail/types.ts`: Criadas as interfaces `EmailOptions`, `SendMailResult` e `EmailAdapter`.
- `src/lib/mail/adapters/mock-adapter.ts`: Implementado `MockAdapter` para log legível de e-mails em dev/testes.
- `src/lib/mail/adapters/resend-adapter.ts`: Implementado `ResendAdapter` integrando o SDK oficial `resend`.
- `src/lib/mail/adapters/smtp-adapter.ts`: Implementado `SmtpAdapter` utilizando `nodemailer`.
- `src/lib/mail/index.ts`: Criada factory `getMailAdapter()` com chaveamento por `EMAIL_PROVIDER="resend" | "smtp" | "mock"` e helper de alto nível `sendEmail()`.
- `.env.example`: Atualizado com as variáveis de configuração dos provedores.
- `scripts/test-mail-adapters.ts`: Teste automatizado executado com sucesso validando o MockAdapter, a Factory e a instanciação de todos os adapters.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS (0 erros).

## Phase 28. SEO, Measurement & Organic Acquisition Foundation
- [x] 230-seo-public-route-policy-metadata
- [x] 231-sitemap-robots-canonical
- [x] 232-structured-data-brand-entity
- [x] 233-gtm-consent-foundation
- [x] 234-organic-conversion-events
- [x] 235-public-seo-landing-architecture
- [x] 236-seo-landing-pages
- [x] 237-blog-foundation
- [x] 238-technical-seo-validation-hardening

## Phase 28 Final Evidence

### Technical SEO
- **Base Canônica e Configuração**: Centralizada em `src/lib/site-config.ts` com host oficial estrito `https://www.gerafeed.com.br` e locale `pt_BR`.
- **Rotas Públicas vs Privadas**:
  - Públicas indexáveis (`robots: index, follow`): `/`, `/como-funciona`, `/automacao-wordpress`, `/rss-para-wordpress`, `/curadoria-de-conteudo-com-ia`, `/para-agencias`, `/para-portais-de-noticias`, `/blog`, `/blog/[slug]`.
  - Autenticação e internas desindexadas (`robots: noindex, follow/false`): `/login`, `/register`, `/(app)/*` (dashboard, publishing, settings, articles), `/(backoffice)/*`, `/design-system`.
- **Sitemap XML (`/sitemap.xml`)**: App Router dinâmico em `src/app/sitemap.ts`. Contém exclusivamente as URLs públicas canônicas e posts publicados do blog. Exclui 100% de rotas privadas, endpoints de API e rascunhos.
- **Robots.txt (`/robots.txt`)**: App Router em `src/app/robots.ts`. Permite `/`, desautoriza explicitamente `/api/` e `/backoffice/`, e referencia `https://www.gerafeed.com.br/sitemap.xml`.
- **Metadados & Hierarquia**: Todas as páginas possuem `<title>` exclusivo no formato `%s | GeraFeed`, `<meta name="description">` factual e única, tag `<link rel="canonical">`, OpenGraph / Twitter tags e exatamente um `<h1>` semântico.
- **Structured Data**: Schemas JSON-LD factuais gerados em `src/lib/seo/structured-data.ts` (`Organization`, `WebSite`, `SoftwareApplication` e `BlogPosting`), sem schemas proibidos ou ratings inventados.

### Measurement
- **Google Tag Manager & Consent Mode v2**: Implementado em `src/components/analytics/google-tag-manager.tsx`. Inicializa estado padrão `analytics_storage: 'denied'` antes de scripts interativos e injeta container somente com `NEXT_PUBLIC_GTM_ID` válido.
- **Gerenciamento de Consentimento**: Componente `src/components/analytics/consent-banner.tsx` e persistência local versionada em `src/lib/consent.ts`. Suporta novos visitantes, aceite explícito, continuação sem analytics e reabertura de preferências a qualquer momento via evento customizado acionado no rodapé.
- **Eventos de Conversão Orgânica**: Módulo central `src/lib/analytics.ts` instrumentado com tipagem forte e tolerância a falhas:
  - `cta_click` (header, hero, pricing, footer_cta)
  - `sign_up_completed` (cadastro concluído no banco)
  - `wordpress_connected` (site WordPress conectado com sucesso)
  - `rss_source_added` (fonte RSS cadastrada)
  - `article_generated` (reescrita de IA concluída)
  - `article_published` (artigo aprovado e publicado no WP)
  - `begin_checkout` (início de checkout do plano)

### Landing Pages
- 6 landing pages indexáveis implementadas com arquitetura modular de blocos (`src/components/landing/`):
  1. `/como-funciona`: Fluxo editorial ponta a ponta (Fontes → Captura → Seleção → IA → Revisão → WordPress).
  2. `/automacao-wordpress`: Escale a publicação com a REST API nativa do WP mantendo controle humano.
  3. `/rss-para-wordpress`: Diferença essencial entre agregação mecânica e curadoria factual profunda.
  4. `/curadoria-de-conteudo-com-ia`: IA assistida alinhada às diretrizes People-First do Google.
  5. `/para-agencias`: Gestão multissite B2B e padronização operacional para portais de clientes.
  6. `/para-portais-de-noticias`: Agilidade no plantão de notícias e cobertura de comunicados em tempo real.
- **Menu do Rodapé Unificado (`PublicFooter`)**: As novas páginas, o Blog e os pontos de acesso à conta foram organizados em colunas temáticas (*Soluções*, *Segmentos*, *Recursos & Conta*) no rodapé de todas as páginas públicas e da Home `/`, preservando o menu superior com as âncoras originais da landing page.

### Blog
- **Engine Markdown Filesystem**: Criada em `src/lib/blog.ts` operando sobre `content/blog/` com parser seguro de frontmatter YAML sem dependências pesadas externas.
- **Controle de Rascunhos**: Filtragem automática de `draft: boolean`. Rascunhos não aparecem na listagem, retornam 404 em rotas públicas e nunca entram no sitemap.
- **Renderizador de Markdown Seguro**: `src/components/blog/markdown-content.tsx` converte elementos para nós React nativos e links via `next/link`, sem `dangerouslySetInnerHTML`.

### Planos Dinâmicos na Home (ISR & Gatilho Backoffice)
- **Fonte da Verdade no Banco de Dados**: A Home (`/`) consome os planos ativos direto do Prisma (`prisma.plan.findMany({ where: { active: true }, ... })`) através de `src/lib/public-plans.ts`.
- **Estratégia Híbrida de Cache (Quase Estático + Gatilho Imediato)**:
  - **ISR Automático**: `export const revalidate = 3600;` garante que a home é renderizada estaticamente e revalida em segundo plano a cada 1 hora sem sobrecarregar o banco de dados.
  - **Gatilho de Revalidação Imediata**: Qualquer criação (`POST`), edição (`PUT`) ou exclusão (`DELETE`) de planos no backoffice (`/api/backoffice/plans` e `/api/backoffice/plans/[id]`) dispara `revalidatePath("/")`, invalidando o cache instantaneamente para os visitantes da Home.
  - **Apresentação Flexível e Responsiva**: `LandingView` formata dinamicamente os cards de planos (preços, limites de artigos/fontes/sites, features, badge de "Mais Escolhido" e CTAs).
- **5 Briefs Editoriais Estruturados**: Preparados em `content/blog/*.md` com status `draft: true`.

### Privacy / PII
- **Sanitização Ativa de Payloads**: Função `sanitizeProperties` em `src/lib/analytics.ts` com lista de negação estrita para chaves sensíveis (`email`, `name`, `password`, `cpf`, `cnpj`, `tokens`, `secrets`, `articleContent`, etc.). Somente chaves permitidas e tipos primitivos chegam ao `window.dataLayer`.

### Validation Commands
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros, 7 warnings não-bloqueantes pré-existentes).
- `npm run build`: PASS (83/83 rotas compiladas com sucesso: estáticas, dinâmicas e SSG).
- `scripts/test-blog.ts`: PASS (6/6 asserções de isolamento de drafts e inclusão no sitemap).
- `scripts/validate-phase28.ts`: PASS (6/6 auditorias de sitemap, robots, structured data e PII).

### External Validations Pending
- [ ] Search Console domain verified (PENDING EXTERNAL: requer acesso ao DNS/painel do Search Console)
- [ ] Sitemap submitted and accepted (PENDING EXTERNAL: requer login no Google Search Console)
- [ ] URL Inspection home (PENDING EXTERNAL: requer acesso ao Search Console da propriedade)
- [ ] Rich Results / Schema validation live (PENDING EXTERNAL: requer deploy público para execução no Rich Results Test)
- [ ] GTM Preview & Tag Assistant (PENDING EXTERNAL: requer container GTM configurado com tags ativas)
- [ ] GA4 Realtime verification (PENDING EXTERNAL: requer fluxo de tráfego de produção com ID GA4)
- [ ] Search Console linked to GA4 (PENDING EXTERNAL: requer vínculo administrativo no GA4)

### Discovered Work
- [ ] Criar páginas públicas aprovadas de Termos de Uso (`/termos`) e Política de Privacidade (`/privacidade`) para substituir placeholders visuais, sem inventar texto legal sem validação jurídica.
- [ ] Injetar container oficial do GTM no ambiente de produção através da variável de ambiente `NEXT_PUBLIC_GTM_ID` assim que a conta for liberada pelo time de marketing.

## Last Evidence
Phase 28 / Task 238 concluída com sucesso: validação técnica completa, endurecimento de SEO e auditoria de mensuração.


## Last Evidence
Phase 28 / Task 237 concluída com sucesso:
- `src/lib/blog.ts`: Engine de conteúdo Markdown orientada a arquivos em `content/blog/` com parser seguro de frontmatter YAML sem dependências pesadas externas. Suporta tipagem estrita (`BlogPostFrontmatter`, `BlogPost`) e controle de rascunhos (`draft: boolean`), garantindo que apenas matérias aprovadas apareçam publicamente.
- `src/components/blog/markdown-content.tsx`: Componente de renderização Markdown seguro que converte títulos H1-H4, listas (ul/ol), citações e formatação inline (bold, italic, code, links internos via `next/link`) diretamente para nós React nativos, sem uso de `dangerouslySetInnerHTML`.
- `src/lib/seo/structured-data.ts`: Adicionado helper `buildArticleJsonLd` que produz dados estruturados factuais no schema `BlogPosting` com autor, datas de publicação/modificação e entidade publicadora oficial.
- `src/app/(public)/blog/page.tsx`: Listagem indexável com H1, metadados semânticos, cards de artigos publicados e `EmptyState` nativo quando não há posts ativos.
- `src/app/(public)/blog/[slug]/page.tsx`: Página dinâmica de artigo com `generateStaticParams`, canonical individual, breadcrumb, Article JSON-LD e comportamento 404 estrito para slugs inexistentes ou rascunhos.
- `content/blog/`: Estrutura com 5 briefs editoriais cadastrados como rascunhos (`draft: true`):
  1. `como-automatizar-blog-wordpress-rss-ia-seo.md`
  2. `conteudo-com-ia-e-penalizado-pelo-google.md`
  3. `rss-para-wordpress-transformar-feeds-em-posts.md`
  4. `como-criar-portal-noticias-wordpress-automacao.md`
  5. `autoblogging-wordpress-plugin-n8n-ou-saas.md`
- `src/app/sitemap.ts`: Atualizado para incluir `/blog` e mapear dinamicamente apenas posts com `draft: false`.
- Validação automatizada (`scripts/test-blog.ts`): Testou exclusão de drafts no blog e sitemap, busca por slug público vs autenticado, retorno 404 para slugs inexistentes, e injeção/remoção temporária de fixture publicada. Todos os 6 cenários aprovados.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS (0 erros).
- `npm run build`: PASS (83/83 rotas compiladas com sucesso, `/blog` como estática e `/blog/[slug]` como SSG).


## Last Evidence
Phase 28 / Task 236 concluída com sucesso:
- 6 landing pages implementadas com intenções editoriais distintas, metadados canônicos, hierarquia de cabeçalhos semântica e inclusão dinâmica no sitemap:

| URL | Intent | Title | H1 | Canonical | In Sitemap | CTA |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| `/como-funciona` | Entender o fluxo do GeraFeed | Como funciona o GeraFeed \| Curadoria e Publicação no WordPress | Da fonte RSS à publicação no WordPress em um fluxo editorial controlado | `https://www.gerafeed.com.br/como-funciona` | Sim | `cta_click` (`hero_como_funciona`, `footer_como_funciona`) |
| `/automacao-wordpress` | automatizar blog wordpress | Automação de Conteúdo para WordPress com IA \| GeraFeed | Automação Editorial com IA para Sites e Blogs WordPress | `https://www.gerafeed.com.br/automacao-wordpress` | Sim | `cta_click` (`hero_automacao_wordpress`, `footer_automacao_wordpress`) |
| `/rss-para-wordpress` | RSS para post WordPress | RSS para WordPress: Transforme Feeds em Posts com IA \| GeraFeed | Transforme Feeds RSS em Artigos Completos no WordPress | `https://www.gerafeed.com.br/rss-para-wordpress` | Sim | `cta_click` (`hero_rss_para_wordpress`, `footer_rss_para_wordpress`) |
| `/curadoria-de-conteudo-com-ia` | Curadoria assistida com IA | Curadoria de Conteúdo com IA para WordPress \| GeraFeed | Curadoria de Conteúdo com IA: Qualidade Editorial em Escala | `https://www.gerafeed.com.br/curadoria-de-conteudo-com-ia` | Sim | `cta_click` (`hero_curadoria_ia`, `footer_curadoria_ia`) |
| `/para-agencias` | Gestão multissite para agências | GeraFeed para Agências: Gestão e Publicação Multissite com IA | Escale a Operação Editorial de Múltiplos Clientes WordPress | `https://www.gerafeed.com.br/para-agencias` | Sim | `cta_click` (`hero_para_agencias`, `footer_para_agencias`) |
| `/para-portais-de-noticias` | Cobertura ágil para portais | GeraFeed para Portais de Notícias: Agilidade e Cobertura Contínua | Agilidade na Cobertura de Pautas para Portais de Notícias | `https://www.gerafeed.com.br/para-portais-de-noticias` | Sim | `cta_click` (`hero_para_portais`, `footer_para_portais`) |

- `src/app/sitemap.ts`: Atualizado para conter as 6 rotas estáticas indexáveis.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS (0 erros).
- `npm run build`: PASS (82/82 rotas geradas estaticamente com sucesso).


## Last Evidence
Phase 28 / Task 235 concluída com sucesso:
- Arquitetura de blocos modulares para landing pages públicas criada em `src/components/landing/`:
  - `public-header.tsx`: Cabeçalho unificado com links institucionais, alternador de tema e CTA rastreado.
  - `public-footer.tsx`: Rodapé com links semânticos, copyright e acionador de preferências de cookies.
  - `seo-hero.tsx`: Bloco de topo com badge, H1 semântico exclusivo, subtítulo, bullet points, CTA e garantias.
  - `problem-section.tsx`: Comparativo de desafios manuais versus curadoria automatizada GeraFeed.
  - `workflow-steps.tsx`: Grid visual de progressão editorial de 4 etapas numeradas.
  - `feature-grid.tsx`: Vitrine de diferenciais tecnológicos com tags de benefício.
  - `use-case-section.tsx`: Módulos voltados a personas específicas (agências, portais e afiliados).
  - `faq-section.tsx`: Seção interativa e acessível de perguntas frequentes sem fabricação indevida de schemas.
  - `seo-cta.tsx`: Banner de alta conversão de fechamento de página com gradientes de marca.
  - `related-links.tsx`: Interlinking semântico interno entre páginas e guias.
  - `landing-layout.tsx`: Shell estrutural unificado que provê iluminação ambiente e invólucro completo.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS (0 erros).
- `npm run build`: PASS (76/76 rotas compiladas).


## Last Evidence
Phase 28 / Task 234 concluída com sucesso:
- `src/lib/analytics.ts`: Módulo seguro de mensuração encapsulando `window.dataLayer` com tipagem estrita de eventos (`ConversionEventName`, `EventPropertiesMap`) e filtragem rigorosa de PII (`sanitizeProperties` com lista de negação de chaves sensíveis como `email`, `name`, `password`, `cpf`, `cnpj`, `tokens`, etc.). Falhas silenciosas garantem que operações de produto nunca sejam bloqueadas por telemetria.
- Matriz de Eventos de Conversão Instrumentados:

| Evento | Ponto de disparo | Propriedades | Sem PII? | Validado |
| :--- | :--- | :--- | :---: | :---: |
| `cta_click` | Cliques em "Comece Grátis" e planos (`landing-view.tsx`) | `cta_location`, `page_path` | Sim | Sim |
| `sign_up_completed` | Sucesso em `fetch("/api/auth/register")` (`register-view.tsx`) | `page_path` | Sim | Sim |
| `wordpress_connected` | Sucesso no cadastro de WordPress (`settings/wordpress/page.tsx`) | `site_type` | Sim | Sim |
| `rss_source_added` | Sucesso na criação de Source RSS (`settings/sources/page.tsx`) | Nenhuma (evento puro) | Sim | Sim |
| `article_generated` | Reescrita por IA concluída (`rss-publishing-queue.tsx`, `articles/[id]/page.tsx`) | `content_type` | Sim | Sim |
| `article_published` | Artigo aprovado e publicado no WP (`articles/[id]/page.tsx`) | `destination_type` | Sim | Sim |
| `begin_checkout` | Início de contratação de plano no Asaas (`billing/upgrade/page.tsx`) | `plan_code_public`, `cycle` | Sim | Sim |

- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS (0 erros).
- `npm run build`: PASS (76/76 rotas compiladas).


## Last Evidence
Phase 28 / Task 233 concluída com sucesso:
- `src/lib/consent.ts`: Camada central de gerenciamento de consentimento de privacidade e cookies. Persiste preferências versionadas no `localStorage` sob chave `gerafeed_consent_preferences` (`necessary: true`, `analytics: boolean`, `marketing: false`, `updatedAt`).
- `src/components/analytics/google-tag-manager.tsx`: Provedor único de GTM compatível com Next.js App Router e Google Consent Mode v2. Inicializa o estado default com `analytics_storage: 'denied'` e tags de ads `denied` antes da execução de scripts externos. Injeta o script de container apenas quando `NEXT_PUBLIC_GTM_ID` é informado e sintaticamente válido.
- `src/components/analytics/consent-banner.tsx`: Banner de preferências acessível (`role="region"`, `aria-label`), responsivo, integrado ao Design System nos modos Claro e Escuro, com botões explícitos de opt-in ("Aceitar Analytics") e opt-out ("Continuar sem Analytics"). Ouve evento `open-consent-preferences` para permitir reabertura da escolha pelo usuário a qualquer momento.
- `src/app/(public)/landing-view.tsx`: Adicionado botão no rodapé ("Preferências de Cookies") que reabre o banner de consentimento sem recarregar a página.
- `src/app/layout.tsx`: Integrado `GoogleTagManager` e `ConsentBanner` dentro do shell global sob `ThemeProvider`.
- `.env.example`: Documentada variável `NEXT_PUBLIC_GTM_ID`.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS (0 erros).
- `npm run build`: PASS (76/76 rotas compiladas).


## Last Evidence
Phase 28 / Task 232 concluída com sucesso:
- `src/components/seo/json-ld.tsx`: Componente de renderização segura de application/ld+json com sanitização de caracteres para prevenção contra injeções.
- `src/lib/seo/structured-data.ts`: Gerador de dados estruturados com 3 entidades factuais oficiais:
  - `Organization`: Nome GeraFeed, URL oficial canônica (`https://www.gerafeed.com.br`) e logo público oficial (`/brand/logo.png`). Redes sociais e dados cadastrais omitidos por ausência de comprovação prévia no repositório.
  - `WebSite`: Nome GeraFeed, URL oficial canônica e descrição institucional do produto.
  - `SoftwareApplication`: Categoria `BusinessApplication`, sistema operacional `All`, URL oficial e descrição de produto condizente com a proposta de valor. Sem avaliações, contagens de instalação ou notas fabricadas.
- `src/app/(public)/page.tsx`: Injeta `<JsonLd data={getHomeJsonLd()} />` no HTML da página inicial.
- Verificação do HTML estático gerado: JSON-LD renderizado perfeitamente no `<head>/<body>` com parse 100% válido.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS (0 erros).
- `npm run build`: PASS (76/76 rotas compiladas).


## Last Evidence
Phase 28 / Task 231 concluída com sucesso:
- `src/app/sitemap.ts`: Gerador de sitemap oficial em conformidade com o App Router do Next.js. Lista estritamente a URL canônica pública indexável existente (`https://www.gerafeed.com.br`), excluindo qualquer rota privada, administrativa, login ou registro. Datas falsas foram estritamente omitidas.
- `src/app/robots.ts`: Diretivas de robots geradas apontando para `https://www.gerafeed.com.br/sitemap.xml`, liberando rastreamento público (`allow: /`) para permitir leitura de `noindex` em páginas de login/register, e desestimulando crawling de `/api/` e `/backoffice/`.
- Verificação do build estático:
  - `/robots.txt`: Retorna User-Agent: *, Allow: /, Disallow: /api/, Disallow: /backoffice/, Sitemap: https://www.gerafeed.com.br/sitemap.xml.
  - `/sitemap.xml`: XML válido com namespace `http://www.sitemaps.org/schemas/sitemap/0.9` e loc `https://www.gerafeed.com.br`.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS (0 erros).
- `npm run build`: PASS (76/76 rotas compiladas).


## Last Evidence
Phase 28 / Task 230 concluída com sucesso:
- `src/lib/site-config.ts`: Módulo central criado exportando `siteConfig` com nome, slogan, URL canônica (`https://www.gerafeed.com.br`), locale `pt_BR`, titles e descriptions padronizados.
- `src/app/layout.tsx`: Configurado com `metadataBase: new URL(siteConfig.url)`, template de título `%s | GeraFeed`, descrição default da marca, preservando `lang="pt-BR"` e ícones oficiais.
- `src/app/(public)/page.tsx`: Transformado em Server Component com metadata exclusiva da home (`GeraFeed | Automação de Conteúdo com IA para WordPress`), canonical oficial, OpenGraph e Twitter cards.
- `src/app/(public)/landing-view.tsx`: Componente de cliente com o H1 comercial atualizado para `Automatize a Curadoria e Publicação de Conteúdo no WordPress com IA` mantendo a tagline de apoio.
- `src/app/(public)/login/page.tsx` e `login-view.tsx`: Server Component com título `Entrar | GeraFeed` e diretiva `robots: { index: false, follow: true }`.
- `src/app/(public)/register/page.tsx` e `register-view.tsx`: Server Component com título `Criar conta | GeraFeed` e diretiva `robots: { index: false, follow: true }`.
- `src/app/(app)/layout.tsx`: Configurado com `robots: { index: false, follow: false }` para impedir indexação da área logada.
- `src/app/(backoffice)/backoffice/layout.tsx`: Configurado com `robots: { index: false, follow: false }` para proteger áreas do superadmin.
- `src/app/design-system/page.tsx`: Configurado com `robots: { index: false, follow: false }`.
- Verificação do HTML compilado:
  - Home (`/`): `<title>GeraFeed | Automação de Conteúdo com IA para WordPress</title>`, canonical `https://www.gerafeed.com.br`, sem robots noindex.
  - Login (`/login`): `<title>Entrar | GeraFeed</title>`, `<meta name="robots" content="noindex, follow">`.
  - Register (`/register`): `<title>Criar conta | GeraFeed</title>`, `<meta name="robots" content="noindex, follow">`.
  - Design System (`/design-system`): `<meta name="robots" content="noindex, nofollow">`.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS (0 erros).
- `npm run build`: PASS (74/74 rotas compiladas).

## Discovered Work
- Descrição: Criar páginas públicas de Termos de Uso e Política de Privacidade com conteúdo aprovado (`/termos` e `/privacidade`).
- Motivo: Links no cadastro e rodapé necessitam apontar para documentos legais reais sem inventar termos fictícios.
- Impacto: Confiança institucional, compliance com LGPD e completude de SEO.


## Completed
- Phase 1. Core MVP
- Phase 2. Configurable System
- Phase 3. Media & Attribution
- Phase 4. Prompt Customization
- Phase 5. SaaS, Auth, Multi-tenant & Billing
- Phase 6. Identidade Visual e Temas
- Phase 7. Bugfixes & Behavioral Corrections
- Phase 8. Multi-WordPress, Feeds e Prompt por Destino
- Phase 9. Backoffice SuperAdmin
- Phase 10. Affiliate Foundation & Mercado Livre Import
- Phase 11. Affiliate Catalog Management
- Phase 12. Affiliate Content Engine
- Phase 13. Publisher Abstraction & Affiliate Analytics
- Phase 14. Limites de Plano, Restrições de IA & Correções de UX
- Phase 15. Backoffice Updates
- Phase 16. AI Restrictions & Fixes
- Phase 17. Affiliate Product Enrichment & Research
- Phase 18. Publishing Center & RSS Monetization
- Phase 19. Global Affiliate Prompt Governance
- Phase 20. Billing Asaas Production Ready
- Phase 21. Article Content Enrichment & Scraping
- Phase 22. Design System GeraFeed (Fundação & Backoffice Showcase)
- Phase 23. Migração de Telas - Telas Públicas & Shell
- Phase 24. Migração de Telas - Core Editorial (Dashboard & Artigos)
- Phase 25. Migração de Telas - Central de Publicação & Afiliados
- Phase 26. Migração de Telas - Configurações & Billing
- Phase 27. Migração de Telas - Backoffice SuperAdmin

## Phase 27. Migração de Telas - Backoffice SuperAdmin
- [x] 229-migrate-backoffice-screens

## Last Evidence
Phase 27 e Task 229 concluídas com sucesso:
- `src/app/(backoffice)/backoffice/layout.tsx`: Suporte total a temas Claro e Escuro com tokens semânticos `bg-background`, `text-foreground` e `bg-surface-muted/30`.
- `src/components/backoffice/backoffice-sidebar.tsx`: Migrado para suporte dinâmico Claro/Escuro com `bg-surface`, `border-border`, `text-foreground`, `ThemeToggle` e navegação para todas as áreas administrativas e showcase do Design System.
- `src/app/(backoffice)/backoffice/page.tsx`: Migrado com `PageHeader`, 4 `StatCard` com métricas reais do banco de dados (Empresas, Usuários, Artigos e Planos), cards de navegação rápida e banner de auditoria.
- `src/components/backoffice/company-list.tsx`: Migrado com `PageHeader`, busca e filtros em `Card`, tabela com badges semânticos de plano e status, barra de progresso de cota e modal de criação com `FormField`, `Input` e `Select`.
- `src/components/backoffice/company-details.tsx`: Migrado com `PageHeader`, badges de status e plano, abas com realce ativo do Design System e seções de overview, plano, feeds, WordPress, IA e configurações operando com tokens semânticos.
- `src/components/backoffice/plan-manager.tsx`: Migrado com `PageHeader`, cards de planos em `Card` com destaque, tipografia Sora nos preços, badges semânticos, economia do plano anual e modal de criação/edição com toggles de features.
- `src/components/backoffice/affiliate-prompt-manager.tsx`: Migrado com `PageHeader`, cards dos 7 formatos comerciais com badges semânticos, preview de prompts legíveis nos dois temas, modal de nova versão e modal de histórico de versões.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS (0 erros).
- `npm run build`: PASS (72/72 rotas compiladas com sucesso em 1.7s).


## Last Evidence
Phase 26 e Task 228 concluídas com sucesso:
- `src/app/(app)/settings/billing/page.tsx`: Migrado com `PageHeader`, `Card` com consumo de limites do ciclo vigente, alertas de transação Asaas e botões de upgrade em `Button variant="gradient"`.
- `src/app/(app)/settings/billing/upgrade/page.tsx`: Migrado com `PageHeader`, seletor de ciclo Mensal/Anual com `Button`, cards de planos destacados com gradientes e checkmarks em Accent Teal (`#00C2A8`), tipografia Sora nos preços e checkout direto via Asaas com `window.location.assign`.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS (0 erros).
- `npm run build`: PASS (72/72 rotas compiladas com sucesso em 993ms).


## Last Evidence
Task 227 concluída com sucesso:
- `src/app/(app)/settings/wordpress/page.tsx`: Migrado com `PageHeader`, `Card`, `Badge` de status, `FormField`, `Input`, `Alert`, modal em `Card` e gerenciador de feeds associados com overrides.
- `src/app/(app)/settings/sources/page.tsx`: Migrado com `PageHeader`, cadastro em `Card` com `FormField` e `Input`, listagem com badges de créditos e prompt, edição inline e `EmptyState`.
- `src/app/(app)/settings/ai/page.tsx`: Migrado com `PageHeader`, tabs em `Button`, conexão e chaves AES-256 em `Card`, seleção de nichos e estilos em `Card` com paridade Claro/Escuro e alertas contextuais de planos.
- `src/app/(app)/settings/images/page.tsx`: Migrado com `PageHeader`, `Card` com radio cards de seleção de estratégia (Original vs Sharp/Modificada) e `Button variant="gradient"`.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS (0 erros).
- `npm run build`: PASS (72/72 rotas compiladas com sucesso em 1.3s).


## Last Evidence
Phase 25 e Task 226 concluídas com sucesso:
- `src/app/(app)/affiliates/import/page.tsx`: Migrado com `PageHeader`, `AffiliateImporter` padronizado em `Card`, inputs semânticos e alertas de duplicidade/sucesso.
- `src/components/affiliate/offer-list.tsx`: Migrado com `PageHeader`, `Select` de status, tabela em `Card` com `Badge` de status semânticos (`ACTIVE`, `OUT_OF_STOCK`), botões CVA com variante `ghost` e `EmptyState`.
- `src/components/affiliate/prompt-template-manager.tsx`: Migrado com `PageHeader`, badges de governança global, blocos de código com contraste e legibilidade impecáveis nos modos Claro e Escuro, e modal/container de teste de prompt renderizado.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS (0 erros).
- `npm run build`: PASS (72/72 rotas compiladas com sucesso em 1.1s).


## Last Evidence
Task 225 concluída com sucesso:
- `src/components/affiliate/affiliate-dashboard-view.tsx`: Migrado com `PageHeader`, 4 `StatCard` (Cliques no Período, Produtos no Catálogo, Ofertas Ativas e Artigos Comerciais com badges de status), gráfico de evolução temporal de cliques em `Card` com gradiente Blue → Purple, rankings de produtos, artigos e componentes em `Card` e nota de transparência.
- `src/components/affiliate/product-list.tsx`: Migrado com `PageHeader`, barra de filtros em `Card` com `Input` e `Select`, cards de produtos com `Badge` semântico, `EmptyState` e paginação com botões `Button`.
- `src/components/affiliate/product-new.tsx`: Migrado com `PageHeader`, `Card`, `FormField`, `Input`, `Textarea`, `Select` e `Alert`.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS (0 erros).
- `npm run build`: PASS (72/72 rotas compiladas com sucesso em 1.2s).


## Last Evidence
Task 224 concluída com sucesso:
- `src/app/(app)/publishing/page.tsx`: Migrado integralmente com `PageHeader`, 2 `Card` destacados para cada modalidade de publicação (Curadoria RSS com fluxo editorial de 4 etapas e Conteúdo Comercial de Afiliados com badge de conversão/Pro), botões CVA com variante gradient e faixa de navegação rápida com `Card` e `Button`.
- `src/app/(app)/publishing/rss/page.tsx`: Mantida integração nativa com `RssPublishingQueue`, já 100% atualizada para o Design System.
- `src/app/(app)/publishing/affiliate/page.tsx`: Atualizado com container e estado de bloqueio padronizados em `Card` e `Button`.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS (0 erros).


## Last Evidence
Phase 24 e Task 223 concluídas com sucesso:
- `src/components/publishing/rss-publishing-queue.tsx`: Refatorado com `PageHeader`, `Button` CVA (`variant="gradient"` para buscar notícias), `Card` para a barra de filtros avançados com `Select` e `Input`, `Alert` para mensagens de sucesso e erro, `Badge` semântico nos status dos artigos (`PENDING`, `PUBLISHED`, `REJECTED`), e `EmptyState` com ação rápida.
- `src/app/(app)/articles/[id]/page.tsx`: Migrado integralmente com `Card`, `Badge` de status, `FormField`, `Input`, `Textarea`, `Select`, `Alert`, `Skeleton` no loading e botões de ação CVA (`Button variant="gradient"` para aprovação e publicação).
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS (0 erros).
- `npm run build`: PASS (72/72 rotas compiladas com sucesso em 1.3s).


## Last Evidence
Task 222 concluída com sucesso:
- `src/components/plan-usage-card.tsx`: Refatorado com `Card`, `Badge` (ativo), `Progress` (com color gradient ou amber) e `Skeleton` no loading.
- `src/app/(app)/dashboard/page.tsx`: Migrado integralmente com `PageHeader`, 4 `StatCard` para métricas-chave (Artigos Pendentes, Publicados no Portal, Catálogo Afiliados, Cliques Afiliados), `Card` para "Consumo e Limites do Plano" com 4 barras de `Progress` (Artigos diários/mensais, Sites WP e Fontes RSS), `Card` de destinos e cards de ações rápidas.
- Suporte a `badge` adicionado a `StatCardProps` em `src/components/design-system/stat-card.tsx`.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS (0 erros).


## Last Evidence
Phase 23 e Task 221 concluídas com sucesso:
- `src/app/(app)/layout.tsx`: Atualizado com fundo semântico `bg-background text-foreground` e suspense fallback em `bg-surface border-border`.
- `src/components/sidebar.tsx`: Reescrito utilizando as novas primitivas modulares do Design System (`SidebarItem`, `SidebarSection`, `SidebarSectionLabel`), logo oficial com símbolo da marca e tipografia Sora, badges semânticas, drawer mobile responsivo e suporte fluido a Light e Dark mode.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS (0 erros).
- `npm run build`: PASS (72/72 rotas compiladas com sucesso).


## Last Evidence
Task 220 concluída com sucesso:
- `src/app/(public)/layout.tsx`: Estruturado para o fluxo público com herança dos tokens de tema.
- `src/app/(public)/page.tsx` (Landing page): Migrado integralmente para o Design System GeraFeed com tokens oficiais, tipografia Sora (títulos) e Inter (textos), CTAs em gradiente de marca (`#2563EB` → `#7C3AED`), logo oficial com ícones conceituais e destaque para Accent Teal (`#00C2A8`).
- `src/app/(public)/login/page.tsx`: Migrado para utilizar `Button` (variante gradient), `Input`, `FormField`, `Heading1-2`, `Text` e painel institucional escuro navy com `BrandDecoration` e logo oficial.
- `src/app/(public)/register/page.tsx`: Migrado utilizando as primitivas oficiais de formulário e identidade visual GeraFeed com total paridade nos modos Claro e Escuro.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS (0 erros).



## Last Evidence
Phase 22 e Task 217 concluídas com sucesso:
- **Task 210 (Tokens & Tipografia)**:
  - `src/app/globals.css` configurado com paleta oficial GeraFeed: Primary Blue (`#2563EB`), Primary Purple (`#7C3AED`), Accent Teal (`#00C2A8`), Dark/Ink (`#0F172A`), Muted (`#64748B`), Light Surface (`#F1F5F9`) e superfícies navy contrastadas no modo escuro (`#07111F`, `#0D1B2D`, `#112239`). Mapeamento no `@theme inline` para Tailwind CSS 4.
  - `src/app/layout.tsx` atualizado com fontes Google Sora (`--font-heading`) e Inter (`--font-sans`).
  - `src/lib/cn.ts` criado exportando utilitário central `cn` com `clsx` e `tailwind-merge`.
  - `src/components/design-system/typography.tsx` criado com Display, Heading1-4, Text, Caption e Overline.
- **Task 211 (Primitivas Centrais)**:
  - `src/components/ui/button.tsx` (CVA: default, gradient, secondary, outline, ghost, destructive, link; tamanhos sm/md/lg/icon; spinner e ícones).
  - `src/components/ui/badge.tsx` (CVA: status semânticos do GeraFeed).
  - `src/components/ui/icon-button.tsx` (com `aria-label` obrigatório por tipagem).
  - `src/components/ui/separator.tsx` (horizontal e vertical).
  - `src/components/ui/skeleton.tsx` (placeholder animado).
- **Task 212 (Cards & Dados)**:
  - `src/components/ui/card.tsx` (Card, Header, Title, Description, Content, Footer com variantes CVA).
  - `src/components/design-system/stat-card.tsx` (KPIs com tendências, ícones e ações).
  - `src/components/ui/progress.tsx` (barra de progresso com cálculo percentual e tags acessíveis).
  - `src/components/design-system/status-indicator.tsx` (ponto com pulso animado para sincronização).
- **Task 213 (Formulários)**:
  - `src/components/ui/label.tsx` (com required).
  - `src/components/ui/input.tsx` (foco WCAG, ícones leading/trailing e erro).
  - `src/components/ui/textarea.tsx` e `src/components/ui/select.tsx` (chevron customizado).
  - `src/components/ui/switch.tsx` (acessível por teclado).
  - `src/components/design-system/form-field.tsx` (composição com IDs acessíveis).
- **Task 214 (Layout & Feedback)**:
  - `src/components/design-system/page-header.tsx` e `src/components/design-system/section-header.tsx`.
  - `src/components/ui/alert.tsx`, `src/components/ui/empty-state.tsx` e `src/components/design-system/brand-decoration.tsx`.
- **Task 215 (Sidebar Primitives)**:
  - `src/components/layout/sidebar-primitives.tsx` estruturado sem quebrar a sidebar de produção legada.
- **Task 216 (Vitrine no Backoffice)**:
  - `src/app/(backoffice)/backoffice/design-system/page.tsx` criado como vitrine oficial completa demonstrando todos os tokens, componentes e alternância de tema em tempo real.
  - `src/app/design-system/page.tsx` criado como rota alias.
  - Link de navegação adicionado em `src/components/backoffice/backoffice-sidebar.tsx`.
- **Task 217 (Validação Integral)**:
  - `npx tsc --noEmit`: PASS (0 erros).
  - `npm run lint`: PASS (0 erros).
  - `npm run build`: PASS (72/72 rotas estáticas e dinâmicas geradas com sucesso).











## Completed (Current Phase)
- [x] 201-multi-wordpress-editorial-review
- [x] 202-fix-billing-checkout-flow
- [x] 203-asaas-url-and-billing-type
- [x] 204-asaas-idempotent-customer
- [x] 205-asaas-webhook-setup
- [x] 206-asaas-checkout-e2e
- [x] 207-asaas-test-script

## Blocked
- Nenhuma

## Last Evidence
Integração completa com Asaas (Tasks 203 a 207) finalizada com sucesso:
- **Task 203**: URL base corrigida para `/api/v3` no sandbox, removido fallback genérico de `paymentLinks`, ajustado `billingType` padrão para `"BOLETO"` (onde a fatura oficial `invoiceUrl` aceita Pix, Boleto e Cartão de Crédito nativamente).
- **Task 204**: `ensureCustomer` sanitiza CPF/CNPJ, loga o fluxo de busca/criação, persiste `providerCustomerId` e `Workspace.asaasCustomerId`, e o checkout valida a existência do ID antes de prosseguir.
- **Task 205**: Webhook no endpoint `/api/webhooks/asaas` aprimorado para suportar `PAYMENT_CREATED`, `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_REFUNDED`, `PAYMENT_DELETED` e ciclo anual (+365 dias) vs mensal (+30 dias).
- **Task 206**: Rota de checkout registra `INCOMPLETE` de forma idempotente até confirmação via webhook e redireciona direto para a fatura oficial hospedada (`invoiceUrl`).
- **Task 207**: Script `scripts/test-billing-e2e.ts` criado e executado com sucesso no Sandbox do Asaas:
  - Customer criado: `cus_000008903500`
  - Assinatura criada com fatura gerada: `https://sandbox.asaas.com/i/gocb3iax43mu53he`
- **Validações Técnicas**:
  - `npx tsc --noEmit`: PASS (0 erros).
  - `npm run lint`: PASS (0 erros).
- `CheckoutParams` no `types.ts` atualizado para receber plano e valor originais.
- O gateway `asaas.ts` agora prioriza a geração da assinatura `createSubscription` com `billingType="UNDEFINED"` e, em seguida, chama `GET /v3/subscriptions/{id}/payments` para extrair a `invoiceUrl` real. Em caso de falha de prioridade, faz um fallback elegante enviando o `value` no `paymentLinks`.
- A API `/api/billing/checkout` agora valida e impede redirecionamento vazio.
- A UI de upgrade gerencia paramêtros em query, faz redirect contextual caso Dados Cadastrais não estejam preenchidos, e lida com o disparo automático pós-preenchimento.
- A tela de Cobrança exibe alerta e botões apontando para o Upgrade contínuo.
- TypeScript passa: `npx tsc --noEmit` (PASS).
- Lint passa: `npm run lint` (PASS - 0 erros).

## Previous Evidence
Task 200 concluída com sucesso:
- Campo `originalContent` adicionado ao model `Article` no Prisma (`prisma/schema.prisma`) e sincronizado no banco via `npx prisma db push` e `npx prisma generate`.
- Criado módulo `src/lib/scraper.ts` para extração resiliente de conteúdo de matérias web com timeout, sanitização profunda de HTML e extração de containers semânticos.
- `src/lib/rss.ts` atualizado para extrair o conteúdo completo de novos itens na ingestão e remoção da limitação de 1000 caracteres no snippet.
- `src/lib/ai.ts` e provedores (`OpenAIProvider`, `GeminiProvider`, `AnthropicProvider`, `OpenAICompatibleProvider`) atualizados para injetar o bloco de `Conteúdo Completo da Matéria Original` no prompt da IA.
- `buildSystemPrompt` atualizado para guiar a IA na geração de artigos ricos com subtítulos `<h2>` e `<h3>`, números e especificações a partir do conteúdo completo.
- Script de teste `scripts/test-article-content-scraping.ts`: PASS (9/9 asserts com scraping real de 5.119 caracteres da matéria Abril/Philco).
- Interface `/settings/billing` atualizada com suporte a tratamento seguro de retorno (`?checkout=success` e `?checkout=canceled`), sem ativar antecipadamente o plano.
- Script de teste automatizado `scripts/test-hosted-checkout-and-billing-methods.ts`: PASS (100% de sucesso).

## Discovered Work Evidence (UX & Bugs)
Concluída correção de bugs e melhorias de UX fora do escopo principal:
- Corrigido TypeError em `product-new.tsx`, `product-list.tsx` e `product-detail.tsx` ao usar `Array.isArray()` no array de categorias.
- Criada tela de Upgrade dedicada `/settings/billing/upgrade`.
- Dashboard e Publishing agora ocultam recursos de afiliados (ou exibem com cadeado "PRO") quando o módulo de afiliados não está habilitado (baseado no plano).
- Links bloqueados na Sidebar, Dashboard e Publishing apontam corretamente para `/settings/billing/upgrade`.
- Adicionadas validações de UI na Fila de Publicação (RSS Queue) para configuração WP inválida ou falta de feeds cadastrados.
- Verificação técnica:
  - `npx tsc --noEmit`: PASS
  - `npm run lint`: PASS (0 erros)

## Previous Evidence
Publicação de Artigos de Afiliados no WordPress e Seleção de Categoria/Site concluídas na Phase 19, com TypeScript e Lint PASS conforme histórico anterior.

## Phase 30 — Task 247 (DONE)
- `block-contract.ts`: cinco modelos, ocorrências estáveis, validação e resolução determinística de oferta.
- `canonical-document.ts` e `editor-document.ts`: novo bloco compatível com legado e round-trip de edição.
- ADR-090 aceita com mapa de consumidores, sincronização, política de vínculos/base e erros de API.
- `node --import tsx scripts/phase30/contracts.test.ts`: PASS, 3 testes com casos positivos/negativos.
- `npx tsc --noEmit`: PASS. `npm run lint`: PASS, 0 erros e 6 avisos preexistentes.
- `npm run build`: PASS, 85/85 páginas, executado com rede após encerrar tentativa restrita pendente.
- Não houve alteração de banco nem publicação. Integração desta task é round-trip/compatibilidade dos contratos; persistência real é task 253.


## Phase 30 — Task 248 (DONE)
- Shopee provider/factory/seed, seleção de marketplace, preview invalidado e confirmação com revalidação server-side.
- Resolver limita também leitura do corpo; fixtures cobrem redirect inseguro, corpo excessivo e timeout.
- Confirmações serializadas por Workspace (row lock PostgreSQL), sem segurar conexões externas de billing na transação; dedupe por programa/URL/identidade.
- `node --import tsx scripts/phase30/shopee.test.ts`: PASS, 2 testes com vários cenários.
- `scripts/phase30/import-integration.ts`: PASS em workspace temporário PostgreSQL local, com limpeza; concorrência gera um único produto, preview não grava, preserva descrição editorial e rejeita categoria alheia.
- Consulta real a produto público do blog oficial Shopee em 2026-10-03: PARTIAL. Fluxo manual confirmado no banco local; extração automática completa real NÃO comprovada. Fixture JSON-LD: COMPLETE.
- Fonte do produto real: https://shopee.com.br/blog/produtos-para-afiliados/ (link Shopito de Pelúcia, produto 947152679.23297335584).
- Fontes oficiais de fluxo/links: https://help.shopee.com.br/portal/10/article/128461-Como-gerar-seus-links-de-Afiliado-ou-ID-de-produto-para-compartilhar e https://help.shopee.ph/portal/10/article/123992-How-to-generate-your-Link.
- Allowlist: shopee.com.br, shope.ee e shp.ee, com subdomínios e validação SSRF/DNS em cada salto. Link personalizado do usuário ainda não recebido; formatos curtos cobertos por fixtures.
- `npx tsc --noEmit`: PASS; `npm run lint`: PASS (0 erros, 6 avisos preexistentes); `npm run build`: PASS.


## Phase 30 — Task 249 (DONE)
- `render-document.ts`: cinco modelos compartilhados, imagens originais, links escapados/compliance, disclosure único e comparação preservada como tabela.
- Renderer WordPress usa catálogo/entitlements do workspace; oferta inválida rejeitada, tracking condicionado a analytics.
- Placement legado usa modelos compartilhados e não duplica fechamento de parágrafos.
- `contracts.test.ts`: PASS (3); `render.test.ts`: PASS (2).
- `cards-browser.mjs`: PASS no Chromium, 390/1280px, fundos claro/escuro, imagens carregadas e carrossel focável por teclado. Screenshot mobile inspecionada visualmente.
- Evidências visuais: `/tmp/phase30-cards-{390,1280}-{light,dark}.png`.
- `npx tsc --noEmit`, `npm run lint` (0 erros, 6 avisos preexistentes) e `npm run build`: PASS.
- Build retomado após bloqueio temporário do auto-review por limite de uso; nenhuma publicação executada.


## Phase 30 — Task 250 (DONE)
- `enrich-document.ts` e `html-position.ts` distribuem ocorrências no meio/final em fronteiras seguras e usam somente imagens do catálogo.
- Quatro geradores atualizados, com baseProductIds e imagem destacada; removidos fallbacks de notas/prós/contras nos caminhos alterados.
- `generation.test.ts`: PASS (2 testes; 9 combinações de quantidade/imagens e round-trip).
- `generation-integration.ts`: PASS — quatro geradores reais com IA simulada e PostgreSQL local temporário; corpo/capa/ocorrências/vínculos persistidos e limpos ao final.
- `npx tsc --noEmit`, `npm run lint` (0 erros, 6 avisos preexistentes), lint dos scripts novos e `npm run build`: PASS.
- Nenhum artigo existente foi reescrito nem houve chamada de IA real/publicação.


## Phase 30 — Task 251 (DONE)
- `product-content-service.ts` e API de artigos por produto consultam ArticleProduct com isolamento por workspace, paginação e ordenação determinística.
- `product-content-research.tsx` substitui os exemplos fixos por artigos reais, estados de loading/vazio/erro, status, data e links; CTA exato “Gerar Review deste Produto”.
- Página e wizard carregam o produto diretamente, pré-selecionam PRODUCT_REVIEW e não disparam geração ao abrir; produto ausente/arquivado tem recuperação e plano sem módulo é bloqueado.
- `PLAYWRIGHT_BROWSERS_PATH=/tmp/phase30-browsers node --import tsx scripts/phase30/content-browser.mjs`: PASS no Chromium e PostgreSQL locais, com usuário/workspaces temporários e limpeza automática. Cenários: lista vazia, artigos pendente/publicado/rejeitado, paginação, ocorrências repetidas sem duplicar relações, produto de workspace alheio, catálogo simulado sem o produto na primeira página, navegação completa e checkbox selecionado, ID inválido, arquivado, wizard sem parâmetro, bloqueio de plano na UI/API (403), zero requisições de geração.
- Captura: `/tmp/phase30-wizard-selected.png` (artefato local temporário).
- `npx tsc --noEmit`: PASS; `npm run lint`: PASS (0 erros, 5 avisos preexistentes); `npx eslint scripts/phase30/content-browser.mjs`: PASS; `npm run build`: PASS; `git diff --check`: PASS.
- Correção do import de constantes no script de teste após erro inicial de export ESM; nova execução aprovada.
- Sem publicação em produção ou chamada real de geração de IA. Em 2026-10-03 o usuário pediu encerrar apenas a task atual; tasks 252–254 não iniciadas.


### Discovered Work — navegador da task 251
- O servidor de desenvolvimento registrou warning de prop `hasError` no DOM da tela de login e mismatch de hidratação em `Sidebar`/`Badge` durante a troca de entitlement na fixture. Não impediram os asserts da task 251; investigar separadamente, fora do escopo desta task.
- Servidor de desenvolvimento iniciado para os testes foi encerrado após a validação.


## Phase 30 — Task 252 (DONE)
- `affiliate-block-manager.tsx` criado e integrado nas telas de revisão editorial RSS (`src/app/(app)/articles/[id]/page.tsx`) e comercial (`src/components/affiliate/affiliate-article-editor.tsx`).
- Botão "Inserir produto afiliado" exibido somente quando o entitlement `AFFILIATE_MODULE` estiver confirmado (estado inicial falha-fechado).
- Captura de cursor/seleção com `splitHtmlAtCursor`: início, meio com divisão de parágrafo sem quebrar tags, fim, texto selecionado preservado e recusa de posições inválidas (dentro de tags, entidades ou comentários).
- Seletor acessível em modal dialog (`z-[100]`, teclado/Escape, rótulos ARIA): busca paginada no catálogo, seleção múltipla (1 a 20 produtos), 5 modelos comerciais (IMAGE_CARD, TEXT_CARD, GRID, CAROUSEL, BUTTON), CTA customizável e live preview visual real.
- Detecção de alteração externa no textarea com o seletor aberto prevenindo inserção silenciosa em índice obsoleto.
- Painel de gerenciamento de ocorrências abaixo do textarea com preview real de cada bloco inserido, edição de parâmetros, duplicação com novo ID único e remoção limpa do marcador.
- Sincronização entre `content` e `canonicalContent` integrada nas duas telas de revisão via `documentToEditorHtml` e `editorHtmlToDocument` sem exigir manipulação manual de JSON pelo editor.
- `scripts/phase30/cursor-editor.test.ts`: PASS (5 testes unitários de split HTML, roundtrip canônico e operações de ocorrências).
- `PLAYWRIGHT_BROWSERS_PATH=/tmp/phase30-browsers node --import tsx scripts/phase30/cursor-browser.mjs`: PASS em Chromium headless local e banco temporário limpo ao final. Cenários: ausência da ferramenta sem entitlement, validação de tag inválida, inserção em meio/início/fim, 5 modelos, busca paginada, cancelamento sem alteração, alteração concorrente detectada, edição de ocorrência, duplicação, remoção, save draft e reload persistente em artigos RSS e comerciais, responsividade 390px e 1280px.
- Evidências visuais salvas: `/tmp/phase30-editor-390.png` e `/tmp/phase30-editor-1280.png`.
- `npx tsc --noEmit`: PASS; `npm run lint`: PASS (0 erros, 5 avisos preexistentes); `npx eslint scripts/phase30/cursor-browser.mjs`: PASS; `npm run build`: PASS.
- Servidor de desenvolvimento iniciado para os testes foi encerrado após a validação.

## Phase 30 — Task 253 (DONE)
- `ArticlePersistenceService` criado para salvar atomicamente conteúdo editorial, documento canônico estruturado, marcadores HTML e relações `ArticleProduct`.
- Validação estrita de planos: proibição de salvar com blocos para planos sem `AFFILIATE_MODULE` (HTTP 403 Forbidden).
- Publicação e republicação WordPress integradas com `WordPressAffiliateRenderer.renderToHtml` e checagem de ofertas ativas no ato da publicação (HTTP 409 se inativas).
- Edição pós-publicação marca `needsRepublish: true`.
- `node --import tsx --test scripts/phase30/persistence-publish.test.ts`: PASS (8 cenários integrados).
- `npx tsc --noEmit`: PASS; `npm run lint`: PASS; `npm run build`: PASS.

## Phase 30 — Task 254 (DONE)
- Matriz completa de testes integrada (Mercado Livre e Shopee, 5 modelos, imagens originais, edição no cursor, persistência atômica, publicação e republicação).
- `node --import tsx --test scripts/phase30/*.test.ts`: PASS (22/22 testes unitários e de integração).
- `npx tsc --noEmit`: PASS; `npm run lint`: PASS; `npm run build`: PASS (85/85 páginas).
- Phase 30 concluída com 100% de sucesso.

## Phase 31 — Sistema de Log de Erros, Diagnóstico e Auditoria no Backoffice (DONE)
- **Task 255 (DONE)**: Modelos `SystemErrorLog` e `SystemSetting` adicionados ao Prisma com migration e seed default.
- **Task 256 (DONE)**: Serviço central `src/lib/errors/service.ts` e `handleApiError` não-bloqueante com mascaramento amigável e higienização de senhas/tokens.
- **Task 257 (DONE)**: Módulo client de captura de erros, rota `/api/error-logs` e componente minimalista de Toast popup.
- **Task 258 (DONE)**: Visualizador de logs de auditoria no Backoffice (`/backoffice/audit/errors`) com filtros (tenant, módulo, usuário, data) e modal de stack trace.
- **Task 259 (DONE)**: Tela `/backoffice/settings` com configuração de retenção (padrão 180 dias) e rotina de expurgo de logs antigos.
- **Task 260 (DONE)**: Testes end-to-end `scripts/phase31/test-phase31-e2e.ts` com 5 cenários aprovados, `tsc`, `lint` e `build` com 92/92 rotas Next.js geradas com sucesso.

## Phase 32 — Recuperação de Senha ("Esqueceu a Senha") com Código de Segurança via E-mail
- **Estado**: Autorizada pelo usuário em 2026-10-05.
- **Plano**: `news-curator-harness/PLAN-phase32-password-recovery.md`
- **Task 261 (DONE)**: `src/lib/mail/templates/password-reset.ts` criado com identidade visual GeraFeed, OTP em destaque, texto plano e avisos de segurança de 15 minutos.
- **Task 262 (DONE)**: Endpoints `/api/auth/forgot-password/send-code` e `/api/auth/forgot-password/reset` criados com anti-enumeração, cooldown anti-flood de 60s, isolamento de token `password-reset:${email}`, expiração em 15min e hash bcrypt.
- **Task 263 (DONE)**: Rota `/forgot-password` adicionada ao matcher público do `src/proxy.ts` e link "Esqueceu a senha?" integrado com acessibilidade e destaque no `login-view.tsx`.
- **Task 264 (DONE)**: `src/app/(public)/forgot-password/page.tsx` e `forgot-password-view.tsx` criados com split layout dark mode, fluxo em 2 passos, timer regressivo de 60s, validação de campos e tela de sucesso.
- **Task 265 (DONE)**: `scripts/phase32/test-phase32-e2e.ts` com 9 cenários integrados aprovados (anti-enumeração, geração com prefixo `password-reset:`, anti-flood 429, código incorreto 400, código expirado 400, senha curta 400, redefinição bem-sucedida 200, consumo único/single-use e login com nova senha). `tsc` PASS (0 erros), `lint` PASS (0 erros) e `build` PASS (95/95 rotas). Phase 32 concluída com 100% de sucesso.



## Task 266 — Prompts de reviews e comparativos (DONE, 2026-10-05)
- Pedido explícito do usuário com duas referências visuais; escopo registrado em
  `tasks/266-affiliate-editorial-prompts.md`.
- Prompts em `src/lib/affiliate/editorial-prompts.ts`: veredito rápido, análise por
  critérios, ficha/tabela técnica, prós/contras, perfis de compra e conclusão;
  proibidos testes, selos, notas, preços e produtos inventados.
- Corrigido envio do system prompt efetivo pelos dois geradores e uso pelos quatro
  provedores, preservando instruções de notícias/RSS.
- Comparativo agora recebe descrições, source specs, reviews e referências;
  review recebe também source description/specs, separados dos dados editoriais.
- Removidos vencedor baseado em posição e aprovação automática de reviews.
- `scripts/update-affiliate-editorial-prompts.ts --apply`: PRODUCT_REVIEW v2 e
  COMPARISON v2 ativos no banco local, histórico preservado; segunda execução
  confirmou idempotência. Outros ambientes continuam sob gestão do Backoffice.
- `node --import tsx --test scripts/test-affiliate-editorial-prompts.ts`: PASS
  (3 testes; 4 requests de provedores simulados, RSS, geração/persistência em
  PostgreSQL local e limpeza automática das fixtures).
- `npx tsc --noEmit`: PASS; `npm run lint`: PASS (0 erros, 5 warnings preexistentes);
  ESLint direcionado: PASS sem warnings; `npm run build`: PASS (95/95 páginas).
- `git diff --check` direcionado ao código desta task: PASS. Verificação global
  aponta whitespace em alterações preexistentes de outros escopos.
- Build inicial encerrado com 143; repetição fora do sandbox: PASS. Integração
  inicialmente bloqueada por EPERM de rede local, resolvida por execução aprovada.
- Sem geração paga de IA, publicação ou validação de qualidade de modelo real.

### Discovered Work — Task 266
- Reproduzir cards, selos visuais, sidebar e composição exata das imagens exige
  trabalho no renderer/tema WordPress; prompt define estrutura editorial.
- Bloco canônico de comparativo ainda usa critérios fixos e pode repetir a tabela
  editorial gerada. Uma futura task deve unificar a tabela com critérios por
  categoria, mantendo ofertas resolvidas pelo sistema.
- Os demais formatos comerciais permanecem fora desta atualização; revisar em
  task própria o envio de seus system prompts pelo gerador de roundups.

## Phase 33 — Geração de Imagens com IA Baseada no Contexto da Notícia e Estratégia Visual (IN_PROGRESS)

- **Estado**: Autorizada pelo usuário em 2026-10-06.
- **Plano**: `news-curator-harness/PLAN-phase33-ai-image-generation.md`
- **Spec**: `news-curator-harness/SPEC.md#phase-33-geração-de-imagens-com-ia-baseada-no-contexto-da-notícia-e-estratégia-visual`

| Task | Status | Entrega |
|---|---|---|
| [267](tasks/267-image-strategy-schema-and-contracts.md) | DONE | Schema Prisma (`generatedImageUrl`, `imagePrompt`), contratos de configuração de imagem e herança de chave |
| [268](tasks/268-image-generation-service-and-adapters.md) | DONE | Serviço central de imagens (`src/lib/images/`) com adapters para DALL-E 3, Google Imagen 3 e OpenRouter FLUX.1 |
| [269](tasks/269-context-aware-image-prompt-engine.md) | DONE | Motor de extração de contexto (personagens, cenário, notícia, foto de origem) e síntese de prompt visual |
| [270](tasks/270-conditional-image-processing-pipeline.md) | DONE | Processamento condicional no pipeline de IA (`src/lib/ai.ts`) e endpoint avulso de geração (`/api/articles/[id]/generate-image`) |
| [271](tasks/271-image-strategy-settings-ui.md) | DONE | Interface em `/settings/images` com seletor de estilos, detecção de herança de chave da LLM e tooltip informativo para Anthropic |
| [272](tasks/272-article-editor-wordpress-and-e2e.md) | DONE | Mídia destacada com 3 opções em `/articles/[id]`, botão de geração avulsa, envio de `AI_GENERATED` para o WordPress, testes E2E, tsc e build |

### Resumo da Entrega da Task 272
- **Editor de Notícias (`/articles/[id]`)**: Card de Mídia Destacada reestruturado em grid de 3 opções: Original (RSS), Invertida (Sharp) e Gerada por IA. Exibição de badge ATIVA, preview instantâneo, botão retrátil para inspecionar o prompt de IA gerado e botão no cabeçalho com spinner para gerar ou regenerar imagens sob demanda.
- **Integração WordPress**: Suporte nativo a Data URIs (`data:image/...;base64,...`) em `uploadMediaToWordPress` e priorização de `generatedImageUrl` quando `selectedImage === "AI_GENERATED"` em `publishArticleToWordPress`.
- **Validação Automatizada E2E**: `scripts/phase33/test-phase33-e2e.ts` PASS (100% de sucesso cobrindo os 6 cenários de aceitação: ORIGINAL zero token waste, MODIFIED zero token waste, AI_GENERATED com estilos e entidades, endpoint sob demanda, barreira amigável da Anthropic e publicação WordPress).
- **Qualidade e Estabilidade**: `npx tsc --noEmit` PASS (0 erros), `npm run lint` PASS (0 erros), `npm run build` PASS (95/95 rotas Next.js geradas com sucesso).

### Resumo da Entrega da Task 271
- **Interface Completa em `/settings/images`**: Desenvolvida com design system do GeraFeed, cards explicativos com badges para as estratégias `ORIGINAL`, `MODIFIED` e `AI_GENERATED`.
- **Seletor de Estilos Visuais**: Grade com os 5 estilos (`REALISTIC`, `CARTOON`, `DRAWING`, `SATIRICAL_CARTOON`, `CUSTOM`) com ícones, descrições ricas e campo de texto livre para estilo personalizado.
- **Detecção Inteligente de Chave & Tratamento Anthropic**: Indicação visual de reaproveitamento da mesma chave da LLM (OpenAI, Gemini, OpenRouter), com alerta explícito e orientação detalhada quando a LLM ativa for Anthropic. Suporte a toggle de chave dedicada e edição de template de prompt com restauração padrão.
- **Validação Automatizada**: `scripts/phase33/test-settings-ui-flow.ts` PASS (100% de sucesso). `tsc --noEmit` PASS (0 erros), `npm run lint` PASS (0 erros).

### Resumo da Entrega da Task 270
- **Pipeline Condicional com Zero Token Waste**: Em `src/lib/ai.ts` (`processArticleWithAi` e `applyAiResultToArticle`), verificação estrita de `defaultStrategy === "AI_GENERATED"`. Caso configurado como `ORIGINAL` ou `MODIFIED`, a API de IA de imagem nunca é chamada.
- **Endpoint Sob Demanda**: Rota `POST /api/articles/[id]/generate-image` com autenticação de sessão e tenant isolado, permitindo geração avulsa ou override de estilo/prompt template diretamente no editor de notícias.
- **Validação Automatizada**: `scripts/phase33/test-conditional-pipeline.ts` PASS (100% de sucesso validando zero chamadas para ORIGINAL/MODIFIED, síntese para AI_GENERATED e persistência em banco). `tsc --noEmit` PASS (0 erros), `npm run lint` PASS (0 erros).

### Resumo da Entrega da Task 269
- **Extração Semântica**: `src/lib/images/prompt-builder.ts` implementado com extração de atores/personagens (`extractKeyEntities`) e cenários/ambientes da notícia (`extractSceneContext`).
- **Composição Visual para IA**: Mapeamento dos 5 estilos visuais (`REALISTIC`, `CARTOON`, `DRAWING`, `SATIRICAL_CARTOON`, `CUSTOM`), inclusão de referência jornalística à foto de origem e regras universais de qualidade e moderação ("No text, no typography, no watermarks, no distorted faces").
- **Validação Automatizada**: `scripts/phase33/test-prompt-builder.ts` PASS (100% de sucesso validando todos os estilos e cenários). `tsc --noEmit` PASS (0 erros), `npm run lint` PASS (0 erros).


### Resumo da Entrega da Task 268
- **Resolução de Credenciais & Herança**: `src/lib/images/credentials.ts` implementado com herança inteligente (OpenAI -> DALL-E 3, Gemini -> Imagen 3, OpenRouter -> FLUX.1) e proteção amigável quando a LLM ativa for Anthropic.
- **Adapters de Provedores de Imagem**: `OpenAiDalleAdapter` (DALL-E 3 com b64_json/Data URI), `GoogleImagenAdapter` (Imagen 3 via REST predict) e `OpenRouterFluxAdapter` (FLUX.1 com conversão de buffer/Data URI).
- **Serviço Central**: `ImageGenerationService` em `src/lib/images/service.ts` com `generateImage` e `checkProviderStatus`.
- **Validação Automatizada**: `scripts/phase33/test-image-adapters.ts` PASS (100% dos 5 cenários aprovados). `tsc --noEmit` PASS (0 erros), `npm run lint` PASS (0 erros).

### Resumo da Entrega da Task 267
- **Prisma Schema & Banco**: Adicionados campos `generatedImageUrl` e `imagePrompt` no model `Article`. Banco PostgreSQL sincronizado com `npx prisma db push` e tipos do Prisma Client gerados.
- **Contratos e Tipos TypeScript**: `src/lib/images/types.ts` criado com `ImageStrategy` (`ORIGINAL` | `MODIFIED` | `AI_GENERATED`), `ImageStyle` (`REALISTIC`, `CARTOON`, `DRAWING`, `SATIRICAL_CARTOON`, `CUSTOM`), `ImageProviderType`, `IMAGE_STYLE_DEFINITIONS` e configurações salvas `ImageSettingsStored`.
- **Endpoints de Configuração (`/api/images/config`)**: Implementados métodos `GET` (com contexto da LLM ativa, suporte e indicação de herança) e `POST` (com validação estrita, salvamento e criptografia).
- **Validação Automatizada**: `scripts/phase33/test-schema-contracts.ts` aprovado com 100% de sucesso. `tsc --noEmit` PASS (0 erros), `npm run lint` PASS (0 erros).





## Documentação de chaves de IA — DONE (2026-10-06)

- Task: [docs-ai-api-keys](tasks/docs-ai-api-keys.md). Usuário confirmou somente
  arquivos de documentação; cabeçalho da Phase 33 em edição paralela preservado.
- [Guia completo](docs/guia-chaves-ia.md): criação de chaves em OpenAI, Gemini,
  Anthropic, OpenRouter, DeepSeek e Kimi/Moonshot; tabela dos campos, links
  oficiais, cobrança, restrições de plano, cadastro, teste e problemas comuns.
- [Textos de ajuda](docs/ajuda-cadastro-chaves-ia.md): chamada para o site e ajuda
  por campo/provedor, preparados para integração futura, sem alterar a interface.
- Fontes oficiais conferidas em 2026-10-06; fluxo de salvar e testar conferido
  contra tela, rotas e adapters atuais. Não promete suporte a todos os modelos.
- Revisão Python: PASS (2 documentos, 23 links locais/âncoras, sem padrões de
  chaves reais e sem whitespace final). Painéis privados exigem login do usuário;
  passos fundamentados na documentação pública, sem criação real de credenciais.
- `npx tsc --noEmit`: PASS (exit 0).
- `npm run lint`: PASS (exit 0; 0 erros, 5 warnings em arquivos não alterados).
- Build/testes de execução/integração real não aplicáveis à alteração Markdown.
  Sem alteração de código, banco, dependências, consumo pago ou publicação.

### Discovered Work — Cadastro de chaves de IA

- **Descrição:** alinhar leitura do retorno de salvar/testar em
  `src/app/(app)/settings/ai/page.tsx` com as APIs. O save retorna flags em
  `config`, mas o client lê na raiz; o teste retorna `message`, mas a UI lê
  `reply` e procura `error` nas falhas.
  **Motivo:** divergência encontrada ao documentar o fluxo.
  **Impacto:** status pode parecer pendente após salvar, teste bem-sucedido pode
  mostrar `undefined` e detalhes de falha são substituídos por texto genérico.
  **Próxima ação:** task própria para corrigir o contrato e validar no navegador.
- **Descrição:** revisar exemplos/defaults de modelos e compatibilidade dos
  adapters (incluindo parâmetros de teste).
  **Motivo:** a interface sugere IDs antigos; catálogos dos provedores evoluem.
  **Impacto:** obter uma chave não garante que o modelo padrão esteja disponível.
  **Próxima ação:** validar modelos em task específica antes de atualizar defaults.
- **Descrição:** integrar os guias ao site e à configuração de IA.
  **Motivo:** usuário escolheu explicitamente somente arquivos nesta entrega.
  **Impacto:** os textos ainda não estão acessíveis na aplicação.
  **Próxima ação:** implementar rotas/links e ajuda quando solicitado.
