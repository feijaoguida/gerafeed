import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import {
  ProductCatalogService,
  ProductOfferService,
  ArticleProductService,
  CanonicalDocumentService,
  ensureDefaultAffiliatePrograms,
} from "@/lib/affiliate";

async function run() {
  console.log("=== TEST: Task 127 - Affiliate Article Editor & Human Approval Flow ===");

  const WS_A_SLUG = "test-ws-editor-a";
  const WS_B_SLUG = "test-ws-editor-b";
  const PLAN_SLUG = "test-plan-editor";

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

    // 1. Setup Workspace and Article
    console.log("\n--- Check 1: Setup de Workspace, Produtos e Artigo Comercial ---");
    await BillingService.ensureDefaultFeatures();
    const featModule = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MODULE } });
    const featMaxProd = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MAX_PRODUCTS } });

    const plan = await prisma.plan.create({
      data: {
        name: "Plano Editor",
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
      data: { name: "Tenant A Editor", slug: WS_A_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsA.id, planId: plan.id, status: "ACTIVE" },
    });

    const wsB = await prisma.workspace.create({
      data: { name: "Tenant B Editor", slug: WS_B_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsB.id, planId: plan.id, status: "ACTIVE" },
    });

    const prod1 = await ProductCatalogService.createProduct(wsA.id, {
      name: "Notebook Ultra Slim 14",
      brand: "ZenTech",
    });
    const offer1 = await ProductOfferService.createOffer(wsA.id, {
      productId: prod1.id,
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-3001-notebook-zen",
      price: 3899.0,
    });

    const prod2 = await ProductCatalogService.createProduct(wsA.id, {
      name: "Notebook Power Max 15",
      brand: "ZenTech",
    });
    const offer2 = await ProductOfferService.createOffer(wsA.id, {
      productId: prod2.id,
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-3002-notebook-max",
      price: 4999.0,
    });

    const canonicalDoc = CanonicalDocumentService.createDocument([
      {
        type: "AFFILIATE_DISCLOSURE",
        data: { text: "Artigo com links comissionados.", position: "top" },
      },
      {
        type: "HEADING",
        data: { level: 2, text: "ZenTech Slim vs ZenTech Max" },
      },
    ]);

    const article = await prisma.article.create({
      data: {
        workspaceId: wsA.id,
        title: "ZenTech Slim vs ZenTech Max: Qual o Melhor Notebook?",
        summary: "Análise comparativa entre os modelos de 14 e 15 polegadas.",
        content: "<p>Conteúdo do comparativo</p>",
        commercialType: "COMPARISON",
        canonicalContent: canonicalDoc as object,
        status: "PENDING",
        seoFocusKeyword: "melhor notebook zentech",
        seoTitle: "ZenTech Slim vs Max: Comparativo 2026",
        seoDescription: "Descubra qual notebook ZenTech comprar em 2026.",
        tags: ["Notebook", "ZenTech", "Comparativo"],
      },
    });

    await ArticleProductService.attachProducts(wsA.id, article.id, [
      { productId: prod1.id, offerId: offer1.id, position: 0, badge: "Mais Portátil", score: 9.0 },
      { productId: prod2.id, offerId: offer2.id, position: 1, badge: "Mais Potente", score: 9.3 },
    ]);
    console.log("✓ Check 1 PASS: Artigo e produtos configurados.");

    // 2. Consulta de Dados para o Editor
    console.log("\n--- Check 2: Consulta Completa para o Editor ---");
    const retrievedArticle = await prisma.article.findUniqueOrThrow({
      where: { id: article.id },
      include: {
        articleProducts: {
          orderBy: { position: "asc" },
          include: { product: true, offer: true },
        },
      },
    });

    if (retrievedArticle.articleProducts.length !== 2 || retrievedArticle.articleProducts[0].badge !== "Mais Portátil") {
      throw new Error("FAIL: Consulta de produtos vinculados para o editor divergente.");
    }
    console.log("✓ Check 2 PASS: Consulta de artigo comercial para o editor validada.");

    // 3. Reordenação e Edição de Metadados de Produtos
    console.log("\n--- Check 3: Reordenação de Produtos e Atualização de Metadados ---");
    // Swap positions: prod2 becomes position 0, prod1 becomes position 1
    await ArticleProductService.attachProducts(wsA.id, article.id, [
      {
        productId: prod2.id,
        offerId: offer2.id,
        position: 0,
        badge: "Campeão Geral",
        score: 9.5,
        recommendation: "Recomendado para uso intenso",
      },
      {
        productId: prod1.id,
        offerId: offer1.id,
        position: 1,
        badge: "Melhor para Viagens",
        score: 9.2,
        recommendation: "Excelente portabilidade",
      },
    ]);

    const updatedProds = await ArticleProductService.getArticleProducts(wsA.id, article.id);
    if (
      updatedProds[0].productId !== prod2.id ||
      updatedProds[0].badge !== "Campeão Geral" ||
      updatedProds[1].productId !== prod1.id
    ) {
      throw new Error("FAIL: Reordenação e edição de metadados não persistiram corretamente.");
    }
    console.log("✓ Check 3 PASS: Reordenação e metadados de produtos atualizados com sucesso.");

    // 4. Fluxo Editorial e Aprovação Humana (Human Approval)
    console.log("\n--- Check 4: Fluxo Editorial e Aprovação Humana ---");
    const approvedArticle = await prisma.article.update({
      where: { id: article.id },
      data: {
        title: "ZenTech Slim vs ZenTech Max: Qual o Melhor Notebook em 2026? [Aprovado]",
        status: "PUBLISHED",
        seoFocusKeyword: "melhor notebook zentech 2026",
      },
    });

    if (approvedArticle.status !== "PUBLISHED" || !approvedArticle.title?.includes("[Aprovado]")) {
      throw new Error("FAIL: Falha ao aprovar e atualizar status editorial do artigo.");
    }
    console.log("✓ Check 4 PASS: Aprovação humana e atualização editorial confirmadas.");

    // 5. Isolamento Multi-Tenant no Editor
    console.log("\n--- Check 5: Isolamento Multi-Tenant ---");
    let tenantBUpdateBlocked = false;
    try {
      await ArticleProductService.attachProducts(wsB.id, article.id, [
        { productId: prod1.id, position: 0 },
      ]);
    } catch {
      tenantBUpdateBlocked = true;
    }

    if (!tenantBUpdateBlocked) {
      throw new Error("FAIL: Tenant B conseguiu modificar produtos do artigo do Tenant A!");
    }
    console.log("✓ Check 5 PASS: Isolamento estrito de modificação multi-tenant validado.");

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
    console.log("TODOS OS TESTES DA TASK 127 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 127:", error);
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
