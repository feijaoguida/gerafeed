# Task 228. Migrate Billing Screens (Portal and Upgrade)

## Objetivo
Padronizar o portal do cliente de faturamento e a tela de checkout/upgrade para o Design System GeraFeed.

## Telas Afetadas
1. `src/app/(app)/settings/billing/page.tsx`:
   - `PageHeader` com resumo da assinatura.
   - Status de faturamento (`ACTIVE`, `PAST_DUE`, `CANCELED`) com badges padronizadas.
   - Tabela de histórico de faturas e pagamentos.
   - Seções de Dados Cadastrais com `FormField`.
2. `src/app/(app)/settings/billing/upgrade/page.tsx`:
   - Seletor de ciclo Mensal / Anual (toggle padronizado).
   - Cards de planos destacados com gradiente e lista de benefícios com ícones check.
   - Botões de checkout apontando para a fatura oficial Asaas.

## Critérios de Aceite
- [ ] Light Mode e Dark Mode impecáveis no fluxo de contratação.
- [ ] TypeScript PASS e Lint PASS.
