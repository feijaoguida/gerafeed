# Task 050 — Fix AI Rewrite UI Refresh

## Problema
Ao clicar "Reescrever com IA", a API retorna `{ success, article, aiResult }`, mas o handler `handleProcessAi` acessa `data.title`, `data.summary` etc. diretamente na raiz. Os dados corretos estão em `data.article.*`.

## Escopo
- Alterar `handleProcessAi` em `src/app/(app)/articles/[id]/page.tsx` para ler `data.article.*`.

## Definition of Done
- [ ] `handleProcessAi` lê campos de `data.article`.
- [ ] Após clicar "Reescrever com IA", título, resumo, conteúdo, tags, SEO e imagem modificada atualizam sem reload.
- [ ] TypeScript PASS.
- [ ] Lint PASS.
