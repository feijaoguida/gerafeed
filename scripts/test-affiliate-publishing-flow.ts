import { prisma } from "@/lib/prisma";
import { ProductReviewGenerator } from "@/lib/affiliate/generators/review-generator";
import { ProductComparisonGenerator } from "@/lib/affiliate/generators/comparison-generator";
import { ensureDefaultAffiliatePrograms } from "@/lib/affiliate/seed";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import { AIProvider } from "@/lib/ai/types";

async function run() {
  console.log("=== TEST: Task 165 - Affiliate Publishing Flow ===");

  const timestamp = Date.now();
  const testEmail = `tenant-165-${timestamp}@example.com`;
  const workspaceSlug = `ws-165-${timestamp}`;
  const planSlug = `plan-165-${timestamp}`;

  try {
    await ensureDefaultAffiliatePrograms();

    // 1. Setup Workspace & Entitlements
    console.log("\n--- Check 1: Setup de Workspace, Entitlements e Produtos ---");
    const user = await prisma.user.create({
      data: { email: testEmail, name: "Test User 165" },
    });

    const plan = await prisma.plan.create({
      data: {
        name: "Plan Affiliate 165",
        slug: planSlug,
        maxArticles: 100,
        maxDailyArticles: 20,
        maxSources: 5,
        maxWordPressSites: 2,
      },
    });

    const affiliateFeature = await prisma.feature.findUniqueOrThrow({
      where: { key: "affiliate_module" },
    });
    await prisma.planFeature.create({
      data: {
        planId: plan.id,
        featureId: affiliateFeature.id,
        enabled: true,
      },
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: `Workspace 165 ${timestamp}`,
        slug: workspaceSlug,
        members: {
          create: { userId: user.id, role: "OWNER" },
        },
        subscription: {
          create: { planId: plan.id, status: "ACTIVE" },
        },
      },
    });

    const hasModule = await BillingService.hasFeature(workspace.id, AFFILIATE_FEATURES.MODULE);
    if (!hasModule) {
      throw new Error("FAIL Check 1: Módulo de afiliados deveria estar ativo.");
    }

    const mlProgram = await prisma.affiliateProgram.findUniqueOrThrow({
      where: { code: "MERCADO_LIVRE" },
    });

    const product1 = await prisma.product.create({
      data: {
        workspaceId: workspace.id,
        name: "Kindle Paperwhite 16GB",
        brand: "Amazon",
        slug: `kindle-paperwhite-${timestamp}`,
        description: "Leitor de livros digitais com luz ajustável e tela de 300 ppi.",
        rating: 4.8,
        pros: ["Bateria de longa duração", "Tela antirreflexo"],
        cons: ["Sem áudio integrado"],
        offers: {
          create: {
            workspaceId: workspace.id,
            affiliateProgramId: mlProgram.id,
            affiliateUrl: "https://produto.mercadolivre.com.br/MLB-16501-kindle",
            price: 799.0,
            seller: "Amazon Oficial",
            status: "ACTIVE",
          },
        },
      },
    });

    const product2 = await prisma.product.create({
      data: {
        workspaceId: workspace.id,
        name: "Kobo Clara 2E",
        brand: "Rakuten Kobo",
        slug: `kobo-clara-${timestamp}`,
        description: "E-reader ecológico à prova d'água com ComfortLight PRO.",
        rating: 4.6,
        pros: ["À prova d'água", "Suporte a múltiplos formatos de ebook"],
        cons: ["Ecossistema menor que a Amazon"],
        offers: {
          create: {
            workspaceId: workspace.id,
            affiliateProgramId: mlProgram.id,
            affiliateUrl: "https://produto.mercadolivre.com.br/MLB-16502-kobo",
            price: 749.0,
            seller: "Kobo Brasil",
            status: "ACTIVE",
          },
        },
      },
    });

    console.log("✓ Check 1 PASS: Workspace, entitlement e 2 produtos configurados.");

    const mockAiProvider: AIProvider = {
      name: "Mock AI Provider",
      model: "mock-v1",
      async testConnection() {
        return { connected: true, provider: "mock", model: "mock-v1" };
      },
      async generateArticle() {
        return {
          relevant: true,
          score: 9.5,
          title: "Artigo de Afiliado Gerado - Mock AI",
          summary: "Resumo estruturado e persuasivo para conversão de afiliados.",
          content: "<h3>Introdução</h3><p>Análise completa dos melhores modelos do mercado.</p><h3>Veredito</h3><p>Excelente custo-benefício.</p>",
          suggestedCategoryId: null,
          tags: ["Tecnologia", "E-readers", "Kindle", "Kobo"],
          seoFocusKeyword: "melhor leitor de livros digitais",
          seoTitle: "Review Completo e Comparativo de E-readers",
          seoDescription: "Descubra qual o melhor modelo de e-reader para a sua rotina.",
        };
      },
    };

    // 2. Generate Product Review Article (Canonical Document)
    console.log("\n--- Check 2: Geração de Review Aprofundado (PRODUCT_REVIEW) ---");
    const reviewResult = await ProductReviewGenerator.generate({
      workspaceId: workspace.id,
      productId: product1.id,
      focusKeyword: "kindle paperwhite vale a pena",
      aiProvider: mockAiProvider,
    });

    if (!reviewResult.article?.id || !reviewResult.canonicalDocument) {
      throw new Error("FAIL Check 2: Falha na geração do Review Canônico!");
    }
    console.log(`✓ Check 2 PASS: Review '${reviewResult.article.title}' gerado com documento canônico.`);

    // 3. Generate Product Comparison Article (Canonical Document)
    console.log("\n--- Check 3: Geração de Comparativo Direto (COMPARISON) ---");
    const comparisonResult = await ProductComparisonGenerator.generate({
      workspaceId: workspace.id,
      productIds: [product1.id, product2.id],
      focusKeyword: "kindle paperwhite vs kobo clara 2e",
      aiProvider: mockAiProvider,
    });

    if (!comparisonResult.article?.id || !comparisonResult.canonicalDocument) {
      throw new Error("FAIL Check 3: Falha na geração do Comparativo Canônico!");
    }
    console.log(`✓ Check 3 PASS: Comparativo '${comparisonResult.article.title}' gerado com documento canônico.`);

    // 4. Verify DB Articles and Commercial Relationships
    console.log("\n--- Check 4: Verificação de Artigos e Relações Comerciais ---");
    const savedReview = await prisma.article.findUniqueOrThrow({
      where: { id: reviewResult.article.id },
      include: { articleProducts: true },
    });
    if (savedReview.commercialType !== "PRODUCT_REVIEW" || savedReview.articleProducts.length !== 1) {
      throw new Error("FAIL Check 4: Dados salvos do review inválidos.");
    }

    const savedComparison = await prisma.article.findUniqueOrThrow({
      where: { id: comparisonResult.article.id },
      include: { articleProducts: true },
    });
    if (savedComparison.commercialType !== "COMPARISON" || savedComparison.articleProducts.length !== 2) {
      throw new Error("FAIL Check 4: Dados salvos do comparativo inválidos.");
    }
    console.log("✓ Check 4 PASS: Relações comerciais persistidas com integridade multi-tenant.");

    // Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.articleProduct.deleteMany({ where: { articleId: { in: [savedReview.id, savedComparison.id] } } });
    await prisma.article.deleteMany({ where: { id: { in: [savedReview.id, savedComparison.id] } } });
    await prisma.productOffer.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.product.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.workspace.delete({ where: { id: workspace.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.plan.delete({ where: { id: plan.id } });
    console.log("✓ Cleanup concluído.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 165 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 165:", error);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
