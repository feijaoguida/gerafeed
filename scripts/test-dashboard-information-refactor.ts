import { prisma } from "@/lib/prisma";
import { BillingService } from "@/lib/billing";
import { ensureDefaultAffiliatePrograms } from "@/lib/affiliate/seed";

async function run() {
  console.log("=== TEST: Task 160 - Dashboard Information Refactor ===");

  const timestamp = Date.now();
  const testEmail = `tenant-160-${timestamp}@example.com`;
  const workspaceSlug = `ws-160-${timestamp}`;
  const planSlug = `plan-160-${timestamp}`;

  try {
    await ensureDefaultAffiliatePrograms();

    // 1. Setup Workspace & Subscription with custom limits
    console.log("\n--- Check 1: Setup de Workspace, Plano e Entidades ---");
    const user = await prisma.user.create({
      data: { email: testEmail, name: "Test User 160" },
    });

    const plan = await prisma.plan.create({
      data: {
        name: "Plan Dashboard 160",
        slug: planSlug,
        maxArticles: 150,
        maxDailyArticles: 25,
        maxSources: 10,
        maxWordPressSites: 4,
      },
    });

    const affiliateFeature = await prisma.feature.findUnique({
      where: { key: "affiliate_module" },
    });
    if (affiliateFeature) {
      await prisma.planFeature.upsert({
        where: { planId_featureId: { planId: plan.id, featureId: affiliateFeature.id } },
        create: { planId: plan.id, featureId: affiliateFeature.id, enabled: true },
        update: { enabled: true },
      });
    }

    const workspace = await prisma.workspace.create({
      data: {
        name: `Workspace 160 ${timestamp}`,
        slug: workspaceSlug,
        members: {
          create: { userId: user.id, role: "OWNER" },
        },
        subscription: {
          create: { planId: plan.id, status: "ACTIVE" },
        },
      },
    });

    // Create some test entities (articles, source, product, offer, click, site)
    await prisma.source.create({
      data: {
        workspaceId: workspace.id,
        name: "Tech News Feed",
        rssUrl: "https://technews.example.com/rss",
        active: true,
      },
    });

    await prisma.wordPressSite.create({
      data: {
        workspaceId: workspace.id,
        name: "Portal de Tecnologia Principal",
        url: "https://portaltech.example.com",
        username: "editor",
        encryptedApplicationPassword: "enc_pwd",
      },
    });

    await prisma.article.create({
      data: {
        workspaceId: workspace.id,
        originalTitle: "Notícia 1 Pendente",
        originalUrl: "https://technews.example.com/noticia-1",
        status: "PENDING",
      },
    });

    await prisma.article.create({
      data: {
        workspaceId: workspace.id,
        originalTitle: "Notícia 2 Publicada",
        originalUrl: "https://technews.example.com/noticia-2",
        status: "PUBLISHED",
        processedAt: new Date(),
      },
    });

    const product = await prisma.product.create({
      data: {
        workspaceId: workspace.id,
        name: "Smartphone Pro Max",
        slug: `smartphone-pro-${timestamp}`,
        status: "ACTIVE",
      },
    });

    const mlProgram = await prisma.affiliateProgram.findUniqueOrThrow({
      where: { code: "MERCADO_LIVRE" },
    });

    const offer = await prisma.productOffer.create({
      data: {
        workspaceId: workspace.id,
        productId: product.id,
        affiliateProgramId: mlProgram.id,
        affiliateUrl: "https://produto.mercadolivre.com.br/MLB-160160-smartphone",
        price: 3499.0,
        status: "ACTIVE",
      },
    });

    await prisma.affiliateClick.create({
      data: {
        workspaceId: workspace.id,
        productId: product.id,
        offerId: offer.id,
        eventToken: `token-${timestamp}`,
      },
    });

    console.log("✓ Check 1 PASS: Entidades criadas para simular uso real do Workspace.");

    // 2. Fetch and Validate Aggregated Dashboard Stats Logic
    console.log("\n--- Check 2: Verificação de Agregação de Métricas e Limites ---");
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [
      pendingCount,
      publishedCount,
      activeSourcesCount,
      productsCount,
      offersCount,
      affiliateClicksCount,
      wordpressSitesCount,
      articlesDailyUsed,
      articlesMonthlyUsed,
      sub,
    ] = await Promise.all([
      prisma.article.count({ where: { workspaceId: workspace.id, status: "PENDING" } }),
      prisma.article.count({ where: { workspaceId: workspace.id, status: "PUBLISHED" } }),
      prisma.source.count({ where: { workspaceId: workspace.id, active: true } }),
      prisma.product.count({ where: { workspaceId: workspace.id } }),
      prisma.productOffer.count({ where: { workspaceId: workspace.id, status: "ACTIVE" } }),
      prisma.affiliateClick.count({ where: { workspaceId: workspace.id } }),
      prisma.wordPressSite.count({ where: { workspaceId: workspace.id } }),
      prisma.article.count({
        where: {
          workspaceId: workspace.id,
          processedAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      prisma.article.count({
        where: {
          workspaceId: workspace.id,
          processedAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      BillingService.getWorkspaceSubscription(workspace.id),
    ]);

    if (pendingCount !== 1) throw new Error(`FAIL Check 2: pendingCount esperado 1, obtido ${pendingCount}`);
    if (publishedCount !== 1) throw new Error(`FAIL Check 2: publishedCount esperado 1, obtido ${publishedCount}`);
    if (activeSourcesCount !== 1) throw new Error(`FAIL Check 2: activeSourcesCount esperado 1, obtido ${activeSourcesCount}`);
    if (productsCount !== 1) throw new Error(`FAIL Check 2: productsCount esperado 1, obtido ${productsCount}`);
    if (offersCount !== 1) throw new Error(`FAIL Check 2: offersCount esperado 1, obtido ${offersCount}`);
    if (affiliateClicksCount !== 1) throw new Error(`FAIL Check 2: affiliateClicksCount esperado 1, obtido ${affiliateClicksCount}`);
    if (wordpressSitesCount !== 1) throw new Error(`FAIL Check 2: wordpressSitesCount esperado 1, obtido ${wordpressSitesCount}`);
    if (articlesDailyUsed !== 1) throw new Error(`FAIL Check 2: articlesDailyUsed esperado 1, obtido ${articlesDailyUsed}`);
    if (articlesMonthlyUsed !== 1) throw new Error(`FAIL Check 2: articlesMonthlyUsed esperado 1, obtido ${articlesMonthlyUsed}`);
    if (sub.plan.name !== "Plan Dashboard 160") throw new Error("FAIL Check 2: Nome do plano incorreto");

    console.log("✓ Check 2 PASS: Todas as métricas e consumos agregados com 100% de exatidão.");

    // Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.workspace.delete({ where: { id: workspace.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.plan.delete({ where: { id: plan.id } });
    console.log("✓ Cleanup concluído.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 160 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 160:", error);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
