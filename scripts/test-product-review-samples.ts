import { prisma } from "@/lib/prisma";
import { AffiliateService } from "@/lib/affiliate/service";
import { ProductRefreshService } from "@/lib/affiliate/refresh-service";
import { ProductCatalogService } from "@/lib/affiliate/product-service";
import { ProductReviewService } from "@/lib/affiliate/review-service";
import { AffiliateProviderFactory } from "@/lib/affiliate/factory";
import { extractProductMetadata } from "@/lib/affiliate/metadata-extractor";
import { ensureDefaultAffiliatePrograms } from "@/lib/affiliate/seed";

async function run() {
  console.log("=== TEST: Task 152 - Product Review Samples ===");

  const timestamp = Date.now();
  const testEmail = `tenant-152-${timestamp}@example.com`;
  const workspaceSlug = `ws-152-${timestamp}`;
  const planSlug = `plan-152-${timestamp}`;

  try {
    await ensureDefaultAffiliatePrograms();

    // 1. Setup Tenant & Plan
    console.log("\n--- Check 1: Setup de Workspace e Plano ---");
    const user = await prisma.user.create({
      data: { email: testEmail, name: "Test User 152" },
    });

    const plan = await prisma.plan.create({
      data: {
        name: "Plan Task 152",
        slug: planSlug,
        maxArticles: 100,
        maxDailyArticles: 50,
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

    const maxProductsFeature = await prisma.feature.findUnique({
      where: { key: "affiliate_max_products" },
    });
    if (maxProductsFeature) {
      await prisma.planFeature.upsert({
        where: { planId_featureId: { planId: plan.id, featureId: maxProductsFeature.id } },
        create: { planId: plan.id, featureId: maxProductsFeature.id, enabled: true, limit: 50 },
        update: { enabled: true, limit: 50 },
      });
    }

    const workspace = await prisma.workspace.create({
      data: {
        name: `Workspace 152 ${timestamp}`,
        slug: workspaceSlug,
        members: {
          create: { userId: user.id, role: "OWNER" },
        },
        subscription: {
          create: { planId: plan.id, status: "ACTIVE" },
        },
      },
    });

    console.log("✓ Check 1 PASS: Workspace e features configurados.");

    // 2. Metadata Extraction of Review Samples (JSON-LD and HTML Fallback)
    console.log("\n--- Check 2: Extração de Review Samples e Sanitização de PII ---");
    const mockHtmlWithReviews = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Monitor Gamer Curvo 27 Pol</title>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "Monitor Gamer Curvo 27 Polegadas 165Hz",
          "image": "https://http2.mlstatic.com/monitor.jpg",
          "description": "Monitor gamer com alta taxa de atualização.",
          "offers": {
            "@type": "Offer",
            "price": "1299.90",
            "priceCurrency": "BRL"
          },
          "review": [
            {
              "@type": "Review",
              "reviewRating": { "ratingValue": 5 },
              "name": "Excelente qualidade e cores",
              "reviewBody": "O monitor superou as expectativas, taxa de 165hz muito fluida.",
              "author": { "@type": "Person", "name": "Carlos Silva carlos@email.com +55 11 99999-9999" }
            },
            {
              "@type": "Review",
              "reviewRating": { "ratingValue": 4 },
              "name": "Muito bom",
              "reviewBody": "Ótimo custo benefício, apenas o suporte que poderia ter ajuste de altura.",
              "author": "Mariana Oliveira"
            },
            {
              "@type": "Review",
              "reviewRating": { "ratingValue": 5 },
              "reviewBody": "Cores muito vivas e sem nenhum dead pixel.",
              "author": "Lucas Pereira"
            },
            {
              "@type": "Review",
              "reviewRating": { "ratingValue": 4.5 },
              "reviewBody": "Chegou rápido e bem embalado, recomendo.",
              "author": "Fernanda Costa"
            },
            {
              "@type": "Review",
              "reviewRating": { "ratingValue": 5 },
              "reviewBody": "Uso para programar e jogar, excelente.",
              "author": "Rafael Santos"
            },
            {
              "@type": "Review",
              "reviewRating": { "ratingValue": 3 },
              "reviewBody": "Avaliação extra que deve ser truncada pelo limite de 5.",
              "author": "Excedente"
            }
          ]
        }
        </script>
      </head>
      <body></body>
      </html>
    `;

    const extracted = extractProductMetadata(mockHtmlWithReviews, {
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-152152-monitor-gamer",
    });

    if (!extracted.reviewSamples || extracted.reviewSamples.length !== 5) {
      throw new Error(`FAIL Check 2: Esperado exatamente 5 reviewSamples, obtido: ${extracted.reviewSamples?.length}`);
    }

    // Check PII sanitization on author Carlos Silva
    const firstReview = extracted.reviewSamples[0];
    if (firstReview.authorName?.includes("@") || firstReview.authorName?.includes("9999")) {
      throw new Error(`FAIL Check 2: PII não foi sanitizada do autor: ${firstReview.authorName}`);
    }
    if (firstReview.authorName !== "Carlos S.") {
      throw new Error(`FAIL Check 2: Formato de nome sanitizado incorreto: ${firstReview.authorName}`);
    }

    console.log("✓ Check 2 PASS: Extração de até 5 reviews e sanitização de PII validadas.");

    // 3. Confirm Import with Review Samples Sync
    console.log("\n--- Check 3: Persistência de ProductReviewSample no confirmImport ---");
    const confirmResult = await AffiliateService.confirmImport(workspace.id, {
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-152152-monitor-gamer",
      name: "Monitor Gamer Curvo 27 Polegadas 165Hz",
      price: 1299.9,
      reviewSamples: extracted.reviewSamples,
    });

    const savedReviews = await ProductReviewService.getProductReviewSamples(workspace.id, confirmResult.product.id);
    if (savedReviews.length !== 5) {
      throw new Error(`FAIL Check 3: Esperado 5 ProductReviewSample persistidos, obtido: ${savedReviews.length}`);
    }

    console.log(`✓ Check 3 PASS: ${savedReviews.length} avaliações persistidas com sucesso no banco de dados.`);

    // 4. Grounding Formatter validation
    console.log("\n--- Check 4: Formatação de Grounding para IA ---");
    const groundingText = ProductReviewService.formatReviewsForAiGrounding(savedReviews);

    if (!groundingText.includes("Amostras Qualitativas de Opiniões de Consumidores")) {
      throw new Error("FAIL Check 4: Cabeçalho de grounding ausente.");
    }
    if (!groundingText.includes("NÃO devem ser tratadas como estatística exaustiva")) {
      throw new Error("FAIL Check 4: Disclaimer de amostragem qualitativa ausente.");
    }
    if (!groundingText.includes("Excelente qualidade e cores")) {
      throw new Error("FAIL Check 4: Conteúdo das avaliações ausente no texto de grounding.");
    }

    console.log("Grounding text preview:\n" + groundingText.split("\n").slice(0, 4).join("\n") + "\n...");
    console.log("✓ Check 4 PASS: Formatação de grounding com disclaimer qualitativo validada.");

    // 5. Product Detail retrieval and Refresh Sync
    console.log("\n--- Check 5: Carregamento no ProductCatalogService e Sync no Refresh ---");
    const loadedProduct = await ProductCatalogService.getProduct(workspace.id, confirmResult.product.id);
    if (!loadedProduct.reviewSamples || loadedProduct.reviewSamples.length !== 5) {
      throw new Error(`FAIL Check 5: getProduct não incluiu reviewSamples: ${loadedProduct.reviewSamples?.length}`);
    }

    // Simulate refresh with updated review samples
    const provider = AffiliateProviderFactory.getProvider("MERCADO_LIVRE");
    const originalFetch = provider.fetchProductMetadata;
    provider.fetchProductMetadata = async () => ({
      status: "COMPLETE",
      affiliateUrl: confirmResult.offer.affiliateUrl,
      name: "Monitor Gamer Curvo 27 Polegadas 165Hz",
      price: 1199.0,
      metadataSource: "REFRESH_TEST",
      fetchedAt: new Date(),
      warnings: [],
      reviewSamples: [
        {
          rating: 5,
          title: "Review Refreshed",
          text: "Review atualizado via refresh de oferta.",
          authorName: "Roberto F.",
          capturedAt: new Date(),
        },
      ],
    });

    try {
      await ProductRefreshService.refreshOffer(workspace.id, confirmResult.offer.id);
      const reloadedReviews = await ProductReviewService.getProductReviewSamples(workspace.id, confirmResult.product.id);
      if (reloadedReviews.length !== 1 || reloadedReviews[0].title !== "Review Refreshed") {
        throw new Error(`FAIL Check 5: Refresh não sincronizou os novos review samples.`);
      }
    } finally {
      provider.fetchProductMetadata = originalFetch;
    }

    console.log("✓ Check 5 PASS: getProduct e sincronização de reviews no refresh validados com sucesso.");

    // Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.workspace.delete({ where: { id: workspace.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.plan.delete({ where: { id: plan.id } });
    console.log("✓ Cleanup concluído.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 152 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 152:", error);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
