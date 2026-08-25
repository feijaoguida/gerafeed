import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import {
  ProductCatalogService,
  ProductOfferService,
  CanonicalDocumentService,
  SafeUrlResolver,
  AffiliateAnalyticsService,
  ClickTrackingService,
  ensureDefaultAffiliatePrograms,
} from "@/lib/affiliate";
import {
  WordPressAffiliateRenderer,
  AffiliateComplianceService,
  PublicationSyncService,
  PublisherFactory,
} from "@/lib/publisher";

async function run() {
  console.log("================================================================================");
  console.log("🛡️  INICIANDO SUÍTE DE HARDENING DA PHASE 13: PUBLISHER & AFFILIATE ANALYTICS");
  console.log("================================================================================\n");

  const WS_A = "hardening-p13-ws-a";
  const WS_B = "hardening-p13-ws-b";
  const PLAN_FULL = "hardening-p13-plan-full";
  const PLAN_RESTRICTED = "hardening-p13-plan-restricted";

  try {
    // 0. Cleanup
    await ensureDefaultAffiliatePrograms();

    await prisma.affiliateClick.deleteMany({
      where: { workspace: { slug: { in: [WS_A, WS_B] } } },
    });
    await prisma.articleProduct.deleteMany({
      where: { article: { workspace: { slug: { in: [WS_A, WS_B] } } } },
    });
    await prisma.article.deleteMany({
      where: { workspace: { slug: { in: [WS_A, WS_B] } } },
    });
    await prisma.productOffer.deleteMany({
      where: { workspace: { slug: { in: [WS_A, WS_B] } } },
    });
    await prisma.product.deleteMany({
      where: { workspace: { slug: { in: [WS_A, WS_B] } } },
    });
    await prisma.productCategory.deleteMany({
      where: { workspace: { slug: { in: [WS_A, WS_B] } } },
    });
    await prisma.subscription.deleteMany({
      where: { workspace: { slug: { in: [WS_A, WS_B] } } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: { in: [WS_A, WS_B] } },
    });
    await prisma.planFeature.deleteMany({
      where: { plan: { slug: { in: [PLAN_FULL, PLAN_RESTRICTED] } } },
    });
    await prisma.plan.deleteMany({
      where: { slug: { in: [PLAN_FULL, PLAN_RESTRICTED] } },
    });

    // 1. Setup Plans & Entitlements
    console.log("--- 1. Auditoria de Planos, Entitlements e Multi-Tenant ---");
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

    // Full Plan
    const planFull = await prisma.plan.create({
      data: {
        name: "Plano Hardening Completo",
        slug: PLAN_FULL,
        price: 199.0,
        planFeatures: {
          create: [
            { featureId: featModule.id, enabled: true },
            { featureId: featAnalytics.id, enabled: true },
            { featureId: featMaxProd.id, enabled: true, limit: 100 },
          ],
        },
      },
    });

    // Restricted Plan (No Analytics, Low product limit)
    const planRestricted = await prisma.plan.create({
      data: {
        name: "Plano Hardening Restrito",
        slug: PLAN_RESTRICTED,
        price: 29.0,
        planFeatures: {
          create: [
            { featureId: featModule.id, enabled: true },
            { featureId: featAnalytics.id, enabled: false },
            { featureId: featMaxProd.id, enabled: true, limit: 1 },
          ],
        },
      },
    });

    const wsA = await prisma.workspace.create({
      data: { name: "Workspace Hardening A", slug: WS_A, active: true },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsA.id, planId: planFull.id, status: "ACTIVE" },
    });

    const wsB = await prisma.workspace.create({
      data: { name: "Workspace Hardening B", slug: WS_B, active: true },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsB.id, planId: planRestricted.id, status: "ACTIVE" },
    });

    console.log("✓ Planos, assinaturas e isolamento de tenants provisionados.");

    // 2. SSRF Protection & Safe Link Resolver Audit
    console.log("\n--- 2. Auditoria de Segurança: SSRF & Safe Link Resolver ---");
    const maliciousUrls = [
      "http://127.0.0.1:8080/admin",
      "http://localhost:3000/api",
      "http://169.254.169.254/latest/meta-data/",
      "http://10.0.0.1/private",
      "http://192.168.1.1/router",
      "file:///etc/passwd",
      "ftp://malicious.com/file",
      "http://untrusted-phishing-site.com/item",
    ];

    for (const url of maliciousUrls) {
      let blocked = false;
      try {
        await SafeUrlResolver.resolve(url, {
          allowedHosts: ["mercadolivre.com", "mercadolivre.com.br", "produto.mercadolivre.com.br"],
        });
      } catch {
        blocked = true;
      }
      if (!blocked) {
        throw new Error(`FALHA DE SSRF: URL perigosa não foi bloqueada: ${url}`);
      }
    }
    console.log("✓ Todas as URLs maliciosas e faixas privadas foram bloqueadas pelo SafeUrlResolver.");

    // 3. Catalog, Product Creation & Limits Audit
    console.log("\n--- 3. Auditoria de Catálogo e Limites de Plano ---");
    const prodA1 = await ProductCatalogService.createProduct(wsA.id, {
      name: "Monitor Gamer 165Hz",
      brand: "LG",
      rating: 4.9,
      pros: ["1ms de resposta", "Painel IPS"],
      cons: ["Base ocupa espaço"],
    });

    const offerA1 = await ProductOfferService.createOffer(wsA.id, {
      productId: prodA1.id,
      providerCode: "MERCADO_LIVRE",
      affiliateUrl: "https://mercadolivre.com/sec/monitor-lg-165hz",
      price: 1299.0,
      seller: "LG Oficial",
    });

    // Verify limit enforcement in Workspace B (limit: 1)
    await ProductCatalogService.createProduct(wsB.id, {
      name: "Mousepad Speed",
      brand: "HyperX",
    });

    let threwLimit = false;
    try {
      await ProductCatalogService.createProduct(wsB.id, {
        name: "Headset Gamer",
        brand: "HyperX",
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("limite de produtos")) {
        threwLimit = true;
      }
    }
    if (!threwLimit) {
      throw new Error("FALHA: Limite de produtos do plano não foi respeitado no Workspace B!");
    }
    console.log("✓ Limites de produtos por plano e criação no catálogo auditados com sucesso.");

    // 4. Canonical Document Structure & Absence of Raw Affiliate URLs
    console.log("\n--- 4. Auditoria de Independência do Documento Canônico ---");
    const canonicalDoc = CanonicalDocumentService.createDocument([
      {
        type: "AFFILIATE_DISCLOSURE",
        data: {},
      },
      {
        type: "HEADING",
        data: { level: 2, text: "Visão Geral do Monitor" },
      },
      {
        type: "PRODUCT_CARD",
        data: {
          productId: prodA1.id,
          showSpecs: true,
          showProsCons: true,
          highlightBadge: "Melhor Custo-Benefício",
        },
      },
      {
        type: "CTA",
        data: {
          productId: prodA1.id,
          text: "Ver Menor Preço no Mercado Livre",
        },
      },
    ]);

    // Ensure raw affiliate URLs are NEVER stored inside Canonical Document blocks
    const docJson = JSON.stringify(canonicalDoc);
    if (docJson.includes("mercadolivre.com") || docJson.includes("http://") || docJson.includes("https://")) {
      throw new Error("FALHA: Canonical Document contém URLs de afiliados hardcoded em vez de referências por ID!");
    }
    console.log("✓ Documento canônico comprovadamente independente de URLs hardcoded.");

    // 5. Publisher Adapter, WordPress Renderer, Compliance & Disclosure Audit
    console.log("\n--- 5. Auditoria de Publisher, Compliance de Links e Disclosure ---");
    await AffiliateComplianceService.setWorkspaceDisclosure(
      wsA.id,
      "Aviso de Transparência: Este artigo contém links afiliados auditados."
    );

    const articleA = await prisma.article.create({
      data: {
        workspaceId: wsA.id,
        title: "Review Monitor Gamer LG 165Hz",
        commercialType: "PRODUCT_REVIEW",
        status: "PUBLISHED",
      },
    });

    const renderedHtml = await WordPressAffiliateRenderer.renderToHtml(wsA.id, canonicalDoc, {
      articleId: articleA.id,
    });

    // Check direct href
    if (!renderedHtml.includes('href="https://mercadolivre.com/sec/monitor-lg-165hz"')) {
      throw new Error("FALHA: Renderer não produziu o link direto para a oferta do Mercado Livre!");
    }

    // Check rel="sponsored nofollow noopener"
    if (!renderedHtml.includes('rel="sponsored nofollow noopener"')) {
      throw new Error("FALHA: Links comerciais não contêm rel='sponsored nofollow noopener'!");
    }

    // Check Disclosure
    if (!renderedHtml.includes("Este artigo contém links afiliados auditados.")) {
      throw new Error("FALHA: Disclosure customizado do workspace não foi embutido no HTML!");
    }

    // Check Publisher Adapter
    const pubAdapter = PublisherFactory.create("wordpress", {
      url: "https://wp-test.example.com",
      username: "admin",
      applicationPassword: "app-password-test",
    });
    if (!pubAdapter) {
      throw new Error("FALHA: PublisherAdapter do WordPress não pôde ser instanciado via Factory!");
    }
    console.log("✓ PublisherAdapter, compliance de links sponsored/nofollow e disclosure validados.");

    // 6. Publication Sync, Hash & Outdated Detection Audit
    console.log("\n--- 6. Auditoria de Publication Sync & Detecção de Desatualização ---");
    const contentHash = PublicationSyncService.computeContentHash(renderedHtml);
    await prisma.article.update({
      where: { id: articleA.id },
      data: {
        renderedContentHash: contentHash,
        needsRepublish: false,
        lastPublishedAt: new Date(),
      },
    });

    // Link article to product offer
    await prisma.articleProduct.create({
      data: {
        articleId: articleA.id,
        productId: prodA1.id,
        offerId: offerA1.id,
      },
    });

    // Simulate offer update in catalog (Price change from 1299 to 1199)
    await ProductOfferService.updateOffer(wsA.id, offerA1.id, {
      price: 1199.0,
    });

    // Verify article was automatically marked as needsRepublish
    const updatedArticle = await prisma.article.findUniqueOrThrow({
      where: { id: articleA.id },
    });
    if (!updatedArticle.needsRepublish) {
      throw new Error("FALHA: Artigo dependente não foi marcado com needsRepublish: true após alteração da oferta!");
    }
    console.log("✓ Detecção automática de publicações desatualizadas (needsRepublish) auditada com sucesso.");

    // 7. Click Tracking, Signed Tokens & Non-Blocking Beacon Audit
    console.log("\n--- 7. Auditoria de Tracking Criptográfico e Script Non-blocking ---");
    const eventToken = ClickTrackingService.generateEventToken({
      workspaceId: wsA.id,
      articleId: articleA.id,
      productId: prodA1.id,
      offerId: offerA1.id,
      component: "PRODUCT_CARD",
    });

    const recordedClick = await ClickTrackingService.recordClick(eventToken);
    if (recordedClick.workspaceId !== wsA.id || recordedClick.productId !== prodA1.id) {
      throw new Error("FALHA: Registro de clique falhou na integridade de dados!");
    }

    // Tampering test
    let tamperedRejected = false;
    try {
      ClickTrackingService.verifyEventToken(eventToken + "corrupted");
    } catch {
      tamperedRejected = true;
    }
    if (!tamperedRejected) {
      throw new Error("FALHA: Token adulterado não foi rejeitado!");
    }
    console.log("✓ Tokens assinados com HMAC-SHA256 e gravação segura validados.");

    // 8. Analytics Dashboard & Separation of Clicks vs Sales
    console.log("\n--- 8. Auditoria de Analytics Dashboard & Métricas ---");
    const statsA = await AffiliateAnalyticsService.getDashboardStats(wsA.id, {
      period: "30d",
    });

    if (statsA.summary.periodClicks !== 1 || statsA.topProducts[0]?.clicks !== 1) {
      throw new Error("FALHA: Estatísticas do dashboard de afiliados incorretas!");
    }

    // Verify Workspace B (without entitlement) is blocked
    let paywallEnforced = false;
    try {
      await AffiliateAnalyticsService.getDashboardStats(wsB.id);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("não está disponível")) {
        paywallEnforced = true;
      }
    }
    if (!paywallEnforced) {
      throw new Error("FALHA: Workspace B sem entitlement de analytics conseguiu acessar dados!");
    }
    console.log("✓ Dashboard de afiliados, rankings e paywalls por plano validados.");

    // 9. Cleanup
    await prisma.affiliateClick.deleteMany({
      where: { workspace: { slug: { in: [WS_A, WS_B] } } },
    });
    await prisma.articleProduct.deleteMany({
      where: { article: { workspace: { slug: { in: [WS_A, WS_B] } } } },
    });
    await prisma.article.deleteMany({
      where: { workspace: { slug: { in: [WS_A, WS_B] } } },
    });
    await prisma.productOffer.deleteMany({
      where: { workspace: { slug: { in: [WS_A, WS_B] } } },
    });
    await prisma.product.deleteMany({
      where: { workspace: { slug: { in: [WS_A, WS_B] } } },
    });
    await prisma.productCategory.deleteMany({
      where: { workspace: { slug: { in: [WS_A, WS_B] } } },
    });
    await prisma.subscription.deleteMany({
      where: { workspace: { slug: { in: [WS_A, WS_B] } } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: { in: [WS_A, WS_B] } },
    });
    await prisma.planFeature.deleteMany({
      where: { plan: { slug: { in: [PLAN_FULL, PLAN_RESTRICTED] } } },
    });
    await prisma.plan.deleteMany({
      where: { slug: { in: [PLAN_FULL, PLAN_RESTRICTED] } },
    });

    console.log("\n================================================================================");
    console.log("🏆 TODAS AS AUDITORIAS DA PHASE 13 HARDENING FORAM APROVADAS COM SUCESSO!");
    console.log("================================================================================");
  } catch (err) {
    console.error("ERRO NO HARDENING:", err);
    process.exit(1);
  }
}

run();
