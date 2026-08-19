# Task 068. Phase 8 Integration

## Objetivo
Provar fluxo multi-site.

## Cenários
1. Workspace com 2 WordPress.
2. Um Feed associado aos dois.
3. Prompt diferente por destino.
4. Feed novo criado dentro de um site.
5. Artigos filtrados por data/feed/site.
6. Card mostrando data do feed.
7. Publicação usando o WordPress correto.

## Definition of Done
- [x] todos os cenários PASS.
- [x] prompt correto por destino.
- [x] publicação correta.
- [x] sem vazamento entre Workspaces.
- [x] TypeScript PASS.
- [x] Lint PASS.
- [x] Build PASS.

## Evidence
- `scripts/test-phase8-integration.ts` criado e executado com sucesso cobrindo a matriz completa dos 7 cenários da Fase 8:
  1. Workspace com 2 sites WordPress cadastrados com criptografia.
  2. Feed compartilhado associado aos 2 sites.
  3. Resolução de prompt por destino (Site A com override específico e Site B com default do Feed).
  4. Quick-Create de novo feed dentro do site com vinculação instantânea.
  5. Artigos filtrados combinando data editorial, feed e site de destino.
  6. Card formatando a data original com timezone e fallback.
  7. Publicação para o WordPress resolvendo credenciais e endpoint do site correto.
  8. Isolamento multi-tenant estrito validado em todas as etapas sem vazamento entre workspaces.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.

