import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import {
  ProductCatalogService,
  ProductOfferService,
  CanonicalDocumentService,
  ArticleProductService,
  ensureDefaultAffiliatePrograms,
} from "@/lib/affiliate";
import {
  WordPressAffiliateRenderer,
  PublicationSyncService,
  PublisherFactory,
} from "@/lib/publisher";

async function run() {
  console.log("=== TEST: Task 133 - Publication Sync & Outdated Detection ===");

  const WS_SLUG = "test-ws-pub-sync";
  const PLAN_SLUG = "plan-pub-sync";

  try {
    // 0. Cleanup
    await ensureDefaultAffiliatePrograms();

    await prisma.articleProduct.deleteMany({
      where: { article: { workspace: { slug: WS_SLUG } } },
    });
    await prisma.article.deleteMany({
      where: { workspace: { slug: WS_SLUG } },
    });
    await prisma.productOffer.deleteMany({
      where: { workspace: { slug: WS_SLUG } },
    });
    await prisma.product.deleteMany({
      where: { workspace: { slug: WS_SLUG } },
    });
    await prisma.subscription.deleteMany({
      where: { workspace: { slug: WS_SLUG } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: WS_SLUG },
    });
    await prisma.planFeature.deleteMany({
      where: { plan: { slug: PLAN_SLUG } },
    });
    await prisma.plan.deleteMany({
      where: { slug: PLAN_SLUG },
    });

    // 1. Setup Workspace, Plan & Entitlements
    console.log("\n--- Check 1: Setup de Workspace, Catálogo e Artigo Comercial ---");
    await BillingService.ensureDefaultFeatures();
    const featModule = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MODULE } });
    const featMaxProd = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MAX_PRODUCTS } });

    const plan = await prisma.plan.create({
      data: {
        name: "Plano Pub Sync",
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

    const ws = await prisma.workspace.create({
      data: { name: "Tenant Pub Sync Test", slug: WS_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: ws.id, planId: plan.id, status: "ACTIVE" },
    });

    const prod = await ProductCatalogService.createProduct(ws.id, {
      name: "Notebook Ultrafino 16GB",
      brand: "TechBrand",
      rating: 4.8,
      specs: { ram: "16GB", ssd: "512GB", processador: "Core i7" },
      pros: ["Muito leve e rápido"],
      cons: ["Poucas portas USB-A"],
    });

    const offer = await ProductOfferService.createOffer(ws.id, {
      productId: prod.id,
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-999-notebook-ultrafino",
      price: 3999.0,
      seller: "TechBrand Store",
    });

    const canonicalDoc = CanonicalDocumentService.createDocument([
      {
        type: "AFFILIATE_DISCLOSURE",
        data: { position: "top" },
      },
      {
        type: "HEADING",
        data: { level: 2, text: "Review: Notebook Ultrafino 16GB" },
      },
      {
        type: "PRODUCT_CARD",
        data: {
          productId: prod.id,
          offerId: offer.id,
          highlightBadge: "Top Escolha",
          showSpecs: true,
          showProsCons: true,
        },
      },
    ]);

    const article = await prisma.article.create({
      data: {
        workspaceId: ws.id,
        commercialType: "PRODUCT_REVIEW",
        title: "Review: Notebook Ultrafino 16GB",
        canonicalContent: canonicalDoc as unknown as object,
        status: "PENDING",
      },
    });

    await ArticleProductService.attachProducts(ws.id, article.id, [
      { productId: prod.id, position: 0, badge: "Top Escolha" },
    ]);
    console.log("✓ Check 1 PASS: Workspace, produto, oferta e artigo estruturados.");

    // 2. Registro Inicial de Publicação e Cálculo de Hash
    console.log("\n--- Check 2: Registro de Publicação e Hash de Conteúdo ---");
    const initialHtml = await WordPressAffiliateRenderer.renderToHtml(ws.id, canonicalDoc);
    const publishedArticle = await PublicationSyncService.recordPublication({
      articleId: article.id,
      workspaceId: ws.id,
      renderedHtml: initialHtml,
      wordpressPostId: 888,
    });

    if (publishedArticle.status !== "PUBLISHED" || !publishedArticle.renderedContentHash || publishedArticle.needsRepublish) {
      throw new Error("FAIL: Publicação inicial não registrada corretamente no PublicationSyncService.");
    }
    console.log("✓ Check 2 PASS: Publicação inicial registrada com hash SHA-256 e status sincronizado.");

    // 3. Detecção de Desatualização após Mudança de Oferta/Preço
    console.log("\n--- Check 3: Mudança de Oferta e Marcação de needsRepublish ---");
    await ProductOfferService.updateOffer(ws.id, offer.id, {
      price: 3499.0,
    });

    const affectedCount = await PublicationSyncService.markDependentArticlesForRepublish(ws.id, prod.id);
    if (affectedCount < 1) {
      throw new Error("FAIL: markDependentArticlesForRepublish não identificou o artigo dependente.");
    }

    const isOutdated = await PublicationSyncService.checkArticleOutdated(article.id, ws.id);
    if (!isOutdated) {
      throw new Error("FAIL: checkArticleOutdated retornou false para artigo com preço alterado.");
    }
    console.log(`✓ Check 3 PASS: ${affectedCount} artigo(s) identificado(s) e marcado(s) com needsRepublish: true.`);

    // 4. Mock do Publisher Adapter e Republicação Manual
    console.log("\n--- Check 4: Republicação Manual do Artigo ---");
    PublisherFactory.setCustomResolver(() => ({
      name: "Mock WordPress Sync",
      type: "wordpress",
      async testConnection() {
        return { connected: true };
      },
      async createDraft() {
        return { success: true, postId: 888, status: "draft" };
      },
      async publish() {
        return { success: true, postId: 888, status: "publish" };
      },
      async update(postId: string | number, payload: Partial<{ content?: string; title?: string }>) {
        if (!payload.content?.includes("3499.00")) {
          throw new Error("FAIL: HTML republicado não continha o novo preço atualizado (3499.00).");
        }
        return { success: true, postId, status: "publish", postUrl: `https://mock.blog/?p=${postId}` };
      },
    }));

    const republishResult = await PublicationSyncService.republishArticle(ws.id, article.id);
    if (!republishResult.success) {
      throw new Error(`FAIL: republishArticle falhou: ${republishResult.error}`);
    }

    const postRepublishOutdated = await PublicationSyncService.checkArticleOutdated(article.id, ws.id);
    if (postRepublishOutdated) {
      throw new Error("FAIL: Artigo continua marcado como desatualizado após republicação bem-sucedida.");
    }
    PublisherFactory.setCustomResolver(null);
    console.log("✓ Check 4 PASS: Republicação manual concluída com novo hash e status atualizado.");

    // Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.articleProduct.deleteMany({
      where: { article: { workspace: { slug: WS_SLUG } } },
    });
    await prisma.article.deleteMany({
      where: { workspace: { slug: WS_SLUG } },
    });
    await prisma.productOffer.deleteMany({
      where: { workspace: { slug: WS_SLUG } },
    });
    await prisma.product.deleteMany({
      where: { workspace: { slug: WS_SLUG } },
    });
    await prisma.subscription.deleteMany({
      where: { workspace: { slug: WS_SLUG } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: WS_SLUG },
    });
    await prisma.planFeature.deleteMany({
      where: { plan: { slug: PLAN_SLUG } },
    });
    await prisma.plan.deleteMany({
      where: { slug: PLAN_SLUG },
    });
    console.log("✓ Cleanup concluído com sucesso.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 133 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 133:", error);
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
