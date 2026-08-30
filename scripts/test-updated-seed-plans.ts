import { prisma } from "../src/lib/prisma";
import { BillingService } from "../src/lib/billing";

async function main() {
  console.log("=================================================");
  console.log("=== TEST: Verificação dos Novos Planos do Seed ===");
  console.log("=================================================");

  console.log("\n1. Executando BillingService.ensureDefaultPlans()...");
  await BillingService.ensureDefaultPlans();
  console.log("✓ ensureDefaultPlans executado com sucesso.");

  console.log("\n2. Buscando todos os planos do banco de dados...");
  const dbPlans = await prisma.plan.findMany({
    orderBy: { price: "asc" },
    include: {
      planFeatures: {
        include: { feature: true },
      },
    },
  });

  console.log(`✓ Total de planos encontrados no banco: ${dbPlans.length}`);
  if (dbPlans.length < 5) {
    throw new Error(`Esperado pelo menos 5 planos, encontrado: ${dbPlans.length}`);
  }

  // Validar cada um dos 5 planos
  const expectedPlans = [
    {
      slug: "free",
      name: "Plano Gratuito",
      price: 0,
      monthlyPrice: 0,
      annualDiscountPercent: 0,
      maxArticles: 10,
      maxDailyArticles: 2,
      maxSources: 1,
      maxWordPressSites: 1,
      highlight: false,
      activeFeaturesCount: 0,
    },
    {
      slug: "starter",
      name: "Plano Starter",
      price: 39.9,
      monthlyPrice: 39.9,
      annualDiscountPercent: 16.0,
      maxArticles: 50,
      maxDailyArticles: 3,
      maxSources: 3,
      maxWordPressSites: 1,
      highlight: false,
      activeFeaturesCount: 3,
    },
    {
      slug: "influencer",
      name: "Plano Influencer",
      price: 79.9,
      monthlyPrice: 79.9,
      annualDiscountPercent: 16.0,
      maxArticles: 150,
      maxDailyArticles: 10,
      maxSources: 15,
      maxWordPressSites: 2,
      highlight: true,
      activeFeaturesCount: 7,
    },
    {
      slug: "pro",
      name: "Plano Pro",
      price: 149.9,
      monthlyPrice: 149.9,
      annualDiscountPercent: 16.0,
      maxArticles: 500,
      maxDailyArticles: 25,
      maxSources: 30,
      maxWordPressSites: 5,
      highlight: false,
      activeFeaturesCount: 7,
    },
    {
      slug: "agencia",
      name: "Plano Agência",
      price: 299.9,
      monthlyPrice: 299.9,
      annualDiscountPercent: 16.0,
      maxArticles: 1500,
      maxDailyArticles: 50,
      maxSources: 100,
      maxWordPressSites: 20,
      highlight: false,
      activeFeaturesCount: 7,
    },
  ];

  for (const expected of expectedPlans) {
    const p = dbPlans.find((plan) => plan.slug === expected.slug);
    if (!p) {
      throw new Error(`Plano com slug ${expected.slug} não foi encontrado no banco!`);
    }

    console.log(`\nValidando plano: ${p.name} (${p.slug})...`);
    if (Number(p.monthlyPrice) !== expected.monthlyPrice) {
      throw new Error(`[${p.slug}] Preço mensal incorreto. Esperado ${expected.monthlyPrice}, obtido ${p.monthlyPrice}`);
    }
    if (Number(p.annualDiscountPercent) !== expected.annualDiscountPercent) {
      throw new Error(`[${p.slug}] Desconto anual incorreto. Esperado ${expected.annualDiscountPercent}, obtido ${p.annualDiscountPercent}`);
    }
    if (p.maxArticles !== expected.maxArticles) {
      throw new Error(`[${p.slug}] maxArticles incorreto. Esperado ${expected.maxArticles}, obtido ${p.maxArticles}`);
    }
    if (p.maxDailyArticles !== expected.maxDailyArticles) {
      throw new Error(`[${p.slug}] maxDailyArticles incorreto. Esperado ${expected.maxDailyArticles}, obtido ${p.maxDailyArticles}`);
    }
    if (p.maxSources !== expected.maxSources) {
      throw new Error(`[${p.slug}] maxSources incorreto. Esperado ${expected.maxSources}, obtido ${p.maxSources}`);
    }
    if (p.maxWordPressSites !== expected.maxWordPressSites) {
      throw new Error(`[${p.slug}] maxWordPressSites incorreto. Esperado ${expected.maxWordPressSites}, obtido ${p.maxWordPressSites}`);
    }
    if (p.highlight !== expected.highlight) {
      throw new Error(`[${p.slug}] highlight incorreto. Esperado ${expected.highlight}, obtido ${p.highlight}`);
    }

    const enabledFeatures = p.planFeatures.filter((pf) => pf.enabled);
    console.log(`  - Features ativas: ${enabledFeatures.length} (esperado: ${expected.activeFeaturesCount})`);
    enabledFeatures.forEach((pf) => {
      console.log(`    ✦ ${pf.feature.name} ${pf.limit ? `(${pf.limit})` : ""}`);
    });

    if (enabledFeatures.length !== expected.activeFeaturesCount) {
      throw new Error(`[${p.slug}] Quantidade de features ativas incorreta. Esperado ${expected.activeFeaturesCount}, obtido ${enabledFeatures.length}`);
    }
  }

  // Validar limites numéricos de produtos e programas nos planos influencer, pro e agencia
  const influencer = dbPlans.find((p) => p.slug === "influencer")!;
  const pro = dbPlans.find((p) => p.slug === "pro")!;
  const agencia = dbPlans.find((p) => p.slug === "agencia")!;

  const getLimit = (plan: typeof influencer, key: string) => {
    const pf = plan.planFeatures.find((f) => f.feature.key === key);
    return pf ? pf.limit : null;
  };

  if (getLimit(influencer, "affiliate_max_products") !== 100 || getLimit(influencer, "affiliate_max_programs") !== 100) {
    throw new Error("Limites de produtos/programas no Influencer devem ser 100.");
  }
  if (getLimit(pro, "affiliate_max_products") !== 1000 || getLimit(pro, "affiliate_max_programs") !== 1000) {
    throw new Error("Limites de produtos/programas no Pro devem ser 1000.");
  }
  if (getLimit(agencia, "affiliate_max_products") !== 5000 || getLimit(agencia, "affiliate_max_programs") !== 5000) {
    throw new Error("Limites de produtos/programas na Agência devem ser 5000.");
  }

  console.log("\n=================================================");
  console.log(">>> TODOS OS 5 PLANOS FORAM VALIDADOS COM SUCESSO! <<<");
  console.log("=================================================");
}

main()
  .catch((err) => {
    console.error("ERRO NO TESTE:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
