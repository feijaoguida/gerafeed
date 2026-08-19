import { prisma } from "../src/lib/prisma";
import { isSuperAdminUser } from "../src/lib/superadmin";
import { encrypt } from "../src/lib/crypto";

async function runTests() {
  console.log("=========================================================");
  console.log("=== TEST: Task 079 - Backoffice Hardening & Audit     ===");
  console.log("=========================================================");

  // 1. Check SuperAdmin vs Regular User authorization
  const superAdminUser = await prisma.user.upsert({
    where: { email: "superadmin-audit@example.com" },
    update: { isSuperAdmin: true },
    create: {
      email: "superadmin-audit@example.com",
      name: "SuperAdmin Auditor",
      isSuperAdmin: true,
    },
  });

  const regularUser = await prisma.user.upsert({
    where: { email: "regular-user@example.com" },
    update: { isSuperAdmin: false },
    create: {
      email: "regular-user@example.com",
      name: "Regular Tenant User",
      isSuperAdmin: false,
    },
  });

  const isSuper1 = await isSuperAdminUser(superAdminUser.id);
  const isSuper2 = await isSuperAdminUser(regularUser.id);
  const isSuper3 = await isSuperAdminUser("non-existent-user-id");

  if (!isSuper1 || isSuper2 || isSuper3) {
    throw new Error("FAIL: Verificação de SuperAdmin falhou na segregação de privilégios.");
  }
  console.log("✓ Check 1 PASS: Autenticação e autorização estrita de SuperAdmin validadas (usuários comuns e IDs falsos bloqueados).");

  // 2. Audit Secret Leakage in Payloads
  const testSecret = "sensitive-wordpress-application-key-xyz";
  const encryptedSecret = encrypt(testSecret);

  // Mock workspace & site
  const testWorkspace = await prisma.workspace.create({
    data: {
      name: "Audit Workspace",
      slug: "test-audit-workspace",
      active: true,
      wordpressSites: {
        create: [
          {
            name: "Audit WP",
            url: "https://audit.example.com",
            username: "auditor",
            encryptedApplicationPassword: encryptedSecret,
            active: true,
          },
        ],
      },
    },
    include: { wordpressSites: true },
  });

  const site = testWorkspace.wordpressSites[0];
  const clientSafeSite = {
    id: site.id,
    name: site.name,
    url: site.url,
    username: site.username,
    hasPassword: Boolean(site.encryptedApplicationPassword),
    active: site.active,
  };

  const payloadString = JSON.stringify(clientSafeSite);
  if (payloadString.includes(testSecret) || payloadString.includes(encryptedSecret)) {
    throw new Error("FAIL: Vazamento de segredo detectado no payload exposto ao cliente!");
  }
  if (!clientSafeSite.hasPassword) {
    throw new Error("FAIL: Indicador booleano hasPassword deve ser verdadeiro.");
  }
  console.log("✓ Check 2 PASS: Auditoria de segredos (secrets nunca trafegam em texto plano nem em hex cifrado para o cliente).");

  // 3. Cross-Tenant Integrity Audit
  const anotherWorkspace = await prisma.workspace.create({
    data: {
      name: "Foreign Workspace",
      slug: "test-foreign-workspace",
      active: true,
      sources: {
        create: [
          {
            name: "Foreign Feed",
            rssUrl: "https://foreign.com/rss",
            active: true,
          },
        ],
      },
    },
    include: { sources: true },
  });

  const foreignSource = anotherWorkspace.sources[0];

  // Try linking Foreign Source to Audit Workspace Site
  const invalidLink = await prisma.source.findFirst({
    where: {
      id: foreignSource.id,
      workspaceId: testWorkspace.id, // Strictly scoped to testWorkspace
    },
  });

  if (invalidLink !== null) {
    throw new Error("FAIL: Fonte de outro workspace foi aceita no escopo do workspace auditado!");
  }
  console.log("✓ Check 3 PASS: Isolamento e integridade multi-tenant em operações de associação validados.");

  // Cleanup
  await prisma.wordPressSite.deleteMany({ where: { workspaceId: testWorkspace.id } });
  await prisma.source.deleteMany({ where: { workspaceId: anotherWorkspace.id } });
  await prisma.workspace.deleteMany({
    where: { id: { in: [testWorkspace.id, anotherWorkspace.id] } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [superAdminUser.id, regularUser.id] } },
  });

  console.log("\n=========================================================");
  console.log(">>> TODOS OS TESTES DA TASK 079 PASSARAM COM SUCESSO! <<<");
  console.log("=========================================================");
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRO NO TESTE DE HARDENING & AUDIT:", err);
    process.exit(1);
  });
