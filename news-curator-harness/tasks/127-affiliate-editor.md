# 127 Affiliate Editor

## Objetivo
Criar editor/revisão comercial.

## Escopo
Mostrar tipo, prompt, keyword, produtos/ofertas, ordem, badges, score, recommendation, preview canônico, SEO e disclosure. Human approval obrigatória.

## Definition of Done
- [x] Create/edit/select/reorder.
- [x] Preview/SEO.
- [x] Human approval.
- [x] TypeScript/Lint PASS.

## Validation
Executar testes automatizados em `scripts/test-affiliate-editor.ts`, tsc, lint e build.

## Evidence
- `src/components/affiliate/affiliate-article-editor.tsx`:
  - Implementado editor visual para artigos comerciais e de afiliados com 4 abas (`Editor de Conteúdo`, `Produtos Vinculados`, `Preview Canônico` e `SEO & Metadados`).
  - Gestão e reordenação interativa de produtos (`moveProduct`), edição de badges personalizados, notas/score e veredictos.
  - Renderização em tempo real de blocos canônicos estruturados e aviso obrigatório de compliance (`AFFILIATE_DISCLOSURE`).
  - Fluxo de aprovação humana obrigatória (`Aprovar & Marcar Pronto`, `Salvar Rascunho`, `Rejeitar`).
- `src/app/(app)/articles/[id]/page.tsx`:
  - Integrado `AffiliateArticleEditor` condicionalmente quando `article.commercialType` está presente, preservando a experiência de notícias legadas.
- Validações:
  - `npx tsx scripts/test-affiliate-editor.ts`: PASS (5/5 checks).
  - `npx tsc --noEmit`: PASS.
  - `npm run lint`: PASS (0 erros, 0 avisos).

