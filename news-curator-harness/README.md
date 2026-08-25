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

## Primeira instrução para IDE

```text
Leia AGENTS.md, SPEC.md, MEMORY.md, PROGRESS.md,
docs/decisions.md, docs/asaas-phase20-research.md
e tasks/180-plan-monthly-annual-pricing.md.

Inspecione primeiro o schema Prisma e o billing atual.
Reutilize Plan, Subscription, Invoice, BillingService,
PaymentProvider e AsaasProvider existentes.

Implemente somente a Task 180.

Não avance para a Task 181.

Ao concluir:
1. execute Definition of Done;
2. execute TypeScript;
3. execute lint;
4. execute testes;
5. execute build quando aplicável;
6. registre Evidence;
7. atualize PROGRESS.md.
```
