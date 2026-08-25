import { prisma } from "@/lib/prisma";
import { AffiliatePromptTemplateService, TEMPLATE_CONSTRAINTS } from "@/lib/affiliate/prompt-template-service";
import { ProductReviewGenerator } from "@/lib/affiliate/generators/review-generator";
import { ensureDefaultAffiliatePrograms } from "@/lib/affiliate/seed";
import { AIProvider } from "@/lib/ai/types";

async function run() {
  console.log("=================================================================");
  console.log("=== TEST: Task 174 - Phase 19 Integration & Hardening Suite ===");
  console.log("=================================================================");

  const timestamp = Date.now();
  const superAdminEmail = `superadmin-174-${timestamp}@example.com`;
  const tenantEmail = `tenant-174-${timestamp}@example.com`;
  const workspaceSlug = `ws-174-${timestamp}`;
  const planSlug = `plan-174-${timestamp}`;

  try {
    await ensureDefaultAffiliatePrograms();
    await AffiliatePromptTemplateService.ensureDefaultTemplates();

    // 1. SuperAdmin and Tenant Setup
    console.log("\n--- Scenario 1: SuperAdmin vs Tenant Setup & Entitlements ---");
    const superAdmin = await prisma.user.create({
      data: { email: superAdminEmail, name: "Super Admin 174", isSuperAdmin: true },
    });

    const tenantUser = await prisma.user.create({
      data: { email: tenantEmail, name: "Tenant User 174", isSuperAdmin: false },
    });

    const plan = await prisma.plan.create({
      data: {
        name: "Plan Enterprise 174",
        slug: planSlug,
        maxArticles: 100,
        maxDailyArticles: 50,
        maxSources: 10,
        maxWordPressSites: 5,
      },
    });

    const affiliateFeature = await prisma.feature.findUniqueOrThrow({
      where: { key: "affiliate_module" },
    });
    await prisma.planFeature.create({
      data: { planId: plan.id, featureId: affiliateFeature.id, enabled: true },
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: `Workspace 174 ${timestamp}`,
        slug: workspaceSlug,
        members: { create: { userId: tenantUser.id, role: "OWNER" } },
        subscription: { create: { planId: plan.id, status: "ACTIVE" } },
      },
    });

    const mlProgram = await prisma.affiliateProgram.findUniqueOrThrow({
      where: { code: "MERCADO_LIVRE" },
    });

    const product1 = await prisma.product.create({
      data: {
        workspaceId: workspace.id,
        name: "Logitech MX Master 3S",
        brand: "Logitech",
        slug: `mx-master-3s-${timestamp}`,
        description: "Mouse ergonômico sem fio com sensor 8K DPI.",
        rating: 4.9,
        status: "ACTIVE",
        offers: {
          create: {
            workspaceId: workspace.id,
            affiliateProgramId: mlProgram.id,
            affiliateUrl: "https://produto.mercadolivre.com.br/MLB-17401-mxmaster",
            price: 549.0,
            seller: "Logitech Store",
            status: "ACTIVE",
          },
        },
      },
    });

    await prisma.product.create({
      data: {
        workspaceId: workspace.id,
        name: "Razer DeathAdder V3 Pro",
        brand: "Razer",
        slug: `deathadder-v3-${timestamp}`,
        description: "Mouse gamer ultraleve sem fio com switches ópticos.",
        rating: 4.8,
        status: "ACTIVE",
        offers: {
          create: {
            workspaceId: workspace.id,
            affiliateProgramId: mlProgram.id,
            affiliateUrl: "https://produto.mercadolivre.com.br/MLB-17402-deathadder",
            price: 799.0,
            seller: "Razer Store",
            status: "ACTIVE",
          },
        },
      },
    });

    console.log("✓ Scenario 1 PASS: SuperAdmin, Tenant, Workspace, Produtos e Ofertas configurados.");

    // 2. SuperAdmin Edits and Publishes New Global Template Version
    console.log("\n--- Scenario 2: SuperAdmin Versioning & Governance ---");
    const globalV2 = await AffiliatePromptTemplateService.createGlobalVersion("PRODUCT_REVIEW", {
      name: "Review Editorial Avançado v2",
      description: "Análise com benchmarks e testes de laboratório",
      systemPrompt: "Você é um especialista em benchmarks e reviews com tom imparcial e autoridade técnica.",
      userPromptTemplate: "Faça um review aprofundado de {{product.name}} (Marca: {{product.brand}}). Preço de referência: {{product.price}}. Avaliação: {{product.rating}}. Amostras: {{product.reviews}}.",
      active: true,
    });

    const activeTemplate = await AffiliatePromptTemplateService.getEffectiveTemplate(
      workspace.id,
      "PRODUCT_REVIEW"
    );

    if (activeTemplate.id !== globalV2.id || activeTemplate.version !== globalV2.version) {
      throw new Error(`FAIL Scenario 2: Template ativo incorreto! Esperado: v${globalV2.version}, Obtido: v${activeTemplate.version}`);
    }
    console.log("✓ Scenario 2 PASS: SuperAdmin versionou template global v2 com sucesso e propagou para o workspace.");

    // 3. Legacy Workspace Override Ignored by Generator
    console.log("\n--- Scenario 3: Legacy Workspace Override Stays in DB but Ignored by Generation ---");
    const legacyTenantOverride = await prisma.promptTemplate.create({
      data: {
        workspaceId: workspace.id,
        type: "PRODUCT_REVIEW",
        name: "Legacy Tenant Override 174",
        systemPrompt: "LEGACY OVERRIDE SYSTEM PROMPT",
        userPromptTemplate: "LEGACY OVERRIDE USER PROMPT",
        version: 99,
        active: true,
      },
    });

    const resolvedForTenant = await AffiliatePromptTemplateService.getEffectiveTemplate(
      workspace.id,
      "PRODUCT_REVIEW"
    );

    if (resolvedForTenant.isCustomOverride || resolvedForTenant.workspaceId !== null) {
      throw new Error("FAIL Scenario 3: getEffectiveTemplate usou override de workspace em vez do template global!");
    }
    console.log("✓ Scenario 3 PASS: Override legado no banco foi estritamente ignorado em favor do global.");

    // 4. Template Variable Validation & Security Guard
    console.log("\n--- Scenario 4: Template Variable Validation & Whitelist Enforcement ---");
    const invalidTemplateTest = AffiliatePromptTemplateService.validateTemplateVariables(
      "Review de {{product.name}} com {{hacked_system_secret}} e {{internal_eval_score}}",
      "PRODUCT_REVIEW"
    );
    if (invalidTemplateTest.valid || invalidTemplateTest.invalidVariables.length !== 2) {
      throw new Error("FAIL Scenario 4: Validador não bloqueou variáveis não autorizadas!");
    }

    const validTemplateTest = AffiliatePromptTemplateService.validateTemplateVariables(
      "Review de {{product.name}} (Marca: {{product.brand}}). Prós: {{product.pros}}. Contras: {{product.cons}}. Categoria: {{category.name}}.",
      "PRODUCT_REVIEW"
    );
    if (!validTemplateTest.valid || validTemplateTest.errors.length > 0) {
      throw new Error(`FAIL Scenario 4: Template válido foi incorretamente rejeitado: ${validTemplateTest.errors.join("; ")}`);
    }
    console.log("✓ Scenario 4 PASS: Whitelist de placeholders Mustache validada com rejeição estrita de variáveis desconhecidas.");

    // 5. Cardinality Enforcement Across Commercial Formats
    console.log("\n--- Scenario 5: Cardinality Constraints (Review=1, Comparison=2, BestProducts=N) ---");
    if (TEMPLATE_CONSTRAINTS.PRODUCT_REVIEW.minProducts !== 1 || TEMPLATE_CONSTRAINTS.PRODUCT_REVIEW.maxProducts !== 1) {
      throw new Error("FAIL Scenario 5: Regra de cardinalidade de Review deve ser exatamente 1!");
    }
    if (TEMPLATE_CONSTRAINTS.COMPARISON.minProducts !== 2 || TEMPLATE_CONSTRAINTS.COMPARISON.maxProducts !== 2) {
      throw new Error("FAIL Scenario 5: Regra de cardinalidade de Comparativo deve ser exatamente 2!");
    }
    if (TEMPLATE_CONSTRAINTS.BEST_PRODUCTS.minProducts !== 2 || TEMPLATE_CONSTRAINTS.BEST_PRODUCTS.requiresCategory !== true) {
      throw new Error("FAIL Scenario 5: BestProducts deve exigir categoria e pelo menos 2 produtos!");
    }
    console.log("✓ Scenario 5 PASS: Restrições formais de cardinalidade e categoria verificadas.");

    // 6. Article Generation with Audit Persistence (promptTemplateId & promptTemplateVersion)
    console.log("\n--- Scenario 6: Article Generation with Audit Persistence & Context Input ---");
    const mockAi: AIProvider = {
      name: "Mock AI 174",
      model: "mock-hardening-v1",
      async testConnection() { return { connected: true, provider: "mock", model: "mock-v1" }; },
      async generateArticle() {
        return {
          relevant: true,
          score: 9.8,
          title: "Análise Logitech MX Master 3S: O Melhor Mouse Ergonômico",
          summary: "Veredito editorial completo sobre precisão, ergonomia e produtividade.",
          content: "<p>O Logitech MX Master 3S estabelece o padrão de excelência para profissionais criativos.</p>",
          suggestedCategoryId: null,
          tags: ["Logitech", "Mouse", "Produtividade"],
          seoFocusKeyword: "mx master 3s review",
          seoTitle: "Review Logitech MX Master 3S - Vale a Pena?",
          seoDescription: "Análise detalhada do mouse topo de linha Logitech MX Master 3S.",
        };
      },
    };

    // Generate Review article with custom contextual instructions from tenant (without mutating global template)
    const reviewResult = await ProductReviewGenerator.generate({
      workspaceId: workspace.id,
      productId: product1.id,
      focusKeyword: "mx master 3s review completo",
      customInstructions: "Destaque a tecnologia de cliques silenciosos Quiet Clicks.",
      aiProvider: mockAi,
    });

    const savedArticle = await prisma.article.findUniqueOrThrow({
      where: { id: reviewResult.article.id },
    });

    if (savedArticle.promptTemplateId !== globalV2.id) {
      throw new Error(`FAIL Scenario 6: promptTemplateId incorreto! Esperado: ${globalV2.id}, Obtido: ${savedArticle.promptTemplateId}`);
    }

    if (savedArticle.promptTemplateVersion !== globalV2.version) {
      throw new Error(`FAIL Scenario 6: promptTemplateVersion incorreto! Esperado: ${globalV2.version}, Obtido: ${savedArticle.promptTemplateVersion}`);
    }

    console.log("✓ Scenario 6 PASS: Artigo gerado com auditoria rigorosa de template/versão e contexto preservado.");

    // 7. Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.articleProduct.deleteMany({ where: { articleId: savedArticle.id } });
    await prisma.article.deleteMany({ where: { id: savedArticle.id } });
    await prisma.promptTemplate.deleteMany({ where: { id: legacyTenantOverride.id } });
    await prisma.promptTemplate.deleteMany({ where: { id: globalV2.id } });
    await prisma.productOffer.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.product.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.workspace.delete({ where: { id: workspace.id } });
    await prisma.user.delete({ where: { id: superAdmin.id } });
    await prisma.user.delete({ where: { id: tenantUser.id } });
    await prisma.plan.delete({ where: { id: plan.id } });
    console.log("✓ Cleanup concluído.");

    console.log("\n=================================================================");
    console.log("TODOS OS TESTES DE INTEGRAÇÃO & HARDENING DA FASE 19 PASSARAM!");
    console.log("=================================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DA SUÍTE DE HARDENING DA FASE 19:", error);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
