import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import { AffiliateService } from "@/lib/affiliate";

async function run() {
  console.log("=== TEST: Task 106 - Affiliate Navigation & Protected Routes ===");

  const WS_ENABLED_SLUG = "test-ws-nav-enabled";
  const WS_DISABLED_SLUG = "test-ws-nav-disabled";
  const PLAN_ENABLED_SLUG = "test-plan-nav-enabled";
  const PLAN_DISABLED_SLUG = "test-plan-nav-disabled";

  try {
    // 0. Cleanup
    await prisma.subscription.deleteMany({
      where: { workspace: { slug: { in: [WS_ENABLED_SLUG, WS_DISABLED_SLUG] } } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: { in: [WS_ENABLED_SLUG, WS_DISABLED_SLUG] } },
    });
    await prisma.planFeature.deleteMany({
      where: { plan: { slug: { in: [PLAN_ENABLED_SLUG, PLAN_DISABLED_SLUG] } } },
    });
    await prisma.plan.deleteMany({
      where: { slug: { in: [PLAN_ENABLED_SLUG, PLAN_DISABLED_SLUG] } },
    });

    // 1. Setup Plans (Enabled vs Disabled)
    console.log("\n--- Check 1: Configuração de Planos Habilitados vs Desabilitados ---");
    await BillingService.ensureDefaultFeatures();
    const featModule = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MODULE } });

    const planEnabled = await prisma.plan.create({
      data: {
        name: "Plano Com Afiliados",
        slug: PLAN_ENABLED_SLUG,
        price: 99.0,
        planFeatures: {
          create: [{ featureId: featModule.id, enabled: true }],
        },
      },
    });

    const planDisabled = await prisma.plan.create({
      data: {
        name: "Plano Sem Afiliados",
        slug: PLAN_DISABLED_SLUG,
        price: 29.0,
      },
    });

    const wsEnabled = await prisma.workspace.create({
      data: { name: "WS Com Afiliados", slug: WS_ENABLED_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsEnabled.id, planId: planEnabled.id, status: "ACTIVE" },
    });

    const wsDisabled = await prisma.workspace.create({
      data: { name: "WS Sem Afiliados", slug: WS_DISABLED_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsDisabled.id, planId: planDisabled.id, status: "ACTIVE" },
    });
    console.log("✓ Check 1 PASS: Workspaces e planos configurados.");

    // 2. Entitlement UI Flags
    console.log("\n--- Check 2: Verificação de Flags de Entitlement para UI ---");
    const hasNavEnabled = await BillingService.hasFeature(wsEnabled.id, AFFILIATE_FEATURES.MODULE);
    const hasNavDisabled = await BillingService.hasFeature(wsDisabled.id, AFFILIATE_FEATURES.MODULE);

    if (hasNavEnabled !== true) {
      throw new Error("FAIL: Workspace com plano Pro deve ter hasAffiliateModule = true.");
    }
    if (hasNavDisabled !== false) {
      throw new Error("FAIL: Workspace com plano básico deve ter hasAffiliateModule = false.");
    }
    console.log("✓ Check 2 PASS: Flags de navegação para Sidebar resolvidas corretamente.");

    // 3. API Route Protection (Blocked Workspace Rejection)
    console.log("\n--- Check 3: Proteção Server-side de Rotas e APIs ---");
    let blockedPreview = false;
    try {
      await AffiliateService.previewImport(wsDisabled.id, {
        affiliateUrl: "https://produto.mercadolivre.com.br/MLB-12345-teste",
      });
    } catch (e: unknown) {
      blockedPreview = true;
      if (e instanceof Error) {
        console.log(`  Mensagem esperada de bloqueio: "${e.message}"`);
      }
    }
    if (!blockedPreview) {
      throw new Error("FAIL: previewImport permitiu acesso a workspace sem o módulo de afiliados!");
    }

    let blockedConfirm = false;
    try {
      await AffiliateService.confirmImport(wsDisabled.id, {
        affiliateUrl: "https://produto.mercadolivre.com.br/MLB-12345-teste",
        name: "Produto Inválido",
      });
    } catch {
      blockedConfirm = true;
    }
    if (!blockedConfirm) {
      throw new Error("FAIL: confirmImport permitiu acesso a workspace sem o módulo de afiliados!");
    }
    console.log("✓ Check 3 PASS: Rotas de API protegidas rejeitaram requisições não autorizadas.");

    // 4. Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.subscription.deleteMany({
      where: { workspace: { slug: { in: [WS_ENABLED_SLUG, WS_DISABLED_SLUG] } } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: { in: [WS_ENABLED_SLUG, WS_DISABLED_SLUG] } },
    });
    await prisma.planFeature.deleteMany({
      where: { plan: { slug: { in: [PLAN_ENABLED_SLUG, PLAN_DISABLED_SLUG] } } },
    });
    await prisma.plan.deleteMany({
      where: { slug: { in: [PLAN_ENABLED_SLUG, PLAN_DISABLED_SLUG] } },
    });
    console.log("✓ Cleanup concluído.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 106 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 106:", error);
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
