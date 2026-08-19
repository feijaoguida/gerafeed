import { prisma } from "../src/lib/prisma";
import { BillingService } from "../src/lib/billing";

async function runTests() {
  console.log("=================================================");
  console.log("=== TEST: Task 072 - Feature & Plan Management ===");
  console.log("=================================================");

  // Cleanup test entities first
  await prisma.planFeature.deleteMany({
    where: {
      plan: { slug: { in: ["test-custom-plan", "test-plan-enterprise"] } },
    },
  });
  await prisma.plan.deleteMany({
    where: { slug: { in: ["test-custom-plan", "test-plan-enterprise"] } },
  });
  await prisma.feature.deleteMany({
    where: { key: { in: ["ai_image_gen", "custom_prompts", "multi_wordpress"] } },
  });

  try {
    // ----------------------------------------------------------------
    // 1. Create Features
    // ----------------------------------------------------------------
    const featImage = await prisma.feature.create({
      data: {
        key: "ai_image_gen",
        name: "Geração de Imagens IA",
        description: "Geração automática de capas via DALL-E / Imagen",
        valueType: "QUANTITY",
        active: true,
      },
    });

    const featMultiWp = await prisma.feature.create({
      data: {
        key: "multi_wordpress",
        name: "Múltiplos Destinos WordPress",
        description: "Conexão com múltiplos sites WordPress independentes",
        valueType: "BOOLEAN",
        active: true,
      },
    });

    console.log("✓ Check 1 PASS: Features criadas com sucesso:", featImage.key, featMultiWp.key);

    // ----------------------------------------------------------------
    // 2. Create Plan with PlanFeatures
    // ----------------------------------------------------------------
    const customPlan = await prisma.plan.create({
      data: {
        name: "Plano Enterprise Especial",
        slug: "test-plan-enterprise",
        description: "Plano exclusivo para grandes redações",
        price: 299.0,
        periodicity: "MONTHLY",
        active: true,
        highlight: true,
        maxArticles: 5000,
        maxSources: 100,
        planFeatures: {
          create: [
            {
              featureId: featImage.id,
              enabled: true,
              limit: 500, // 500 image generations
            },
            {
              featureId: featMultiWp.id,
              enabled: true,
              limit: null,
            },
          ],
        },
      },
      include: {
        planFeatures: {
          include: {
            feature: true,
          },
        },
      },
    });

    if (!customPlan || customPlan.planFeatures.length !== 2) {
      throw new Error("FAIL: Plano não foi criado com as features associadas.");
    }
    console.log("✓ Check 2 PASS: Plano criado e vinculado a features com limites específicos.");

    // ----------------------------------------------------------------
    // 3. Update Plan & Feature Toggles
    // ----------------------------------------------------------------
    const updatedPlan = await prisma.plan.update({
      where: { id: customPlan.id },
      data: {
        price: 349.0,
        highlight: false,
      },
    });

    if (updatedPlan.price !== 349.0 || updatedPlan.highlight !== false) {
      throw new Error("FAIL: Atualização de plano falhou.");
    }

    // Update PlanFeature limit
    const pfImage = customPlan.planFeatures.find((pf) => pf.featureId === featImage.id);
    if (!pfImage) throw new Error("PlanFeature de imagem não encontrada.");

    const updatedPf = await prisma.planFeature.update({
      where: { id: pfImage.id },
      data: { limit: 1000 },
    });

    if (updatedPf.limit !== 1000) {
      throw new Error("FAIL: Atualização de limite da PlanFeature falhou.");
    }
    console.log("✓ Check 3 PASS: Edição de plano e ajuste de limites de features validados.");

    // ----------------------------------------------------------------
    // 4. Validate BillingService compatibility
    // ----------------------------------------------------------------
    await BillingService.ensureDefaultPlans();
    const testWs = await prisma.workspace.upsert({
      where: { slug: "test-billing-features-ws" },
      update: {},
      create: { name: "Billing Features WS", slug: "test-billing-features-ws" },
    });

    // Assign custom plan
    await prisma.subscription.upsert({
      where: { workspaceId: testWs.id },
      update: { planId: customPlan.id },
      create: {
        workspaceId: testWs.id,
        planId: customPlan.id,
        status: "ACTIVE",
      },
    });

    const limitCheck = await BillingService.checkLimit(testWs.id, "ARTICLES");
    if (!limitCheck.allowed || limitCheck.limit !== 5000) {
      throw new Error(`FAIL: BillingService não reconheceu o limite de 5000 artigos: ${JSON.stringify(limitCheck)}`);
    }
    console.log("✓ Check 4 PASS: BillingService continua operando 100% integrado com o novo plano e limites.");

    // Cleanup
    await prisma.workspace.deleteMany({
      where: { slug: "test-billing-features-ws" },
    });

    console.log("\n=================================================");
    console.log(">>> TODOS OS TESTES DA TASK 072 PASSARAM COM SUCESSO! <<<");
    console.log("=================================================");
  } finally {
    // Final Cleanup
    await prisma.planFeature.deleteMany({
      where: {
        plan: { slug: { in: ["test-custom-plan", "test-plan-enterprise"] } },
      },
    });
    await prisma.plan.deleteMany({
      where: { slug: { in: ["test-custom-plan", "test-plan-enterprise"] } },
    });
    await prisma.feature.deleteMany({
      where: { key: { in: ["ai_image_gen", "custom_prompts", "multi_wordpress"] } },
    });
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRO NO TESTE DE FEATURES E PLANOS:", err);
    process.exit(1);
  });
