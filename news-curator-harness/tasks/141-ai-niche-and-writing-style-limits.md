# 141 AI Niche and Writing Style Limits

## Objetivo
Restringir as opções de área de atuação do portal e de estilos de escrita disponíveis para planos sem a feature correspondente.

## Escopo
- Criar a feature `ai_unlimited_niches` (BOOLEAN) em `BillingService.ensureDefaultFeatures` e seed.
- Criar a feature `ai_unlimited_styles` (BOOLEAN) em `BillingService.ensureDefaultFeatures` e seed.
- Adicionar constante `ALLOWED_NICHES_RESTRICTED` com as 3 áreas permitidas: `["Política", "Negócios", "Meio Ambiente"]`.
- Adicionar constante `ALLOWED_STYLES_RESTRICTED` com os 4 estilos permitidos: `["Sério", "Informativo", "Alegre", "Atraente"]`.
- Atualizar a tela `/settings/ai` (aba Prompt Editorial):
  - Carregar entitlement do workspace via `GET /api/billing/subscription` ou endpoint dedicado.
  - Áreas e estilos fora da lista permitida devem ser exibidos com estado `disabled`, opacidade reduzida e badge "Upgrade" clicável (link para `/billing` ou modal).
  - Áreas e estilos dentro da lista permitida ficam sempre habilitados.
- Atualizar `POST /api/ai/prompt-settings` para validar server-side:
  - Se `ai_unlimited_niches: false`, rejeitar com 403 se a área não estiver em `ALLOWED_NICHES_RESTRICTED`.
  - Se `ai_unlimited_styles: false`, rejeitar com 403 se qualquer estilo não estiver em `ALLOWED_STYLES_RESTRICTED`.
- Criar script de validação `scripts/test-ai-niche-style-limits.ts`.

## Definition of Done
- [x] Features `ai_unlimited_niches` e `ai_unlimited_styles` criadas no seed.
- [x] UI desabilita opções restritas com badge "Upgrade".
- [x] `POST /api/ai/prompt-settings` rejeita valores não permitidos com 403.
- [x] Script `scripts/test-ai-niche-style-limits.ts` executado com sucesso.
- [x] TypeScript/Lint/Build PASS.

## Validation
- Constantes de restrição `ALLOWED_NICHES_RESTRICTED` e `ALLOWED_STYLES_RESTRICTED` validadas.
- Plano Free sem `ai_unlimited_niches` e sem `ai_unlimited_styles` restringe UI + Server 403.
- Plano Pro com ambas as features ativas libera todas as opções.

## Evidence
- Arquivos alterados:
  - `src/lib/billing.ts`: `AI_FEATURES`, `ALLOWED_NICHES_RESTRICTED`, `ALLOWED_STYLES_RESTRICTED` adicionados.
  - `src/app/api/ai/prompt-settings/route.ts`: validação server-side com bloqueio 403 caso nicho/estilo não esteja na lista permitida.
  - `src/app/api/billing/subscription/route.ts`: resposta expandida para expor `aiFeatures` no client.
  - `src/app/(app)/settings/ai/page.tsx`: UI atualizada com badges de Upgrade em opções travadas.
  - `scripts/test-ai-niche-style-limits.ts`: suíte de testes de nichos/estilos.
- Comandos executados:
  - `npx tsx scripts/test-ai-niche-style-limits.ts`: PASS (4/4 testes).
  - `npx tsc --noEmit`: PASS.
  - `npm run lint`: PASS (0 erros).
