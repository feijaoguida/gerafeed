# 145 Phase14 Integration and Hardening

## Objetivo
Validar e auditar toda a Phase 14 de ponta a ponta.

## Escopo
- Criar `scripts/test-phase14-hardening.ts` com suíte E2E cobrindo:
  - Multi-tenant: dados de plano e features isolados por workspace.
  - Limite de sites WordPress: bloqueio ao exceder `maxWordPressSites`.
  - Limite diário de artigos: bloqueio ao exceder `maxDailyArticles` com mensagem indicando quando renova.
  - Limite mensal de artigos: bloqueio ao exceder `maxArticles` com mensagem indicando quando renova.
  - Restrição de nicho: `POST /api/ai/prompt-settings` com área não permitida retorna 403 para plano restrito.
  - Restrição de estilo: `POST /api/ai/prompt-settings` com estilo não permitido retorna 403 para plano restrito.
  - Restrição de provedor: `POST /api/ai/config` com provedor avançado retorna 403 para plano restrito.
  - Planos sem restrições: todas as opções são aceitas normalmente.
- Executar `npx tsc --noEmit`.
- Executar `npm run lint`.
- Executar `npm run build`.

## Definition of Done
- [x] Suíte E2E em `scripts/test-phase14-hardening.ts` executada com 100% de sucesso (8/8 cenários).
- [x] Todos os bloqueios (WP sites, artigos diários/mensais, nicho, estilo, provedor) validados.
- [x] Planos sem restrição funcionando normalmente.
- [x] TypeScript/Lint/Build PASS.

## Validation
- `scripts/test-phase14-hardening.ts`: 8/8 cenários de hardening validados com sucesso.
- Isolamento estrito entre tenants em planos restritos e ilimitados.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.

## Evidence
- Arquivos criados/auditados:
  - `scripts/test-phase14-hardening.ts`
  - `src/lib/billing.ts`
  - `src/app/api/wordpress/sites/route.ts`
  - `src/app/api/articles/[id]/process-ai/route.ts`
  - `src/app/api/ai/prompt-settings/route.ts`
  - `src/app/api/ai/config/route.ts`
  - `src/app/api/billing/subscription/route.ts`
  - `src/app/(app)/settings/ai/page.tsx`
  - `src/app/(app)/affiliates/page.tsx`
  - `src/components/sidebar.tsx`
- Comandos executados:
  - `npx tsx scripts/test-phase14-hardening.ts`: PASS (8/8 cenários).
  - `npx tsc --noEmit`: PASS.
  - `npm run lint`: PASS (0 erros).
  - `npm run build`: PASS.
