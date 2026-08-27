# PROGRESS.md

## Current Phase
Phase 21. Article Content Enrichment & Scraping

## Current Task
201-multi-wordpress-editorial-review

## Status
IN_PROGRESS

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

## Phase 20. Billing Asaas Production Ready
- [x] 180-plan-monthly-annual-pricing
- [x] 181-billing-profile-and-customer-data
- [x] 182-payment-provider-contract-and-asaas-customer-sync
- [x] 183-hosted-checkout-and-billing-methods
- [ ] 184-asaas-recurring-subscriptions
- [ ] 185-asaas-webhook-ingestion
- [ ] 186-payment-ledger-and-invoice-history
- [ ] 187-subscription-lifecycle-and-access-control
- [ ] 188-customer-billing-portal
- [ ] 189-backoffice-billing-management
- [ ] 190-manual-reconciliation-and-recovery
- [ ] 191-phase20-integration-and-hardening

## Phase 21. Article Content Enrichment & Scraping
- [x] 200-article-content-scraping-and-enrichment
- [x] 201-multi-wordpress-editorial-review
- [x] 202-fix-billing-checkout-flow

## In Progress
- Nenhuma

## Completed (Current Phase)
- [x] 201-multi-wordpress-editorial-review
- [x] 202-fix-billing-checkout-flow

## Blocked
- Nenhuma

## Last Evidence
Task 202 concluída com sucesso:
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
