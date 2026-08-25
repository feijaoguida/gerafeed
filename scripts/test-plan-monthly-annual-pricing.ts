import { prisma } from "../src/lib/prisma";
import { BillingService } from "../src/lib/billing";
import {
  calculateAnnualPlanPrice,
  calculateAnnualSavings,
  validatePlanPricing,
  formatCurrency,
} from "../src/lib/pricing";

async function runTests() {
  console.log("=================================================");
  console.log("=== TEST: Task 180 - Plan Monthly & Annual Pricing ===");
  console.log("=================================================");

  // Cleanup test plans if any
  await prisma.planFeature.deleteMany({
    where: { plan: { slug: { in: ["test-monthly-annual-plan", "test-free-plan"] } } },
  });
  await prisma.plan.deleteMany({
    where: { slug: { in: ["test-monthly-annual-plan", "test-free-plan"] } },
  });

  try {
    // ----------------------------------------------------------------
    // 1. Validation Cases for Helper Functions
    // ----------------------------------------------------------------
    console.log("\n--- 1. Testing Helper Calculations & Validations ---");

    // Case 1: 29.90 and 0%
    const c1Annual = calculateAnnualPlanPrice(29.90, 0);
    const c1Savings = calculateAnnualSavings(29.90, 0);
    console.log(`Case 1 (29.90 @ 0%): Annual = ${c1Annual.toString()}, Savings = ${c1Savings.toString()}`);
    if (c1Annual.toNumber() !== 358.80 || c1Savings.toNumber() !== 0.0) {
      throw new Error(`FAIL Case 1: Expected 358.80 and 0.00, got ${c1Annual} and ${c1Savings}`);
    }

    // Case 2: 29.90 and discount resulting close to 299.90 (e.g. 16.41583054626533% -> 299.90)
    // Using 16.41638795986622%
    const c2Annual = calculateAnnualPlanPrice(29.90, "16.41638795986622");
    const c2Savings = calculateAnnualSavings(29.90, "16.41638795986622");
    console.log(`Case 2 (29.90 @ 16.416...%): Annual = ${c2Annual.toString()}, Savings = ${c2Savings.toString()}`);
    if (c2Annual.toNumber() !== 299.90 || c2Savings.toNumber() !== 58.90) {
      throw new Error(`FAIL Case 2: Expected 299.90 and 58.90, got ${c2Annual} and ${c2Savings}`);
    }

    // Case 3: 0 and 0% (Free plan)
    const c3Annual = calculateAnnualPlanPrice(0, 0);
    const c3Savings = calculateAnnualSavings(0, 0);
    console.log(`Case 3 (0 @ 0%): Annual = ${c3Annual.toString()}, Savings = ${c3Savings.toString()}`);
    if (c3Annual.toNumber() !== 0 || c3Savings.toNumber() !== 0) {
      throw new Error(`FAIL Case 3: Expected 0 and 0, got ${c3Annual} and ${c3Savings}`);
    }

    // Case 4: Negative discount blocked
    const c4Val = validatePlanPricing(29.90, -5);
    console.log(`Case 4 (Negative Discount): Valid = ${c4Val.valid}, Error = ${c4Val.error}`);
    if (c4Val.valid) {
      throw new Error("FAIL Case 4: Negative discount should be blocked.");
    }

    // Case 5: 100% discount blocked
    const c5Val = validatePlanPricing(29.90, 100);
    console.log(`Case 5 (100% Discount): Valid = ${c5Val.valid}, Error = ${c5Val.error}`);
    if (c5Val.valid) {
      throw new Error("FAIL Case 5: 100% discount should be blocked.");
    }

    // Case 6: Negative monthly price blocked
    const c6Val = validatePlanPricing(-10, 15);
    console.log(`Case 6 (Negative Monthly Price): Valid = ${c6Val.valid}, Error = ${c6Val.error}`);
    if (c6Val.valid) {
      throw new Error("FAIL Case 6: Negative monthly price should be blocked.");
    }

    console.log("✓ Check 1 PASS: Todas as regras de cálculo e validação de precificação passaram.");

    // ----------------------------------------------------------------
    // 2. Database Schema & Prisma Persistence
    // ----------------------------------------------------------------
    console.log("\n--- 2. Testing Prisma Model Persistence ---");

    const createdPlan = await prisma.plan.create({
      data: {
        name: "Plano Teste Mensal/Anual",
        slug: "test-monthly-annual-plan",
        description: "Plano para validação de precificação",
        price: 29.90,
        monthlyPrice: 29.90,
        annualDiscountPercent: 16.42,
        maxArticles: 100,
        maxDailyArticles: 10,
        maxSources: 5,
        maxWordPressSites: 2,
      },
    });

    console.log(`✓ Plan criado com ID: ${createdPlan.id}`);
    console.log(`  monthlyPrice (Decimal): ${createdPlan.monthlyPrice}`);
    console.log(`  annualDiscountPercent (Decimal): ${createdPlan.annualDiscountPercent}`);

    if (
      Number(createdPlan.monthlyPrice) !== 29.90 ||
      Number(createdPlan.annualDiscountPercent) !== 16.42
    ) {
      throw new Error("FAIL: Valores persistidos no banco não batem com o esperado.");
    }

    // Update plan pricing
    const updatedPlan = await prisma.plan.update({
      where: { id: createdPlan.id },
      data: {
        monthlyPrice: 49.90,
        annualDiscountPercent: 20.0,
      },
    });

    if (
      Number(updatedPlan.monthlyPrice) !== 49.90 ||
      Number(updatedPlan.annualDiscountPercent) !== 20.0
    ) {
      throw new Error("FAIL: Atualização de preço no banco falhou.");
    }

    console.log("✓ Check 2 PASS: Persistência Prisma e atualizações de campos Decimal validadas.");

    // ----------------------------------------------------------------
    // 3. BillingService Default Plans Verification
    // ----------------------------------------------------------------
    console.log("\n--- 3. Testing BillingService.ensureDefaultPlans ---");

    await BillingService.ensureDefaultPlans();

    const starterPlan = await prisma.plan.findUnique({
      where: { slug: "starter" },
    });

    if (!starterPlan || Number(starterPlan.monthlyPrice) !== 47.0) {
      throw new Error("FAIL: BillingService não inicializou o plano Starter com monthlyPrice.");
    }

    console.log("✓ Check 3 PASS: ensureDefaultPlans atualizou SEED_PLANS com monthlyPrice e annualDiscountPercent.");

    // Format currency check
    const formatted = formatCurrency(29.90);
    console.log(`Format currency test: ${formatted}`);
    if (formatted !== "R$ 29,90") {
      throw new Error(`FAIL formatCurrency: Expected "R$ 29,90", got "${formatted}"`);
    }

    console.log("\n=================================================");
    console.log(">>> TODOS OS TESTES DA TASK 180 PASSARAM COM SUCESSO! <<<");
    console.log("=================================================");
  } finally {
    // Cleanup
    await prisma.planFeature.deleteMany({
      where: { plan: { slug: { in: ["test-monthly-annual-plan", "test-free-plan"] } } },
    });
    await prisma.plan.deleteMany({
      where: { slug: { in: ["test-monthly-annual-plan", "test-free-plan"] } },
    });
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRO NO TESTE DE PRECIFICAÇÃO MENSAL E ANUAL:", err);
    process.exit(1);
  });
