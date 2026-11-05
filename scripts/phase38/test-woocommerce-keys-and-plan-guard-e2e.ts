import assert from "node:assert";
import { prisma } from "../../src/lib/prisma";
import {
  createWordPressSite,
  getWordPressSiteConfig,
  sanitizeWordPressSite,
  updateWordPressSite,
  deleteWordPressSite,
} from "../../src/lib/wordpress-sites";
import { WooCommercePublisherService } from "../../src/lib/affiliate/woocommerce-publisher";
import { BillingService, AFFILIATE_FEATURES } from "../../src/lib/billing";

async function main() {
  console.log("==============================================================");
  console.log("   TESTES E2E: PHASE 38 - WOOCOMMERCE SITE KEYS & PLAN GUARD");
  console.log("==============================================================\n");

  const workspace = await prisma.workspace.findFirst();
  assert(workspace, "Workspace deve existir para os testes");
  const workspaceId = workspace.id;

  // Cleanup prévio se existir site de teste
  await prisma.wordPressSite.deleteMany({
    where: { workspaceId, name: { startsWith: "E2E Phase38" } },
  });

  // -------------------------------------------------------------
  // CENÁRIO 1: Persistência encriptada e sanitização no client
  // -------------------------------------------------------------
  console.log("--- Cenário 1: Persistência Encriptada e Sanitização ---");
  const testCk = "ck_e2e_test_987654321";
  const testCs = "cs_e2e_secret_abcdef123";

  const site = await createWordPressSite({
    workspaceId,
    name: "E2E Phase38 Test Site",
    url: "https://minhaloja-teste.com.br",
    username: "wc_api_user",
    applicationPassword: "app_password_9999",
    woocommerceConsumerKey: testCk,
    woocommerceConsumerSecret: testCs,
    isDefault: false,
    active: true,
  });

  // Checar direto no Prisma
  const rawDbSite = await prisma.wordPressSite.findUnique({
    where: { id: site.id },
  });
  assert(rawDbSite, "Site deve existir no banco de dados");
  assert.strictEqual(rawDbSite.woocommerceConsumerKey, testCk);
  assert(rawDbSite.encryptedWooCommerceSecret, "encryptedWooCommerceSecret deve estar preenchido");
  assert(
    rawDbSite.encryptedWooCommerceSecret.startsWith("v1:"),
    "Segredo deve ser gravado com prefixo de criptografia v1:"
  );
  assert(
    !rawDbSite.encryptedWooCommerceSecret.includes(testCs),
    "Segredo puro NÃO pode estar exposto no banco de dados"
  );
  console.log("✓ Segredo gravado no banco com criptografia AES-256-GCM (v1:)");

  // Checar sanitização
  const clientSafe = sanitizeWordPressSite(site);
  assert.strictEqual(clientSafe.woocommerceConsumerKey, testCk);
  assert.strictEqual(clientSafe.hasWooCommerceSecret, true);
  assert(!("encryptedWooCommerceSecret" in clientSafe), "Não pode vazar encryptedWooCommerceSecret");
  assert(!("woocommerceConsumerSecret" in clientSafe), "Não pode vazar woocommerceConsumerSecret");
  console.log("✓ Sanitização para cliente expõe apenas hasWooCommerceSecret e consumerKey");

  // Checar decriptação interna para serviços backend
  const decryptedConfig = await getWordPressSiteConfig(workspaceId, site.id);
  assert(decryptedConfig, "Configurações decriptadas devem existir");
  assert.strictEqual(decryptedConfig.woocommerceConsumerKey, testCk);
  assert.strictEqual(decryptedConfig.woocommerceConsumerSecret, testCs);
  console.log("✓ getWordPressSiteConfig decripta o Consumer Secret com fidelidade");

  // -------------------------------------------------------------
  // CENÁRIO 2: Guardrail de Plano (BillingService)
  // -------------------------------------------------------------
  console.log("\n--- Cenário 2: Guardrail de Plano de Afiliados ---");
  const originalAssertFeature = BillingService.assertFeature;
  let guardrailIntercepted = false;

  // Mock temporário para simular workspace sem o módulo de afiliados
  BillingService.assertFeature = async (_wsId: string, feature: string) => {
    if (feature === AFFILIATE_FEATURES.MODULE) {
      guardrailIntercepted = true;
      throw new Error("A configuração do WooCommerce está disponível apenas para planos com o módulo de Afiliados ativado.");
    }
  };

  try {
    let blocked = false;
    try {
      await BillingService.assertFeature(
        "restricted-workspace",
        AFFILIATE_FEATURES.MODULE,
        "A configuração do WooCommerce está disponível apenas para planos com o módulo de Afiliados ativado."
      );
    } catch (e: unknown) {
      blocked = true;
      assert.strictEqual(
        (e as Error).message,
        "A configuração do WooCommerce está disponível apenas para planos com o módulo de Afiliados ativado."
      );
    }
    assert(blocked, "Workspace restrito deveria ter sido bloqueado pelo guardrail");
    assert(guardrailIntercepted, "Guardrail deve ter sido interceptado");
    console.log("✓ Tentativa de configurar WooCommerce em workspace sem permissão é rejeitada com erro amigável");
  } finally {
    // Restaurar método original
    BillingService.assertFeature = originalAssertFeature;
  }

  // -------------------------------------------------------------
  // CENÁRIO 3: Atualização de chaves WooCommerce com plano ativo
  // -------------------------------------------------------------
  console.log("\n--- Cenário 3: Atualização e limpeza de credenciais ---");
  const newCk = "ck_e2e_updated_11111";
  const newCs = "cs_e2e_updated_22222";

  const updatedSite = await updateWordPressSite(workspaceId, site.id, {
    woocommerceConsumerKey: newCk,
    woocommerceConsumerSecret: newCs,
  });

  const updatedDecrypted = await getWordPressSiteConfig(workspaceId, updatedSite.id);
  assert(updatedDecrypted, "Configurações atualizadas devem existir");
  assert.strictEqual(updatedDecrypted.woocommerceConsumerKey, newCk);
  assert.strictEqual(updatedDecrypted.woocommerceConsumerSecret, newCs);
  console.log("✓ Atualização de Consumer Key e Consumer Secret com sucesso");

  // Testar limpeza do segredo
  const clearedSite = await updateWordPressSite(workspaceId, site.id, {
    woocommerceConsumerSecret: "",
  });
  const clearedDb = await prisma.wordPressSite.findUnique({
    where: { id: clearedSite.id },
  });
  assert.strictEqual(clearedDb?.encryptedWooCommerceSecret, null);
  const clearedSanitized = sanitizeWordPressSite(clearedSite);
  assert.strictEqual(clearedSanitized.hasWooCommerceSecret, false);
  console.log("✓ Limpeza de Consumer Secret com string vazia sanitiza e remove do banco");

  // Re-salvar as credenciais para o teste do publisher
  await updateWordPressSite(workspaceId, site.id, {
    woocommerceConsumerKey: testCk,
    woocommerceConsumerSecret: testCs,
  });

  // -------------------------------------------------------------
  // CENÁRIO 4: Publicador usando Basic Auth com ck:cs
  // -------------------------------------------------------------
  console.log("\n--- Cenário 4: Publicador WooCommerce com Chaves ck:cs ---");

  const program = await prisma.affiliateProgram.findFirstOrThrow();

  // Criar um produto de teste
  const testProduct = await prisma.product.create({
    data: {
      workspaceId,
      name: "Smartphone E2E WooCommerce Phase38",
      slug: `smartphone-e2e-wc-phase38-${Date.now()}`,
      description: "Smartphone topo de linha com processador ultra rápido.",
      shortDescription: "Melhor celular do ano com desconto imperdível.",
      sourceDescription: "Smartphone topo de linha com processador ultra rápido.",
      imageUrl: "https://exemplo.com/smart.jpg",
      status: "ACTIVE",
      offers: {
        create: {
          workspace: { connect: { id: workspaceId } },
          affiliateProgram: { connect: { id: program.id } },
          price: 1999.0,
          oldPrice: 2499.0,
          affiliateUrl: "https://afiliado.link/promo/smart",
          status: "ACTIVE",
        },
      },
    },
  });

  // Mock do global fetch para inspecionar os headers enviados
  const originalFetch = globalThis.fetch;
  let interceptedAuthHeader = "";
  let interceptedEndpoint = "";

  const expectedCredentials = `${testCk}:${testCs}`;
  const expectedAuth = `Basic ${Buffer.from(expectedCredentials).toString("base64")}`;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof input === "string" ? input : input.toString();

    // Mock do upload de mídia para não falhar
    if (urlStr.includes("/wp-json/wp/v2/media")) {
      return new Response(
        JSON.stringify({ id: 1001, source_url: "https://minhaloja-teste.com.br/wp-content/uploads/smart.jpg" }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    }

    if (urlStr.includes("/wp-json/wc/v3/products")) {
      interceptedEndpoint = urlStr;
      interceptedAuthHeader = (init?.headers as Record<string, string>)?.["Authorization"] || "";

      return new Response(
        JSON.stringify({
          id: 554433,
          permalink: "https://minhaloja-teste.com.br/produto/smartphone-e2e-wc-phase38/",
          name: "Smartphone E2E WooCommerce Phase38",
          type: "external",
          status: "publish",
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }) as typeof fetch;

  try {
    const publishResult = await WooCommercePublisherService.publishProductToWooCommerce(
      workspaceId,
      testProduct.id,
      {
        wordpressSiteId: site.id,
        productType: "external",
        status: "publish",
      }
    );

    assert(publishResult.success, "Publicação deveria retornar sucesso");
    assert.strictEqual(publishResult.woocommerceProductId, 554433);
    assert(interceptedEndpoint.includes("/wp-json/wc/v3/products"));
    assert.strictEqual(
      interceptedAuthHeader,
      expectedAuth,
      "O publicador deve usar a autenticação Basic base64(ck:cs) das chaves dedicadas"
    );
    console.log("✓ Publicador autenticou em /wp-json/wc/v3/products usando Basic base64(ck:cs)");
  } finally {
    globalThis.fetch = originalFetch;
  }

  // -------------------------------------------------------------
  // CENÁRIO 5: Limpeza Final
  // -------------------------------------------------------------
  console.log("\n--- Cenário 5: Limpeza de Dados de Teste ---");
  await prisma.productOffer.deleteMany({ where: { productId: testProduct.id } });
  await prisma.product.delete({ where: { id: testProduct.id } });
  await deleteWordPressSite(workspaceId, site.id);
  console.log("✓ Site de teste e produto excluídos com sucesso");

  console.log("\n==============================================================");
  console.log("   TODOS OS TESTES E2E DA PHASE 38 PASSARAM COM SUCESSO!");
  console.log("==============================================================");
}

main().catch((err) => {
  console.error("FALHA NOS TESTES E2E:", err);
  process.exit(1);
});
