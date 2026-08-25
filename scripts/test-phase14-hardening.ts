import { prisma } from "@/lib/prisma";
import { BillingService, ALLOWED_NICHES_RESTRICTED, ALLOWED_STYLES_RESTRICTED, ALLOWED_PROVIDERS_RESTRICTED } from "@/lib/billing";

async function run() {
  console.log("================================================================================");
  console.log("🛡️ AUDITORIA & HARDENING PHASE 14: E2E INTEGRATION SUITE");
  console.log("================================================================================\n");

  const WS_RESTRICTED = "p14-ws-restricted";
  const WS_UNRESTRICTED = "p14-ws-unrestricted";
  const PLAN_RESTRICTED = "p14-plan-restricted";
  const PLAN_UNRESTRICTED = "p14-plan-unrestricted";

  const FEAT_NICHES = "p14-feat-niches";
  const FEAT_STYLES = "p14-feat-styles";
  const FEAT_PROVIDERS = "p14-feat-providers";

  try {
    // --- 0. Cleanup ---
    console.log("--- Cenário 0: Limpeza do ambiente de teste ---");
    await prisma.planFeature.deleteMany({ where: { plan: { slug: { in: [PLAN_RESTRICTED, PLAN_UNRESTRICTED] } } } });
    await prisma.wordPressSite.deleteMany({ where: { workspace: { slug: { in: [WS_RESTRICTED, WS_UNRESTRICTED] } } } });
    await prisma.article.deleteMany({ where: { workspace: { slug: { in: [WS_RESTRICTED, WS_UNRESTRICTED] } } } });
    await prisma.subscription.deleteMany({ where: { workspace: { slug: { in: [WS_RESTRICTED, WS_UNRESTRICTED] } } } });
    await prisma.workspace.deleteMany({ where: { slug: { in: [WS_RESTRICTED, WS_UNRESTRICTED] } } });
    await prisma.plan.deleteMany({ where: { slug: { in: [PLAN_RESTRICTED, PLAN_UNRESTRICTED] } } });
    await prisma.feature.deleteMany({ where: { key: { in: [FEAT_NICHES, FEAT_STYLES, FEAT_PROVIDERS] } } });
    console.log("✓ Limpeza concluída.");

    // --- 1. Setup ---
    console.log("\n--- Cenário 1: Setup de Planos, Features e Workspaces ---");
    const fn = await prisma.feature.create({ data: { key: FEAT_NICHES, name: "Unlimited Niches", valueType: "BOOLEAN", active: true } });
    const fs = await prisma.feature.create({ data: { key: FEAT_STYLES, name: "Unlimited Styles", valueType: "BOOLEAN", active: true } });
    const fp = await prisma.feature.create({ data: { key: FEAT_PROVIDERS, name: "Advanced Providers", valueType: "BOOLEAN", active: true } });

    const planRestricted = await prisma.plan.create({
      data: {
        name: "Plano Restrito P14",
        slug: PLAN_RESTRICTED,
        price: 0,
        maxArticles: 10,
        maxDailyArticles: 2,
        maxSources: 2,
        maxWordPressSites: 1,
      },
    });

    const planUnrestricted = await prisma.plan.create({
      data: {
        name: "Plano Ilimitado P14",
        slug: PLAN_UNRESTRICTED,
        price: 199,
        maxArticles: 1000,
        maxDailyArticles: 100,
        maxSources: 50,
        maxWordPressSites: 10,
      },
    });

    await prisma.planFeature.createMany({
      data: [
        { planId: planRestricted.id, featureId: fn.id, enabled: false },
        { planId: planRestricted.id, featureId: fs.id, enabled: false },
        { planId: planRestricted.id, featureId: fp.id, enabled: false },
        { planId: planUnrestricted.id, featureId: fn.id, enabled: true },
        { planId: planUnrestricted.id, featureId: fs.id, enabled: true },
        { planId: planUnrestricted.id, featureId: fp.id, enabled: true },
      ],
    });

    const wsRestricted = await prisma.workspace.create({ data: { name: "WS Restrito P14", slug: WS_RESTRICTED, active: true } });
    await prisma.subscription.create({ data: { workspaceId: wsRestricted.id, planId: planRestricted.id, status: "ACTIVE" } });

    const wsUnrestricted = await prisma.workspace.create({ data: { name: "WS Ilimitado P14", slug: WS_UNRESTRICTED, active: true } });
    await prisma.subscription.create({ data: { workspaceId: wsUnrestricted.id, planId: planUnrestricted.id, status: "ACTIVE" } });

    console.log("✓ Workspaces e Planos configurados.");

    // --- 2. Limite de Sites WordPress ---
    console.log("\n--- Cenário 2: Validação de Limite de Sites WordPress ---");
    const checkWp1 = await BillingService.checkLimit(wsRestricted.id, "WORDPRESS_SITES");
    if (!checkWp1.allowed) throw new Error("FALHA: WS Restrito deveria poder criar 1º site!");

    await prisma.wordPressSite.create({
      data: { workspaceId: wsRestricted.id, name: "WP Site 1", url: "https://wp1.com", username: "admin", encryptedApplicationPassword: "enc" },
    });

    const checkWp2 = await BillingService.checkLimit(wsRestricted.id, "WORDPRESS_SITES");
    if (checkWp2.allowed) throw new Error("FALHA: WS Restrito deveria ser bloqueado no 2º site (max=1)!");
    console.log(`✓ WS Restrito bloqueado corretamente: "${checkWp2.message}"`);

    const checkWpUnrestricted = await BillingService.checkLimit(wsUnrestricted.id, "WORDPRESS_SITES");
    if (!checkWpUnrestricted.allowed) throw new Error("FALHA: WS Ilimitado deveria poder criar sites (max=10)!");
    console.log(`✓ WS Ilimitado dentro do limite (${checkWpUnrestricted.current}/${checkWpUnrestricted.limit}).`);

    // --- 3. Limite Diário de Artigos ---
    console.log("\n--- Cenário 3: Validação de Limite Diário de Artigos ---");
    const now = new Date();
    await prisma.article.createMany({
      data: [
        { workspaceId: wsRestricted.id, title: "Artigo Hoje 1", processedAt: now, status: "PENDING" },
        { workspaceId: wsRestricted.id, title: "Artigo Hoje 2", processedAt: now, status: "PENDING" },
      ],
    });

    const checkDailyRestricted = await BillingService.checkLimit(wsRestricted.id, "ARTICLES_DAILY");
    if (checkDailyRestricted.allowed) throw new Error("FALHA: WS Restrito deveria estar bloqueado após 2 artigos hoje (maxDaily=2)!");
    if (!checkDailyRestricted.message?.includes("Renova amanhã")) throw new Error("FALHA: Mensagem diária deve conter 'Renova amanhã'!");
    console.log(`✓ Limite diário acionado corretamente: "${checkDailyRestricted.message}"`);

    // --- 4. Limite Mensal de Artigos ---
    console.log("\n--- Cenário 4: Validação de Limite Mensal de Artigos ---");
    await prisma.article.createMany({
      data: Array.from({ length: 8 }).map((_, i) => ({
        workspaceId: wsRestricted.id,
        title: `Artigo Mensal Extra ${i}`,
        processedAt: new Date(now.getFullYear(), now.getMonth(), 1 + (i % 20)),
        status: "PENDING",
      })),
    });

    const checkMonthlyRestricted = await BillingService.checkLimit(wsRestricted.id, "ARTICLES");
    if (checkMonthlyRestricted.allowed) throw new Error("FALHA: WS Restrito deveria estar bloqueado após 10 artigos mensais (max=10)!");
    if (!checkMonthlyRestricted.message?.includes("Renova em")) throw new Error("FALHA: Mensagem mensal deve conter 'Renova em'!");
    console.log(`✓ Limite mensal acionado corretamente: "${checkMonthlyRestricted.message}"`);

    // --- 5. Restrição de Nichos de IA ---
    console.log("\n--- Cenário 5: Restrição de Nichos de Atuação de IA ---");
    const nichesFeatRestricted = await BillingService.hasFeature(wsRestricted.id, FEAT_NICHES);
    const nichesFeatUnrestricted = await BillingService.hasFeature(wsUnrestricted.id, FEAT_NICHES);
    if (nichesFeatRestricted) throw new Error("FALHA: WS Restrito não deve ter nichos ilimitados!");
    if (!nichesFeatUnrestricted) throw new Error("FALHA: WS Ilimitado deve ter nichos ilimitados!");

    console.log(`✓ Nichos permitidos em plano restrito: [${ALLOWED_NICHES_RESTRICTED.join(", ")}]`);
    console.log("✓ Validação de nichos por plano confirmada.");

    // --- 6. Restrição de Estilos de IA ---
    console.log("\n--- Cenário 6: Restrição de Estilos de Escrita de IA ---");
    const stylesFeatRestricted = await BillingService.hasFeature(wsRestricted.id, FEAT_STYLES);
    const stylesFeatUnrestricted = await BillingService.hasFeature(wsUnrestricted.id, FEAT_STYLES);
    if (stylesFeatRestricted) throw new Error("FALHA: WS Restrito não deve ter estilos ilimitados!");
    if (!stylesFeatUnrestricted) throw new Error("FALHA: WS Ilimitado deve ter estilos ilimitados!");

    console.log(`✓ Estilos permitidos em plano restrito: [${ALLOWED_STYLES_RESTRICTED.join(", ")}]`);
    console.log("✓ Validação de estilos por plano confirmada.");

    // --- 7. Restrição de Provedores de IA ---
    console.log("\n--- Cenário 7: Restrição de Provedores de IA Avançados ---");
    const providersFeatRestricted = await BillingService.hasFeature(wsRestricted.id, FEAT_PROVIDERS);
    const providersFeatUnrestricted = await BillingService.hasFeature(wsUnrestricted.id, FEAT_PROVIDERS);
    if (providersFeatRestricted) throw new Error("FALHA: WS Restrito não deve ter provedores avançados!");
    if (!providersFeatUnrestricted) throw new Error("FALHA: WS Ilimitado deve ter provedores avançados!");

    console.log(`✓ Provedores permitidos em plano restrito: [${ALLOWED_PROVIDERS_RESTRICTED.join(", ")}]`);
    console.log("✓ Validação de provedores por plano confirmada.");

    // --- 8. Isolation Multi-Tenant ---
    console.log("\n--- Cenário 8: Isolamento Multi-Tenant ---");
    const checkUnrestrictedDaily = await BillingService.checkLimit(wsUnrestricted.id, "ARTICLES_DAILY");
    if (!checkUnrestrictedDaily.allowed) throw new Error("FALHA: WS Ilimitado não deve sofrer interferência do WS Restrito!");
    console.log(`✓ WS Ilimitado 100% isolado com saldo livre (${checkUnrestrictedDaily.current}/${checkUnrestrictedDaily.limit}).`);

    // --- Cleanup final ---
    await prisma.planFeature.deleteMany({ where: { plan: { slug: { in: [PLAN_RESTRICTED, PLAN_UNRESTRICTED] } } } });
    await prisma.wordPressSite.deleteMany({ where: { workspace: { slug: { in: [WS_RESTRICTED, WS_UNRESTRICTED] } } } });
    await prisma.article.deleteMany({ where: { workspace: { slug: { in: [WS_RESTRICTED, WS_UNRESTRICTED] } } } });
    await prisma.subscription.deleteMany({ where: { workspace: { slug: { in: [WS_RESTRICTED, WS_UNRESTRICTED] } } } });
    await prisma.workspace.deleteMany({ where: { slug: { in: [WS_RESTRICTED, WS_UNRESTRICTED] } } });
    await prisma.plan.deleteMany({ where: { slug: { in: [PLAN_RESTRICTED, PLAN_UNRESTRICTED] } } });
    await prisma.feature.deleteMany({ where: { key: { in: [FEAT_NICHES, FEAT_STYLES, FEAT_PROVIDERS] } } });

    console.log("\n================================================================================");
    console.log("🏆 HARDENING PHASE 14 COMPLETO: 8/8 CENÁRIOS APROVADOS COM SUCESSO!");
    console.log("================================================================================");
  } catch (err) {
    try {
      await prisma.planFeature.deleteMany({ where: { plan: { slug: { in: [PLAN_RESTRICTED, PLAN_UNRESTRICTED] } } } });
      await prisma.wordPressSite.deleteMany({ where: { workspace: { slug: { in: [WS_RESTRICTED, WS_UNRESTRICTED] } } } });
      await prisma.article.deleteMany({ where: { workspace: { slug: { in: [WS_RESTRICTED, WS_UNRESTRICTED] } } } });
      await prisma.subscription.deleteMany({ where: { workspace: { slug: { in: [WS_RESTRICTED, WS_UNRESTRICTED] } } } });
      await prisma.workspace.deleteMany({ where: { slug: { in: [WS_RESTRICTED, WS_UNRESTRICTED] } } });
      await prisma.plan.deleteMany({ where: { slug: { in: [PLAN_RESTRICTED, PLAN_UNRESTRICTED] } } });
      await prisma.feature.deleteMany({ where: { key: { in: [FEAT_NICHES, FEAT_STYLES, FEAT_PROVIDERS] } } });
    } catch {}
    console.error("ERRO:", err);
    process.exit(1);
  }
}

run();
