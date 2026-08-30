# News Curator. Phase 8 + Phase 9 Harness Package

## Observação sobre numeração

Os arquivos recebidos já consideravam a Phase 7 como concluída para Bugfixes & Behavioral Corrections.

Para preservar histórico, as novas fases foram numeradas:

- Phase 8 = Multi-WordPress, Feeds e Prompt por Destino
- Phase 9 = Backoffice e SuperAdmin

## Instalação

Copie os arquivos da raiz para o projeto existente, preservando `src`, `package.json` e `prisma` atuais.

Arquivos de Harness:

- AGENTS.md
- MEMORY.md
- PROGRESS.md
- SPEC.md
- docs/decisions.md
- tasks/*

## Ordem

Phase 8:
060 → 061 → 062 → 063 → 064 → 065 → 066 → 067 → 068 → 069

Phase 9:
070 → 071 → 072 → 073 → 074 → 075 → 076 → 077 → 078 → 079 → 080 → 081

## Primeira instrução para a IDE

```text
Leia AGENTS.md, SPEC.md, MEMORY.md, PROGRESS.md, docs/decisions.md e a task 060.

Estamos iniciando a Phase 8.
Analise o código atual antes de implementar.
Não implemente a task 061 ou qualquer outra futura.
Apresente o plano e aguarde autorização.
```
# Affiliate Platform. Phases 10 a 13

As Phases 8 e 9 já estão concluídas. A expansão Affiliate começa na Phase 10.

Ordem:
- Phase 10: 100 → 107
- Phase 11: 110 → 115
- Phase 12: 120 → 128
- Phase 13: 130 → 136

Primeira instrução para a IDE:
```text
Leia AGENTS.md, SPEC.md, MEMORY.md, PROGRESS.md, docs/decisions.md e tasks/100-affiliate-plan-entitlements.md.
Analise o projeto atual.
Implemente somente a Task 100.
Não avance até cumprir Definition of Done e registrar Evidence.
```

# Phases 17 a 19

Phase 17: 150 → 157.
Phase 18: 160 → 169.
Phase 19: 170 → 174.

Primeira instrução para IDE:
```text
Leia AGENTS.md, SPEC.md, MEMORY.md, PROGRESS.md, docs/decisions.md e tasks/150-affiliate-import-enrichment.md. Analise o código atual. Implemente somente a Task 150. Execute Definition of Done, testes e Evidence. Não avance para a 151.
```

# Phase 20. Billing Asaas Production Ready

A Phase 19 está concluída.

A próxima fase transforma a integração de billing existente em fluxo SaaS operacional de produção.

## Ordem

```text
180 → 181 → 182 → 183 → 184 → 185
→ 186 → 187 → 188 → 189 → 190 → 191
```

## Tasks

- 180. Plan Monthly/Annual Pricing.
- 181. Billing Profile & Customer Data.
- 182. PaymentProvider Contract & Asaas Customer Sync.
- 183. Hosted Checkout & Billing Methods.
- 184. Asaas Recurring Subscriptions.
- 185. Asaas Webhook Ingestion.
- 186. Payment Ledger & Invoice History.
- 187. Subscription Lifecycle & Access Control.
- 188. Customer Billing Portal.
- 189. Backoffice Billing Management.
- 190. Manual Reconciliation & Recovery.
- 191. Integration & Hardening.

# GeraFeed. Phase 28. SEO, Measurement & Organic Acquisition Foundation

## Objetivo

Adicionar a fundação técnica necessária para o GeraFeed ser rastreável, indexável, mensurável e preparado para crescer via busca orgânica, sem misturar esta fase com criação massiva de conteúdo ou refatorações de domínio.

Esta fase começa após a conclusão da Phase 27 e usa a sequência de tasks 230 a 238.

## Regra de execução

Uma task por vez.

Fluxo obrigatório:

```text
Contexto
→ Task
→ Inspeção da implementação atual
→ Plano
→ Implementação
→ Definition of Done
→ Validation
→ Evidence
→ PROGRESS
→ MEMORY/decisions quando necessário
```

Não avance automaticamente para a próxima task.

## Ordem

```text
230 → 231 → 232 → 233 → 234 → 235 → 236 → 237 → 238
```

## Tasks

- 230. SEO Public Route Policy & Metadata Baseline
- 231. Sitemap, Robots & Canonicals
- 232. Structured Data & Brand Entity
- 233. Google Tag Manager & Consent Foundation
- 234. Organic Conversion Event Tracking
- 235. Public SEO Landing Architecture
- 236. SEO Landing Pages
- 237. Blog Foundation
- 238. Technical SEO Validation & Hardening

## Pré-condição externa

Antes da Task 233, preencher `docs/google-handoff.md` com os IDs criados na Frente Google.

A verificação principal do Search Console deve preferir propriedade de domínio por DNS. Não criar dependência de meta verification no código quando a propriedade de domínio estiver verificada.

## Primeira instrução para o Agente de Código

```text
Leia AGENTS.md, SPEC.md, MEMORY.md, PROGRESS.md, docs/decisions.md,
este pacote Phase 28 e tasks/230-seo-public-route-policy-metadata.md.

A Phase 27 está concluída. Estamos iniciando a Phase 28.

Inspecione a implementação atual antes de alterar qualquer arquivo.
Implemente somente a Task 230.
Não implemente a Task 231 nem qualquer task futura.

Antes de codificar, apresente:
1. arquivos que pretende alterar;
2. comportamento atual encontrado;
3. plano de implementação;
4. riscos de regressão.

Aguarde autorização.

Ao concluir a Task 230:
1. execute Definition of Done;
2. execute TypeScript;
3. execute lint;
4. execute testes aplicáveis;
5. execute build;
6. registre Evidence;
7. atualize PROGRESS.md;
8. atualize MEMORY.md ou docs/decisions.md apenas quando necessário.
```

## Restrições da fase

- Preservar monólito Next.js App Router.
- Preservar multi-tenant e regras de autorização existentes.
- Não adicionar microserviços, fila, cron ou CMS externo para resolver SEO.
- Não alterar regras de billing, affiliate, scraping ou publicação salvo quando necessário para instrumentação de eventos sem PII.
- Não criar dezenas de páginas programáticas automaticamente.
- Não gerar reviews, estrelas, números de clientes ou estatísticas fictícias em JSON-LD.
- Não duplicar Google Analytics direto no código se GA4 estiver sendo servido pelo Google Tag Manager.
- Não enviar email, nome, CPF/CNPJ, workspaceId, IDs de usuário ou outros dados pessoais para Analytics.
- Usar o Design System GeraFeed existente em toda nova UI pública.



## Primeira instrução para IDE

```text
Leia AGENTS.md, SPEC.md, MEMORY.md, PROGRESS.md,
docs/decisions.md

Inspecione primeiro o schema Prisma e o billing atual.
Reutilize Plan, Subscription, Invoice, BillingService,
PaymentProvider e AsaasProvider existentes.

Implemente somente a fase 28.

Ao concluir:
1. execute Definition of Done;
2. execute TypeScript;
3. execute lint;
4. execute testes;
5. execute build quando aplicável;
6. registre Evidence;
7. atualize PROGRESS.md.
```

