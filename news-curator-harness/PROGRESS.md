# PROGRESS.md

## Current Phase
Phase 28. SEO, Measurement & Organic Acquisition Foundation

## Current Task
238-technical-seo-validation-hardening

## Status
DONE

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

