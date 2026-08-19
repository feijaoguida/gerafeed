import { prisma } from "../src/lib/prisma";
import { BillingService } from "../src/lib/billing";
import { SubscriptionStatus } from "@prisma/client";

async function runTests() {
  console.log("=========================================================");
  console.log("=== TEST: Task 078 - Backoffice Billing and Credits   ===");
  console.log("=========================================================");

  await BillingService.ensureDefaultPlans();

  const starterPlan = await prisma.plan.findUnique({ where: { slug: "starter" } });
  const proPlan = await prisma.plan.findUnique({ where: { slug: "pro" } });

  if (!starterPlan || !proPlan) {
    throw new Error("FAIL: Planos padrão não foram encontrados.");
  }

  // Create isolated test companies
  await prisma.workspace.deleteMany({
    where: { slug: { in: ["test-billing-company-a", "test-billing-company-b"] } },
  });

  const companyA = await prisma.workspace.create({
    data: {
      name: "Company Billing A",
      slug: "test-billing-company-a",
      active: true,
      asaasCustomerId: "cus_asaas_12345",
      stripeCustomerId: "cus_stripe_67890",
    },
  });

  const companyB = await prisma.workspace.create({
    data: {
      name: "Company Billing B",
      slug: "test-billing-company-b",
      active: true,
    },
  });

  console.log("✓ Empresas isoladas criadas: Company A (", companyA.id, ") e Company B (", companyB.id, ")");

  try {
    // ----------------------------------------------------------------
    // 1. Initialize Subscription & Plan
    // ----------------------------------------------------------------
    await prisma.subscription.create({
      data: {
        workspaceId: companyA.id,
        planId: starterPlan.id,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    const subA = await BillingService.getWorkspaceSubscription(companyA.id);
    if (subA.planId !== starterPlan.id || subA.status !== "ACTIVE") {
      throw new Error("FAIL: Assinatura inicial de Company A inválida.");
    }
    console.log("✓ Check 1 PASS: Assinatura e plano obtidos via BillingService com sucesso.");

    // ----------------------------------------------------------------
    // 2. Usage and Quota Verification via BillingService
    // ----------------------------------------------------------------
    // Create 5 processed articles for Company A this month
    const sourceA = await prisma.source.create({
      data: {
        workspaceId: companyA.id,
        name: "Fonte A1",
        rssUrl: "https://a1.com/rss",
        active: true,
      },
    });

    for (let i = 0; i < 5; i++) {
      const url = `https://a1.com/artigo-${i + 1}-${Date.now()}`;
      await prisma.article.create({
        data: {
          workspaceId: companyA.id,
          sourceId: sourceA.id,
          originalTitle: `Artigo Original ${i + 1}`,
          title: `Artigo Teste ${i + 1}`,
          originalUrl: url,
          processedAt: new Date(),
        },
      });
    }




    const articleLimit = await BillingService.checkLimit(companyA.id, "ARTICLES");
    const sourceLimit = await BillingService.checkLimit(companyA.id, "SOURCES");

    if (articleLimit.current !== 5 || articleLimit.limit !== starterPlan.maxArticles) {
      throw new Error(`FAIL: Contagem de artigos incorreta. Esperado 5/${starterPlan.maxArticles}, obtido ${articleLimit.current}/${articleLimit.limit}`);
    }

    if (sourceLimit.current !== 1 || sourceLimit.limit !== starterPlan.maxSources) {
      throw new Error(`FAIL: Contagem de fontes incorreta. Esperado 1/${starterPlan.maxSources}, obtido ${sourceLimit.current}/${sourceLimit.limit}`);
    }
    console.log("✓ Check 2 PASS: Uso de artigos e fontes computado com precisão via BillingService.");

    // ----------------------------------------------------------------
    // 3. Plan Change & Status Transition
    // ----------------------------------------------------------------
    await prisma.subscription.update({
      where: { workspaceId: companyA.id },
      data: {
        planId: proPlan.id,
        status: SubscriptionStatus.PAST_DUE,
      },
    });

    const updatedSub = await BillingService.getWorkspaceSubscription(companyA.id);
    const updatedArticleLimit = await BillingService.checkLimit(companyA.id, "ARTICLES");

    if (
      updatedSub.planId !== proPlan.id ||
      updatedSub.status !== "PAST_DUE" ||
      updatedArticleLimit.limit !== proPlan.maxArticles
    ) {
      throw new Error("FAIL: Transição de plano e status de cobrança falhou.");
    }
    console.log("✓ Check 3 PASS: Upgrade de plano para Pro (cota aumentada para", proPlan.maxArticles, ") e status PAST_DUE refletidos com sucesso.");

    // ----------------------------------------------------------------
    // 4. Strict Tenant Isolation (Usage in A doesn't affect B)
    // ----------------------------------------------------------------
    const articleLimitB = await BillingService.checkLimit(companyB.id, "ARTICLES");
    const sourceLimitB = await BillingService.checkLimit(companyB.id, "SOURCES");

    if (articleLimitB.current !== 0 || sourceLimitB.current !== 0) {
      throw new Error("FAIL: Vazamento de uso/créditos de Company A para Company B!");
    }
    console.log("✓ Check 4 PASS: Isolamento total de faturamento e consumo entre workspaces distintos.");

    console.log("\n=========================================================");
    console.log(">>> TODOS OS TESTES DA TASK 078 PASSARAM COM SUCESSO! <<<");
    console.log("=========================================================");
  } finally {
    // Cleanup
    await prisma.article.deleteMany({
      where: { workspaceId: { in: [companyA.id, companyB.id] } },
    });
    await prisma.source.deleteMany({
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
    console.error("ERRO NO TESTE DE COBRANÇA E CRÉDITOS:", err);
    process.exit(1);
  });
