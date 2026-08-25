# 140 Plan WordPress and Daily Article Limits

## Objetivo
Adicionar limites de sites WordPress e de artigos diários ao modelo de plano e ao BillingService.

## Escopo
- Adicionar `maxWordPressSites` (Int, padrão 1) e `maxDailyArticles` (Int, padrão 5) ao modelo `Plan` no schema Prisma.
- Rodar `npx prisma db push` e `npx prisma generate`.
- Atualizar `BillingService.checkLimit` para suportar os recursos `WORDPRESS_SITES` e `ARTICLES_DAILY`.
- Atualizar `POST /api/wordpress/sites` para validar o limite de sites antes de criar.
- Atualizar `POST /api/articles/[id]/process-ai` para verificar ambos os limites (diário e mensal) antes de processar. Resposta de erro deve indicar qual limite foi atingido e quando ele renova.
- Atualizar o CRUD de Planos no Backoffice (`GET/POST /api/backoffice/plans` e `GET/PATCH/DELETE /api/backoffice/plans/[id]`) para incluir e persistir os novos campos.
- Criar script de validação `scripts/test-plan-limits-wordpress-daily.ts`.

## Definition of Done
- [x] Schema Prisma com `maxWordPressSites` e `maxDailyArticles`.
- [x] `BillingService.checkLimit` suportando `WORDPRESS_SITES` e `ARTICLES_DAILY`.
- [x] `POST /api/wordpress/sites` bloqueia se o workspace já atingiu `maxWordPressSites`.
- [x] `POST /api/articles/[id]/process-ai` bloqueia indicando limite diário OU mensal.
- [x] Backoffice CRUD de Planos persiste e exibe os novos campos.
- [x] Script `scripts/test-plan-limits-wordpress-daily.ts` executado com sucesso.
- [x] TypeScript/Lint/Build PASS.

## Validation
- Limite de sites WordPress: WS_B bloqueado após criar 1 site (limite=1). WS_A permite até 5.
- Limite diário: WS_B bloqueado após 3 artigos no dia com mensagem "Renova amanhã em 20/08/2026".
- Limite mensal: WS_B bloqueado após 20 artigos no mês com mensagem "Renova em 01/09/2026".
- Campos `maxDailyArticles` e `maxWordPressSites` persistidos e lidos corretamente via Prisma.

## Evidence
- Arquivos alterados:
  - `prisma/schema.prisma`: campos `maxWordPressSites` e `maxDailyArticles` adicionados ao modelo `Plan`.
  - `src/lib/billing.ts`: `LimitResource` expandido; `SEED_PLANS` atualizado; `checkLimit` suporta `ARTICLES_DAILY` e `WORDPRESS_SITES` com mensagens de renovação.
  - `src/app/api/wordpress/sites/route.ts`: `POST` valida `WORDPRESS_SITES` antes de criar; retorna 403 com `limitReached: true`.
  - `src/app/api/articles/[id]/process-ai/route.ts`: `POST` valida `ARTICLES_DAILY` e `ARTICLES` antes de processar; retorna 403 com indicação de qual limite foi atingido.
  - `src/app/api/backoffice/plans/route.ts`: `POST` aceita e persiste `maxDailyArticles` e `maxWordPressSites`.
  - `src/app/api/backoffice/plans/[id]/route.ts`: `PATCH` aceita e persiste `maxDailyArticles` e `maxWordPressSites`.
  - `scripts/test-plan-limits-wordpress-daily.ts`: suíte de testes criada.
- Comandos executados:
  - `npx prisma db push`: PASS — schema sincronizado.
  - `npx prisma generate`: PASS — Prisma Client v7.9.1 regenerado.
  - `npx tsx scripts/test-plan-limits-wordpress-daily.ts`: PASS (4/4 testes).
  - `npx tsc --noEmit`: PASS.
  - `npm run lint`: PASS (0 erros, 0 warnings).
