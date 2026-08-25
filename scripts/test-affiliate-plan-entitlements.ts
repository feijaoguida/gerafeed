import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES, SEED_FEATURES } from "@/lib/billing";

async function run() {
  console.log("=== TEST: Task 100 - Affiliate Plan Entitlements ===");

  const TEST_SLUG_AFFILIATE = "test-ws-affiliate-entitlements";
  const TEST_SLUG_BASIC = "test-ws-basic-no-affiliate";
  const TEST_PLAN_AFFILIATE_SLUG = "test-plan-affiliate-pro";
  const TEST_PLAN_BASIC_SLUG = "test-plan-basic-clean";

  try {
    // 0. Cleanup previous test state if any
    await prisma.subscription.deleteMany({
      where: {
        workspace: {
          slug: { in: [TEST_SLUG_AFFILIATE, TEST_SLUG_BASIC] },
        },
      },
    });
    await prisma.workspace.deleteMany({
      where: { slug: { in: [TEST_SLUG_AFFILIATE, TEST_SLUG_BASIC] } },
    });
    await prisma.planFeature.deleteMany({
      where: {
        plan: {
          slug: { in: [TEST_PLAN_AFFILIATE_SLUG, TEST_PLAN_BASIC_SLUG] },
        },
      },
    });
    await prisma.plan.deleteMany({
      where: { slug: { in: [TEST_PLAN_AFFILIATE_SLUG, TEST_PLAN_BASIC_SLUG] } },
    });

    // 1. Test Feature Seeding & Idempotency
    console.log("\n--- Check 1: Feature Seeding & Idempotency ---");
    await BillingService.ensureDefaultFeatures();
    await BillingService.ensureDefaultFeatures(); // Run second time to verify idempotency

    for (const feat of SEED_FEATURES) {
      const dbFeat = await prisma.feature.findUnique({
        where: { key: feat.key },
      });
      if (!dbFeat) {
        throw new Error(`FAIL: Feature ${feat.key} não encontrada após seed.`);
      }
      if (dbFeat.valueType !== feat.valueType) {
        throw new Error(`FAIL: Feature ${feat.key} com tipo incorreto: ${dbFeat.valueType} (esperado ${feat.valueType})`);
      }
    }
    console.log("✓ Check 1 PASS: Todas as 4 features de afiliados foram seedadas com sucesso e são idempotentes.");

    // 2. Test Plan & PlanFeature Creation (Backoffice capability)
    console.log("\n--- Check 2: Atribuição de Features no Plano ---");
    const featModule = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MODULE } });
    const featAnalytics = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.ANALYTICS } });
    const featMaxProducts = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MAX_PRODUCTS } });
    const featMaxPrograms = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MAX_PROGRAMS } });

    // Plan with Affiliate Enabled
    const affiliatePlan = await prisma.plan.create({
      data: {
        name: "Plano Afiliado Pro Test",
        slug: TEST_PLAN_AFFILIATE_SLUG,
        price: 199.0,
        planFeatures: {
          create: [
            { featureId: featModule.id, enabled: true },
            { featureId: featAnalytics.id, enabled: false }, // Explicitly disabled
            { featureId: featMaxProducts.id, enabled: true, limit: 50 },
            { featureId: featMaxPrograms.id, enabled: true, limit: 3 },
          ],
        },
      },
    });

    // Basic Plan without Affiliate Features
    const basicPlan = await prisma.plan.create({
      data: {
        name: "Plano Básico Sem Afiliados Test",
        slug: TEST_PLAN_BASIC_SLUG,
        price: 29.0,
      },
    });
    console.log("✓ Check 2 PASS: Planos criados com e sem features de afiliados.");

    // 3. Test Workspaces & Subscriptions
    console.log("\n--- Check 3: Workspace com Módulo de Afiliados Habilitado ---");
    const wsAffiliate = await prisma.workspace.create({
      data: {
        name: "Workspace Afiliado Test",
        slug: TEST_SLUG_AFFILIATE,
      },
    });
    await prisma.subscription.create({
      data: {
        workspaceId: wsAffiliate.id,
        planId: affiliatePlan.id,
        status: "ACTIVE",
      },
    });

    // Verify hasFeature (case-insensitive)
    const hasModuleLower = await BillingService.hasFeature(wsAffiliate.id, "affiliate_module");
    const hasModuleUpper = await BillingService.hasFeature(wsAffiliate.id, "AFFILIATE_MODULE");
    const hasAnalytics = await BillingService.hasFeature(wsAffiliate.id, "affiliate_analytics");

    if (!hasModuleLower || !hasModuleUpper) {
      throw new Error("FAIL: hasFeature retornou false para affiliate_module habilitado.");
    }
    if (hasAnalytics) {
      throw new Error("FAIL: hasFeature retornou true para affiliate_analytics desabilitado.");
    }

    // Verify assertFeature
    await BillingService.assertFeature(wsAffiliate.id, "affiliate_module"); // Must not throw
    let assertBlockedPassed = false;
    try {
      await BillingService.assertFeature(wsAffiliate.id, "affiliate_analytics");
    } catch {
      assertBlockedPassed = true;
    }
    if (!assertBlockedPassed) {
      throw new Error("FAIL: assertFeature não bloqueou feature desabilitada.");
    }
    console.log("✓ Check 3 PASS: Workspace com módulo autorizado passa na validação booleana e case-insensitive.");

    // 4. Test Workspace without Feature (Safe Fallback)
    console.log("\n--- Check 4: Workspace Sem Feature Mapeada (Fallback Seguro) ---");
    const wsBasic = await prisma.workspace.create({
      data: {
        name: "Workspace Básico Test",
        slug: TEST_SLUG_BASIC,
      },
    });
    await prisma.subscription.create({
      data: {
        workspaceId: wsBasic.id,
        planId: basicPlan.id,
        status: "ACTIVE",
      },
    });

    const hasModuleBasic = await BillingService.hasFeature(wsBasic.id, "affiliate_module");
    const limitBasic = await BillingService.getFeatureLimit(wsBasic.id, "affiliate_max_products");

    if (hasModuleBasic !== false) {
      throw new Error("FAIL: Workspace sem PlanFeature deve retornar false com segurança.");
    }
    if (limitBasic.enabled !== false || limitBasic.limit !== 0) {
      throw new Error(`FAIL: getFeatureLimit para plano sem feature deve retornar enabled:false e limit:0. Retornou: ${JSON.stringify(limitBasic)}`);
    }

    let basicAssertBlocked = false;
    try {
      await BillingService.assertFeature(wsBasic.id, "affiliate_module");
    } catch {
      basicAssertBlocked = true;
    }
    if (!basicAssertBlocked) {
      throw new Error("FAIL: assertFeature não bloqueou workspace sem feature.");
    }
    console.log("✓ Check 4 PASS: Workspace sem feature configurada é bloqueado com fallback seguro (enabled: false).");

    // 5. Test Quantity Limits & Enforcement
    console.log("\n--- Check 5: Validação de Limites Quantitativos (QUANTITY) ---");
    const productLimitInfo = await BillingService.getFeatureLimit(wsAffiliate.id, "affiliate_max_products");
    if (!productLimitInfo.enabled || productLimitInfo.limit !== 50) {
      throw new Error(`FAIL: Limite de produtos incorreto: ${JSON.stringify(productLimitInfo)}`);
    }

    // Check within limit (e.g. 10 / 50)
    const checkWithin = await BillingService.checkFeatureLimit(wsAffiliate.id, "affiliate_max_products", 10);
    if (!checkWithin.allowed) {
      throw new Error("FAIL: checkFeatureLimit rejeitou contagem dentro do limite.");
    }
    await BillingService.assertFeatureLimit(wsAffiliate.id, "affiliate_max_products", 10);

    // Check at limit (e.g. 50 / 50)
    const checkAtLimit = await BillingService.checkFeatureLimit(wsAffiliate.id, "affiliate_max_products", 50);
    if (checkAtLimit.allowed) {
      throw new Error("FAIL: checkFeatureLimit permitiu contagem no teto do limite.");
    }

    let limitAssertBlocked = false;
    try {
      await BillingService.assertFeatureLimit(wsAffiliate.id, "affiliate_max_products", 50);
    } catch (e: unknown) {
      limitAssertBlocked = true;
      if (e instanceof Error) {
        console.log(`  Mensagem esperada capturada: "${e.message}"`);
      }
    }
    if (!limitAssertBlocked) {
      throw new Error("FAIL: assertFeatureLimit não lançou erro quando limite foi atingido.");
    }

    // Check limit on basic workspace (0 limit)
    const checkBasicLimit = await BillingService.checkFeatureLimit(wsBasic.id, "affiliate_max_products", 0);
    if (checkBasicLimit.allowed) {
      throw new Error("FAIL: checkFeatureLimit no workspace básico permitiu uso com feature não contratada.");
    }

    console.log("✓ Check 5 PASS: Limites numéricos (QUANTITY) e mensagens de bloqueio validados com sucesso.");

    // 6. Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.subscription.deleteMany({
      where: {
        workspace: {
          slug: { in: [TEST_SLUG_AFFILIATE, TEST_SLUG_BASIC] },
        },
      },
    });
    await prisma.workspace.deleteMany({
      where: { slug: { in: [TEST_SLUG_AFFILIATE, TEST_SLUG_BASIC] } },
    });
    await prisma.planFeature.deleteMany({
      where: {
        plan: {
          slug: { in: [TEST_PLAN_AFFILIATE_SLUG, TEST_PLAN_BASIC_SLUG] },
        },
      },
    });
    await prisma.plan.deleteMany({
      where: { slug: { in: [TEST_PLAN_AFFILIATE_SLUG, TEST_PLAN_BASIC_SLUG] } },
    });
    console.log("✓ Cleanup concluído com sucesso.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 100 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 100:", error);
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
