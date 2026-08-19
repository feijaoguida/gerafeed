import { prisma } from "../src/lib/prisma";
import { isSuperAdminUser } from "../src/lib/superadmin";

async function runTests() {
  console.log("=================================================");
  console.log("=== TEST: Task 071 - Backoffice Shell & Protection ===");
  console.log("=================================================");

  // Setup test users
  const standardUser = await prisma.user.create({
    data: {
      name: "Standard Client",
      email: `client-${Date.now()}@test.com`,
      isSuperAdmin: false,
    },
  });

  const superAdminUser = await prisma.user.create({
    data: {
      name: "SuperAdmin Tester",
      email: `super-${Date.now()}@test.com`,
      isSuperAdmin: true,
    },
  });

  console.log("✓ Usuários de teste criados:", standardUser.id, superAdminUser.id);

  try {
    // 1. Test Server-side Guard logic for Standard User
    const isStandardSuper = await isSuperAdminUser(standardUser.id);
    if (isStandardSuper !== false) {
      throw new Error("FAIL: Usuário comum obteve acesso ao Backoffice Shell!");
    }
    console.log("✓ Check 1 PASS: Usuário comum bloqueado com segurança do Backoffice Shell.");

    // 2. Test Server-side Guard logic for SuperAdmin User
    const isSuper = await isSuperAdminUser(superAdminUser.id);
    if (isSuper !== true) {
      throw new Error("FAIL: SuperAdmin foi bloqueado do Backoffice Shell!");
    }
    console.log("✓ Check 2 PASS: SuperAdmin autorizado no Backoffice Shell.");

    // 3. Test Backoffice Routes & Database Queries for Shell
    const companies = await prisma.workspace.findMany({
      take: 5,
      include: {
        members: true,
        sources: true,
        wordpressSites: true,
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    const plans = await prisma.plan.findMany({
      include: {
        subscriptions: true,
      },
    });

    if (!Array.isArray(companies) || !Array.isArray(plans)) {
      throw new Error("FAIL: Falha ao carregar dados das telas do Backoffice Shell.");
    }
    console.log(`✓ Check 3 PASS: Queries das páginas /backoffice, /backoffice/companies e /backoffice/plans executadas com sucesso (${companies.length} empresas, ${plans.length} planos).`);

    console.log("\n=================================================");
    console.log(">>> TODOS OS TESTES DA TASK 071 PASSARAM COM SUCESSO! <<<");
    console.log("=================================================");
  } finally {
    // Cleanup
    await prisma.user.deleteMany({
      where: { id: { in: [standardUser.id, superAdminUser.id] } },
    });
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRO NO TESTE DO BACKOFFICE SHELL:", err);
    process.exit(1);
  });
