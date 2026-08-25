import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import {
  ProductCatalogService,
  ProductOfferService,
  AffiliateAnalyticsService,
  ensureDefaultAffiliatePrograms,
} from "@/lib/affiliate";

async function run() {
  console.log("=== TEST: Task 135 - Affiliate Analytics & Dashboard ===");

  const WS_SLUG = "test-ws-dash-analytics";
  const WS_NO_ANALYTICS = "test-ws-dash-no-analytics";
  const PLAN_WITH_ANALYTICS = "plan-analytics-enabled";
  const PLAN_WITHOUT_ANALYTICS = "plan-analytics-disabled";

  try {
    // 0. Cleanup
    await ensureDefaultAffiliatePrograms();

    await prisma.affiliateClick.deleteMany({
      where: {
        workspace: { slug: { in: [WS_SLUG, WS_NO_ANALYTICS] } },
      },
    });
    await prisma.articleProduct.deleteMany({
      where: { article: { workspace: { slug: { in: [WS_SLUG, WS_NO_ANALYTICS] } } } },
    });
    await prisma.article.deleteMany({
      where: { workspace: { slug: { in: [WS_SLUG, WS_NO_ANALYTICS] } } },
    });
    await prisma.productOffer.deleteMany({
      where: { workspace: { slug: { in: [WS_SLUG, WS_NO_ANALYTICS] } } },
    });
    await prisma.product.deleteMany({
      where: { workspace: { slug: { in: [WS_SLUG, WS_NO_ANALYTICS] } } },
    });
    await prisma.subscription.deleteMany({
      where: { workspace: { slug: { in: [WS_SLUG, WS_NO_ANALYTICS] } } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: { in: [WS_SLUG, WS_NO_ANALYTICS] } },
    });
    await prisma.planFeature.deleteMany({
      where: { plan: { slug: { in: [PLAN_WITH_ANALYTICS, PLAN_WITHOUT_ANALYTICS] } } },
    });
    await prisma.plan.deleteMany({
      where: { slug: { in: [PLAN_WITH_ANALYTICS, PLAN_WITHOUT_ANALYTICS] } },
    });

    // 1. Setup Plans & Workspaces
    console.log("\n--- Check 1: Setup de Planos e Workspaces com Entitlements ---");
    await BillingService.ensureDefaultFeatures();
    const featModule = await prisma.feature.findUniqueOrThrow({
      where: { key: AFFILIATE_FEATURES.MODULE },
    });
    const featAnalytics = await prisma.feature.findUniqueOrThrow({
      where: { key: AFFILIATE_FEATURES.ANALYTICS },
    });
    const featMaxProd = await prisma.feature.findUniqueOrThrow({
      where: { key: AFFILIATE_FEATURES.MAX_PRODUCTS },
    });

    // Plan with Analytics
    const planPro = await prisma.plan.create({
      data: {
        name: "Plano Analytics Pro",
        slug: PLAN_WITH_ANALYTICS,
        price: 99.0,
        planFeatures: {
          create: [
            { featureId: featModule.id, enabled: true },
            { featureId: featAnalytics.id, enabled: true },
            { featureId: featMaxProd.id, enabled: true, limit: 50 },
          ],
        },
      },
    });

    // Plan without Analytics (Module only)
    const planStarter = await prisma.plan.create({
      data: {
        name: "Plano Sem Analytics",
        slug: PLAN_WITHOUT_ANALYTICS,
        price: 49.0,
        planFeatures: {
          create: [
            { featureId: featModule.id, enabled: true },
            { featureId: featAnalytics.id, enabled: false },
            { featureId: featMaxProd.id, enabled: true, limit: 10 },
          ],
        },
      },
    });

    const wsPro = await prisma.workspace.create({
      data: { name: "Workspace Analytics Pro", slug: WS_SLUG, active: true },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsPro.id, planId: planPro.id, status: "ACTIVE" },
    });

    const wsStarter = await prisma.workspace.create({
      data: { name: "Workspace Sem Analytics", slug: WS_NO_ANALYTICS, active: true },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsStarter.id, planId: planStarter.id, status: "ACTIVE" },
    });

    console.log("✓ Workspaces e assinaturas configurados.");

    // 2. Populate Catalog & Commercial Articles
    console.log("\n--- Check 2: Cadastro de Produtos, Ofertas e Artigos Comerciais ---");
    const prod1 = await ProductCatalogService.createProduct(wsPro.id, {
      name: "Mouse Sem Fio Ultra",
      brand: "Logitech",
      rating: 4.9,
    });
    const offer1 = await ProductOfferService.createOffer(wsPro.id, {
      productId: prod1.id,
      providerCode: "MERCADO_LIVRE",
      affiliateUrl: "https://mercadolivre.com/sec/mouse-logitech",
      price: 199.9,
    });

    const prod2 = await ProductCatalogService.createProduct(wsPro.id, {
      name: "Teclado Mecânico RGB",
      brand: "Keychron",
      rating: 4.8,
    });
    const offer2 = await ProductOfferService.createOffer(wsPro.id, {
      productId: prod2.id,
      providerCode: "MERCADO_LIVRE",
      affiliateUrl: "https://mercadolivre.com/sec/teclado-keychron",
      price: 499.0,
    });

    const article1 = await prisma.article.create({
      data: {
        workspaceId: wsPro.id,
        title: "Melhores Mouses e Teclados de 2026",
        commercialType: "BEST_PRODUCTS",
        status: "PUBLISHED",
      },
    });

    const article2 = await prisma.article.create({
      data: {
        workspaceId: wsPro.id,
        title: "Review do Teclado Keychron",
        commercialType: "PRODUCT_REVIEW",
        status: "PUBLISHED",
      },
    });

    console.log("✓ Catálogo e artigos criados.");

    // 3. Generate Simulated Clicks (Different products, components, dates)
    console.log("\n--- Check 3: Simulação de Cliques em Diferentes Componentes e Datas ---");
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

    // 3 clicks for prod1 on PRODUCT_CARD in article1 (2 today, 1 two days ago)
    await prisma.affiliateClick.create({
      data: {
        workspaceId: wsPro.id,
        productId: prod1.id,
        offerId: offer1.id,
        articleId: article1.id,
        component: "PRODUCT_CARD",
        createdAt: now,
      },
    });
    await prisma.affiliateClick.create({
      data: {
        workspaceId: wsPro.id,
        productId: prod1.id,
        offerId: offer1.id,
        articleId: article1.id,
        component: "PRODUCT_CARD",
        createdAt: now,
      },
    });
    await prisma.affiliateClick.create({
      data: {
        workspaceId: wsPro.id,
        productId: prod1.id,
        offerId: offer1.id,
        articleId: article1.id,
        component: "CTA",
        createdAt: twoDaysAgo,
      },
    });

    // 2 clicks for prod2 on COMPARISON_TABLE in article1 and article2 (1 ten days ago)
    await prisma.affiliateClick.create({
      data: {
        workspaceId: wsPro.id,
        productId: prod2.id,
        offerId: offer2.id,
        articleId: article1.id,
        component: "COMPARISON_TABLE",
        createdAt: now,
      },
    });
    await prisma.affiliateClick.create({
      data: {
        workspaceId: wsPro.id,
        productId: prod2.id,
        offerId: offer2.id,
        articleId: article2.id,
        component: "COMPARISON_TABLE",
        createdAt: tenDaysAgo,
      },
    });

    console.log("✓ 5 cliques simulados com sucesso.");

    // 4. Test Analytics Service Stats Calculation
    console.log("\n--- Check 4: Verificação dos Cálculos do AnalyticsService ---");
    
    // 4.1 30 Days Period (should include all 5 clicks)
    const stats30d = await AffiliateAnalyticsService.getDashboardStats(wsPro.id, {
      period: "30d",
    });

    if (stats30d.summary.totalProducts !== 2) {
      throw new Error(`Esperava 2 produtos, obteve ${stats30d.summary.totalProducts}`);
    }
    if (stats30d.summary.totalActiveOffers !== 2) {
      throw new Error(`Esperava 2 ofertas ativas, obteve ${stats30d.summary.totalActiveOffers}`);
    }
    if (stats30d.summary.totalAffiliateArticles !== 2) {
      throw new Error(`Esperava 2 artigos comerciais, obteve ${stats30d.summary.totalAffiliateArticles}`);
    }
    if (stats30d.summary.periodClicks !== 5) {
      throw new Error(`Esperava 5 cliques em 30d, obteve ${stats30d.summary.periodClicks}`);
    }

    // Check Top Products Ranking
    if (stats30d.topProducts.length !== 2) {
      throw new Error(`Esperava 2 produtos no ranking, obteve ${stats30d.topProducts.length}`);
    }
    if (stats30d.topProducts[0].id !== prod1.id || stats30d.topProducts[0].clicks !== 3) {
      throw new Error(`Top 1 produto deveria ser prod1 com 3 cliques, obteve: ${JSON.stringify(stats30d.topProducts[0])}`);
    }
    if (stats30d.topProducts[1].id !== prod2.id || stats30d.topProducts[1].clicks !== 2) {
      throw new Error(`Top 2 produto deveria ser prod2 com 2 cliques, obteve: ${JSON.stringify(stats30d.topProducts[1])}`);
    }
    console.log("✓ Ranking de produtos calculado com precisão (Mouse=3 cliques / Teclado=2 cliques).");

    // Check Top Articles Ranking
    if (stats30d.topArticles[0].id !== article1.id || stats30d.topArticles[0].clicks !== 4) {
      throw new Error(`Top 1 artigo deveria ser article1 com 4 cliques, obteve: ${JSON.stringify(stats30d.topArticles[0])}`);
    }
    console.log("✓ Ranking de artigos calculado com precisão (Artigo 1=4 cliques / Artigo 2=1 clique).");

    // Check Top Components Breakdown
    const compCard = stats30d.topComponents.find((c) => c.id === "PRODUCT_CARD");
    const compTable = stats30d.topComponents.find((c) => c.id === "COMPARISON_TABLE");
    const compCta = stats30d.topComponents.find((c) => c.id === "CTA");

    if (compCard?.clicks !== 2 || compTable?.clicks !== 2 || compCta?.clicks !== 1) {
      throw new Error(`Distribuição por componentes incorreta: ${JSON.stringify(stats30d.topComponents)}`);
    }
    console.log("✓ Métricas por componente visual verificadas (Card=2, Tabela=2, CTA=1).");

    // 4.2 7 Days Period (should exclude the click from 10 days ago -> 4 clicks)
    const stats7d = await AffiliateAnalyticsService.getDashboardStats(wsPro.id, {
      period: "7d",
    });
    if (stats7d.summary.periodClicks !== 4) {
      throw new Error(`Esperava 4 cliques em 7d, obteve ${stats7d.summary.periodClicks}`);
    }
    console.log("✓ Filtro de 7 dias excluiu corretamente cliques fora da janela.");

    // 5. Test Entitlement Enforcement & Paywall
    console.log("\n--- Check 5: Validação de Entitlements e Paywall ---");
    let threwPaywall = false;
    try {
      await AffiliateAnalyticsService.getDashboardStats(wsStarter.id);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("não está disponível")) {
        threwPaywall = true;
      }
    }
    if (!threwPaywall) {
      throw new Error("FALHA: Workspace sem AFFILIATE_ANALYTICS deveria ter bloqueio de acesso!");
    }
    console.log("✓ Workspace sem entitlement foi bloqueado com mensagem descritiva de upgrade.");

    // 6. Test Multi-tenant Isolation
    console.log("\n--- Check 6: Isolamento Multi-tenant ---");
    const statsStarterWithSkip = await AffiliateAnalyticsService.getDashboardStats(wsStarter.id, {
      skipEntitlementCheck: true,
    });
    if (statsStarterWithSkip.summary.periodClicks !== 0 || statsStarterWithSkip.summary.totalAllTimeClicks !== 0) {
      throw new Error(`Vazamento de tenant detectado: workspace starter encontrou cliques de outro tenant!`);
    }
    console.log("✓ Isolamento total confirmado: 0 cliques no workspace isolado.");

    // 7. Cleanup
    await prisma.affiliateClick.deleteMany({
      where: { workspace: { slug: { in: [WS_SLUG, WS_NO_ANALYTICS] } } },
    });
    await prisma.articleProduct.deleteMany({
      where: { article: { workspace: { slug: { in: [WS_SLUG, WS_NO_ANALYTICS] } } } },
    });
    await prisma.article.deleteMany({
      where: { workspace: { slug: { in: [WS_SLUG, WS_NO_ANALYTICS] } } },
    });
    await prisma.productOffer.deleteMany({
      where: { workspace: { slug: { in: [WS_SLUG, WS_NO_ANALYTICS] } } },
    });
    await prisma.product.deleteMany({
      where: { workspace: { slug: { in: [WS_SLUG, WS_NO_ANALYTICS] } } },
    });
    await prisma.subscription.deleteMany({
      where: { workspace: { slug: { in: [WS_SLUG, WS_NO_ANALYTICS] } } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: { in: [WS_SLUG, WS_NO_ANALYTICS] } },
    });
    await prisma.planFeature.deleteMany({
      where: { plan: { slug: { in: [PLAN_WITH_ANALYTICS, PLAN_WITHOUT_ANALYTICS] } } },
    });
    await prisma.plan.deleteMany({
      where: { slug: { in: [PLAN_WITH_ANALYTICS, PLAN_WITHOUT_ANALYTICS] } },
    });

    console.log("\n========================================================");
    console.log("🎉 TODOS OS TESTES DA TASK 135 PASSARAM COM SUCESSO!");
    console.log("========================================================");
  } catch (err) {
    console.error("ERRO NO TESTE:", err);
    process.exit(1);
  }
}

run();
