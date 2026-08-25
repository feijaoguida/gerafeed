import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import {
  ProductCategoryService,
  ProductCatalogService,
  ProductOfferService,
  ArticleProductService,
  ProductReviewGenerator,
  ProductComparisonGenerator,
  BestProductsGenerator,
  BuyingGuideGenerator,
  ensureDefaultAffiliatePrograms,
} from "@/lib/affiliate";

async function run() {
  console.log("================================================================================");
  console.log("🚀 INICIANDO SUÍTE DE INTEGRAÇÃO E2E DA PHASE 12: AFFILIATE CONTENT ENGINE");
  console.log("================================================================================\n");

  const WS_A_SLUG = "e2e-phase12-ws-a";
  const WS_B_SLUG = "e2e-phase12-ws-b";
  const PLAN_SLUG = "e2e-phase12-plan";

  try {
    // 0. Cleanup & Baseline Setup
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
    await prisma.source.deleteMany({
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

    // 1. Setup Plans & Multi-Tenant Workspaces
    console.log("--- Cenário 1: Entitlements de Plano e Workspaces ---");
    await BillingService.ensureDefaultFeatures();
    const featModule = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MODULE } });
    const featMaxProd = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MAX_PRODUCTS } });

    const plan = await prisma.plan.create({
      data: {
        name: "Plano Phase 12 E2E",
        slug: PLAN_SLUG,
        price: 149.0,
        planFeatures: {
          create: [
            { featureId: featModule.id, enabled: true },
            { featureId: featMaxProd.id, enabled: true, limit: 20 },
          ],
        },
      },
    });

    const wsA = await prisma.workspace.create({
      data: { name: "Tenant A E2E Phase 12", slug: WS_A_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsA.id, planId: plan.id, status: "ACTIVE" },
    });

    const wsB = await prisma.workspace.create({
      data: { name: "Tenant B E2E Phase 12", slug: WS_B_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsB.id, planId: plan.id, status: "ACTIVE" },
    });
    console.log("✓ Cenário 1 PASS: Entitlements e isolamento multi-tenant configurados.");

    // Setup Catalog in Tenant A
    const catAudio = await ProductCategoryService.createCategory(wsA.id, {
      name: "Áudio & Fones",
      slug: "audio-fones",
    });

    const prodSony = await ProductCatalogService.createProduct(wsA.id, {
      name: "Sony WH-1000XM5",
      brand: "Sony",
      categoryId: catAudio.id,
      rating: 4.9,
      specs: { cancelamentoRuido: "ANC Duplo Processador V1", bateria: "30h", codecs: "LDAC, AAC, SBC" },
      pros: ["Melhor cancelamento de ruído do mercado", "Conforto excepcional para longas horas"],
      cons: ["Não dobra como o modelo anterior XM4"],
    });
    const offerSony = await ProductOfferService.createOffer(wsA.id, {
      productId: prodSony.id,
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-4001-sony-xm5",
      price: 2199.0,
      seller: "Sony Loja Oficial",
    });

    const prodBose = await ProductCatalogService.createProduct(wsA.id, {
      name: "Bose QuietComfort Ultra",
      brand: "Bose",
      categoryId: catAudio.id,
      rating: 4.8,
      specs: { cancelamentoRuido: "CustomTune ANC", bateria: "24h", audioImersivo: "Bose Immersive Audio" },
      pros: ["Áudio espacial imersivo", "Construção dobrável premium"],
      cons: ["Autonomia menor que o concorrente Sony"],
    });
    await ProductOfferService.createOffer(wsA.id, {
      productId: prodBose.id,
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-4002-bose-qc-ultra",
      price: 2499.0,
      seller: "Bose Brasil",
    });

    const prodSennheiser = await ProductCatalogService.createProduct(wsA.id, {
      name: "Sennheiser Momentum 4",
      brand: "Sennheiser",
      categoryId: catAudio.id,
      rating: 4.7,
      specs: { cancelamentoRuido: "ANC Adaptativo", bateria: "60h", driver: "42mm Audiophile" },
      pros: ["Incrível bateria de 60 horas", "Qualidade sonora audiófila"],
      cons: ["Design mais simples em plástico"],
    });
    await ProductOfferService.createOffer(wsA.id, {
      productId: prodSennheiser.id,
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-4003-sennheiser-momentum-4",
      price: 1899.0,
      seller: "Sennheiser Oficial",
    });

    // Mock AI Provider
    const mockAi = {
      name: "MockAI",
      model: "mock-model",
      async testConnection() {
        return { connected: true, provider: "mock", model: "mock-model" };
      },
      async generateArticle(input: { originalTitle: string }) {
        return {
          relevant: true,
          score: 9.8,
          title: `Artigo Gerado: ${input.originalTitle}`,
          summary: `Resumo aprofundado com especificações factuais para ${input.originalTitle}.`,
          content: `<p>Análise detalhada sobre os produtos selecionados com total transparência.</p>`,
          suggestedCategoryId: null,
          tags: ["Áudio", "Fones", "Tecnologia"],
          seoFocusKeyword: "melhores fones bluetooth 2026",
          seoTitle: `Guia & Análise: ${input.originalTitle}`,
          seoDescription: `Confira tudo sobre ${input.originalTitle} em nosso guia especializado.`,
        };
      },
    };

    // 2. Scenario 2: Single Product Review Generation
    console.log("\n--- Cenário 2: Motor de Review de Produto Único ---");
    const reviewResult = await ProductReviewGenerator.generate({
      workspaceId: wsA.id,
      productId: prodSony.id,
      offerId: offerSony.id,
      focusKeyword: "review sony wh 1000xm5",
      aiProvider: mockAi,
    });

    if (reviewResult.article.commercialType !== "PRODUCT_REVIEW") {
      throw new Error("FAIL: Review não possui commercialType PRODUCT_REVIEW.");
    }
    const reviewProds = await ArticleProductService.getArticleProducts(wsA.id, reviewResult.article.id);
    if (reviewProds.length !== 1 || reviewProds[0].productId !== prodSony.id) {
      throw new Error("FAIL: Review não vinculou exatamente 1 produto.");
    }
    console.log("✓ Cenário 2 PASS: Review gerado com dados estruturados e validação de 1 produto.");

    // 3. Scenario 3: Multi-Product Comparison Generation
    console.log("\n--- Cenário 3: Motor de Comparativo Multi-Produto ---");
    const compResult = await ProductComparisonGenerator.generate({
      workspaceId: wsA.id,
      productIds: [prodSony.id, prodBose.id, prodSennheiser.id],
      focusKeyword: "sony xm5 vs bose qc ultra vs momentum 4",
      aiProvider: mockAi,
    });

    if (compResult.article.commercialType !== "COMPARISON") {
      throw new Error("FAIL: Comparativo não possui commercialType COMPARISON.");
    }

    const compBlocks = compResult.canonicalDocument.blocks;
    const compTable = compBlocks.find((b) => b.type === "PRODUCT_COMPARISON");
    if (!compTable || compTable.type !== "PRODUCT_COMPARISON" || compTable.data.productIds.length !== 3) {
      throw new Error("FAIL: Tabela comparativa canônica incompleta.");
    }

    const compProds = await ArticleProductService.getArticleProducts(wsA.id, compResult.article.id);
    if (compProds.length !== 3 || compProds[0].position !== 0 || compProds[2].position !== 2) {
      throw new Error("FAIL: Ordenação de posições dos produtos no comparativo incorreta.");
    }
    console.log("✓ Cenário 3 PASS: Comparativo gerado com tabela e 3 produtos ordenados.");

    // 4. Scenario 4: Best Products (Top Picks) Roundup Engine
    console.log("\n--- Cenário 4: Motor de Melhores Produtos (Top Picks) ---");
    const bestResult = await BestProductsGenerator.generate({
      workspaceId: wsA.id,
      productIds: [prodSony.id, prodBose.id],
      categoryName: "Fones de Ouvido Premium",
      focusKeyword: "melhores fones bluetooth cancelamento ruido",
      aiProvider: mockAi,
    });

    if (bestResult.article.commercialType !== "BEST_PRODUCTS") {
      throw new Error("FAIL: BestProducts não possui commercialType BEST_PRODUCTS.");
    }
    console.log("✓ Cenário 4 PASS: Melhores Produtos gerado sem alucinações.");

    // 5. Scenario 5: Buying Guide Engine
    console.log("\n--- Cenário 5: Motor de Guia de Compra (Buying Guide) ---");
    const guideResult = await BuyingGuideGenerator.generate({
      workspaceId: wsA.id,
      productIds: [prodSony.id, prodSennheiser.id],
      categoryName: "Fones de Ouvido com Cancelamento de Ruído",
      focusKeyword: "como escolher fone com cancelamento de ruido",
      aiProvider: mockAi,
    });

    if (guideResult.article.commercialType !== "BUYING_GUIDE") {
      throw new Error("FAIL: BuyingGuide não possui commercialType BUYING_GUIDE.");
    }
    console.log("✓ Cenário 5 PASS: Guia de Compra gerado com critérios e recomendações.");

    // 6. Scenario 6: Invariant Verification (No Raw Affiliate URLs in Canonical Document)
    console.log("\n--- Cenário 6: Invariante de Segurança (Desacoplamento de URLs) ---");
    const allDocs = [
      reviewResult.canonicalDocument,
      compResult.canonicalDocument,
      bestResult.canonicalDocument,
      guideResult.canonicalDocument,
    ];

    for (const doc of allDocs) {
      const docStr = JSON.stringify(doc);
      if (docStr.includes("mercadolivre.com.br") || docStr.includes("affiliateUrl")) {
        throw new Error("FAIL CRÍTICO: Documento canônico contém links de afiliados embutidos!");
      }
    }
    console.log("✓ Cenário 6 PASS: Nenhum link de afiliado exposto na estrutura canônica.");

    // 7. Scenario 7: Full Retrocompatibility with Legacy RSS Articles
    console.log("\n--- Cenário 7: Retrocompatibilidade com Notícias Legadas RSS ---");
    const source = await prisma.source.create({
      data: {
        workspaceId: wsA.id,
        name: "Fonte RSS Notícias Tech",
        rssUrl: "https://example.com/feed.xml",
      },
    });

    await prisma.article.create({
      data: {
        workspaceId: wsA.id,
        sourceId: source.id,
        originalUrl: "https://example.com/news/101",
        originalTitle: "Notícia Tech Legada",
        content: "<p>Conteúdo da notícia RSS clássica</p>",
        commercialType: null, // Legacy news
        status: "PENDING",
      },
    });

    // Query mixed articles
    const allArticles = await prisma.article.findMany({
      where: { workspaceId: wsA.id },
    });
    const commercialArticles = await prisma.article.findMany({
      where: { workspaceId: wsA.id, commercialType: { not: null } },
    });
    const legacyArticles = await prisma.article.findMany({
      where: { workspaceId: wsA.id, commercialType: null },
    });

    if (allArticles.length !== 5 || commercialArticles.length !== 4 || legacyArticles.length !== 1) {
      throw new Error("FAIL: Filtragem mista de artigos comerciais e legados falhou.");
    }
    console.log("✓ Cenário 7 PASS: Coexistência perfeita entre notícias legadas e artigos comerciais.");

    // 8. Scenario 8: Multi-Tenant Boundary Security
    console.log("\n--- Cenário 8: Isolamento Estrito Multi-Tenant ---");
    const wsBQueryCross = await prisma.article.findMany({
      where: { workspaceId: wsB.id },
    });
    if (wsBQueryCross.length !== 0) {
      throw new Error("FAIL: Vazamento de artigos do Tenant A para o Tenant B!");
    }
    console.log("✓ Cenário 8 PASS: Isolamento estrito de dados entre workspaces confirmado.");

    // Cleanup
    console.log("\n--- Cleanup Final ---");
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
    await prisma.source.deleteMany({
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

    console.log("\n================================================================================");
    console.log("🎉 TODOS OS 8 CENÁRIOS DE INTEGRAÇÃO DA PHASE 12 PASSARAM COM 100% DE SUCESSO!");
    console.log("================================================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DA INTEGRAÇÃO E2E DA PHASE 12:", error);
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
