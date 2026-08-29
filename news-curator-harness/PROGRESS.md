# PROGRESS.md

## Current Phase
Phase 27. Migração de Telas - Backoffice SuperAdmin (Concluída)

## Current Task
229-migrate-backoffice-screens

## Status
DONE

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
