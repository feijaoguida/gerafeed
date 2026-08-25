# 147 AI Restrictions and UI Fixes

## Objetivo
Implementar bloqueio mestre de Inteligência Artificial via plano (`ai_module`), restringir a opção "Outro" nos prompts, corrigir o bug do contador de estilos de escrita, e ajustar a responsividade visual da importação de afiliados.

## Escopo
- `src/lib/billing-constants.ts`: Adicionar feature `ai_module` às constantes e `SEED_FEATURES`.
- `src/app/(app)/settings/ai/page.tsx`:
  - Lógica de empty state caso o plano não contenha `ai_module`.
  - Fix na lógica de `isAllowed` para a opção "Outro" (exigir `unlimitedNiches`/`unlimitedStyles`).
  - Limpar `writingStyles` ao carregar dados do backend para remover opções legadas não listadas.
- `src/app/api/ai/config/route.ts` & `src/app/api/ai/prompt-settings/route.ts`: Adicionar verificação de autorização baseada em `ai_module`.
- `src/components/affiliate/affiliate-importer.tsx`: Refinar layout da barra de pesquisa e botão para não quebrar ou ficar desalinhado.

## Definition of Done
- [ ] Feature `ai_module` configurável nos Planos.
- [ ] Backend bloqueando `POST /api/ai/config` e `POST /api/ai/prompt-settings` se não possuir `ai_module`.
- [ ] Frontend ocultando a aba IA (bloqueio UI) caso sem plano compatível.
- [ ] Opção "Outro" indisponível se o plano for restrito.
- [ ] Contador "X/3" não considera opções invisíveis.
- [ ] Tela de importação de afiliado responsiva e alinhada.
- [ ] TypeScript, Lint, Build aprovados.

## Validation
- `npx tsc --noEmit` e `npm run lint`.
- Testar endpoints via Postman ou UI garantindo 403 Forbidden.

## Evidence
- (Pendente)
