import { prisma } from "@/lib/prisma";
import { AffiliatePromptTemplateService } from "@/lib/affiliate/prompt-template-service";
import { ProductReviewGenerator } from "@/lib/affiliate/generators/review-generator";
import { ensureDefaultAffiliatePrograms } from "@/lib/affiliate/seed";
import { AIProvider } from "@/lib/ai/types";

async function run() {
  console.log("=== TEST: Task 170 - Global Affiliate Prompt Migration ===");

  const timestamp = Date.now();
  const testEmail = `tenant-170-${timestamp}@example.com`;
  const workspaceSlug = `ws-170-${timestamp}`;
  const planSlug = `plan-170-${timestamp}`;

  try {
    await ensureDefaultAffiliatePrograms();
    await AffiliatePromptTemplateService.ensureDefaultTemplates();

    // 1. Setup Workspace with Affiliate Entitlement
    console.log("\n--- Check 1: Setup de Workspace e Entitlement ---");
    const user = await prisma.user.create({
      data: { email: testEmail, name: "Test User 170" },
    });

    const plan = await prisma.plan.create({
      data: {
        name: "Plan Pro 170",
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
        name: `Workspace 170 ${timestamp}`,
        slug: workspaceSlug,
        members: { create: { userId: user.id, role: "OWNER" } },
        subscription: { create: { planId: plan.id, status: "ACTIVE" } },
      },
    });

    const mlProgram = await prisma.affiliateProgram.findUniqueOrThrow({
      where: { code: "MERCADO_LIVRE" },
    });

    const product = await prisma.product.create({
      data: {
        workspaceId: workspace.id,
        name: "Kindle Paperwhite 16GB",
        brand: "Amazon",
        slug: `kindle-paperwhite-${timestamp}`,
        description: "Leitor de livros digitais com tela de 6.8 polegadas e temperatura de luz ajustável.",
        rating: 4.8,
        status: "ACTIVE",
        offers: {
          create: {
            workspaceId: workspace.id,
            affiliateProgramId: mlProgram.id,
            affiliateUrl: "https://produto.mercadolivre.com.br/MLB-17001-kindle",
            price: 799.0,
            seller: "Amazon Oficial",
            status: "ACTIVE",
          },
        },
      },
    });

    console.log("✓ Check 1 PASS: Workspace, produto e ofertas criados com sucesso.");

    // 2. Global Template Resolution & Legacy Workspace Override Preservation
    console.log("\n--- Check 2: Global Resolver e Preservação de Overrides Legados ---");
    // Create a legacy workspace override in the database
    const legacyOverride = await prisma.promptTemplate.create({
      data: {
        workspaceId: workspace.id,
        type: "PRODUCT_REVIEW",
        name: "Legacy Tenant Custom Review",
        description: "Template customizado do tenant anterior à Fase 19",
        systemPrompt: "CUSTOM LEGACY SYSTEM PROMPT THAT SHOULD BE IGNORED",
        userPromptTemplate: "CUSTOM LEGACY USER PROMPT THAT SHOULD BE IGNORED",
        version: 99,
        active: true,
      },
    });

    // Verify that getEffectiveTemplate ignores the legacy override and returns the global template
    const effectiveTemplate = await AffiliatePromptTemplateService.getEffectiveTemplate(
      workspace.id,
      "PRODUCT_REVIEW"
    );

    if (effectiveTemplate.isCustomOverride || effectiveTemplate.workspaceId !== null) {
      throw new Error("FAIL Check 2: getEffectiveTemplate ainda retornou o override do workspace em vez do template global!");
    }
    if (effectiveTemplate.systemPrompt.includes("CUSTOM LEGACY SYSTEM PROMPT")) {
      throw new Error("FAIL Check 2: Prompt do override legado foi usado indevidamente na resolução!");
    }

    // Verify legacy override record in database was NOT destroyed
    const preservedLegacy = await prisma.promptTemplate.findUnique({
      where: { id: legacyOverride.id },
    });
    if (!preservedLegacy) {
      throw new Error("FAIL Check 2: Registro legado de override foi excluído indevidamente!");
    }
    console.log("✓ Check 2 PASS: Global resolver ignora overrides de workspace e preserva registros legados no banco.");

    // 3. Article Generation with Audit Fields (promptTemplateId & promptTemplateVersion)
    console.log("\n--- Check 3: Geração de Artigo com Auditoria (promptTemplateId / version) ---");
    const mockAi: AIProvider = {
      name: "Mock Global AI",
      model: "mock-v1",
      async testConnection() { return { connected: true, provider: "mock", model: "mock-v1" }; },
      async generateArticle() {
        return {
          relevant: true,
          score: 9.7,
          title: "Review Kindle Paperwhite 16GB: Vale o Preço?",
          summary: "Análise completa do e-reader mais popular da Amazon.",
          content: "<p>O Kindle Paperwhite entrega uma experiência de leitura quase idêntica ao papel.</p>",
          suggestedCategoryId: null,
          tags: ["Kindle", "E-reader", "Amazon"],
          seoFocusKeyword: "kindle paperwhite 16gb review",
          seoTitle: "Review Kindle Paperwhite 16GB - Análise Completa",
          seoDescription: "Confira nossa análise detalhada do leitor digital Kindle Paperwhite.",
        };
      },
    };

    const genResult = await ProductReviewGenerator.generate({
      workspaceId: workspace.id,
      productId: product.id,
      aiProvider: mockAi,
    });

    const savedArticle = await prisma.article.findUniqueOrThrow({
      where: { id: genResult.article.id },
    });

    if (!savedArticle.promptTemplateId || savedArticle.promptTemplateId !== effectiveTemplate.id) {
      throw new Error(`FAIL Check 3: promptTemplateId incorreto ou ausente no artigo gerado! Esperado: ${effectiveTemplate.id}, Obtido: ${savedArticle.promptTemplateId}`);
    }

    if (savedArticle.promptTemplateVersion !== effectiveTemplate.version) {
      throw new Error(`FAIL Check 3: promptTemplateVersion incorreto! Esperado: ${effectiveTemplate.version}, Obtido: ${savedArticle.promptTemplateVersion}`);
    }

    console.log("✓ Check 3 PASS: Artigo novo salva promptTemplateId e promptTemplateVersion com fidelidade.");

    // Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.articleProduct.deleteMany({ where: { articleId: savedArticle.id } });
    await prisma.article.deleteMany({ where: { id: savedArticle.id } });
    await prisma.promptTemplate.deleteMany({ where: { id: legacyOverride.id } });
    await prisma.productOffer.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.product.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.workspace.delete({ where: { id: workspace.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.plan.delete({ where: { id: plan.id } });
    console.log("✓ Cleanup concluído.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 170 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 170:", error);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
