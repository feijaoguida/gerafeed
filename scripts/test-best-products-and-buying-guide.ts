import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import {
  ProductCatalogService,
  ProductCategoryService,
  ProductOfferService,
  BestProductsGenerator,
  BuyingGuideGenerator,
  ensureDefaultAffiliatePrograms,
} from "@/lib/affiliate";

async function run() {
  console.log("=== TEST: Task 126 - Best Products & Buying Guide Content Generators ===");

  const WS_A_SLUG = "test-ws-gen-guide-a";
  const WS_B_SLUG = "test-ws-gen-guide-b";
  const PLAN_SLUG = "test-plan-gen-guide";

  try {
    // 0. Cleanup
    await ensureDefaultAffiliatePrograms();

    await prisma.articleProduct.deleteMany({
      where: { article: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } } },
    });
    await prisma.article.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.productOffer.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.product.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.productCategory.deleteMany({
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

    // 1. Setup Workspace and Products
    console.log("\n--- Check 1: Setup de Workspace, Categoria e Produtos ---");
    await BillingService.ensureDefaultFeatures();
    const featModule = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MODULE } });
    const featMaxProd = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MAX_PRODUCTS } });

    const plan = await prisma.plan.create({
      data: {
        name: "Plano Guide Generator",
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
      data: { name: "Tenant A Guide Gen", slug: WS_A_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsA.id, planId: plan.id, status: "ACTIVE" },
    });

    const wsB = await prisma.workspace.create({
      data: { name: "Tenant B Guide Gen", slug: WS_B_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsB.id, planId: plan.id, status: "ACTIVE" },
    });

    const category = await ProductCategoryService.createCategory(wsA.id, {
      name: "Cafeteiras Expresso",
    });

    const prod1 = await ProductCatalogService.createProduct(wsA.id, {
      name: "Cafeteira Espresso Manual 15 Bar",
      brand: "CoffeePro",
      categoryId: category.id,
      rating: 4.8,
      specs: { pressao: "15 bar", capacidadeAgua: "1.5L", moedor: "Não incluso" },
      pros: ["Crema espessa e consistente", "Design clássico em inox"],
      cons: ["Exige moedor separado para café em grãos"],
    });
    await ProductOfferService.createOffer(wsA.id, {
      productId: prod1.id,
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-2001-cafeteira-manual",
      price: 699.0,
      seller: "CoffeePro Oficial",
    });

    const prod2 = await ProductCatalogService.createProduct(wsA.id, {
      name: "Cafeteira de Cápsulas Prática",
      brand: "PodMaster",
      categoryId: category.id,
      rating: 4.5,
      specs: { pressao: "19 bar", capacidadeAgua: "0.8L", sistema: "Cápsulas" },
      pros: ["Muito rápida e prática", "Fácil limpeza"],
      cons: ["Custo por dose mais elevado"],
    });
    await ProductOfferService.createOffer(wsA.id, {
      productId: prod2.id,
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-2002-cafeteira-capsula",
      price: 389.0,
      seller: "PodMaster Store",
    });

    const prod3 = await ProductCatalogService.createProduct(wsA.id, {
      name: "Cafeteira Superautomática com Moedor Integrado",
      brand: "BaristaSupreme",
      categoryId: category.id,
      rating: 4.9,
      specs: { pressao: "15 bar", capacidadeAgua: "1.8L", moedor: "Cônico integrado" },
      pros: ["Mói os grãos na hora com 1 toque", "Vaporizador de leite profissional"],
      cons: ["Investimento financeiro alto"],
    });
    await ProductOfferService.createOffer(wsA.id, {
      productId: prod3.id,
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-2003-cafeteira-superauto",
      price: 3299.0,
      seller: "Barista Oficial",
    });
    console.log("✓ Check 1 PASS: Dados configurados com sucesso.");

    // 2. Geração do Artigo de Best Products (Top Picks)
    console.log("\n--- Check 2: Geração de Artigo de Melhores Produtos (Top Picks) ---");
    const mockAiProvider = {
      name: "MockAI",
      model: "mock-model",
      async testConnection() {
        return { connected: true, provider: "mock", model: "mock-model" };
      },
      async generateArticle() {
        return {
          relevant: true,
          score: 9.9,
          title: "As 3 Melhores Cafeteiras Expresso em 2026: Do Custo-Benefício ao Premium",
          summary: "Selecionamos as melhores cafeteiras expresso manuais, de cápsula e automáticas para você tomar o melhor café em casa.",
          content: "<p>Se você ama café, escolher a cafeteira certa faz toda a diferença no sabor e na rotina.</p>",
          suggestedCategoryId: null,
          tags: ["Cafeteiras", "Melhores Cafeteiras", "Espresso", "Café"],
          seoFocusKeyword: "melhores cafeteiras expresso 2026",
          seoTitle: "As Melhores Cafeteiras Expresso de 2026: Guia Completo",
          seoDescription: "Guia definitivo com as melhores cafeteiras expresso para comprar neste ano.",
        };
      },
    };

    const bestResult = await BestProductsGenerator.generate({
      workspaceId: wsA.id,
      productIds: [prod1.id, prod2.id, prod3.id],
      categoryName: "Cafeteiras Expresso",
      focusKeyword: "melhores cafeteiras expresso 2026",
      customInstructions: "Destaque as ocasiões de uso para cada modelo.",
      aiProvider: mockAiProvider,
    });

    if (bestResult.article.commercialType !== "BEST_PRODUCTS") {
      throw new Error("FAIL: commercialType gerado não é BEST_PRODUCTS.");
    }

    const bestArticleProds = await prisma.articleProduct.findMany({
      where: { articleId: bestResult.article.id },
      orderBy: { position: "asc" },
    });

    if (bestArticleProds.length !== 3) {
      throw new Error("FAIL: BestProducts não vinculou todos os 3 produtos.");
    }
    console.log(`✓ Check 2 PASS: Artigo de Melhores Produtos "${bestResult.article.title}" gerado.`);

    // 3. Geração do Artigo de Buying Guide
    console.log("\n--- Check 3: Geração de Guia de Compra (Buying Guide) ---");
    const guideResult = await BuyingGuideGenerator.generate({
      workspaceId: wsA.id,
      productIds: [prod1.id, prod2.id, prod3.id],
      categoryName: "Cafeteiras Expresso",
      focusKeyword: "como escolher cafeteira expresso",
      customInstructions: "Explique a diferença entre pressão em bar e temperatura ideal de extração.",
      aiProvider: mockAiProvider,
    });

    if (guideResult.article.commercialType !== "BUYING_GUIDE") {
      throw new Error("FAIL: commercialType gerado não é BUYING_GUIDE.");
    }

    const guideBlocks = guideResult.canonicalDocument.blocks;
    const hasGuideDisclosure = guideBlocks.some((b) => b.type === "AFFILIATE_DISCLOSURE");
    const hasGuideCards = guideBlocks.filter((b) => b.type === "PRODUCT_CARD").length === 3;

    if (!hasGuideDisclosure || !hasGuideCards) {
      throw new Error("FAIL: Blocos canônicos do Guia de Compra incompletos.");
    }
    console.log(`✓ Check 3 PASS: Guia de Compra "${guideResult.article.title}" gerado.`);

    // 4. Isolamento Multi-Tenant
    console.log("\n--- Check 4: Isolamento Multi-Tenant ---");
    let crossTenantBlocked = false;
    try {
      await BestProductsGenerator.generate({
        workspaceId: wsB.id,
        productIds: [prod1.id, prod2.id],
      });
    } catch {
      crossTenantBlocked = true;
    }

    if (!crossTenantBlocked) {
      throw new Error("FAIL: Tenant B conseguiu gerar lista com produtos do Tenant A!");
    }
    console.log("✓ Check 4 PASS: Isolamento estrito entre múltiplos tenants validado.");

    // Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.articleProduct.deleteMany({
      where: { article: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } } },
    });
    await prisma.article.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.productOffer.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.product.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.productCategory.deleteMany({
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
    console.log("✓ Cleanup concluído com sucesso.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 126 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 126:", error);
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
