# Plano Phase 37 — Descrição de Produto com IA Focada em Vendas e Publicação no WordPress (WooCommerce)

## Estado
Planejado em 2026-11-04.
Aguardando autorização do usuário para início da execução (Task 282 TODO).

## Resultado esperado
1. **Melhoria na Descrição do Produto com IA Focada em Vendas (Copywriting de Conversão)**:
   - Aprimorar a extração da descrição original (`metadata-extractor.ts` e `shopee.ts`) preservando parágrafos, removendo frases genéricas de marketplace e enriquecendo com destaques e ficha técnica.
   - Criar o serviço `ProductSalesCopyService` (`src/lib/affiliate/sales-copy-service.ts`) que utiliza a IA configurada no Workspace para gerar automaticamente (ou sob demanda com 1 clique) uma **Descrição de Alta Conversão (Foco em Vendas)** baseada no framework **AIDA (Atenção, Interesse, Desejo, Ação)**:
     - **Descrição Curta Comercial (`shortDescription`)**: 2 a 3 frases de alto impacto destacando o principal benefício e proposta de valor (ideal para o topo da página do produto no WooCommerce).
     - **Descrição Completa Foco em Vendas (`description`)**: texto persuasivo estruturado com gancho de abertura, benefícios práticos reais, diferenciais técnicos traduzidos para o comprador, percepção de qualidade/avaliações e chamada para ação (CTA), **sem inventar especificações inexistentes**.
     - **Sugestão de Pontos Positivos (`pros`)**: extração de 3 a 5 vantagens reais do produto.
   - Caso o Workspace não possua IA ativa no momento da importação, aplicar um fallback determinístico persuasivo que estrutura os destaques, especificações e benefícios em formato comercial pronto para venda.

2. **Publicação de Produtos no WordPress para Leitura pelo WooCommerce**:
   - Permitir que, já na tela de **Importar Produtos (`/affiliates/import`)** — e também na tela de **Detalhes do Produto (`/affiliates/products/[id]`)** —, o usuário possa publicar o produto diretamente em seu site WordPress para ser lido e exibido pelo **WooCommerce**.
   - **Integração Híbrida WooCommerce (`src/lib/affiliate/woocommerce-publisher.ts`)**:
     - Utiliza as credenciais já configuradas no `WordPressSite` (Application Password).
     - **Caminho Primário (`/wp-json/wc/v3/products`)**: Cria ou atualiza o produto nativamente via API REST v3 do WooCommerce com suporte a:
       - Tipo **`external` (Produto Externo/Afiliado — Padrão)**: o botão de compra na loja WooCommerce redireciona diretamente para o link de afiliado (`affiliateUrl`) com texto configurável (ex: *"Comprar no Mercado Livre"*, *"Comprar na Shopee"*, *"Ver Oferta"*);
       - Tipo **`simple` (Produto Simples)**: produto padrão de catálogo WooCommerce;
       - Preço regular (`regular_price`) e preço promocional (`sale_price`) mapeados a partir de `oldPrice` e `price`;
       - Descrição longa (`description`) e descrição curta (`short_description`) formatadas em HTML;
       - Upload da imagem principal e galeria (`images`) para a Biblioteca de Mídia do WordPress (`/wp-json/wp/v2/media`);
       - Especificações técnicas (`specs`) enviadas como atributos visíveis na aba *"Informação adicional"* do WooCommerce (`attributes`).
     - **Fallback Compatível (`/wp-json/wp/v2/product`)**: Caso os endpoints `/wc/v3` estejam desabilitados por plugin/permalink, publica no Custom Post Type `product` do WordPress preenchendo os metadados nativos do WooCommerce (`_price`, `_regular_price`, `_sale_price`, `_product_url`, `_button_text`, `_sku`).
   - Persistência de rastreamento no modelo `Product` (`wordpressSiteId`, `woocommerceProductId`, `woocommerceProductUrl`, `woocommerceProductType`, `woocommerceLastSyncedAt`), permitindo atualizar o produto no WooCommerce sem duplicar registros.

## Fonte da verdade
- Requisitos: [SPEC.md, Phase 37](SPEC.md#phase-37-descrição-de-produto-com-ia-focada-em-vendas-e-publicação-no-wordpress-woocommerce).
- Regras de execução: [AGENTS.md](../AGENTS.md).
- Status/evidências: [PROGRESS.md](PROGRESS.md).
- Decisões arquiteturais: [docs/decisions.md](docs/decisions.md), ADR-095.

## Sequência de execução

| Task | Entrega | Depende de |
|---|---|---|
| [282](tasks/282-sales-copy-ai-and-product-schema.md) | Schema Prisma (`shortDescription` e campos `woocommerce*` em `Product`), melhoria de extração em `metadata-extractor.ts`, serviço `ProductSalesCopyService` (`src/lib/affiliate/sales-copy-service.ts`) e rota `POST /api/affiliate/import/sales-copy` | Autorização |
| [283](tasks/283-woocommerce-publisher-service-and-api.md) | Serviço `WooCommercePublisherService` (`src/lib/affiliate/woocommerce-publisher.ts`), suporte ao envio de produto durante `/api/affiliate/import/confirm` e rota dedicada `POST /api/affiliate/products/[id]/publish-woocommerce` | 282 |
| [284](tasks/284-importer-and-product-woocommerce-ui.md) | Evolução de `AffiliateImporter` (`/affiliates/import`) e `ProductDetail` (`/affiliates/products/[id]`) com botão/toggle de Descrição Vendedora com IA, edição de Descrição Curta/Longa e painel de Publicação no WordPress (WooCommerce) | 282, 283 |
| [285](tasks/285-phase37-e2e-tests-and-security-audit.md) | Testes E2E (`scripts/phase37/test-woocommerce-and-sales-ai-e2e.ts`), Auditoria de Segurança (`run-security-scanner`), `npx tsc --noEmit`, `npm run lint` e `npm run build` | 282, 283, 284 |

## Estratégia de validação e Segurança

| Área | Cenários essenciais |
|---|---|
| Copywriting com IA (Foco em Vendas) | Geração de `shortDescription`, `description` (estrutura AIDA persuasiva) e `pros` usando os dados reais do produto sem alucinar especificações técnicas; fallback determinístico caso a IA não esteja configurada |
| Publicação WooCommerce (`external` e `simple`) | Envio para `/wp-json/wc/v3/products` (e fallback `/wp-json/wp/v2/product`) com `regular_price`, `sale_price`, `external_url` (`affiliateUrl`), `button_text`, imagens na biblioteca de mídia e especificações técnicas |
| Idempotência e Sincronização | Se o produto já possuir `woocommerceProductId` para o mesmo `wordpressSiteId`, realiza atualização (`PUT`/`POST` no ID existente) em vez de duplicar o produto na loja |
| Segurança Multi-Tenant & SSRF | Isolamento estrito por `workspaceId` para `Product`, `ProductOffer` e `WordPressSite`; credenciais do WordPress descriptografadas apenas no servidor |
| Automated Security Check | Execução do `run-security-scanner` em todos os arquivos criados/modificados |
| Não-regressão | `npx tsc --noEmit` PASS, `npm run lint` PASS, `npm run build` PASS |
