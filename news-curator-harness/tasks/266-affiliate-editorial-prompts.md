# Task 266 — Prompts de reviews e comparativos orientados à compra

## Status
DONE

## Contexto
Pedido explícito do usuário em 2026-10-05, com referências `comparativo.png` e
`Review Completo e Teste.png`. Esta task trata somente da estrutura editorial
dos dois formatos e da passagem efetiva do prompt para IA. O progresso de
recuperação de senha permanece sob responsabilidade da task existente.

## Critérios e Definition of Done
- Review com veredito rápido, análise prática, ficha técnica, prós/contras,
  perfis recomendados e não recomendados, limitações e conclusão.
- Comparativo com decisão rápida por critério, tabela, análise de diferenças
  e veredito por perfil, sem vencedor determinado pela ordem de seleção.
- Não inventar testes, notas, preços, ofertas, fontes, alternativas ou links.
- Enviar instruções do template efetivo aos quatro provedores, preservando RSS.
- Versionar os dois templates no banco local sem apagar histórico.
- TypeScript, lint, testes aplicáveis, integração com IA simulada e build PASS.
- Registrar evidências e limitações no PROGRESS.

## Fora do escopo
Reproduzir o tema WordPress, criar novos blocos visuais ou alterar os outros
cinco formatos comerciais. Nenhuma publicação ou chamada paga de IA.

## Evidências
- `src/lib/affiliate/editorial-prompts.ts`: dois prompts com estrutura editorial,
  regras factuais, HTML semântico e contrato JSON/SEO.
- Templates `PRODUCT_REVIEW` e `COMPARISON` v2 ativos no PostgreSQL local;
  histórico v1 preservado. Reexecução do script: ambos "já atualizado (v2)".
- Geradores enviam `systemPrompt` efetivo; os quatro provedores usam
  `buildArticlePrompts`, com fluxo RSS preservado.
- Contexto inclui dados editoriais/source separados, reviews qualitativos e
  referências; removidos selos/recomendações automáticos sem fundamentação.
- `node --import tsx --test scripts/test-affiliate-editorial-prompts.ts`: PASS
  (3 testes, incluindo requests simulados dos 4 provedores e geração persistida
  de review/comparativo em workspace temporário, removido ao terminar).
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS (0 erros; 5 warnings preexistentes).
- ESLint direcionado aos arquivos desta task: PASS sem warnings.
- `npm run build`: PASS (95/95 páginas geradas).
- `git diff --check` nos arquivos de código alterados nesta task: PASS.
- Primeiras tentativas: acesso ao PostgreSQL bloqueado pelo sandbox (EPERM),
  mock direto do proxy Prisma inválido, TypeScript exigiu tratar html opcional;
  corrigidos e testes repetidos com sucesso. Build inicial terminou com 143;
  repetido fora do sandbox com sucesso.
- Sem chamada paga de IA ou publicação WordPress. Qualidade de saída de modelo
  real e reprodução visual do tema não foram validadas nesta task.
