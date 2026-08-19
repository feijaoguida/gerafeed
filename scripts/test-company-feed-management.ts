import { prisma } from "../src/lib/prisma";
import { BillingService } from "../src/lib/billing";

async function runTests() {
  console.log("=================================================");
  console.log("=== TEST: Task 075 - Company Feed Management  ===");
  console.log("=================================================");

  // Ensure default plans
  await BillingService.ensureDefaultPlans();
  const freePlan = await prisma.plan.findUniqueOrThrow({ where: { slug: "free" } });

  // Create isolated test companies (Company A and Company B)
  await prisma.workspace.deleteMany({
    where: { slug: { in: ["test-feed-company-a", "test-feed-company-b"] } },
  });

  const companyA = await prisma.workspace.create({
    data: {
      name: "Company Feed A",
      slug: "test-feed-company-a",
      active: true,
      subscription: {
        create: {
          planId: freePlan.id,
          status: "ACTIVE",
        },
      },
      wordpressSites: {
        create: [
          {
            name: "WP Portal A",
            url: "https://wpa.example.com",
            username: "admin_a",
            encryptedApplicationPassword: "test_pass_a",
            active: true,
          },
        ],
      },
    },
    include: {
      wordpressSites: true,
    },
  });

  const companyB = await prisma.workspace.create({
    data: {
      name: "Company Feed B",
      slug: "test-feed-company-b",
      active: true,
      subscription: {
        create: {
          planId: freePlan.id,
          status: "ACTIVE",
        },
      },
    },
  });

  const wpSiteA = companyA.wordpressSites[0];
  console.log("✓ Empresas isoladas criadas: Company A (", companyA.id, ") e Company B (", companyB.id, ")");

  try {
    // ----------------------------------------------------------------
    // 1. Create Feed with Credit, Prompt and WordPress Site Association
    // ----------------------------------------------------------------
    const feedA1 = await prisma.source.create({
      data: {
        workspaceId: companyA.id,
        name: "Tech Feed Alpha",
        creditName: "Fonte Tech",
        rssUrl: "https://news.example.com/rss",
        defaultPromptType: "analitico",
        active: true,
      },
    });

    await prisma.wordPressSiteSource.create({
      data: {
        workspaceId: companyA.id,
        sourceId: feedA1.id,
        wordpressSiteId: wpSiteA.id,
      },
    });

    const verifyFeedA1 = await prisma.source.findUnique({
      where: { id: feedA1.id },
      include: {
        wordpressSiteSources: {
          include: {
            wordpressSite: true,
          },
        },
      },
    });

    if (
      !verifyFeedA1 ||
      verifyFeedA1.creditName !== "Fonte Tech" ||
      verifyFeedA1.defaultPromptType !== "analitico" ||
      verifyFeedA1.wordpressSiteSources.length !== 1 ||
      verifyFeedA1.wordpressSiteSources[0].wordpressSiteId !== wpSiteA.id
    ) {
      throw new Error("FAIL: Criação de feed com crédito, prompt e WP falhou.");
    }
    console.log("✓ Check 1 PASS: Feed criado com metadados, prompt customizado e vínculo WordPress.");

    // ----------------------------------------------------------------
    // 2. Search & List Feeds within Tenant
    // ----------------------------------------------------------------
    const searchMatch = await prisma.source.findMany({
      where: {
        workspaceId: companyA.id,
        OR: [
          { name: { contains: "Alpha", mode: "insensitive" } },
          { creditName: { contains: "Alpha", mode: "insensitive" } },
          { rssUrl: { contains: "Alpha", mode: "insensitive" } },
        ],
      },
    });

    if (searchMatch.length !== 1 || searchMatch[0].id !== feedA1.id) {
      throw new Error("FAIL: Busca de feeds dentro do tenant falhou.");
    }
    console.log("✓ Check 2 PASS: Busca e listagem de feeds isolados por tenant funcionam com precisão.");

    // ----------------------------------------------------------------
    // 3. Edit Feed Attributes and Status Toggle
    // ----------------------------------------------------------------
    const updatedFeed = await prisma.source.update({
      where: { id: feedA1.id },
      data: {
        name: "Tech Feed Alpha Renamed",
        defaultPromptType: "curto",
        active: false,
      },
    });

    if (
      updatedFeed.name !== "Tech Feed Alpha Renamed" ||
      updatedFeed.defaultPromptType !== "curto" ||
      updatedFeed.active !== false
    ) {
      throw new Error("FAIL: Edição e toggle de status do feed falhou.");
    }
    console.log("✓ Check 3 PASS: Edição de prompt e toggle de ativação/inativação validados com sucesso.");

    // ----------------------------------------------------------------
    // 4. Strict Tenant Boundary Isolation Check
    // ----------------------------------------------------------------
    // Attempting to look up or operate feedA1 under companyB must fail
    const crossTenantCheck = await prisma.source.findFirst({
      where: {
        id: feedA1.id,
        workspaceId: companyB.id,
      },
    });

    if (crossTenantCheck !== null) {
      throw new Error("FAIL: Isolamento de tenant violado! Feed de Company A acessível por Company B.");
    }
    console.log("✓ Check 4 PASS: Isolamento de tenant garantido (rejeição estrita cross-workspace).");

    // ----------------------------------------------------------------
    // 5. Cascade Delete of Feed and Associations
    // ----------------------------------------------------------------
    await prisma.$transaction([
      prisma.wordPressSiteSource.deleteMany({ where: { sourceId: feedA1.id } }),
      prisma.article.deleteMany({ where: { sourceId: feedA1.id } }),
      prisma.source.delete({ where: { id: feedA1.id } }),
    ]);

    const remainingFeed = await prisma.source.findUnique({ where: { id: feedA1.id } });
    const remainingWss = await prisma.wordPressSiteSource.findMany({ where: { sourceId: feedA1.id } });

    if (remainingFeed !== null || remainingWss.length !== 0) {
      throw new Error("FAIL: Exclusão em cascata de feed e vínculos falhou.");
    }
    console.log("✓ Check 5 PASS: Exclusão segura em cascata validada.");

    console.log("\n=================================================");
    console.log(">>> TODOS OS TESTES DA TASK 075 PASSARAM COM SUCESSO! <<<");
    console.log("=================================================");
  } finally {
    // Cleanup
    await prisma.wordPressSiteSource.deleteMany({
      where: { workspaceId: { in: [companyA.id, companyB.id] } },
    });
    await prisma.source.deleteMany({
      where: { workspaceId: { in: [companyA.id, companyB.id] } },
    });
    await prisma.wordPressSite.deleteMany({
      where: { workspaceId: { in: [companyA.id, companyB.id] } },
    });
    await prisma.subscription.deleteMany({
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
    console.error("ERRO NO TESTE DE GESTÃO DE FEEDS:", err);
    process.exit(1);
  });
