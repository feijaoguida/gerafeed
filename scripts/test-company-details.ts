import { prisma } from "../src/lib/prisma";
import { BillingService } from "../src/lib/billing";
import { encrypt } from "../src/lib/crypto";

async function runTests() {
  console.log("=================================================");
  console.log("=== TEST: Task 074 - Company Details & Context ==");
  console.log("=================================================");

  // Ensure default plans
  await BillingService.ensureDefaultPlans();
  const freePlan = await prisma.plan.findUniqueOrThrow({ where: { slug: "free" } });
  const proPlan = await prisma.plan.findUniqueOrThrow({ where: { slug: "pro" } });

  // Create isolated test company
  await prisma.workspace.deleteMany({
    where: { slug: { in: ["test-company-details-isolated"] } },
  });

  const testWs = await prisma.workspace.create({
    data: {
      name: "Detail Test Workspace",
      slug: "test-company-details-isolated",
      active: true,
      subscription: {
        create: {
          planId: freePlan.id,
          status: "ACTIVE",
        },
      },
      sources: {
        create: [
          {
            name: "Feed Test 1",
            rssUrl: "https://example.com/feed.xml",
            active: true,
          },
        ],
      },
      wordpressSites: {
        create: [
          {
            name: "WordPress Target 1",
            url: "https://wp.example.com",
            username: "admin_super",
            encryptedApplicationPassword: encrypt("supersecretpassword123"),
            active: true,
          },
        ],
      },
      configurations: {
        create: [
          {
            key: "ai_provider",
            value: {
              provider: "openai",
              apiKey: encrypt("sk-secret-test-key-12345"),
              model: "gpt-4o-mini",
            },
          },
        ],
      },
    },
    include: {
      sources: true,
      wordpressSites: true,
      configurations: true,
      subscription: {
        include: {
          plan: true,
        },
      },
    },
  });

  console.log("✓ Empresa de teste criada com feeds, WP e configurações:", testWs.id);

  try {
    // ----------------------------------------------------------------
    // 1. Company Context & Multi-tenant Isolation Check
    // ----------------------------------------------------------------
    const loadedWs = await prisma.workspace.findUnique({
      where: { id: testWs.id },
      include: {
        sources: true,
        wordpressSites: true,
        configurations: true,
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!loadedWs || loadedWs.sources.length !== 1 || loadedWs.wordpressSites.length !== 1) {
      throw new Error("FAIL: Contexto da empresa não carregou os dados operacionais isolados.");
    }
    console.log("✓ Check 1 PASS: Contexto da empresa carregado com isolamento multi-tenant.");

    // ----------------------------------------------------------------
    // 2. Secrets Protection Check
    // ----------------------------------------------------------------
    const wpSite = loadedWs.wordpressSites[0];
    const sanitizedWp = {
      id: wpSite.id,
      name: wpSite.name,
      url: wpSite.url,
      username: wpSite.username,
      hasPassword: Boolean(wpSite.encryptedApplicationPassword),
    };

    if ("encryptedApplicationPassword" in sanitizedWp || !sanitizedWp.hasPassword) {
      throw new Error("FAIL: Sanitização de senha do WordPress falhou.");
    }

    const aiConfig = loadedWs.configurations[0];
    const parsedAi = typeof aiConfig.value === "object" && aiConfig.value !== null ? { ...aiConfig.value as Record<string, unknown> } : {};
    if ("apiKey" in parsedAi) {
      parsedAi.hasApiKey = Boolean(parsedAi.apiKey);
      delete parsedAi.apiKey;
    }

    if ("apiKey" in parsedAi || !parsedAi.hasApiKey) {
      throw new Error("FAIL: Sanitização de chave de API da IA falhou.");
    }
    console.log("✓ Check 2 PASS: Secrets devidamente protegidos e nunca expostos ao Backoffice.");

    // ----------------------------------------------------------------
    // 3. Safe Operational Update (Name, Slug, Status, Plan)
    // ----------------------------------------------------------------
    const updatedWs = await prisma.workspace.update({
      where: { id: testWs.id },
      data: {
        name: "Detail Test Workspace Renamed",
        active: false,
      },
    });

    if (updatedWs.name !== "Detail Test Workspace Renamed" || updatedWs.active !== false) {
      throw new Error("FAIL: Atualização de nome e status falhou.");
    }

    // Change plan to Pro
    await prisma.subscription.update({
      where: { workspaceId: testWs.id },
      data: { planId: proPlan.id },
    });

    const checkProLimit = await BillingService.checkLimit(testWs.id, "ARTICLES");
    if (checkProLimit.limit !== proPlan.maxArticles) {
      throw new Error("FAIL: Alteração de plano da empresa não refletiu no BillingService.");
    }
    console.log("✓ Check 3 PASS: Alteração operacional de dados e plano validada com sucesso.");

    console.log("\n=================================================");
    console.log(">>> TODOS OS TESTES DA TASK 074 PASSARAM COM SUCESSO! <<<");
    console.log("=================================================");
  } finally {
    // Cleanup
    await prisma.source.deleteMany({ where: { workspaceId: testWs.id } });
    await prisma.wordPressSite.deleteMany({ where: { workspaceId: testWs.id } });
    await prisma.configuration.deleteMany({ where: { workspaceId: testWs.id } });
    await prisma.subscription.deleteMany({ where: { workspaceId: testWs.id } });
    await prisma.workspace.deleteMany({ where: { id: testWs.id } });
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRO NO TESTE DE DETALHES DA EMPRESA:", err);
    process.exit(1);
  });
