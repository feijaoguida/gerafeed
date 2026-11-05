# Task 289: Autenticação no Publicador, Testes E2E Automatizados e Build

## Status
DONE

## Contexto
Integrar a autenticação com chaves dedicadas da WooCommerce REST API no `WooCommercePublisherService`, criar suíte automatizada de testes E2E cobrindo autorização por plano, encriptação e publicação, e validar o build de produção.

## Escopo de Implementação
1. **Atualização do Publicador (`src/lib/affiliate/woocommerce-publisher.ts`)**:
   - No método de publicação, se `siteConfig.woocommerceConsumerKey` e `siteConfig.woocommerceConsumerSecret` estiverem preenchidos:
     - Utilizar `Basic base64(ck:cs)` para autenticar na WooCommerce REST API.
     - Se não estiverem, manter o fallback para `username:applicationPassword`.
2. **Script de Testes E2E (`scripts/phase38/test-woocommerce-keys-and-plan-guard-e2e.ts`)**:
   - Cenário 1: Persistência encriptada de `encryptedWooCommerceSecret` e sanitização no client (`hasWooCommerceSecret`).
   - Cenário 2: Validação de plano: rejeição de chaves WooCommerce quando workspace não possui `AFFILIATE_FEATURES.MODULE`.
   - Cenário 3: Aceitação de chaves WooCommerce quando workspace possui o plano adequado.
   - Cenário 4: Publicação de produto usando `Basic base64(ck:cs)` no endpoint `/wp-json/wc/v3/products`.
   - Cenário 5: Endpoint de teste de conexão WooCommerce (`POST /api/wordpress/sites/[id]/test-woocommerce`).
3. **Validação Completa**:
   - `npx tsx scripts/phase38/test-woocommerce-keys-and-plan-guard-e2e.ts` PASS.
   - `npx tsc --noEmit` PASS (0 erros).
   - `npm run lint` PASS (0 erros).
   - `npm run build` PASS.
   - Atualizar `PROGRESS.md` e `MEMORY.md`.

## Critérios de Aceitação
- [x] `WooCommercePublisherService` autentica com chaves WooCommerce prioritariamente.
- [x] Testes E2E executados e 100% aprovados.
- [x] `npx tsc --noEmit` PASS (0 erros).
- [x] `npm run lint` PASS (0 erros).
- [x] `npm run build` PASS.
- [x] `PROGRESS.md` e `MEMORY.md` atualizados.

## Evidência de Conclusão
- `WooCommercePublisherService` atualizado para resolver `woocommerceConsumerKey` e `woocommerceConsumerSecret` decriptados e autenticar requisições para `/wp-json/wc/v3/products` via `Basic base64(ck:cs)`, mantendo fallback para credenciais de Application Password para upload de mídia e rotas legadas.
- Script de teste E2E `scripts/phase38/test-woocommerce-keys-and-plan-guard-e2e.ts` executado com 5 cenários completos validados com sucesso (criptografia AES-256-GCM `v1:`, sanitização client-safe, bloqueio de planos não autorizados, atualização/limpeza e publicação autenticada).
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).
- `npm run build`: PASS (compilou com sucesso todas as 102 páginas).

