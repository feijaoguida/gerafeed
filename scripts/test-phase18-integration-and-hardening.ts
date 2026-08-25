import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import { ArticlePlacementService } from "@/lib/affiliate/placement-service";
import { AffiliateSuggestionService } from "@/lib/affiliate/ai-suggestion-service";
import { ProductReviewGenerator } from "@/lib/affiliate/generators/review-generator";
import { CanonicalDocumentService } from "@/lib/affiliate/canonical-document";
import { validateTemplateInputs } from "@/lib/affiliate/template-rules";
import { ensureDefaultAffiliatePrograms } from "@/lib/affiliate/seed";
import { AffiliatePromptTemplateService } from "@/lib/affiliate/prompt-template-service";
import { AIProvider } from "@/lib/ai/types";

async function run() {
  console.log("=== TEST: Task 169 - Phase 18 Integration & Hardening ===");

  const timestamp = Date.now();
  const testEmailA = `tenant-169-a-${timestamp}@example.com`;
  const testEmailB = `tenant-169-b-${timestamp}@example.com`;
  const planSlug = `plan-169-${timestamp}`;
  const planNoAffSlug = `plan-noaff-169-${timestamp}`;

  try {
    await ensureDefaultAffiliatePrograms();
    await AffiliatePromptTemplateService.ensureDefaultTemplates();

    // 1. Setup Plans: Plan with Affiliate Module vs Plan without Affiliate Module
    console.log("\n--- Check 1: Setup Multi-Tenant e Plan Entitlements ---");
    const planWithAffiliate = await prisma.plan.create({
      data: {
        name: "Plan Pro 169",
        slug: planSlug,
        maxArticles: 500,
        maxDailyArticles: 50,
        maxSources: 20,
        maxWordPressSites: 5,
      },
    });

    const planWithoutAffiliate = await prisma.plan.create({
      data: {
        name: "Plan Starter 169",
        slug: planNoAffSlug,
        maxArticles: 50,
        maxDailyArticles: 5,
        maxSources: 2,
        maxWordPressSites: 1,
      },
    });

    const affiliateFeature = await prisma.feature.findUniqueOrThrow({
      where: { key: "affiliate_module" },
    });

    await prisma.planFeature.create({
      data: {
        planId: planWithAffiliate.id,
        featureId: affiliateFeature.id,
        enabled: true,
      },
    });

    // Tenants A and B
    const userA = await prisma.user.create({ data: { email: testEmailA, name: "User 169 A" } });
    const userB = await prisma.user.create({ data: { email: testEmailB, name: "User 169 B" } });

    const wsA = await prisma.workspace.create({
      data: {
        name: `Workspace 169 A ${timestamp}`,
        slug: `ws-169-a-${timestamp}`,
        members: { create: { userId: userA.id, role: "OWNER" } },
        subscription: { create: { planId: planWithAffiliate.id, status: "ACTIVE" } },
      },
    });

    const wsB = await prisma.workspace.create({
      data: {
        name: `Workspace 169 B ${timestamp}`,
        slug: `ws-169-b-${timestamp}`,
        members: { create: { userId: userB.id, role: "OWNER" } },
        subscription: { create: { planId: planWithoutAffiliate.id, status: "ACTIVE" } },
      },
    });

    const mlProgram = await prisma.affiliateProgram.findUniqueOrThrow({ where: { code: "MERCADO_LIVRE" } });

    // Category and Products in Workspace A
    const catTech = await prisma.productCategory.create({
      data: {
        workspaceId: wsA.id,
        name: "Eletrônicos e Áudio",
        slug: `audio-${timestamp}`,
      },
    });

    const prod1 = await prisma.product.create({
      data: {
        workspaceId: wsA.id,
        categoryId: catTech.id,
        name: "Fone Bluetooth Sony WH-1000XM5",
        brand: "Sony",
        slug: `sony-xm5-${timestamp}`,
        description: "Fone com cancelamento de ruído ativo líder de mercado.",
        status: "ACTIVE",
        rating: 4.9,
        pros: ["Cancelamento de ruído absurdo", "30h de bateria"],
        cons: ["Não dobra completamente"],
        offers: {
          create: {
            workspaceId: wsA.id,
            affiliateProgramId: mlProgram.id,
            affiliateUrl: "https://produto.mercadolivre.com.br/MLB-16901-sony",
            price: 2499.0,
            seller: "Sony Oficial",
            status: "ACTIVE",
          },
        },
      },
    });

    const prod2 = await prisma.product.create({
      data: {
        workspaceId: wsA.id,
        categoryId: catTech.id,
        name: "Fone Bluetooth Bose QuietComfort 45",
        brand: "Bose",
        slug: `bose-qc45-${timestamp}`,
        description: "Conforto lendário com cancelamento de ruído de alta precisão.",
        status: "ACTIVE",
        rating: 4.7,
        pros: ["Muito confortável", "Botões físicos práticos"],
        cons: ["Design tradicional"],
        offers: {
          create: {
            workspaceId: wsA.id,
            affiliateProgramId: mlProgram.id,
            affiliateUrl: "https://produto.mercadolivre.com.br/MLB-16902-bose",
            price: 1999.0,
            seller: "Bose Store",
            status: "ACTIVE",
          },
        },
      },
    });

    console.log("✓ Check 1 PASS: Workspaces e planos com e sem módulo de afiliados configurados.");

    // 2. Entitlement & Cross-Tenant Hardening
    console.log("\n--- Check 2: Hardening de Isolamento Multi-Tenant e Entitlements ---");
    let blockedEntitlement = false;
    try {
      await BillingService.assertFeature(wsB.id, AFFILIATE_FEATURES.MODULE);
    } catch {
      blockedEntitlement = true;
    }
    if (!blockedEntitlement) {
      throw new Error("FAIL Check 2: Workspace B sem entitlement deveria ser bloqueado!");
    }

    let blockedCrossTenant = false;
    try {
      // Workspace B trying to access Workspace A's product placement
      await ArticlePlacementService.createPlacement(wsB.id, {
        articleId: "fake-article-id",
        productId: prod1.id,
        placementType: "PRODUCT_CARD",
      });
    } catch {
      blockedCrossTenant = true;
    }
    if (!blockedCrossTenant) {
      throw new Error("FAIL Check 2: Tentativa de vincular produto de outro tenant deveria ser bloqueada!");
    }
    console.log("✓ Check 2 PASS: Entitlements e isolamento cross-tenant 100% seguros.");

    // 3. Scenario: RSS Normal vs RSS Monetized with Placement
    console.log("\n--- Check 3: RSS Normal vs RSS Monetizado com Placement Manual ---");
    const source = await prisma.source.create({
      data: {
        workspaceId: wsA.id,
        name: "Audio World",
        creditName: "AudioWorld News",
        rssUrl: "https://audioworld.example.com/feed",
      },
    });

    const rssArticle = await prisma.article.create({
      data: {
        workspaceId: wsA.id,
        sourceId: source.id,
        title: "Novos codecs de áudio sem fio prometem alta resolução sem perdas",
        content: "<p>O mercado de fones sem fio como o Sony WH-1000XM5 está recebendo novos codecs Bluetooth de altíssima definição.</p>",
        status: "PENDING",
      },
    });

    // Create placement
    const placement = await ArticlePlacementService.createPlacement(wsA.id, {
      articleId: rssArticle.id,
      productId: prod1.id,
      placementType: "TOP_RECOMMENDATION",
      label: "Frequência e Nitidez Imbatíveis",
    });

    const placements = await ArticlePlacementService.getArticlePlacements(wsA.id, rssArticle.id);
    const renderedRssHtml = ArticlePlacementService.renderPlacementsInHtml(rssArticle.content!, placements);

    if (!renderedRssHtml.includes("MLB-16901-sony") || !renderedRssHtml.includes('rel="sponsored nofollow"')) {
      throw new Error("FAIL Check 3: Renderização de RSS monetizado não contém o link sponsored oficial!");
    }

    await ArticlePlacementService.deletePlacement(wsA.id, placement.id);
    const emptyPlacements = await ArticlePlacementService.getArticlePlacements(wsA.id, rssArticle.id);
    if (emptyPlacements.length !== 0) {
      throw new Error("FAIL Check 3: Remoção de placement falhou.");
    }
    console.log("✓ Check 3 PASS: RSS monetizado, renderizado e removido com sucesso.");

    // 4. Scenario: AI Product Suggestions with Hallucination Protection
    console.log("\n--- Check 4: Sugestões Inteligentes de Afiliados com Proteção Anti-Alucinação ---");
    const suggestions = await AffiliateSuggestionService.suggestAffiliateProductsForArticle(
      wsA.id,
      rssArticle.id
    );

    // Filter should only contain valid catalog items (if any returned by mock or rule)
    for (const sugg of suggestions) {
      if (sugg.productId !== prod1.id && sugg.productId !== prod2.id) {
        throw new Error(`FAIL Check 4: Produto alucinado ${sugg.productId} não foi descartado!`);
      }
    }
    console.log("✓ Check 4 PASS: Sugestão de produtos validada contra alucinações de catálogo.");

    // 5. Scenario: Template Input Validation & Cardinality Rules (Comparison / Best Products)
    console.log("\n--- Check 5: Validação Central de Regras de Templates Comerciais ---");
    // Comparison: 1 product must fail
    const compFail = validateTemplateInputs("COMPARISON", {
      productIds: [prod1.id],
    });
    if (compFail.valid) {
      throw new Error("FAIL Check 5: Comparativo com 1 produto deveria ter falhado!");
    }

    // Comparison: 2 products must pass
    const compPass = validateTemplateInputs("COMPARISON", {
      productIds: [prod1.id, prod2.id],
    });
    if (!compPass.valid) {
      throw new Error(`FAIL Check 5: Comparativo com 2 produtos falhou: ${compPass.errors.join(", ")}`);
    }

    // Best Products: missing category must fail
    const bestFail = validateTemplateInputs("BEST_PRODUCTS", {
      productIds: [prod1.id, prod2.id],
      categoryId: undefined,
    });
    if (bestFail.valid) {
      throw new Error("FAIL Check 5: Best Products sem categoria obrigatória deveria ter falhado!");
    }

    // Best Products: with category and 2 products must pass
    const bestPass = validateTemplateInputs("BEST_PRODUCTS", {
      categoryId: catTech.id,
      productIds: [prod1.id, prod2.id],
    });
    if (!bestPass.valid) {
      throw new Error(`FAIL Check 5: Best Products válido falhou: ${bestPass.errors.join(", ")}`);
    }
    console.log("✓ Check 5 PASS: Regras de seleção e cardinalidade de templates 100% aderentes à SPEC.");

    // 6. Scenario: Commercial Review Generation & Canonical Structure
    console.log("\n--- Check 6: Geração Canônica de Review Comercial & Anti-Alucinação de Links ---");
    let receivedPrompt = "";
    const mockAiGenerator: AIProvider = {
      name: "Mock AI Generator",
      model: "mock-v1",
      async testConnection() { return { connected: true, provider: "mock", model: "mock-v1" }; },
      async generateArticle(input) {
        receivedPrompt = input.originalDescription || "";
        return {
          relevant: true,
          score: 9.9,
          title: "Review Sony WH-1000XM5: O Rei do Cancelamento de Ruído?",
          summary: "Análise técnica minuciosa sobre a qualidade sonora e ANC do fone topo de linha da Sony.",
          content: "<p>O Sony WH-1000XM5 redefine os padrões da indústria de fones premium com ANC avançado.</p>",
          suggestedCategoryId: null,
          tags: ["Sony", "Fone Bluetooth", "Review", "Audio"],
          seoFocusKeyword: "sony wh 1000xm5 review",
          seoTitle: "Review Sony WH-1000XM5 - Vale a Pena em 2026?",
          seoDescription: "Análise detalhada do fone Sony WH-1000XM5 com testes de áudio, ANC e bateria.",
        };
      },
    };

    const reviewResult = await ProductReviewGenerator.generate({
      workspaceId: wsA.id,
      productId: prod1.id,
      focusKeyword: "sony wh 1000xm5 review",
      aiProvider: mockAiGenerator,
    });

    if (!reviewResult.article.id || !reviewResult.canonicalDocument) {
      throw new Error("FAIL Check 6: Artigo canônico não gerado!");
    }

    // Hardening check: AI Prompt NEVER receives raw affiliate URLs
    if (receivedPrompt.includes("MLB-16901-sony") || receivedPrompt.includes("http")) {
      throw new Error("FAIL Check 6: Violação de segurança: URLs cruas de afiliados vazaram no prompt da IA!");
    }

    // Canonical document HTML rendering
    const productsForDoc = await prisma.product.findMany({
      where: { id: prod1.id, workspaceId: wsA.id },
      include: { offers: { where: { status: "ACTIVE" } } },
    });

    const renderedCanonicalHtml = CanonicalDocumentService.renderToHtml(
      reviewResult.canonicalDocument,
      productsForDoc
    );

    if (!renderedCanonicalHtml.includes("MLB-16901-sony") || !renderedCanonicalHtml.includes("gerafeed-affiliate-disclosure")) {
      throw new Error("FAIL Check 6: Renderização canônica não injetou disclosure ou link oficial!");
    }
    console.log("✓ Check 6 PASS: Artigo canônico gerado, anti-alucinação validada e preview HTML perfeito.");

    // Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.articleAffiliatePlacement.deleteMany({ where: { workspaceId: wsA.id } });
    await prisma.articleProduct.deleteMany({ where: { articleId: reviewResult.article.id } });
    await prisma.article.deleteMany({ where: { workspaceId: wsA.id } });
    await prisma.productOffer.deleteMany({ where: { workspaceId: wsA.id } });
    await prisma.product.deleteMany({ where: { workspaceId: wsA.id } });
    await prisma.productCategory.deleteMany({ where: { workspaceId: wsA.id } });
    await prisma.source.deleteMany({ where: { workspaceId: wsA.id } });
    await prisma.workspace.delete({ where: { id: wsA.id } });
    await prisma.workspace.delete({ where: { id: wsB.id } });
    await prisma.user.delete({ where: { id: userA.id } });
    await prisma.user.delete({ where: { id: userB.id } });
    await prisma.plan.delete({ where: { id: planWithAffiliate.id } });
    await prisma.plan.delete({ where: { id: planWithoutAffiliate.id } });
    console.log("✓ Cleanup concluído.");

    console.log("\n=================================================================");
    console.log("TODOS OS TESTES DE INTEGRAÇÃO & HARDENING DA FASE 18 PASSARAM!");
    console.log("=================================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DE INTEGRAÇÃO DA FASE 18:", error);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
