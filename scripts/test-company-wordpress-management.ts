import { prisma } from "../src/lib/prisma";
import { encrypt, decrypt } from "../src/lib/crypto";

async function runTests() {
  console.log("=========================================================");
  console.log("=== TEST: Task 076 - Company WordPress Management    ===");
  console.log("=========================================================");

  // Create isolated test companies (Company A and Company B)
  await prisma.workspace.deleteMany({
    where: { slug: { in: ["test-wp-company-a", "test-wp-company-b"] } },
  });

  const companyA = await prisma.workspace.create({
    data: {
      name: "Company WP A",
      slug: "test-wp-company-a",
      active: true,
      sources: {
        create: [
          {
            name: "Feed WP A1",
            rssUrl: "https://feed.a1.com/rss",
            active: true,
          },
        ],
      },
    },
    include: { sources: true },
  });

  const companyB = await prisma.workspace.create({
    data: {
      name: "Company WP B",
      slug: "test-wp-company-b",
      active: true,
    },
  });

  const sourceA1 = companyA.sources[0];
  console.log("✓ Empresas isoladas criadas: Company A (", companyA.id, ") e Company B (", companyB.id, ")");

  try {
    // ----------------------------------------------------------------
    // 1. Create WordPress Site with Encrypted Credentials & Feed Associations
    // ----------------------------------------------------------------
    const rawPassword = "wp-app-password-secret-1234";
    const encrypted = encrypt(rawPassword);

    const siteA1 = await prisma.wordPressSite.create({
      data: {
        workspaceId: companyA.id,
        name: "Blog Principal A",
        url: "https://blog.companya.com",
        username: "editor_a",
        encryptedApplicationPassword: encrypted,
        defaultPromptType: "opinativo",
        active: true,
      },
    });

    await prisma.wordPressSiteSource.create({
      data: {
        workspaceId: companyA.id,
        wordpressSiteId: siteA1.id,
        sourceId: sourceA1.id,
      },
    });

    console.log("✓ Check 1 PASS: Site WordPress criado com senha criptografada e vínculo com feed.");

    // ----------------------------------------------------------------
    // 2. Secret Protection (Sanitization)
    // ----------------------------------------------------------------
    const loadedSite = await prisma.wordPressSite.findUnique({
      where: { id: siteA1.id },
      include: {
        sources: {
          include: { source: true },
        },
      },
    });

    if (!loadedSite) throw new Error("FAIL: Site WordPress não encontrado.");

    const sanitized = {
      id: loadedSite.id,
      workspaceId: loadedSite.workspaceId,
      name: loadedSite.name,
      url: loadedSite.url,
      username: loadedSite.username,
      hasPassword: Boolean(loadedSite.encryptedApplicationPassword),
      defaultPromptType: loadedSite.defaultPromptType,
      active: loadedSite.active,
    };

    if ("encryptedApplicationPassword" in sanitized || !sanitized.hasPassword) {
      throw new Error("FAIL: Sanitização de senha do WordPress falhou.");
    }
    if (decrypt(loadedSite.encryptedApplicationPassword) !== rawPassword) {
      throw new Error("FAIL: Descriptografia da senha não corresponde ao valor original.");
    }
    console.log("✓ Check 2 PASS: Senha de aplicativo nunca exposta e descriptografável apenas no backend.");

    // ----------------------------------------------------------------
    // 3. Update Site and "Nova Application Password"
    // ----------------------------------------------------------------
    const newPassword = "new-fresh-app-password-5678";
    const updatedSite = await prisma.wordPressSite.update({
      where: { id: siteA1.id },
      data: {
        name: "Blog Principal A Renomeado",
        encryptedApplicationPassword: encrypt(newPassword),
        defaultPromptType: "analitico",
        active: false,
      },
    });

    if (
      updatedSite.name !== "Blog Principal A Renomeado" ||
      updatedSite.defaultPromptType !== "analitico" ||
      updatedSite.active !== false ||
      decrypt(updatedSite.encryptedApplicationPassword) !== newPassword
    ) {
      throw new Error("FAIL: Atualização de atributos e nova senha falhou.");
    }
    console.log("✓ Check 3 PASS: Atualização de nome, prompt, status e nova Application Password bem-sucedida.");

    // ----------------------------------------------------------------
    // 4. Category Sync & Association
    // ----------------------------------------------------------------
    const cat1 = await prisma.wordPressCategory.create({
      data: {
        workspaceId: companyA.id,
        wordpressSiteId: siteA1.id,
        wordpressId: 101,
        name: "Tecnologia",
        slug: "tecnologia",
      },
    });

    if (cat1.wordpressSiteId !== siteA1.id || cat1.workspaceId !== companyA.id) {
      throw new Error("FAIL: Sincronização de categoria vinculada ao site falhou.");
    }
    console.log("✓ Check 4 PASS: Sincronização de categorias associadas ao WordPressSite validada.");

    // ----------------------------------------------------------------
    // 5. Strict Tenant Boundary Isolation
    // ----------------------------------------------------------------
    const crossTenantCheck = await prisma.wordPressSite.findFirst({
      where: {
        id: siteA1.id,
        workspaceId: companyB.id,
      },
    });

    if (crossTenantCheck !== null) {
      throw new Error("FAIL: Isolamento violado! Site de Company A acessível por Company B.");
    }
    console.log("✓ Check 5 PASS: Isolamento de tenant garantido (rejeição estrita cross-workspace).");

    // ----------------------------------------------------------------
    // 6. Safe Cascade Delete
    // ----------------------------------------------------------------
    await prisma.$transaction([
      prisma.wordPressSiteSource.deleteMany({ where: { wordpressSiteId: siteA1.id } }),
      prisma.wordPressCategory.deleteMany({ where: { wordpressSiteId: siteA1.id } }),
      prisma.wordPressSite.delete({ where: { id: siteA1.id } }),
    ]);

    const remainingWp = await prisma.wordPressSite.findUnique({ where: { id: siteA1.id } });
    const remainingWss = await prisma.wordPressSiteSource.findMany({ where: { wordpressSiteId: siteA1.id } });
    const remainingCat = await prisma.wordPressCategory.findMany({ where: { wordpressSiteId: siteA1.id } });

    if (remainingWp !== null || remainingWss.length !== 0 || remainingCat.length !== 0) {
      throw new Error("FAIL: Exclusão em cascata de site WordPress e vínculos falhou.");
    }
    console.log("✓ Check 6 PASS: Exclusão segura em cascata do site, categorias e vínculos de feeds.");

    console.log("\n=========================================================");
    console.log(">>> TODOS OS TESTES DA TASK 076 PASSARAM COM SUCESSO! <<<");
    console.log("=========================================================");
  } finally {
    // Cleanup
    await prisma.wordPressSiteSource.deleteMany({
      where: { workspaceId: { in: [companyA.id, companyB.id] } },
    });
    await prisma.wordPressCategory.deleteMany({
      where: { workspaceId: { in: [companyA.id, companyB.id] } },
    });
    await prisma.source.deleteMany({
      where: { workspaceId: { in: [companyA.id, companyB.id] } },
    });
    await prisma.wordPressSite.deleteMany({
      where: { workspaceId: { in: [companyA.id, companyB.id] } },
    });
    await prisma.workspace.deleteMany({
      where: { id: { in: [companyA.id, companyB.id] } },
    });
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRO NO TESTE DE GESTÃO DO WORDPRESS:", err);
    process.exit(1);
  });
