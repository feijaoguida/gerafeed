# 134 Affiliate Click Tracking

## Objetivo
Registrar cliques sem redirect obrigatório.

## Escopo
Href direto para affiliateUrl. sendBeacon/fetch keepalive em paralelo. Token opaco/assinado. Não aceitar workspaceId arbitrário. Não armazenar IP bruto sem requisito.

## Definition of Done
- [x] Model/token/endpoint/beacon.
- [x] Direct href.
- [x] Failure non-blocking.
- [x] Abuse tests.
- [x] TypeScript/Lint PASS.

## Validation
- Model `AffiliateClick` criado no Prisma com relações e índices tenant-per-row.
- `ClickTrackingService` implementado com geração de token assinado HMAC-SHA256 e decodificação segura.
- Endpoint POST `/api/affiliate/clicks` criado com suporte a JSON e Beacon text/plain com validação de integridade do token.
- `WordPressAffiliateRenderer` atualizado com link direto para `affiliateUrl`, atributo `data-nc-token` e script client-side non-blocking via `navigator.sendBeacon` e `fetch keepalive`.
- Testes automatizados executados via `npx tsx scripts/test-affiliate-click-tracking.ts` com 100% de sucesso.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS (0 erros, 0 warnings).

## Evidence
- Arquivos alterados/criados:
  - `prisma/schema.prisma`
  - `src/lib/affiliate/click-tracking.ts`
  - `src/lib/affiliate/index.ts`
  - `src/lib/publisher/wordpress-renderer.ts`
  - `src/app/api/affiliate/clicks/route.ts`
  - `scripts/test-affiliate-click-tracking.ts`
- Comandos executados:
  - `npx prisma db push`: PASS
  - `npx prisma generate`: PASS
  - `npx tsx scripts/test-affiliate-click-tracking.ts`: PASS
  - `npx tsc --noEmit`: PASS
  - `npm run lint`: PASS
- Resultados:
  - Links comerciais mantêm href direto para o marketplace sem redirecionamento mandatório do servidor.
  - Event tokens criptograficamente assinados impedem falsificação de `workspaceId`, `articleId`, `productId` ou `offerId`.
  - Tentativas de abuso com tokens adulterados ou forjados retornam HTTP 400.
  - Falhas de rede ou bloqueadores de rastreamento não impedem nem atrasam a navegação do usuário final.
