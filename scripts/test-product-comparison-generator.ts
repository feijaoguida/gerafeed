import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import {
  ProductCatalogService,
  ProductCategoryService,
  ProductOfferService,
  ProductComparisonGenerator,
  CanonicalDocumentService,
  ensureDefaultAffiliatePrograms,
} from "@/lib/affiliate";

async function run() {
  console.log("=== TEST: Task 125 - Product Comparison Generator & Canonical Document ===");

  const WS_A_SLUG = "test-ws-gen-comp-a";
  const WS_B_SLUG = "test-ws-gen-comp-b";
  const PLAN_SLUG = "test-plan-gen-comp";

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

    // 1. Setup Workspace and 3 Products
    console.log("\n--- Check 1: Setup de Workspace e 3 Produtos Comparáveis ---");
    await BillingService.ensureDefaultFeatures();
    const featModule = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MODULE } });
    const featMaxProd = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MAX_PRODUCTS } });

    const plan = await prisma.plan.create({
      data: {
        name: "Plano Comparison Generator",
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
      data: { name: "Tenant A Comp Gen", slug: WS_A_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsA.id, planId: plan.id, status: "ACTIVE" },
    });

    const wsB = await prisma.workspace.create({
      data: { name: "Tenant B Comp Gen", slug: WS_B_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsB.id, planId: plan.id, status: "ACTIVE" },
    });

    const category = await ProductCategoryService.createCategory(wsA.id, {
      name: "Monitores Gamer",
    });

    const prod1 = await ProductCatalogService.createProduct(wsA.id, {
      name: "Monitor Gamer OLED 27 240Hz",
      brand: "UltraView",
      categoryId: category.id,
      rating: 4.9,
      specs: { painel: "QD-OLED", taxa: "240Hz", resolucao: "2560x1440", tempoResposta: "0.03ms" },
      pros: ["Cores e contraste perfeitos", "Tempo de resposta quase instantâneo"],
      cons: ["Preço elevado"],
    });
    await ProductOfferService.createOffer(wsA.id, {
      productId: prod1.id,
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-1001-monitor-oled",
      price: 4499.0,
      seller: "UltraView Loja Oficial",
    });

    const prod2 = await ProductCatalogService.createProduct(wsA.id, {
      name: "Monitor Gamer Fast IPS 27 165Hz",
      brand: "GamerPro",
      categoryId: category.id,
      rating: 4.6,
      specs: { painel: "Fast IPS", taxa: "165Hz", resolucao: "2560x1440", tempoResposta: "1ms" },
      pros: ["Excelente equilíbrio de preço e cores", "Suporte ergonômico completo"],
      cons: ["Níveis de preto médios"],
    });
    await ProductOfferService.createOffer(wsA.id, {
      productId: prod2.id,
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-1002-monitor-ips",
      price: 1799.0,
      seller: "GamerPro Oficial",
    });

    const prod3 = await ProductCatalogService.createProduct(wsA.id, {
      name: "Monitor Gamer Curvo VA 27 144Hz",
      brand: "BudgetGamer",
      categoryId: category.id,
      rating: 4.2,
      specs: { painel: "VA Curvo 1500R", taxa: "144Hz", resolucao: "1920x1080", tempoResposta: "4ms" },
      pros: ["Preço muito acessível", "Bom contraste estático"],
      cons: ["Ghosting visível em cenas rápidas"],
    });
    await ProductOfferService.createOffer(wsA.id, {
      productId: prod3.id,
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-1003-monitor-va",
      price: 1099.0,
      seller: "BudgetTech",
    });
    console.log("✓ Check 1 PASS: 3 produtos com specs e ofertas configurados.");

    // 2. Validação de Cardinalidade Mínima (< 2 produtos)
    console.log("\n--- Check 2: Validação de Cardinalidade Mínima (< 2 produtos) ---");
    let singleBlocked = false;
    try {
      await ProductComparisonGenerator.generate({
        workspaceId: wsA.id,
        productIds: [prod1.id],
      });
    } catch {
      singleBlocked = true;
    }

    if (!singleBlocked) {
      throw new Error("FAIL: Comparativo permitiu gerar com apenas 1 produto!");
    }
    console.log("✓ Check 2 PASS: Tentativa de gerar comparativo com 1 produto foi bloqueada.");

    // 3. Geração Completa do Comparativo com IA
    console.log("\n--- Check 3: Geração de Comparativo com IA e Bloco Canônico ---");
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
          title: "Qual o Melhor Monitor Gamer 27 Polegadas em 2026? Comparativo Completo",
          summary: "Comparamos o OLED 240Hz, Fast IPS 165Hz e VA Curvo 144Hz para descobrir qual vale o investimento.",
          content: "<p>Escolher o monitor gamer certo depende do seu orçamento e dos jogos que você mais joga.</p>",
          suggestedCategoryId: null,
          tags: ["Monitor Gamer", "Comparativo", "OLED", "IPS", "Hardware"],
          seoFocusKeyword: "melhor monitor gamer 27 polegadas",
          seoTitle: "Melhor Monitor Gamer 27 Polegadas: Comparativo 2026",
          seoDescription: "Análise comparativa completa entre os principais monitores gamer de 27 polegadas.",
        };
      },
    };

    const result = await ProductComparisonGenerator.generate({
      workspaceId: wsA.id,
      productIds: [prod1.id, prod2.id, prod3.id],
      focusKeyword: "melhor monitor gamer 27 polegadas",
      customInstructions: "Destaque as diferenças de qualidade de painel (OLED vs IPS vs VA).",
      aiProvider: mockAiProvider,
    });

    if (result.article.commercialType !== "COMPARISON") {
      throw new Error("FAIL: Tipo de artigo gerado não é COMPARISON.");
    }
    console.log(`✓ Check 3 PASS: Artigo comparativo "${result.article.title}" gerado com sucesso.`);

    // 4. Validação dos Blocos Canônicos e Tabela Comparativa
    console.log("\n--- Check 4: Validação de Blocos Canônicos e Tabela Comparativa ---");
    const blocks = result.canonicalDocument.blocks;
    const compBlock = blocks.find((b) => b.type === "PRODUCT_COMPARISON");

    if (!compBlock || compBlock.type !== "PRODUCT_COMPARISON") {
      throw new Error("FAIL: Bloco PRODUCT_COMPARISON ausente no documento canônico.");
    }

    if (compBlock.data.productIds.length !== 3) {
      throw new Error("FAIL: Bloco de comparação não contém todos os 3 produtos.");
    }

    const referencedIds = CanonicalDocumentService.extractReferencedProductIds(result.canonicalDocument);
    if (referencedIds.length !== 3 || !referencedIds.includes(prod1.id) || !referencedIds.includes(prod2.id) || !referencedIds.includes(prod3.id)) {
      throw new Error("FAIL: Extração de referências do comparativo divergente.");
    }
    console.log("✓ Check 4 PASS: Bloco de comparação e referências de IDs validados.");

    // 5. Validação das Relações ArticleProduct e Posições
    console.log("\n--- Check 5: Relações ArticleProduct com Ordenação (0, 1, 2) ---");
    const articleProducts = await prisma.articleProduct.findMany({
      where: { articleId: result.article.id },
      orderBy: { position: "asc" },
    });

    if (articleProducts.length !== 3) {
      throw new Error("FAIL: Não foram criadas as 3 relações ArticleProduct.");
    }

    if (articleProducts[0].position !== 0 || articleProducts[1].position !== 1 || articleProducts[2].position !== 2) {
      throw new Error("FAIL: Posições dos produtos no comparativo divergentes.");
    }
    console.log("✓ Check 5 PASS: 3 produtos vinculados com posições 0, 1 e 2.");

    // 6. Isolamento Multi-Tenant na Comparação
    console.log("\n--- Check 6: Isolamento Multi-Tenant ---");
    let crossTenantBlocked = false;
    try {
      await ProductComparisonGenerator.generate({
        workspaceId: wsB.id,
        productIds: [prod1.id, prod2.id], // Produtos pertencem ao Tenant A
      });
    } catch {
      crossTenantBlocked = true;
    }

    if (!crossTenantBlocked) {
      throw new Error("FAIL: Tenant B conseguiu gerar comparativo com produtos do Tenant A!");
    }
    console.log("✓ Check 6 PASS: Isolamento estrito multi-tenant validado.");

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
    console.log("TODOS OS TESTES DA TASK 125 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 125:", error);
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
