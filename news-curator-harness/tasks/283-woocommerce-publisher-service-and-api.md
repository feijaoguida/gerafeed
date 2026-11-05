# Task 283: Serviço de Publicação de Produtos no WordPress / WooCommerce e Rotas de API

## Status
DONE

## Contexto
Permitir publicar produtos importados no WordPress para que sejam lidos pelo plugin **WooCommerce** (como Produto Externo/Afiliado `external` redirecionando para o `affiliateUrl`, ou como Produto Simples `simple`).

## Escopo de Implementação
1. **Serviço `WooCommercePublisherService` (`src/lib/affiliate/woocommerce-publisher.ts`)**:
   - Resolver credenciais do site WordPress selecionado (`getWordPressSiteConfig(workspaceId, siteId)` ou fallback `getWordPressConfig(workspaceId)`).
   - Fazer upload da imagem principal (`imageUrl`) e imagens da galeria (`images`, até 4 fotos) para a Biblioteca de Mídia do WordPress (`/wp-json/wp/v2/media`) reutilizando `uploadMediaToWordPressWithUrl`.
   - Formatar a descrição comercial em HTML semântico para o WooCommerce (`description` e `short_description`), incluindo tabela/lista de especificações técnicas e benefícios.
   - Converter especificações técnicas (`specs`) para o formato `attributes` do WooCommerce (`{ name, visible: true, variation: false, options: [value] }`).
   - Calcular `regular_price` e `sale_price` a partir de `price` e `oldPrice` da oferta ativa (ex: se `oldPrice > price`, `regular_price = oldPrice` e `sale_price = price`; caso contrário `regular_price = price`).
   - **Integração com API REST do WooCommerce (`/wp-json/wc/v3/products`)**:
     - Enviar `POST /wp-json/wc/v3/products` (ou `PUT /wp-json/wc/v3/products/{woocommerceProductId}` quando já publicado no mesmo site) autenticado via Basic Auth com Application Password.
     - Suportar `type: "external"` (com `external_url: offer.affiliateUrl` e `button_text` configurável, padrão `"Comprar no Mercado Livre"` / `"Comprar na Shopee"` / `"Ver Oferta"`) e `type: "simple"`.
   - **Fallback WordPress REST API (`/wp-json/wp/v2/product`)**:
     - Caso `/wp-json/wc/v3/products` retorne 404 (ex: rota WC REST desabilitada, mas Custom Post Type `product` ativo no WP REST), publicar via `/wp-json/wp/v2/product` preenchendo `title`, `content`, `excerpt`, `featured_media`, `status` e `meta` (`_regular_price`, `_sale_price`, `_price`, `_product_url`, `_button_text`, `_sku`).
   - Atualizar o registro `Product` no Prisma com `wordpressSiteId`, `woocommerceProductId`, `woocommerceProductUrl`, `woocommerceProductType` e `woocommerceLastSyncedAt`.
2. **Endpoint Dedicado (`src/app/api/affiliate/products/[id]/publish-woocommerce/route.ts`)**:
   - `POST /api/affiliate/products/[id]/publish-woocommerce`:
     - Valida sessão e entitlement `AFFILIATE_MODULE` (`requireAffiliateWorkspace()`).
     - Aceita `{ wordpressSiteId?, productType?: "external" | "simple", status?: "publish" | "draft", buttonText?: string, offerId?: string }`.
     - Executa `WooCommercePublisherService.publishProductToWooCommerce(...)` e retorna os dados do produto publicado (`woocommerceProductId`, `woocommerceProductUrl`, `status`).
3. **Suporte à Publicação Imediata na Confirmação da Importação (`AffiliateService.confirmImport`)**:
   - Aceitar opção `publishToWooCommerce?: { enabled: boolean; wordpressSiteId?: string; productType?: "external" | "simple"; status?: "publish" | "draft"; buttonText?: string }` em `ConfirmImportInput` (`POST /api/affiliate/import/confirm`).
   - Quando `publishToWooCommerce.enabled === true`, após salvar o produto e a oferta no catálogo, invocar `WooCommercePublisherService.publishProductToWooCommerce` e retornar o resultado da publicação junto com o produto salvo (tratando falhas de conexão com o WordPress de forma que o produto continue salvo no catálogo local com aviso claro do erro do WordPress).

## Critérios de Aceitação
- [x] `src/lib/affiliate/woocommerce-publisher.ts` criado com suporte a `/wp-json/wc/v3/products`, fallback `/wp-json/wp/v2/product`, upload de imagens, preços (`regular_price`/`sale_price`), link de afiliado (`external_url`) e atributos.
- [x] Rota `POST /api/affiliate/products/[id]/publish-woocommerce` criada com validação de tenant e plano.
- [x] `AffiliateService.confirmImport` suportando publicação opcional imediata no WooCommerce ao confirmar a importação.
- [x] `npx tsc --noEmit` PASS.

## Evidências
- `src/lib/affiliate/woocommerce-publisher.ts` criado com `WooCommercePublisherService.publishProductToWooCommerce`:
  - Resolução segura de credenciais do site WordPress selecionado ou default;
  - Upload de fotos (capa e galeria até 4 imagens) para a biblioteca de mídia do WordPress (`uploadMediaToWordPressWithUrl`);
  - Formatação e envio de preços (`regular_price`, `sale_price`), link de afiliado (`external_url`), texto de botão e atributos (`attributes`);
  - Suporte ao endpoint oficial do WooCommerce `/wp-json/wc/v3/products` (com atualização idempotente de IDs existentes e re-criação se deletado) e fallback `/wp-json/wp/v2/product`;
  - Persistência dos campos de sincronização em `Product` (`wordpressSiteId`, `woocommerceProductId`, `woocommerceProductUrl`, `woocommerceProductType`, `woocommerceLastSyncedAt`).
- Rota `POST /api/affiliate/products/[id]/publish-woocommerce` criada com validação de tenant (`requireAffiliateWorkspace`).
- `AffiliateService.confirmImport` atualizado para acionar a publicação opcional no WooCommerce durante a confirmação de importação se `publishToWooCommerce.enabled = true`.
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).
