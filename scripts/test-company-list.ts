import { prisma } from "../src/lib/prisma";
import { BillingService } from "../src/lib/billing";

async function runTests() {
  console.log("=================================================");
  console.log("=== TEST: Task 073 - Company List & Management ==");
  console.log("=================================================");

  // Ensure default plans exist
  await BillingService.ensureDefaultPlans();
  const freePlan = await prisma.plan.findUniqueOrThrow({ where: { slug: "free" } });
  const proPlan = await prisma.plan.findUniqueOrThrow({ where: { slug: "pro" } });

  // Cleanup test workspaces
  await prisma.workspace.deleteMany({
    where: {
      slug: {
        in: [
          "test-co-alpha-list",
          "test-co-beta-list",
          "test-co-gamma-inactive",
        ],
      },
    },
  });

  const wsAlpha = await prisma.workspace.create({
    data: {
      name: "Alpha Media News",
      slug: "test-co-alpha-list",
      active: true,
      subscription: {
        create: {
          planId: proPlan.id,
          status: "ACTIVE",
        },
      },
    },
  });

  const wsBeta = await prisma.workspace.create({
    data: {
      name: "Beta Tech Daily",
      slug: "test-co-beta-list",
      active: true,
      subscription: {
        create: {
          planId: freePlan.id,
          status: "ACTIVE",
        },
      },
    },
  });

  const wsGamma = await prisma.workspace.create({
    data: {
      name: "Gamma Inactive Portal",
      slug: "test-co-gamma-inactive",
      active: false,
      subscription: {
        create: {
          planId: freePlan.id,
          status: "ACTIVE",
        },
      },
    },
  });

  console.log("✓ Empresas de teste criadas:", wsAlpha.slug, wsBeta.slug, wsGamma.slug);

  try {
    // ----------------------------------------------------------------
    // 1. Search Query Test
    // ----------------------------------------------------------------
    const searchResults = await prisma.workspace.findMany({
      where: {
        OR: [
          { name: { contains: "Alpha", mode: "insensitive" } },
          { slug: { contains: "Alpha", mode: "insensitive" } },
        ],
      },
    });

    if (searchResults.length !== 1 || searchResults[0].slug !== wsAlpha.slug) {
      throw new Error("FAIL: Busca por 'Alpha' não retornou o resultado esperado.");
    }
    console.log("✓ Check 1 PASS: Busca por texto/slug funcionando com precisão.");

    // ----------------------------------------------------------------
    // 2. Status Filter Test
    // ----------------------------------------------------------------
    const inactiveWorkspaces = await prisma.workspace.findMany({
      where: { active: false, slug: { in: [wsAlpha.slug, wsBeta.slug, wsGamma.slug] } },
    });

    if (inactiveWorkspaces.length !== 1 || inactiveWorkspaces[0].slug !== wsGamma.slug) {
      throw new Error("FAIL: Filtro por status 'inactive' falhou.");
    }
    console.log("✓ Check 2 PASS: Filtro por status (ativos/inativos) funcionando.");

    // ----------------------------------------------------------------
    // 3. Plan Filter Test
    // ----------------------------------------------------------------
    const proWorkspaces = await prisma.workspace.findMany({
      where: {
        slug: { in: [wsAlpha.slug, wsBeta.slug, wsGamma.slug] },
        subscription: {
          plan: { slug: "pro" },
        },
      },
    });

    if (proWorkspaces.length !== 1 || proWorkspaces[0].slug !== wsAlpha.slug) {
      throw new Error("FAIL: Filtro por plano 'pro' falhou.");
    }
    console.log("✓ Check 3 PASS: Filtro por plano funcionando.");

    // ----------------------------------------------------------------
    // 4. Safe Inactivation / Activation Test
    // ----------------------------------------------------------------
    const inactivatedAlpha = await prisma.workspace.update({
      where: { id: wsAlpha.id },
      data: { active: false },
    });
    if (inactivatedAlpha.active !== false) {
      throw new Error("FAIL: Inativação segura falhou.");
    }

    const reactivatedAlpha = await prisma.workspace.update({
      where: { id: wsAlpha.id },
      data: { active: true },
    });
    if (reactivatedAlpha.active !== true) {
      throw new Error("FAIL: Reativação segura falhou.");
    }
    console.log("✓ Check 4 PASS: Inativação e reativação seguras validadas.");

    // ----------------------------------------------------------------
    // 5. Usage & Quota stats integration with BillingService
    // ----------------------------------------------------------------
    const limitCheck = await BillingService.checkLimit(wsAlpha.id, "ARTICLES");
    if (!limitCheck.allowed || limitCheck.limit !== proPlan.maxArticles) {
      throw new Error("FAIL: Limites e métricas não coincidem com plano Pro.");
    }
    console.log("✓ Check 5 PASS: Consumo e cotas integrados perfeitamente com o BillingService.");

    console.log("\n=================================================");
    console.log(">>> TODOS OS TESTES DA TASK 073 PASSARAM COM SUCESSO! <<<");
    console.log("=================================================");
  } finally {
    // Cleanup
    await prisma.workspace.deleteMany({
      where: {
        slug: {
          in: [
            "test-co-alpha-list",
            "test-co-beta-list",
            "test-co-gamma-inactive",
          ],
        },
      },
    });
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRO NO TESTE DE LISTA DE EMPRESAS:", err);
    process.exit(1);
  });
