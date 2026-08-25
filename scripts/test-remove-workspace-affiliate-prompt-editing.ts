import { prisma } from "@/lib/prisma";
import { AffiliatePromptTemplateService } from "@/lib/affiliate/prompt-template-service";
import { ensureDefaultAffiliatePrograms } from "@/lib/affiliate/seed";

async function run() {
  console.log("=== TEST: Task 173 - Remove Workspace Affiliate Prompt Editing ===");

  const timestamp = Date.now();
  const testEmail = `tenant-173-${timestamp}@example.com`;
  const workspaceSlug = `ws-173-${timestamp}`;
  const planSlug = `plan-173-${timestamp}`;

  try {
    await ensureDefaultAffiliatePrograms();
    await AffiliatePromptTemplateService.ensureDefaultTemplates();

    // 1. Setup Workspace with Affiliate Feature
    console.log("\n--- Check 1: Setup Workspace & Subscription ---");
    const user = await prisma.user.create({
      data: { email: testEmail, name: "Test User 173" },
    });

    const plan = await prisma.plan.create({
      data: {
        name: "Plan Pro 173",
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
        name: `Workspace 173 ${timestamp}`,
        slug: workspaceSlug,
        members: { create: { userId: user.id, role: "OWNER" } },
        subscription: { create: { planId: plan.id, status: "ACTIVE" } },
      },
    });

    console.log("✓ Check 1 PASS: Workspace criado e habilitado.");

    // 2. Template Selection (Read-Only) Works
    console.log("\n--- Check 2: Leitura e Seleção de Templates Globais pelo Workspace ---");
    const templates = await AffiliatePromptTemplateService.listTemplates(workspace.id);
    if (templates.length !== 7) {
      throw new Error(`FAIL Check 2: Esperado 7 templates, obtido ${templates.length}`);
    }

    const reviewTemplate = await AffiliatePromptTemplateService.getEffectiveTemplate(
      workspace.id,
      "PRODUCT_REVIEW"
    );

    if (reviewTemplate.isCustomOverride || reviewTemplate.workspaceId !== null) {
      throw new Error("FAIL Check 2: Template deveria ser estritamente global!");
    }
    console.log("✓ Check 2 PASS: Leitura e seleção de templates pelo workspace funcionando.");

    // 3. News / RSS Prompts Intact
    console.log("\n--- Check 3: Prompts de Notícias / RSS Permanecem Inalterados ---");
    // Verify Company / Workspace AI Settings for News works normally
    const { setConfig, getConfig } = await import("@/lib/config");
    await setConfig(
      "aiPromptSettings",
      {
        portalArea: "Tecnologia",
        writingStyles: ["Formal", "Jornalístico"],
        customWritingStyle: "Escreva com tom conciso.",
      },
      workspace.id
    );

    const savedNewsPrompt = await getConfig<{ portalArea: string; writingStyles: string[] }>(
      "aiPromptSettings",
      workspace.id
    );

    if (!savedNewsPrompt || savedNewsPrompt.portalArea !== "Tecnologia") {
      throw new Error("FAIL Check 3: Configurações de IA de notícias foram corrompidas!");
    }
    console.log("✓ Check 3 PASS: Configurações de IA e prompts de notícias permanecem intactos.");

    // Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.workspace.delete({ where: { id: workspace.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.plan.delete({ where: { id: plan.id } });
    console.log("✓ Cleanup concluído.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 173 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 173:", error);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
