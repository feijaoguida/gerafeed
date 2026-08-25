import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import {
  ProductCatalogService,
  ProductOfferService,
  ProductRefreshService,
  ensureDefaultAffiliatePrograms,
} from "@/lib/affiliate";

async function run() {
  console.log("=== TEST: Task 113 - Product Deduplication and Manual Refresh ===");

  const WS_A_SLUG = "test-ws-refresh-a";
  const WS_B_SLUG = "test-ws-refresh-b";
  const PLAN_SLUG = "test-plan-refresh";

  try {
    // 0. Seed programs & Cleanup
    await ensureDefaultAffiliatePrograms();

    await prisma.productOffer.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.product.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.subscription.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } },
    });
    await prisma.planFeature.deleteMany({
      where: { plan: { slug: PLAN_SLUG } },
    });
    await prisma.plan.deleteMany({
      where: { slug: PLAN_SLUG },
    });

    // 1. Setup Plan & Workspaces
    console.log("\n--- Check 1: Setup de Planos e Workspaces ---");
    await BillingService.ensureDefaultFeatures();
    const featModule = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MODULE } });
    const featMaxProd = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MAX_PRODUCTS } });

    const plan = await prisma.plan.create({
      data: {
        name: "Plano Refresh Teste",
        slug: PLAN_SLUG,
        price: 99.0,
        planFeatures: {
          create: [
            { featureId: featModule.id, enabled: true },
            { featureId: featMaxProd.id, enabled: true, limit: 10 },
          ],
        },
      },
    });

    const wsA = await prisma.workspace.create({
      data: { name: "Tenant A Refresh", slug: WS_A_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsA.id, planId: plan.id, status: "ACTIVE" },
    });

    const wsB = await prisma.workspace.create({
      data: { name: "Tenant B Refresh", slug: WS_B_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsB.id, planId: plan.id, status: "ACTIVE" },
    });
    console.log("✓ Check 1 PASS: Workspaces configurados.");

    // 2. Criação de Produto e Oferta com Dados Editoriais Personalizados
    console.log("\n--- Check 2: Criação de Produto com Dados Editoriais Personalizados ---");
    const product = await ProductCatalogService.createProduct(wsA.id, {
      name: "Smartphone Flagship 256GB Editorial",
      brand: "PhoneBrand",
      description: "Análise editorial detalhada pela equipe de curadoria.",
      pros: ["Câmera excepcional", "Tela OLED 120Hz vibrante"],
      cons: ["Preço elevado de lançamento"],
      rating: 4.9,
      status: "ACTIVE",
    });

    const initialDate = new Date(Date.now() - 86400000); // 1 dia atrás
    const program = await prisma.affiliateProgram.findUniqueOrThrow({ where: { code: "MERCADO_LIVRE" } });
    const offer = await prisma.productOffer.create({
      data: {
        workspaceId: wsA.id,
        productId: product.id,
        affiliateProgramId: program.id,
        externalProductId: "MLB123456789",
        affiliateUrl: "https://produto.mercadolivre.com.br/MLB-123456789-smartphone-flagship",
        seller: "Loja Oficial Antiga",
        price: 2999.0,
        oldPrice: 3499.0,
        currency: "BRL",
        metadataSource: "INITIAL_SEED",
        metadataLastFetchedAt: initialDate,
        status: "ACTIVE",
      },
    });

    console.log("✓ Check 2 PASS: Produto e oferta criados com metadataLastFetchedAt anterior.");

    // 3. Execução de Refresh Manual da Oferta e Merge Policy
    console.log("\n--- Check 3: Execução de Refresh Manual da Oferta ---");
    await ProductRefreshService.refreshOffer(wsA.id, offer.id);

    const updatedOffer = await ProductOfferService.getOffer(wsA.id, offer.id);
    if (!updatedOffer.metadataLastFetchedAt || updatedOffer.metadataLastFetchedAt.getTime() <= initialDate.getTime()) {
      throw new Error("FAIL: metadataLastFetchedAt não foi atualizado no refresh manual!");
    }
    if (updatedOffer.metadataSource !== "REFRESH_MANUAL") {
      throw new Error(`FAIL: metadataSource esperado REFRESH_MANUAL, obtido ${updatedOffer.metadataSource}`);
    }
    console.log(`  metadataLastFetchedAt atualizado para: ${updatedOffer.metadataLastFetchedAt.toISOString()}`);
    console.log("✓ Check 3 PASS: Refresh manual atualizou oferta e carimbo de data com sucesso.");

    // 4. Verificação da Preservação Editorial (Merge Policy)
    console.log("\n--- Check 4: Verificação da Preservação de Campos Editoriais no Produto ---");
    const productAfterOfferRefresh = await ProductCatalogService.getProduct(wsA.id, product.id);
    if (
      productAfterOfferRefresh.description !== "Análise editorial detalhada pela equipe de curadoria." ||
      productAfterOfferRefresh.pros.length !== 2 ||
      productAfterOfferRefresh.rating !== 4.9
    ) {
      throw new Error("FAIL: Merge policy falhou! Campos editoriais do produto foram sobrescritos indevidamente.");
    }
    console.log("✓ Check 4 PASS: Campos editoriais preservados rigorosamente pela merge policy.");

    // 5. Refresh em Lote de Ofertas do Produto
    console.log("\n--- Check 5: Refresh no Nível de Produto (Múltiplas Ofertas) ---");
    // Adiciona 2ª oferta
    await ProductOfferService.createOffer(wsA.id, {
      productId: product.id,
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-987654321-smartphone-flagship-oferta-2",
      seller: "Vendedor Parceiro",
      price: 2899.0,
      status: "ACTIVE",
    });

    const batchRefreshResult = await ProductRefreshService.refreshProduct(wsA.id, product.id);
    if (batchRefreshResult.refreshedCount !== 2) {
      throw new Error(`FAIL: Esperava 2 ofertas atualizadas, obtido ${batchRefreshResult.refreshedCount}`);
    }
    console.log("✓ Check 5 PASS: Refresh de produto executou atualização para todas as ofertas vinculadas.");

    // 6. Isolamento Multi-Tenant no Refresh
    console.log("\n--- Check 6: Isolamento Multi-Tenant no Refresh ---");
    let crossTenantRefreshBlocked = false;
    try {
      await ProductRefreshService.refreshOffer(wsB.id, offer.id);
    } catch {
      crossTenantRefreshBlocked = true;
    }
    if (!crossTenantRefreshBlocked) {
      throw new Error("FAIL: Tenant B conseguiu dar refresh em oferta do Tenant A!");
    }

    let crossTenantProductRefreshBlocked = false;
    try {
      await ProductRefreshService.refreshProduct(wsB.id, product.id);
    } catch {
      crossTenantProductRefreshBlocked = true;
    }
    if (!crossTenantProductRefreshBlocked) {
      throw new Error("FAIL: Tenant B conseguiu dar refresh em produto do Tenant A!");
    }
    console.log("✓ Check 6 PASS: Isolamento estrito entre tenants verificado no refresh.");

    // Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.productOffer.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.product.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.subscription.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } },
    });
    await prisma.planFeature.deleteMany({
      where: { plan: { slug: PLAN_SLUG } },
    });
    await prisma.plan.deleteMany({
      where: { slug: PLAN_SLUG },
    });
    console.log("✓ Cleanup concluído.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 113 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 113:", error);
    process.exit(1);
  }
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
