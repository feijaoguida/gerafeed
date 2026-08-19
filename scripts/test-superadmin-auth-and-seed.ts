import { prisma } from "../src/lib/prisma";
import { seedSuperAdmin, isSuperAdminUser } from "../src/lib/superadmin";

async function runTests() {
  console.log("=================================================");
  console.log("=== TEST: Task 070 - SuperAdmin Auth & Seed ===");
  console.log("=================================================");

  // 1. Test Regular User creation has isSuperAdmin: false by default
  const regularUser = await prisma.user.create({
    data: {
      name: "Regular Tenant User",
      email: `regular-${Date.now()}@example.com`,
    },
  });

  if (regularUser.isSuperAdmin !== false) {
    throw new Error("FAIL: Usuário comum deveria ter isSuperAdmin: false por padrão!");
  }
  console.log("✓ Check 1 PASS: User model possui isSuperAdmin com default false.");

  const isRegularSuper = await isSuperAdminUser(regularUser.id);
  if (isRegularSuper !== false) {
    throw new Error("FAIL: isSuperAdminUser retornou true para usuário comum!");
  }
  console.log("✓ Check 2 PASS: Usuário comum bloqueado por isSuperAdminUser.");

  // 2. Test SuperAdmin Seed with environment variables
  const testSuperEmail = "superadmin@newscurator.test";
  const testSuperPass = "super_secret_password_do_not_log";

  process.env.SUPERADMIN_EMAIL = testSuperEmail;
  process.env.SUPERADMIN_PASSWORD = testSuperPass;

  // First seed run
  const seed1 = await seedSuperAdmin();
  console.log("✓ Resultado do primeiro Seed SuperAdmin:", {
    success: seed1.success,
    email: seed1.user?.email,
    isSuperAdmin: seed1.user?.isSuperAdmin,
  });

  if (!seed1.success || !seed1.user || seed1.user.isSuperAdmin !== true) {
    throw new Error("FAIL: Seed do SuperAdmin falhou.");
  }

  // 3. Test Idempotency: Second seed run
  const seed2 = await seedSuperAdmin();
  console.log("✓ Resultado da segunda execução do Seed (idempotência):", {
    success: seed2.success,
    email: seed2.user?.email,
    isSuperAdmin: seed2.user?.isSuperAdmin,
  });

  if (!seed2.success || seed2.user?.id !== seed1.user.id) {
    throw new Error("FAIL: Seed não foi idempotente (criou duplicata ou alterou ID).");
  }
  console.log("✓ Check 3 PASS: Seed do SuperAdmin é 100% idempotente.");

  // 4. Test SuperAdmin status verification
  const isSuper = await isSuperAdminUser(seed1.user.id);
  if (isSuper !== true) {
    throw new Error("FAIL: SuperAdmin não foi reconhecido por isSuperAdminUser!");
  }
  console.log("✓ Check 4 PASS: SuperAdmin autorizado com sucesso.");

  // 5. Test Missing Env variables handling
  delete process.env.SUPERADMIN_EMAIL;
  delete process.env.SUPERADMIN_PASSWORD;

  const seedMissing = await seedSuperAdmin();
  if (seedMissing.success !== false || seedMissing.reason !== "SUPERADMIN_EMAIL_OR_PASSWORD_NOT_CONFIGURED") {
    throw new Error("FAIL: Seed com variáveis ausentes deveria retornar erro suave.");
  }
  console.log("✓ Check 5 PASS: Variáveis ausentes tratadas de forma segura e sem falhas.");

  // Cleanup
  await prisma.user.deleteMany({
    where: {
      email: { in: [regularUser.email, testSuperEmail] },
    },
  });

  console.log("\n=================================================");
  console.log(">>> TODOS OS TESTES DA TASK 070 PASSARAM COM SUCESSO! <<<");
  console.log("=================================================");
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRO NO TESTE SUPERADMIN:", err);
    process.exit(1);
  });
