import { prisma } from "@/lib/prisma";
import { BillingService, AI_FEATURES, ALLOWED_NICHES_RESTRICTED, ALLOWED_STYLES_RESTRICTED } from "@/lib/billing";

async function run() {
  console.log("================================================================================");
  console.log("🧪 TESTE: Task 141 — Limites de Nicho e Estilo de Escrita por Plano");
  console.log("================================================================================\n");

  const WS_FREE = "test141-ws-free";
  const WS_PRO = "test141-ws-pro";
  const PLAN_FREE = "test141-plan-free";
  const PLAN_PRO = "test141-plan-pro";
  const FEAT_ID_NICHES = "test141-feat-niches";
  const FEAT_ID_STYLES = "test141-feat-styles";

  try {
    // Cleanup
    await prisma.planFeature.deleteMany({ where: { plan: { slug: { in: [PLAN_FREE, PLAN_PRO] } } } });
    await prisma.subscription.deleteMany({ where: { workspace: { slug: { in: [WS_FREE, WS_PRO] } } } });
    await prisma.workspace.deleteMany({ where: { slug: { in: [WS_FREE, WS_PRO] } } });
    await prisma.plan.deleteMany({ where: { slug: { in: [PLAN_FREE, PLAN_PRO] } } });
    await prisma.feature.deleteMany({ where: { key: { in: [FEAT_ID_NICHES, FEAT_ID_STYLES] } } });

    // Setup features
    const featNiches = await prisma.feature.create({
      data: { key: FEAT_ID_NICHES, name: "AI Unlimited Niches Test", valueType: "BOOLEAN", active: true },
    });
    const featStyles = await prisma.feature.create({
      data: { key: FEAT_ID_STYLES, name: "AI Unlimited Styles Test", valueType: "BOOLEAN", active: true },
    });

    // Plans
    const planFree = await prisma.plan.create({
      data: { name: "Free Test141", slug: PLAN_FREE, price: 0, maxArticles: 50, maxDailyArticles: 5, maxSources: 3, maxWordPressSites: 1 },
    });
    const planPro = await prisma.plan.create({
      data: { name: "Pro Test141", slug: PLAN_PRO, price: 97, maxArticles: 1000, maxDailyArticles: 100, maxSources: 30, maxWordPressSites: 10 },
    });

    // Pro plan has unlimited niches+styles, Free does NOT
    await prisma.planFeature.createMany({
      data: [
        { planId: planPro.id, featureId: featNiches.id, enabled: true },
        { planId: planPro.id, featureId: featStyles.id, enabled: true },
        { planId: planFree.id, featureId: featNiches.id, enabled: false },
        { planId: planFree.id, featureId: featStyles.id, enabled: false },
      ],
    });

    // Workspaces
    const wsFree = await prisma.workspace.create({ data: { name: "WS Free 141", slug: WS_FREE, active: true } });
    await prisma.subscription.create({ data: { workspaceId: wsFree.id, planId: planFree.id, status: "ACTIVE" } });

    const wsPro = await prisma.workspace.create({ data: { name: "WS Pro 141", slug: WS_PRO, active: true } });
    await prisma.subscription.create({ data: { workspaceId: wsPro.id, planId: planPro.id, status: "ACTIVE" } });

    // --- Teste 1: constants existem e têm os valores esperados ---
    console.log("--- Teste 1: Constantes de restrição ---");
    if (!ALLOWED_NICHES_RESTRICTED.includes("Política")) throw new Error("FALHA: Política deve estar em ALLOWED_NICHES_RESTRICTED!");
    if (!ALLOWED_NICHES_RESTRICTED.includes("Negócios")) throw new Error("FALHA: Negócios deve estar em ALLOWED_NICHES_RESTRICTED!");
    if (!ALLOWED_NICHES_RESTRICTED.includes("Meio Ambiente")) throw new Error("FALHA: Meio Ambiente deve estar em ALLOWED_NICHES_RESTRICTED!");
    if (ALLOWED_NICHES_RESTRICTED.length !== 3) throw new Error(`FALHA: ALLOWED_NICHES_RESTRICTED deve ter 3 itens, tem ${ALLOWED_NICHES_RESTRICTED.length}!`);
    console.log(`✓ ALLOWED_NICHES_RESTRICTED: [${ALLOWED_NICHES_RESTRICTED.join(", ")}]`);

    if (!ALLOWED_STYLES_RESTRICTED.includes("Sério")) throw new Error("FALHA: Sério deve estar em ALLOWED_STYLES_RESTRICTED!");
    if (!ALLOWED_STYLES_RESTRICTED.includes("Informativo")) throw new Error("FALHA: Informativo deve estar em ALLOWED_STYLES_RESTRICTED!");
    if (!ALLOWED_STYLES_RESTRICTED.includes("Alegre")) throw new Error("FALHA: Alegre deve estar em ALLOWED_STYLES_RESTRICTED!");
    if (!ALLOWED_STYLES_RESTRICTED.includes("Atraente")) throw new Error("FALHA: Atraente deve estar em ALLOWED_STYLES_RESTRICTED!");
    if (ALLOWED_STYLES_RESTRICTED.length !== 4) throw new Error(`FALHA: ALLOWED_STYLES_RESTRICTED deve ter 4 itens, tem ${ALLOWED_STYLES_RESTRICTED.length}!`);
    console.log(`✓ ALLOWED_STYLES_RESTRICTED: [${ALLOWED_STYLES_RESTRICTED.join(", ")}]`);

    // --- Teste 2: Features de IA no SEED_FEATURES ---
    console.log("\n--- Teste 2: AI_FEATURES constants ---");
    if (AI_FEATURES.UNLIMITED_NICHES !== "ai_unlimited_niches") throw new Error("FALHA: AI_FEATURES.UNLIMITED_NICHES incorreto!");
    if (AI_FEATURES.UNLIMITED_STYLES !== "ai_unlimited_styles") throw new Error("FALHA: AI_FEATURES.UNLIMITED_STYLES incorreto!");
    if (AI_FEATURES.ADVANCED_PROVIDERS !== "ai_advanced_providers") throw new Error("FALHA: AI_FEATURES.ADVANCED_PROVIDERS incorreto!");
    console.log("✓ AI_FEATURES constants corretas.");

    // --- Teste 3: Plan Free não tem niches/styles ilimitados ---
    console.log("\n--- Teste 3: Plano Free — restrição de nicho e estilo ---");
    const freeNiches = await BillingService.hasFeature(wsFree.id, FEAT_ID_NICHES);
    const freeStyles = await BillingService.hasFeature(wsFree.id, FEAT_ID_STYLES);
    if (freeNiches) throw new Error("FALHA: Free não deveria ter niches ilimitados!");
    if (freeStyles) throw new Error("FALHA: Free não deveria ter styles ilimitados!");
    console.log("✓ Plano Free: ai_unlimited_niches = false, ai_unlimited_styles = false.");

    // --- Teste 4: Plan Pro tem niches/styles ilimitados ---
    console.log("\n--- Teste 4: Plano Pro — sem restrição de nicho e estilo ---");
    const proNiches = await BillingService.hasFeature(wsPro.id, FEAT_ID_NICHES);
    const proStyles = await BillingService.hasFeature(wsPro.id, FEAT_ID_STYLES);
    if (!proNiches) throw new Error("FALHA: Pro deveria ter niches ilimitados!");
    if (!proStyles) throw new Error("FALHA: Pro deveria ter styles ilimitados!");
    console.log("✓ Plano Pro: ai_unlimited_niches = true, ai_unlimited_styles = true.");

    // --- Cleanup ---
    await prisma.planFeature.deleteMany({ where: { plan: { slug: { in: [PLAN_FREE, PLAN_PRO] } } } });
    await prisma.subscription.deleteMany({ where: { workspace: { slug: { in: [WS_FREE, WS_PRO] } } } });
    await prisma.workspace.deleteMany({ where: { slug: { in: [WS_FREE, WS_PRO] } } });
    await prisma.plan.deleteMany({ where: { slug: { in: [PLAN_FREE, PLAN_PRO] } } });
    await prisma.feature.deleteMany({ where: { key: { in: [FEAT_ID_NICHES, FEAT_ID_STYLES] } } });

    console.log("\n================================================================================");
    console.log("🏆 TASK 141: TODOS OS TESTES PASSARAM COM SUCESSO!");
    console.log("================================================================================");
  } catch (err) {
    // Cleanup on error
    try {
      await prisma.planFeature.deleteMany({ where: { plan: { slug: { in: [PLAN_FREE, PLAN_PRO] } } } });
      await prisma.subscription.deleteMany({ where: { workspace: { slug: { in: [WS_FREE, WS_PRO] } } } });
      await prisma.workspace.deleteMany({ where: { slug: { in: [WS_FREE, WS_PRO] } } });
      await prisma.plan.deleteMany({ where: { slug: { in: [PLAN_FREE, PLAN_PRO] } } });
      await prisma.feature.deleteMany({ where: { key: { in: [FEAT_ID_NICHES, FEAT_ID_STYLES] } } });
    } catch {}
    console.error("ERRO:", err);
    process.exit(1);
  }
}

run();
