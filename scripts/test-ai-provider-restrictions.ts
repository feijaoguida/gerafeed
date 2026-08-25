import { prisma } from "@/lib/prisma";
import { BillingService, ALLOWED_PROVIDERS_RESTRICTED } from "@/lib/billing";

async function run() {
  console.log("================================================================================");
  console.log("🧪 TESTE: Task 142 — Restrições de Provedores de IA por Plano");
  console.log("================================================================================\n");

  const WS_FREE = "test142-ws-free";
  const WS_PRO = "test142-ws-pro";
  const PLAN_FREE = "test142-plan-free";
  const PLAN_PRO = "test142-plan-pro";
  const FEAT_ID_PROVIDERS = "test142-feat-providers";

  try {
    // Cleanup
    await prisma.planFeature.deleteMany({ where: { plan: { slug: { in: [PLAN_FREE, PLAN_PRO] } } } });
    await prisma.subscription.deleteMany({ where: { workspace: { slug: { in: [WS_FREE, WS_PRO] } } } });
    await prisma.workspace.deleteMany({ where: { slug: { in: [WS_FREE, WS_PRO] } } });
    await prisma.plan.deleteMany({ where: { slug: { in: [PLAN_FREE, PLAN_PRO] } } });
    await prisma.feature.deleteMany({ where: { key: FEAT_ID_PROVIDERS } });

    // Setup feature
    const featProviders = await prisma.feature.create({
      data: { key: FEAT_ID_PROVIDERS, name: "AI Advanced Providers Test", valueType: "BOOLEAN", active: true },
    });

    // Plans
    const planFree = await prisma.plan.create({
      data: { name: "Free Test142", slug: PLAN_FREE, price: 0, maxArticles: 50, maxDailyArticles: 5, maxSources: 3, maxWordPressSites: 1 },
    });
    const planPro = await prisma.plan.create({
      data: { name: "Pro Test142", slug: PLAN_PRO, price: 97, maxArticles: 1000, maxDailyArticles: 100, maxSources: 30, maxWordPressSites: 10 },
    });

    // Pro plan has advanced providers, Free does NOT
    await prisma.planFeature.createMany({
      data: [
        { planId: planPro.id, featureId: featProviders.id, enabled: true },
        { planId: planFree.id, featureId: featProviders.id, enabled: false },
      ],
    });

    // Workspaces
    const wsFree = await prisma.workspace.create({ data: { name: "WS Free 142", slug: WS_FREE, active: true } });
    await prisma.subscription.create({ data: { workspaceId: wsFree.id, planId: planFree.id, status: "ACTIVE" } });

    const wsPro = await prisma.workspace.create({ data: { name: "WS Pro 142", slug: WS_PRO, active: true } });
    await prisma.subscription.create({ data: { workspaceId: wsPro.id, planId: planPro.id, status: "ACTIVE" } });

    // --- Teste 1: Constante ALLOWED_PROVIDERS_RESTRICTED ---
    console.log("--- Teste 1: Constante de provedores permitidos ---");
    if (!ALLOWED_PROVIDERS_RESTRICTED.includes("openai")) throw new Error("FALHA: openai deve estar em ALLOWED_PROVIDERS_RESTRICTED!");
    if (!ALLOWED_PROVIDERS_RESTRICTED.includes("openai-compatible")) throw new Error("FALHA: openai-compatible deve estar em ALLOWED_PROVIDERS_RESTRICTED!");
    if (ALLOWED_PROVIDERS_RESTRICTED.length !== 2) throw new Error(`FALHA: ALLOWED_PROVIDERS_RESTRICTED deve ter 2 itens, tem ${ALLOWED_PROVIDERS_RESTRICTED.length}!`);
    console.log(`✓ ALLOWED_PROVIDERS_RESTRICTED: [${ALLOWED_PROVIDERS_RESTRICTED.join(", ")}]`);

    // --- Teste 2: Feature ai_advanced_providers ---
    console.log("\n--- Teste 2: Verificação de Entitlements de Provedores ---");
    const freeAdv = await BillingService.hasFeature(wsFree.id, FEAT_ID_PROVIDERS);
    const proAdv = await BillingService.hasFeature(wsPro.id, FEAT_ID_PROVIDERS);
    if (freeAdv) throw new Error("FALHA: Free não deveria ter provedores avançados!");
    if (!proAdv) throw new Error("FALHA: Pro deveria ter provedores avançados!");
    console.log("✓ Plano Free: ai_advanced_providers = false | Plano Pro: ai_advanced_providers = true");

    // --- Cleanup ---
    await prisma.planFeature.deleteMany({ where: { plan: { slug: { in: [PLAN_FREE, PLAN_PRO] } } } });
    await prisma.subscription.deleteMany({ where: { workspace: { slug: { in: [WS_FREE, WS_PRO] } } } });
    await prisma.workspace.deleteMany({ where: { slug: { in: [WS_FREE, WS_PRO] } } });
    await prisma.plan.deleteMany({ where: { slug: { in: [PLAN_FREE, PLAN_PRO] } } });
    await prisma.feature.deleteMany({ where: { key: FEAT_ID_PROVIDERS } });

    console.log("\n================================================================================");
    console.log("🏆 TASK 142: TODOS OS TESTES PASSARAM COM SUCESSO!");
    console.log("================================================================================");
  } catch (err) {
    // Cleanup on error
    try {
      await prisma.planFeature.deleteMany({ where: { plan: { slug: { in: [PLAN_FREE, PLAN_PRO] } } } });
      await prisma.subscription.deleteMany({ where: { workspace: { slug: { in: [WS_FREE, WS_PRO] } } } });
      await prisma.workspace.deleteMany({ where: { slug: { in: [WS_FREE, WS_PRO] } } });
      await prisma.plan.deleteMany({ where: { slug: { in: [PLAN_FREE, PLAN_PRO] } } });
      await prisma.feature.deleteMany({ where: { key: FEAT_ID_PROVIDERS } });
    } catch {}
    console.error("ERRO:", err);
    process.exit(1);
  }
}

run();
