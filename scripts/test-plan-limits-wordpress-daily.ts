import { prisma } from "@/lib/prisma";
import { BillingService } from "@/lib/billing";

async function run() {
  console.log("================================================================================");
  console.log("🧪 TESTE: Task 140 — Limites de WordPress e Artigos Diários");
  console.log("================================================================================\n");

  const WS_A = "test140-ws-full";
  const WS_B = "test140-ws-restricted";
  const PLAN_FULL = "test140-plan-full";
  const PLAN_RESTRICTED = "test140-plan-restricted";

  try {
    // --- Cleanup ---
    await prisma.wordPressSite.deleteMany({ where: { workspace: { slug: { in: [WS_A, WS_B] } } } });
    await prisma.article.deleteMany({ where: { workspace: { slug: { in: [WS_A, WS_B] } } } });
    await prisma.subscription.deleteMany({ where: { workspace: { slug: { in: [WS_A, WS_B] } } } });
    await prisma.workspace.deleteMany({ where: { slug: { in: [WS_A, WS_B] } } });
    await prisma.plan.deleteMany({ where: { slug: { in: [PLAN_FULL, PLAN_RESTRICTED] } } });

    // --- Setup ---
    const planFull = await prisma.plan.create({
      data: {
        name: "Plano Full Test140",
        slug: PLAN_FULL,
        price: 99,
        maxArticles: 200,
        maxDailyArticles: 10,
        maxSources: 10,
        maxWordPressSites: 5,
      },
    });

    const planRestricted = await prisma.plan.create({
      data: {
        name: "Plano Restrito Test140",
        slug: PLAN_RESTRICTED,
        price: 9,
        maxArticles: 20,
        maxDailyArticles: 3,
        maxSources: 3,
        maxWordPressSites: 1,
      },
    });

    const wsA = await prisma.workspace.create({ data: { name: "WS Full 140", slug: WS_A, active: true } });
    await prisma.subscription.create({ data: { workspaceId: wsA.id, planId: planFull.id, status: "ACTIVE" } });

    const wsB = await prisma.workspace.create({ data: { name: "WS Restrito 140", slug: WS_B, active: true } });
    await prisma.subscription.create({ data: { workspaceId: wsB.id, planId: planRestricted.id, status: "ACTIVE" } });

    // --- Teste 1: Limite de Sites WordPress ---
    console.log("--- Teste 1: Limite de Sites WordPress ---");

    // WS_B pode criar 1 site (limite = 1)
    const allowed1 = await BillingService.checkLimit(wsB.id, "WORDPRESS_SITES");
    if (!allowed1.allowed) throw new Error("FALHA: WS_B deveria poder criar o 1º site!");
    console.log(`✓ WS_B pode criar o 1º site (${allowed1.current}/${allowed1.limit}).`);

    // Criar o site
    await prisma.wordPressSite.create({
      data: { workspaceId: wsB.id, name: "Site B1", url: "https://siteb1.com", username: "admin", encryptedApplicationPassword: "enc" },
    });

    // Agora deve estar no limite
    const blocked1 = await BillingService.checkLimit(wsB.id, "WORDPRESS_SITES");
    if (blocked1.allowed) throw new Error("FALHA: WS_B deveria estar bloqueado após criar 1 site!");
    console.log(`✓ WS_B bloqueado ao tentar criar 2º site: "${blocked1.message}"`);

    // WS_A (limite 5) pode criar mais
    const allowedA = await BillingService.checkLimit(wsA.id, "WORDPRESS_SITES");
    if (!allowedA.allowed) throw new Error("FALHA: WS_A deveria poder criar sites (limite = 5)!");
    console.log(`✓ WS_A pode criar sites (${allowedA.current}/${allowedA.limit}).`);

    // --- Teste 2: Limite Diário de Artigos ---
    console.log("\n--- Teste 2: Limite Diário de Artigos ---");

    // WS_B pode processar até 3/dia
    const daily0 = await BillingService.checkLimit(wsB.id, "ARTICLES_DAILY");
    if (!daily0.allowed) throw new Error("FALHA: WS_B deveria poder processar artigos (0 hoje)!");
    console.log(`✓ WS_B pode processar artigos diários (${daily0.current}/${daily0.limit}).`);

    // Simular 3 artigos processados hoje
    const now = new Date();
    for (let i = 1; i <= 3; i++) {
      await prisma.article.create({
        data: {
          workspaceId: wsB.id,
          title: `Artigo Diário ${i}`,
          processedAt: now,
          status: "PENDING",
        },
      });
    }

    const dailyBlocked = await BillingService.checkLimit(wsB.id, "ARTICLES_DAILY");
    if (dailyBlocked.allowed) throw new Error("FALHA: WS_B deveria estar bloqueado após 3 artigos hoje!");
    if (!dailyBlocked.message?.includes("Renova amanhã")) throw new Error("FALHA: Mensagem de bloqueio diário deve mencionar 'Renova amanhã'!");
    console.log(`✓ WS_B bloqueado após ${dailyBlocked.current} artigos hoje: "${dailyBlocked.message}"`);

    // --- Teste 3: Limite Mensal de Artigos ---
    console.log("\n--- Teste 3: Limite Mensal de Artigos ---");

    // WS_B limite mensal = 20; já tem 3 processados hoje = mensalmente
    const monthly = await BillingService.checkLimit(wsB.id, "ARTICLES");
    if (!monthly.allowed) throw new Error("FALHA: WS_B com 3 artigos no mês deveria estar abaixo do limite mensal de 20!");
    console.log(`✓ WS_B dentro do limite mensal (${monthly.current}/${monthly.limit}).`);

    // Simular 17 artigos adicionais para atingir limite mensal (3 + 17 = 20)
    for (let i = 4; i <= 20; i++) {
      await prisma.article.create({
        data: {
          workspaceId: wsB.id,
          title: `Artigo Mensal ${i}`,
          processedAt: new Date(now.getFullYear(), now.getMonth(), 1 + (i % 28)),
          status: "PENDING",
        },
      });
    }

    const monthlyBlocked = await BillingService.checkLimit(wsB.id, "ARTICLES");
    if (monthlyBlocked.allowed) throw new Error("FALHA: WS_B deveria estar bloqueado com 20 artigos mensais!");
    if (!monthlyBlocked.message?.includes("Renova em")) throw new Error("FALHA: Mensagem mensal deve mencionar 'Renova em'!");
    console.log(`✓ WS_B bloqueado mensalmente após ${monthlyBlocked.current} artigos: "${monthlyBlocked.message}"`);

    // WS_A (limite 200) não deve estar bloqueado
    const monthlyA = await BillingService.checkLimit(wsA.id, "ARTICLES");
    if (!monthlyA.allowed) throw new Error("FALHA: WS_A não deveria estar bloqueado mensalmente!");
    console.log(`✓ WS_A sem bloqueio mensal (${monthlyA.current}/${monthlyA.limit}).`);

    // --- Teste 4: Campos novos nos plans ---
    console.log("\n--- Teste 4: Validação dos campos no modelo Plan ---");
    const planCheck = await prisma.plan.findUniqueOrThrow({ where: { slug: PLAN_RESTRICTED } });
    if (planCheck.maxDailyArticles !== 3) throw new Error(`FALHA: maxDailyArticles deveria ser 3, foi ${planCheck.maxDailyArticles}`);
    if (planCheck.maxWordPressSites !== 1) throw new Error(`FALHA: maxWordPressSites deveria ser 1, foi ${planCheck.maxWordPressSites}`);
    console.log(`✓ Campos maxDailyArticles (${planCheck.maxDailyArticles}) e maxWordPressSites (${planCheck.maxWordPressSites}) corretos.`);

    // --- Cleanup ---
    await prisma.wordPressSite.deleteMany({ where: { workspace: { slug: { in: [WS_A, WS_B] } } } });
    await prisma.article.deleteMany({ where: { workspace: { slug: { in: [WS_A, WS_B] } } } });
    await prisma.subscription.deleteMany({ where: { workspace: { slug: { in: [WS_A, WS_B] } } } });
    await prisma.workspace.deleteMany({ where: { slug: { in: [WS_A, WS_B] } } });
    await prisma.plan.deleteMany({ where: { slug: { in: [PLAN_FULL, PLAN_RESTRICTED] } } });

    console.log("\n================================================================================");
    console.log("🏆 TASK 140: TODOS OS TESTES PASSARAM COM SUCESSO!");
    console.log("================================================================================");
  } catch (err) {
    // Cleanup on error
    try {
      await prisma.wordPressSite.deleteMany({ where: { workspace: { slug: { in: [WS_A, WS_B] } } } });
      await prisma.article.deleteMany({ where: { workspace: { slug: { in: [WS_A, WS_B] } } } });
      await prisma.subscription.deleteMany({ where: { workspace: { slug: { in: [WS_A, WS_B] } } } });
      await prisma.workspace.deleteMany({ where: { slug: { in: [WS_A, WS_B] } } });
      await prisma.plan.deleteMany({ where: { slug: { in: [PLAN_FULL, PLAN_RESTRICTED] } } });
    } catch {}
    console.error("ERRO:", err);
    process.exit(1);
  }
}

run();
