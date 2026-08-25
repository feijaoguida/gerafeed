# 146 Backoffice Plan Limits UI

## Objetivo
Atualizar o fluxo de Cadastro de Planos no backoffice para incluir os novos limites (Sites WordPress e Artigos Diários) e verificar a usabilidade da seleção de restrições de IA.

## Escopo
- Editar `src/components/backoffice/plan-manager.tsx`:
  - Adicionar campos de input (state, form fields, preenchimento do edit modal) para `maxWordPressSites`.
  - Adicionar campos de input para `maxDailyArticles`.
  - Exibir esses limites nos cards de visualização de plano (ex: "Limite Diário de Artigos", "Limite Sites WordPress").
  - (Opcional) Garantir que as features de IA (`ai_unlimited_niches`, `ai_unlimited_styles`, `ai_advanced_providers`) estejam claras na listagem de features vinculadas (já são exibidas dinamicamente, mas conferir se o nome de exibição no seed está amigável).
- O payload de salvamento (`POST/PATCH /api/backoffice/plans`) já suporta os novos campos (atualizado na Phase 14), apenas garantir que a UI envie os dados corretos no JSON.

## Definition of Done
- [ ] Inputs para `maxDailyArticles` e `maxWordPressSites` disponíveis no modal de criar/editar plano.
- [ ] Cards de exibição de plano mostram os 4 limites (`maxArticles`, `maxDailyArticles`, `maxSources`, `maxWordPressSites`).
- [ ] Criação e edição de plano salva com sucesso todos os limites no banco de dados.
- [ ] TypeScript/Lint/Build PASS.

## Validation
- `npx tsc --noEmit` e `npm run lint`.
- Validar no browser (Backoffice -> Planos): editar um plano, alterar os novos limites, salvar e recarregar a página para garantir a persistência.

## Evidence
- Registrar arquivos alterados e resultados da compilação.
