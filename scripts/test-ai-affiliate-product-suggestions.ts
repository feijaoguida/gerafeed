import { prisma } from "@/lib/prisma";
import { AffiliateSuggestionService } from "@/lib/affiliate/ai-suggestion-service";
import { ensureDefaultAffiliatePrograms } from "@/lib/affiliate/seed";

async function run() {
  console.log("=== TEST: Task 163 - AI Affiliate Product Suggestions ===");

  const timestamp = Date.now();
  const testEmail = `tenant-163-${timestamp}@example.com`;
  const workspaceSlug = `ws-163-${timestamp}`;
  const planSlug = `plan-163-${timestamp}`;

  try {
    await ensureDefaultAffiliatePrograms();

    // 1. Setup Workspace & Entitlement Check
    console.log("\n--- Check 1: Verificação de Entitlement (Plano com/sem Afiliados) ---");
    const user = await prisma.user.create({
      data: { email: testEmail, name: "Test User 163" },
    });

    const plan = await prisma.plan.create({
      data: {
        name: "Plan Free 163",
        slug: planSlug,
        maxArticles: 50,
        maxDailyArticles: 5,
        maxSources: 3,
        maxWordPressSites: 1,
      },
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: `Workspace 163 ${timestamp}`,
        slug: workspaceSlug,
        members: {
          create: { userId: user.id, role: "OWNER" },
        },
        subscription: {
          create: { planId: plan.id, status: "ACTIVE" },
        },
      },
    });

    const article = await prisma.article.create({
      data: {
        workspaceId: workspace.id,
        originalTitle: "Melhores Robôs Aspiradores para Comprar em 2026",
        originalDescription: "Guia completo sobre robôs aspiradores com mapeamento a laser e mop.",
        originalUrl: "https://technews.example.com/artigo-robo-aspirador",
        title: "Guia de Robôs Aspiradores Inteligentes 2026",
        summary: "Análise técnica dos robôs com navegação laser e alto poder de sucção.",
        status: "PENDING",
      },
    });

    // 1.1 Should throw when affiliate_module is not active
    let blockedWithoutEntitlement = false;
    try {
      await AffiliateSuggestionService.suggestAffiliateProductsForArticle(workspace.id, article.id);
    } catch (err) {
      if ((err as Error).message.includes("Módulo de Afiliados")) {
        blockedWithoutEntitlement = true;
      }
    }
    if (!blockedWithoutEntitlement) {
      throw new Error("FAIL Check 1.1: Deveria ter bloqueado sugestões para workspace sem feature affiliate_module!");
    }
    console.log("✓ Check 1.1 PASS: Entitlement verificado e bloqueado no plano básico.");

    // Enable affiliate_module
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

    // 2. Setup Catalog Products
    console.log("\n--- Check 2: Setup de Catálogo e Grounding ---");
    const mlProgram = await prisma.affiliateProgram.findUniqueOrThrow({
      where: { code: "MERCADO_LIVRE" },
    });

    const product1 = await prisma.product.create({
      data: {
        workspaceId: workspace.id,
        name: "Robô Aspirador Xiaomi Laser 5000Pa",
        brand: "Xiaomi",
        slug: `robo-xiaomi-${timestamp}`,
        status: "ACTIVE",
        offers: {
          create: {
            workspaceId: workspace.id,
            affiliateProgramId: mlProgram.id,
            affiliateUrl: "https://produto.mercadolivre.com.br/MLB-16301-xiaomi",
            price: 1899.9,
            seller: "Xiaomi Oficial",
            status: "ACTIVE",
          },
        },
      },
    });

    const product2 = await prisma.product.create({
      data: {
        workspaceId: workspace.id,
        name: "Cafeteira Espresso Nespresso Vertuo",
        brand: "Nespresso",
        slug: `cafeteira-vertuo-${timestamp}`,
        status: "ACTIVE",
        offers: {
          create: {
            workspaceId: workspace.id,
            affiliateProgramId: mlProgram.id,
            affiliateUrl: "https://produto.mercadolivre.com.br/MLB-16302-nespresso",
            price: 699.0,
            seller: "Nespresso Brasil",
            status: "ACTIVE",
          },
        },
      },
    });

    console.log("✓ Check 2 PASS: 2 produtos cadastrados no catálogo ativo.");

    // 3. Run AI Suggestions
    console.log("\n--- Check 3: Execução de Sugestões de Afiliados ---");
    const suggestions = await AffiliateSuggestionService.suggestAffiliateProductsForArticle(
      workspace.id,
      article.id
    );

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      throw new Error("FAIL Check 3: Nenhuma sugestão retornada para o artigo!");
    }

    // 4. Server-Side Validation: Verify that all returned product IDs strictly belong to the workspace
    console.log("\n--- Check 4: Validação Estrita Server-Side contra IDs Alucinados ---");
    for (const sug of suggestions) {
      if (![product1.id, product2.id].includes(sug.productId)) {
        throw new Error(`FAIL Check 4: ID de produto alucinado ou inválido retornado: '${sug.productId}'`);
      }
      if (!sug.productName || !sug.suggestedPlacement) {
        throw new Error("FAIL Check 4: Estrutura da sugestão incompleta.");
      }
    }
    console.log(`✓ Check 4 PASS: ${suggestions.length} sugestão(ões) estruturada(s) e 100% validada(s) server-side.`);

    // Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.productOffer.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.product.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.article.delete({ where: { id: article.id } });
    await prisma.workspace.delete({ where: { id: workspace.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.plan.delete({ where: { id: plan.id } });
    console.log("✓ Cleanup concluído.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 163 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 163:", error);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
