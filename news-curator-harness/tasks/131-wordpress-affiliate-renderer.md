# 131 Wordpress Affiliate Renderer

## Objetivo
Renderizar documento canônico para WordPress.

## Escopo
Renderizar text, headings, product card, comparison, pros/cons, CTA e disclosure. Resolver ProductOffer no publish e sanitizar HTML.

## Definition of Done
- [x] Renderer/cards/comparison/CTA.
- [x] Offer resolution.
- [x] Sanitization/tests.
- [x] TypeScript/Lint PASS.

## Validation
Executar testes automatizados em `scripts/test-wordpress-affiliate-renderer.ts`, tsc, lint e build.

## Evidence
- `src/lib/publisher/wordpress-renderer.ts`:
  - Implementado `WordPressAffiliateRenderer` com suporte a todos os 8 tipos de blocos canônicos (`AFFILIATE_DISCLOSURE`, `HEADING`, `RICH_TEXT`, `PRODUCT_CARD`, `PRODUCT_COMPARISON`, `PROS_CONS`, `CTA`, `IMAGE`).
  - Resolução dinâmica de ofertas ativas e preços atualizados no catálogo no momento da renderização / publicação.
  - Sanitização de HTML e compliance de links: injeção obrigatória de `rel="sponsored nofollow noopener"` e `target="_blank"` em todos os links externos e de afiliados gerados.
- Validações:
  - `npx tsx scripts/test-wordpress-affiliate-renderer.ts`: PASS (4/4 checks).
  - `npx tsc --noEmit`: PASS.
  - `npm run lint`: PASS (0 erros, 0 avisos).

