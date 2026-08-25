import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";

async function run() {
  console.log("=== TEST: Task 161 - Publishing Center Shell ===");

  const timestamp = Date.now();
  const testEmail = `tenant-161-${timestamp}@example.com`;
  const workspaceSlug = `ws-161-${timestamp}`;
  const planSlug = `plan-161-${timestamp}`;

  try {
    // 1. Setup Workspace with Free Plan (without affiliate module)
    console.log("\n--- Check 1: Verificação de Permissões & Entitlements ---");
    const user = await prisma.user.create({
      data: { email: testEmail, name: "Test User 161" },
    });

    const plan = await prisma.plan.create({
      data: {
        name: "Plan Free 161",
        slug: planSlug,
        maxArticles: 50,
        maxDailyArticles: 5,
        maxSources: 3,
        maxWordPressSites: 1,
      },
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: `Workspace 161 ${timestamp}`,
        slug: workspaceSlug,
        members: {
          create: { userId: user.id, role: "OWNER" },
        },
        subscription: {
          create: { planId: plan.id, status: "ACTIVE" },
        },
      },
    });

    let hasModule = await BillingService.hasFeature(workspace.id, AFFILIATE_FEATURES.MODULE);
    if (hasModule) {
      throw new Error("FAIL Check 1: Workspace com plano básico não deveria possuir affiliate_module!");
    }
    console.log("✓ Check 1.1 PASS: Permissão de afiliados bloqueada para plano básico.");

    // Upgrade with affiliate_module feature
    const affiliateFeature = await prisma.feature.findUnique({
      where: { key: "affiliate_module" },
    });
    if (affiliateFeature) {
      await prisma.planFeature.create({
        data: {
          planId: plan.id,
          featureId: affiliateFeature.id,
          enabled: true,
        },
      });
    }

    hasModule = await BillingService.hasFeature(workspace.id, AFFILIATE_FEATURES.MODULE);
    if (!hasModule) {
      throw new Error("FAIL Check 1: Workspace com feature habilitada deveria possuir affiliate_module!");
    }
    console.log("✓ Check 1.2 PASS: Permissão de afiliados liberada com sucesso após upgrade.");

    // Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.workspace.delete({ where: { id: workspace.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.plan.delete({ where: { id: plan.id } });
    console.log("✓ Cleanup concluído.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 161 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 161:", error);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
