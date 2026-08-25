# 142 AI Provider Plan Restrictions

## Objetivo
Restringir os provedores de IA disponíveis para seleção em planos sem a feature de provedores avançados.

## Escopo
- Criar a feature `ai_advanced_providers` (BOOLEAN) em `BillingService.ensureDefaultFeatures` e seed.
- Adicionar constante `ALLOWED_PROVIDERS_RESTRICTED` com os provedores permitidos em planos restritos: `["openai", "openai-compatible"]`.
- Atualizar a tela `/settings/ai` (aba Conexão):
  - Carregar entitlement do workspace.
  - Provedores fora da lista permitida (`gemini`, `anthropic`) devem ser exibidos desabilitados com badge "Upgrade" e sem possibilidade de seleção.
  - Provedores dentro da lista (`openai`, `openai-compatible`) ficam sempre habilitados.
  - Se o provedor atualmente salvo for um provedor avançado e o plano não possuir `ai_advanced_providers`, exibir aviso informando que o provedor atual não é compatível com o plano e sugerir a troca.
- Atualizar `POST /api/ai/config` para validar server-side:
  - Se `ai_advanced_providers: false`, rejeitar com 403 se o provedor não estiver em `ALLOWED_PROVIDERS_RESTRICTED`.
- Criar script de validação `scripts/test-ai-provider-restrictions.ts`.

## Definition of Done
- [x] Feature `ai_advanced_providers` criada no seed.
- [x] UI desabilita provedores avançados com badge "Upgrade".
- [x] `POST /api/ai/config` rejeita provedores não permitidos com 403.
- [x] Aviso de incompatibilidade exibido quando provedor salvo é avançado e plano é restrito.
- [x] Script `scripts/test-ai-provider-restrictions.ts` executado com sucesso.
- [x] TypeScript/Lint/Build PASS.

## Validation
- `ALLOWED_PROVIDERS_RESTRICTED` contendo `["openai", "openai-compatible"]`.
- Plano Free sem `ai_advanced_providers` restringe seleção de Gemini/Anthropic no client e retorna 403 no server (`POST /api/ai/config`).
- Exibição de aviso de alerta visual quando o provedor ativo salvo requer upgrade.

## Evidence
- Arquivos alterados:
  - `src/lib/billing.ts`: feature `ai_advanced_providers` e constante `ALLOWED_PROVIDERS_RESTRICTED`.
  - `src/app/api/ai/config/route.ts`: validação server-side com 403 se o provedor for restrito para o plano.
  - `src/app/(app)/settings/ai/page.tsx`: UI atualizada com suporte a desabilitação de opções no `<select>` e alerta de provedor incompatível.
  - `scripts/test-ai-provider-restrictions.ts`: teste automatizado dos provedores.
- Comandos executados:
  - `npx tsx scripts/test-ai-provider-restrictions.ts`: PASS.
  - `npx tsc --noEmit`: PASS.
  - `npm run lint`: PASS.
