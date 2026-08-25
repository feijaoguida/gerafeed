import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import {
  ProductCatalogService,
  ProductCategoryService,
  ProductOfferService,
  ProductReviewGenerator,
  CanonicalDocumentService,
  ensureDefaultAffiliatePrograms,
} from "@/lib/affiliate";

async function run() {
  console.log("=== TEST: Task 124 - Product Review Generator & Canonical Document ===");

  const WS_A_SLUG = "test-ws-gen-review-a";
  const WS_B_SLUG = "test-ws-gen-review-b";
  const PLAN_SLUG = "test-plan-gen-review";

  try {
    // 0. Setup & Cleanup
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

    // 1. Setup Plans, Workspaces & Product
    console.log("\n--- Check 1: Setup de Workspace, Categoria e Produto Factual ---");
    await BillingService.ensureDefaultFeatures();
    const featModule = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MODULE } });
    const featMaxProd = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MAX_PRODUCTS } });

    const plan = await prisma.plan.create({
      data: {
        name: "Plano Review Generator",
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
      data: { name: "Tenant A Review Gen", slug: WS_A_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsA.id, planId: plan.id, status: "ACTIVE" },
    });

    const wsB = await prisma.workspace.create({
      data: { name: "Tenant B Review Gen", slug: WS_B_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsB.id, planId: plan.id, status: "ACTIVE" },
    });

    const category = await ProductCategoryService.createCategory(wsA.id, {
      name: "Periféricos Gamer",
    });

    const product = await ProductCatalogService.createProduct(wsA.id, {
      name: "Teclado Mecânico RGB Pro",
      brand: "KeyTech",
      description: "Teclado mecânico compacto 75% com switches hot-swap e iluminação RGB.",
      categoryId: category.id,
      rating: 4.9,
      specs: {
        switches: "Gateron Red Pro",
        layout: "75% ANSI",
        conectividade: "Tri-mode (Cabo, 2.4Ghz, Bluetooth 5.0)",
        keycaps: "PBT Double-Shot",
      },
      pros: ["Digitação macia e silenciosa", "Bateria dura mais de 80 horas", "Construção em alumínio"],
      cons: ["Software de configuração apenas em inglês"],
    });

    const offer = await ProductOfferService.createOffer(wsA.id, {
      productId: product.id,
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-334455-teclado-mecanico-pro",
      seller: "KeyTech Oficial",
      price: 489.90,
      oldPrice: 599.90,
    });
    console.log("✓ Check 1 PASS: Dados factuais do produto e oferta configurados.");

    // 2. Geração Completa do Review com IA e Documento Canônico
    console.log("\n--- Check 2: Geração Completa de Review com IA e Documento Canônico ---");
    const mockAiProvider = {
      name: "MockAI",
      model: "mock-model",
      async testConnection() {
        return { connected: true, provider: "mock", model: "mock-model" };
      },
      async generateArticle() {
        return {
          relevant: true,
          score: 9.8,
          title: "Review Teclado Mecânico RGB Pro: O Melhor 75%?",
          summary: "Análise completa do Teclado Mecânico RGB Pro com switches hot-swap e bateria de longa duração.",
          content: "<p>O <strong>Teclado Mecânico RGB Pro</strong> impressiona pelo acabamento robusto em alumínio e digitação suave com switches Gateron Red Pro.</p>",
          suggestedCategoryId: null,
          tags: ["Teclado Mecânico", "Gamer", "Periféricos", "KeyTech"],
          seoFocusKeyword: "melhor teclado mecanico 75%",
          seoTitle: "Review Teclado Mecânico RGB Pro - Vale a Pena?",
          seoDescription: "Confira nossa análise detalhada do teclado 75% KeyTech RGB Pro com switches hot-swap.",
        };
      },
    };

    const result = await ProductReviewGenerator.generate({
      workspaceId: wsA.id,
      productId: product.id,
      offerId: offer.id,
      focusKeyword: "melhor teclado mecanico 75%",
      customInstructions: "Enfatize a durabilidade dos switches hot-swap.",
      aiProvider: mockAiProvider,
    });

    if (!result.article.id || result.article.commercialType !== "PRODUCT_REVIEW") {
      throw new Error("FAIL: Artigo de review não foi criado com tipo PRODUCT_REVIEW.");
    }
    console.log(`✓ Check 2 PASS: Review "${result.article.title}" gerado com sucesso.`);

    // 3. Validação dos Blocos Canônicos e Metadados de SEO
    console.log("\n--- Check 3: Validação dos Blocos Estruturados Canônicos ---");
    const blocks = result.canonicalDocument.blocks;
    const hasDisclosure = blocks.some((b) => b.type === "AFFILIATE_DISCLOSURE");
    const hasProductCard = blocks.some((b) => b.type === "PRODUCT_CARD" && b.data.productId === product.id);
    const hasProsCons = blocks.some((b) => b.type === "PROS_CONS" && b.data.pros.length > 0);
    const hasCta = blocks.some((b) => b.type === "CTA");

    if (!hasDisclosure || !hasProductCard || !hasProsCons || !hasCta) {
      throw new Error("FAIL: Estrutura do documento canônico incompleta.");
    }

    const referencedIds = CanonicalDocumentService.extractReferencedProductIds(result.canonicalDocument);
    if (!referencedIds.includes(product.id)) {
      throw new Error("FAIL: Produto não foi referenciado nos blocos canônicos.");
    }
    console.log("✓ Check 3 PASS: Blocos canônicos e extração de IDs validados.");

    // 4. Validação da Relação ArticleProduct no Banco
    console.log("\n--- Check 4: Relação ArticleProduct e Ordenação ---");
    const articleProducts = await prisma.articleProduct.findMany({
      where: { articleId: result.article.id },
    });

    if (articleProducts.length !== 1 || articleProducts[0].productId !== product.id) {
      throw new Error("FAIL: Relação ArticleProduct de Review não foi persistida corretamente.");
    }
    console.log("✓ Check 4 PASS: Relação ArticleProduct validada com sucesso.");

    // 5. Isolamento Multi-Tenant na Geração
    console.log("\n--- Check 5: Isolamento Multi-Tenant na Geração ---");
    let crossTenantBlocked = false;
    try {
      await ProductReviewGenerator.generate({
        workspaceId: wsB.id,
        productId: product.id, // Produto do Tenant A
      });
    } catch {
      crossTenantBlocked = true;
    }

    if (!crossTenantBlocked) {
      throw new Error("FAIL: Tenant B conseguiu gerar review para produto do Tenant A!");
    }
    console.log("✓ Check 5 PASS: Isolamento estrito entre múltiplos tenants confirmado.");

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
    console.log("TODOS OS TESTES DA TASK 124 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 124:", error);
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
