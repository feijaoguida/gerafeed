import assert from "node:assert/strict";
import { prisma } from "../../src/lib/prisma";
import { encrypt } from "../../src/lib/crypto";
import { cleanDescriptionText, buildFallbackDescription } from "../../src/lib/affiliate/metadata-extractor";
import { ProductSalesCopyService } from "../../src/lib/affiliate/sales-copy-service";
import { WooCommercePublisherService } from "../../src/lib/affiliate/woocommerce-publisher";
import { AffiliateService } from "../../src/lib/affiliate/service";

interface WcV3Payload {
  name?: string;
  status?: string;
  type?: string;
  regular_price?: string;
  sale_price?: string;
  external_url?: string;
  button_text?: string;
  attributes?: Array<{ name: string; options: string[] }>;
}

interface WpV2Payload {
  title?: string;
  meta?: {
    _regular_price?: string;
    _price?: string;
    _product_url?: string;
    _button_text?: string;
  };
}

async function run() {
  console.log("=== Phase 37: E2E Verification Suite ===");
  console.log("WooCommerce Integration & Sales-Focused AI Copywriting\n");

  const originalFetch = global.fetch;

  try {
    // -------------------------------------------------------------
    // Suíte 1: Extração e Limpeza de Descrição sem Boilerplate
    // -------------------------------------------------------------
    console.log("1. Testando limpeza de descrição e remoção de boilerplate de marketplace...");
    const dirtyMarketplaceText = `
      Smartphone Samsung Galaxy S24 256GB Cinza
      Garantia do vendedor: 12 meses
      Devolução grátis em até 30 dias
      Enviado pelo full Mercado Livre
      Compre com frete grátis para todo o Brasil.
      O novo Galaxy S24 conta com recursos avançados de IA para fotos e produtividade.
      Confira os meios de pagamento disponíveis.
    `;

    const cleaned = cleanDescriptionText(dirtyMarketplaceText);
    assert.ok(cleaned, "Texto limpo deve estar definido");
    assert.ok(!cleaned.includes("Garantia do vendedor:"), "Deveria remover linha de garantia");
    assert.ok(!cleaned.includes("Devolução grátis"), "Deveria remover linha de devolução grátis");
    assert.ok(!cleaned.includes("Enviado pelo full"), "Deveria remover linha de envio do ML");
    assert.ok(!cleaned.includes("Confira os meios de pagamento"), "Deveria remover meios de pagamento");
    assert.ok(cleaned.includes("Galaxy S24"), "Deveria preservar conteúdo real do produto");
    console.log("   [PASS] Limpeza de texto removeu boilerplate e preservou conteúdo real.");

    const fallbackDesc = buildFallbackDescription("Monitor Gamer LG 27'", "LG", {
      "Resolução": "1920x1080",
      "Taxa de Atualização": "144Hz",
      "Painel": "IPS",
    });
    assert.ok(fallbackDesc, "Fallback deve estar definido");
    assert.ok(fallbackDesc.includes("Monitor Gamer LG 27'"), "Deveria incluir o título");
    assert.ok(fallbackDesc.includes("LG"), "Deveria incluir a marca");
    assert.ok(fallbackDesc.includes("144Hz"), "Deveria listar especificações");
    console.log("   [PASS] Fallback estruturado de descrição criado com sucesso.");

    // -------------------------------------------------------------
    // Suíte 2: Geração de Copy de Vendas Focada em Vender (AIDA)
    // -------------------------------------------------------------
    console.log("\n2. Testando serviço de copywriting de vendas AIDA...");

    // Obter workspace para usar nos testes
    const workspace = await prisma.workspace.findFirst({
      select: { id: true },
    });
    assert.ok(workspace, "Workspace deve existir");

    const salesCopy = await ProductSalesCopyService.generateSalesCopy(workspace.id, {
      name: "Cafeteira Nespresso Essenza Mini 110V",
      brand: "Nespresso",
      seller: "Loja Oficial Nespresso",
      price: 499.9,
      sourceDescription: "Cafeteira de cápsulas com 19 bar de pressão, compacta e elegante.",
      specs: {
        "Pressão": "19 bar",
        "Capacidade": "0.6 Litros",
        "Voltagem": "110V",
      },
    });

    assert.ok(salesCopy.shortDescription, "Deveria conter shortDescription (gancho de atenção)");
    assert.ok(salesCopy.shortDescription.length > 20, "shortDescription deve ter tamanho suficiente");
    assert.ok(salesCopy.description, "Deveria conter descrição completa persuasiva");
    assert.ok(salesCopy.description.includes("<p>"), "Descrição deve ser formatada semanticamente em HTML");
    assert.ok(Array.isArray(salesCopy.pros) && salesCopy.pros.length > 0, "Deveria retornar pontos fortes (pros)");
    console.log("   [PASS] Copy de vendas gerada com gancho AIDA, HTML semântico e benefícios.");

    // -------------------------------------------------------------
    // Suíte 3: Publicação de Produto tipo 'external' no WooCommerce (/wc/v3)
    // -------------------------------------------------------------
    console.log("\n3. Testando publicação no WooCommerce via REST API (/wp-json/wc/v3/products)...");

    const rawPass = "test_wc_password_xyz123";
    const encPass = encrypt(rawPass);

    const testWpSite = await prisma.wordPressSite.upsert({
      where: {
        workspaceId_name: {
          workspaceId: workspace.id,
          name: "E2E Test Store",
        },
      },
      update: {
        url: "https://test-ecommerce.com",
        username: "admin_test",
        encryptedApplicationPassword: encPass,
      },
      create: {
        workspaceId: workspace.id,
        name: "E2E Test Store",
        url: "https://test-ecommerce.com",
        username: "admin_test",
        encryptedApplicationPassword: encPass,
        isDefault: false,
      },
    });

    const testProduct = await prisma.product.create({
      data: {
        workspaceId: workspace.id,
        name: "Headphone Bluetooth Sony WH-1000XM5",
        slug: `sony-xm5-e2e-${Date.now()}`,
        brand: "Sony",
        description: "<p>O melhor fone com cancelamento de ruído do mercado.</p>",
        shortDescription: "Silêncio absoluto e áudio premium onde você estiver.",
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
        specs: { "Conexão": "Bluetooth 5.2", "Cancelamento de Ruído": "Ativo" },
        status: "ACTIVE",
        offers: {
          create: {
            workspace: { connect: { id: workspace.id } },
            affiliateProgram: {
              connectOrCreate: {
                where: { code: "MERCADO_LIVRE" },
                create: {
                  name: "Mercado Livre",
                  code: "MERCADO_LIVRE",
                  providerType: "MERCADO_LIVRE",
                },
              },
            },
            affiliateUrl: "https://mercadolivre.com/sec/sony-xm5-test",
            price: 2199.0,
            oldPrice: 2599.0,
            currency: "BRL",
            status: "ACTIVE",
          },
        },
      },
    });

    let wcV3RequestPayload: WcV3Payload | null = null;
    let wcV3RequestMethod: string = "";

    // Mock fetch para interceptar chamadas ao WooCommerce
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlStr = input.toString();

      if (urlStr.includes("/wp-json/wp/v2/media")) {
        return new Response(
          JSON.stringify({
            id: 1234,
            source_url: "https://test-ecommerce.com/wp-content/uploads/sony.jpg",
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }

      if (urlStr.includes("/wp-json/wc/v3/products")) {
        wcV3RequestMethod = init?.method || "GET";
        wcV3RequestPayload = init?.body ? JSON.parse(init.body as string) : null;

        return new Response(
          JSON.stringify({
            id: 98765,
            name: wcV3RequestPayload?.name,
            permalink: "https://test-ecommerce.com/produto/sony-xm5-test",
            status: wcV3RequestPayload?.status || "publish",
            type: wcV3RequestPayload?.type || "external",
            regular_price: wcV3RequestPayload?.regular_price,
            sale_price: wcV3RequestPayload?.sale_price,
            external_url: wcV3RequestPayload?.external_url,
            button_text: wcV3RequestPayload?.button_text,
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }

      return originalFetch(input, init);
    };

    const publishResult = await WooCommercePublisherService.publishProductToWooCommerce(
      workspace.id,
      testProduct.id,
      {
        wordpressSiteId: testWpSite.id,
        productType: "external",
        status: "publish",
        buttonText: "Compre no Mercado Livre",
      }
    );

    assert.equal(publishResult.success, true);
    assert.equal(publishResult.woocommerceProductId, 98765);
    assert.equal(publishResult.woocommerceProductUrl, "https://test-ecommerce.com/produto/sony-xm5-test");
    assert.equal(wcV3RequestMethod, "POST");
    const payload1 = wcV3RequestPayload as unknown as WcV3Payload;
    assert.ok(payload1, "Payload wcV3 deve estar definido");
    assert.equal(payload1.type, "external");
    assert.equal(payload1.external_url, "https://mercadolivre.com/sec/sony-xm5-test");
    assert.equal(payload1.button_text, "Compre no Mercado Livre");
    assert.equal(payload1.regular_price, "2599.00");
    assert.equal(payload1.sale_price, "2199.00");
    assert.ok(Array.isArray(payload1.attributes) && payload1.attributes.length > 0, "Deveria enviar atributos/especificações");

    // Verificar se persistiu no banco
    const updatedProd = await prisma.product.findUnique({
      where: { id: testProduct.id },
    });
    assert.equal(updatedProd?.woocommerceProductId, 98765);
    assert.equal(updatedProd?.woocommerceProductUrl, "https://test-ecommerce.com/produto/sony-xm5-test");
    assert.equal(updatedProd?.woocommerceProductType, "external");
    assert.ok(updatedProd?.woocommerceLastSyncedAt, "woocommerceLastSyncedAt deve ser preenchido");
    console.log("   [PASS] Produto publicado com sucesso como external no WooCommerce (/wc/v3).");

    // -------------------------------------------------------------
    // Suíte 4: Idempotência na Atualização (PUT /wc/v3/products/{id})
    // -------------------------------------------------------------
    console.log("\n4. Testando atualização idempotente de produto existente no WooCommerce...");

    global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlStr = input.toString();

      if (urlStr.includes("/wp-json/wp/v2/media")) {
        return new Response(
          JSON.stringify({
            id: 1234,
            source_url: "https://test-ecommerce.com/wp-content/uploads/sony.jpg",
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }

      if (urlStr.includes("/wp-json/wc/v3/products/98765")) {
        wcV3RequestMethod = init?.method || "";
        wcV3RequestPayload = init?.body ? JSON.parse(init.body as string) : null;

        return new Response(
          JSON.stringify({
            id: 98765,
            name: wcV3RequestPayload?.name,
            permalink: "https://test-ecommerce.com/produto/sony-xm5-test",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      return originalFetch(input, init);
    };

    const updateResult = await WooCommercePublisherService.publishProductToWooCommerce(
      workspace.id,
      testProduct.id,
      {
        wordpressSiteId: testWpSite.id,
        buttonText: "Garantir Menor Preço",
      }
    );

    assert.equal(updateResult.success, true);
    assert.equal(wcV3RequestMethod, "PUT", "Deveria usar método PUT para atualizar");
    const payload2 = wcV3RequestPayload as unknown as WcV3Payload;
    assert.ok(payload2, "Payload wcV3 deve estar definido");
    assert.equal(payload2.button_text, "Garantir Menor Preço");
    console.log("   [PASS] Idempotência comprovada: PUT /wc/v3/products/98765 executado sem duplicar.");

    // -------------------------------------------------------------
    // Suíte 5: Fallback para Custom Post Type /wp/v2/product
    // -------------------------------------------------------------
    console.log("\n5. Testando fallback para /wp-json/wp/v2/product quando /wc/v3 retorna 404...");

    let wpV2RequestPayload: WpV2Payload | null = null;
    let wpV2RequestMethod: string = "";

    // Resetar o ID do produto para testar o fallback em nova publicação
    await prisma.product.update({
      where: { id: testProduct.id },
      data: { woocommerceProductId: null, woocommerceProductUrl: null },
    });

    global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlStr = input.toString();

      if (urlStr.includes("/wp-json/wp/v2/media")) {
        return new Response(
          JSON.stringify({
            id: 1234,
            source_url: "https://test-ecommerce.com/wp-content/uploads/sony.jpg",
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }

      // Simular que o endpoint oficial /wc/v3/products não está instalado (404)
      if (urlStr.includes("/wp-json/wc/v3/products")) {
        return new Response(
          JSON.stringify({ code: "rest_no_route", message: "No route was found matching the URL and request method." }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // Fallback para Custom Post Type /wp/v2/product
      if (urlStr.includes("/wp-json/wp/v2/product")) {
        wpV2RequestMethod = init?.method || "";
        wpV2RequestPayload = init?.body ? JSON.parse(init.body as string) : null;

        return new Response(
          JSON.stringify({
            id: 88888,
            link: "https://test-ecommerce.com/product/sony-xm5-fallback",
            title: { rendered: wpV2RequestPayload?.title },
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }

      return originalFetch(input, init);
    };

    const fallbackPublish = await WooCommercePublisherService.publishProductToWooCommerce(
      workspace.id,
      testProduct.id,
      {
        wordpressSiteId: testWpSite.id,
        productType: "external",
      }
    );

    assert.equal(fallbackPublish.success, true);
    assert.equal(fallbackPublish.woocommerceProductId, 88888);
    assert.equal(fallbackPublish.woocommerceProductUrl, "https://test-ecommerce.com/product/sony-xm5-fallback");
    assert.equal(wpV2RequestMethod, "POST");
    const wpPayload = wpV2RequestPayload as unknown as WpV2Payload;
    assert.ok(wpPayload?.meta, "Meta wpV2 deve estar definido");
    assert.equal(wpPayload.meta._regular_price, "2599.00");
    assert.equal(wpPayload.meta._price, "2199.00");
    assert.equal(wpPayload.meta._product_url, "https://mercadolivre.com/sec/sony-xm5-test");
    console.log("   [PASS] Fallback para /wp-json/wp/v2/product com metadados de preço e afiliado funcionou perfeitamente.");

    // -------------------------------------------------------------
    // Suíte 6: Fluxo Integrado confirmImport com Publicação WooCommerce
    // -------------------------------------------------------------
    console.log("\n6. Testando fluxo integrado de confirmação de importação com publicação WooCommerce...");

    global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlStr = input.toString();

      if (urlStr.includes("/wp-json/wp/v2/media")) {
        return new Response(
          JSON.stringify({
            id: 1234,
            source_url: "https://test-ecommerce.com/wp-content/uploads/mousepad.jpg",
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }

      if (urlStr.includes("/wp-json/wc/v3/products")) {
        return new Response(
          JSON.stringify({
            id: 77777,
            permalink: "https://test-ecommerce.com/produto/shopee-mouse-pad",
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }

      return originalFetch(input, init);
    };

    const confirmImportResult = await AffiliateService.confirmImport(workspace.id, {
      providerCode: "SHOPEE",
      affiliateUrl: "https://s.shopee.com.br/mousepad-rgb-test",
      name: "Mouse Pad Gamer Speed Extra Grande 900x400mm",
      brand: "GamerPro",
      price: 59.9,
      oldPrice: 89.9,
      currency: "BRL",
      shortDescription: "Controle preciso e velocidade para gamers exigentes.",
      description: "<p>Base de borracha antiderrapante e bordas costuradas.</p>",
      pros: ["Tamanho gigante 90x40cm", "Bordas costuradas reforçadas"],
      publishToWooCommerce: {
        enabled: true,
        wordpressSiteId: testWpSite.id,
        productType: "external",
        status: "publish",
        buttonText: "Comprar na Shopee",
      },
    });

    assert.ok(confirmImportResult.product, "Produto deve ter sido salvo no banco");
    assert.equal(confirmImportResult.product.shortDescription, "Controle preciso e velocidade para gamers exigentes.");
    assert.equal(confirmImportResult.product.woocommerceProductUrl, "https://test-ecommerce.com/produto/shopee-mouse-pad");

    const savedInDb = await prisma.product.findUnique({
      where: { id: confirmImportResult.product.id },
    });
    assert.equal(savedInDb?.woocommerceProductId, 77777);
    assert.equal(savedInDb?.woocommerceProductUrl, "https://test-ecommerce.com/produto/shopee-mouse-pad");
    console.log("   [PASS] Confirmação de importação gravou shortDescription e sincronizou produto no WooCommerce.");

    // Limpeza de produtos de teste
    await prisma.productOffer.deleteMany({
      where: { productId: { in: [testProduct.id, confirmImportResult.product.id] } },
    });
    await prisma.product.deleteMany({
      where: { id: { in: [testProduct.id, confirmImportResult.product.id] } },
    });
    await prisma.wordPressSite.delete({
      where: { id: testWpSite.id },
    });

    console.log("\n=== Todos os 6 testes E2E da Phase 37 passaram com sucesso! ===");
  } finally {
    global.fetch = originalFetch;
  }
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Falha nos testes E2E da Phase 37:", err);
    process.exit(1);
  });
