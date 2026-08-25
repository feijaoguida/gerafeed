import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import {
  ProductCatalogService,
  ProductOfferService,
  ArticleProductService,
  ensureDefaultAffiliatePrograms,
} from "@/lib/affiliate";

async function run() {
  console.log("=== TEST: Task 122 - Article Product Relations & Constraints ===");

  const WS_A_SLUG = "test-ws-art-prod-a";
  const WS_B_SLUG = "test-ws-art-prod-b";
  const PLAN_SLUG = "test-plan-art-prod";

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

    // 1. Setup Workspaces and Plan
    console.log("\n--- Check 1: Setup de Workspaces e Produtos ---");
    await BillingService.ensureDefaultFeatures();
    const featModule = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MODULE } });
    const featMaxProd = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MAX_PRODUCTS } });

    const plan = await prisma.plan.create({
      data: {
        name: "Plano Artigos Produtos",
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
      data: { name: "Tenant A Artigo-Produto", slug: WS_A_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsA.id, planId: plan.id, status: "ACTIVE" },
    });

    const wsB = await prisma.workspace.create({
      data: { name: "Tenant B Artigo-Produto", slug: WS_B_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsB.id, planId: plan.id, status: "ACTIVE" },
    });

    const prod1 = await ProductCatalogService.createProduct(wsA.id, {
      name: "Mouse Gamer Sem Fio A",
      brand: "LogiTech",
    });
    const offer1 = await ProductOfferService.createOffer(wsA.id, {
      productId: prod1.id,
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-1111-mouse-a",
      price: 299.0,
    });

    const prod2 = await ProductCatalogService.createProduct(wsA.id, {
      name: "Mouse Gamer Sem Fio B",
      brand: "Razer",
    });
    const offer2 = await ProductOfferService.createOffer(wsA.id, {
      productId: prod2.id,
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-2222-mouse-b",
      price: 349.0,
    });

    const prodB = await ProductCatalogService.createProduct(wsB.id, {
      name: "Mouse do Tenant B",
      brand: "Outro",
    });
    console.log("✓ Check 1 PASS: Workspaces e produtos criados.");

    // 2. Validação da Regra de Review (Exatamente 1 produto)
    console.log("\n--- Check 2: Validação de Cardinalidade para Review (Exatamente 1) ---");
    const reviewArticle = await prisma.article.create({
      data: {
        workspaceId: wsA.id,
        title: "Review do Mouse Gamer A",
        commercialType: "PRODUCT_REVIEW",
      },
    });

    let reviewMultipleBlocked = false;
    try {
      await ArticleProductService.attachProducts(wsA.id, reviewArticle.id, [
        { productId: prod1.id },
        { productId: prod2.id },
      ]);
    } catch (e: unknown) {
      reviewMultipleBlocked = true;
      if (e instanceof Error) {
        console.log(`  Mensagem esperada de bloqueio: "${e.message}"`);
      }
    }

    if (!reviewMultipleBlocked) {
      throw new Error("FAIL: Review permitiu vincular mais de 1 produto!");
    }

    // Vinculação correta de 1 produto
    const attachedReview = await ArticleProductService.attachProducts(wsA.id, reviewArticle.id, [
      { productId: prod1.id, offerId: offer1.id, badge: "Escolha do Editor", score: 9.5 },
    ]);

    if (attachedReview.length !== 1 || attachedReview[0].productId !== prod1.id) {
      throw new Error("FAIL: Falha ao vincular produto único no review.");
    }
    console.log("✓ Check 2 PASS: Cardinalidade restrita de Review validada.");

    // 3. Validação da Regra de Comparativo (Mínimo 2 produtos)
    console.log("\n--- Check 3: Validação de Cardinalidade para Comparativo (>= 2) ---");
    const compArticle = await prisma.article.create({
      data: {
        workspaceId: wsA.id,
        title: "Mouse A vs Mouse B: Qual Comprar?",
        commercialType: "COMPARISON",
      },
    });

    let compSingleBlocked = false;
    try {
      await ArticleProductService.attachProducts(wsA.id, compArticle.id, [
        { productId: prod1.id },
      ]);
    } catch (e: unknown) {
      compSingleBlocked = true;
      if (e instanceof Error) {
        console.log(`  Mensagem esperada de bloqueio: "${e.message}"`);
      }
    }

    if (!compSingleBlocked) {
      throw new Error("FAIL: Comparativo permitiu vincular apenas 1 produto!");
    }

    // Vinculação correta de 2 produtos
    const attachedComp = await ArticleProductService.attachProducts(wsA.id, compArticle.id, [
      { productId: prod1.id, offerId: offer1.id, position: 0, badge: "Melhor Custo-Benefício", score: 9.0 },
      { productId: prod2.id, offerId: offer2.id, position: 1, badge: "Mais Rápido", score: 9.2 },
    ]);

    if (attachedComp.length !== 2) {
      throw new Error("FAIL: Falha ao vincular 2 produtos no comparativo.");
    }
    console.log("✓ Check 3 PASS: Cardinalidade de Comparativo validada.");

    // 4. Ordenação por Posição e Consulta de Produtos
    console.log("\n--- Check 4: Ordenação por Position e Consulta de Produtos ---");
    const list = await ArticleProductService.getArticleProducts(wsA.id, compArticle.id);
    if (list[0].position !== 0 || list[1].position !== 1 || list[0].badge !== "Melhor Custo-Benefício") {
      throw new Error("FAIL: Ordenação ou metadados de badge/score divergentes.");
    }
    console.log("✓ Check 4 PASS: Ordenação por posição e metadados confirmados.");

    // 5. Isolamento Multi-Tenant Estrito
    console.log("\n--- Check 5: Bloqueio de Produto de Outro Workspace (Tenancy) ---");
    let crossTenantBlocked = false;
    try {
      await ArticleProductService.attachProducts(wsA.id, compArticle.id, [
        { productId: prod1.id },
        { productId: prodB.id }, // Produto pertence ao Tenant B
      ]);
    } catch (e: unknown) {
      crossTenantBlocked = true;
      if (e instanceof Error) {
        console.log(`  Mensagem esperada de tenancy: "${e.message}"`);
      }
    }

    if (!crossTenantBlocked) {
      throw new Error("FAIL: Artigo permitiu vincular produto de outro tenant!");
    }
    console.log("✓ Check 5 PASS: Isolamento estrito entre tenants verificado com sucesso.");

    // 6. Remoção Segura e Cascata de Deleção
    console.log("\n--- Check 6: Remoção Segura e Exclusão em Cascata ---");
    let detachBlocked = false;
    try {
      await ArticleProductService.detachProduct(wsA.id, compArticle.id, prod2.id);
    } catch (e: unknown) {
      detachBlocked = true;
      if (e instanceof Error) {
        console.log(`  Mensagem esperada de remoção bloqueada: "${e.message}"`);
      }
    }

    if (!detachBlocked) {
      throw new Error("FAIL: Remoção de produto violou a cardinalidade mínima do comparativo!");
    }

    // Deleção do artigo em cascata
    await prisma.article.delete({ where: { id: compArticle.id } });
    const remainingRelations = await prisma.articleProduct.count({
      where: { articleId: compArticle.id },
    });
    if (remainingRelations !== 0) {
      throw new Error("FAIL: Relações ArticleProduct não foram excluídas em cascata com o artigo!");
    }

    // Produtos originais devem continuar existindo intactos
    const prod1StillExists = await prisma.product.findUnique({ where: { id: prod1.id } });
    if (!prod1StillExists) {
      throw new Error("FAIL: Deleção do artigo excluiu indevidamente o produto do catálogo!");
    }
    console.log("✓ Check 6 PASS: Remoção segura e integridade de exclusão em cascata confirmadas.");

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
    console.log("TODOS OS TESTES DA TASK 122 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 122:", error);
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
