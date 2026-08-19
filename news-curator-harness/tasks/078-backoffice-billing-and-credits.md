# Task 078. Backoffice Billing and Credits

## Objetivo
Dar ao operador visão operacional de plano, assinatura, limites e créditos/uso.

## Escopo
- plano atual;
- status assinatura;
- limites;
- uso atual;
- créditos disponíveis, conforme modelo existente;
- ajuste manual somente se houver mecanismo seguro no domínio.

Não duplicar regras do BillingService.

## Definition of Done
- [x] dados corretos.
- [x] BillingService reutilizado.
- [x] créditos consistentes.
- [x] alterações auditáveis quando aplicável.
- [x] SuperAdmin only.
- [x] testes.

## Evidence
- Implementado endpoint `src/app/api/backoffice/companies/[id]/billing/route.ts` (`GET` e `PATCH`) reutilizando diretamente `BillingService` como fonte única da verdade para apuração de limites e consumo mensal.
- Interface na aba "Plano & Cobrança" em `src/components/backoffice/company-details.tsx` enriquecida com métricas de consumo de artigos no mês, fontes ativas, créditos restantes e status da assinatura.
- `scripts/test-backoffice-billing-and-credits.ts` executado com 100% de sucesso validando fidelidade de cotas, status da assinatura, upgrade de plano e isolamento total entre empresas.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.

