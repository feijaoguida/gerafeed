import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import {
  AffiliatePromptTemplateService,
  ensureDefaultAffiliatePrograms,
} from "@/lib/affiliate";

async function run() {
  console.log("=== TEST: Task 121 - Affiliate Prompt Templates & Resolution Hierarchy ===");

  const WS_A_SLUG = "test-ws-prompt-a";
  const WS_B_SLUG = "test-ws-prompt-b";
  const PLAN_SLUG = "test-plan-prompt";

  try {
    // 0. Cleanup
    await ensureDefaultAffiliatePrograms();

    await prisma.promptTemplate.deleteMany({
      where: {
        OR: [
          { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
          { workspaceId: null },
        ],
      },
    });
    await prisma.subscription.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } },
    });
    await prisma.planFeature.deleteMany({
      where: { plan: { slug: PLAN_SLUG } },
    });
    await prisma.plan.deleteMany({
      where: { slug: PLAN_SLUG },
    });

    // 1. Setup Plans & Workspaces
    console.log("\n--- Check 1: Setup de Planos e Workspaces ---");
    await BillingService.ensureDefaultFeatures();
    const featModule = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MODULE } });

    const plan = await prisma.plan.create({
      data: {
        name: "Plano Prompts",
        slug: PLAN_SLUG,
        price: 99.0,
        planFeatures: {
          create: [{ featureId: featModule.id, enabled: true }],
        },
      },
    });

    const wsA = await prisma.workspace.create({
      data: { name: "Tenant A Prompts", slug: WS_A_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsA.id, planId: plan.id, status: "ACTIVE" },
    });

    const wsB = await prisma.workspace.create({
      data: { name: "Tenant B Prompts", slug: WS_B_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsB.id, planId: plan.id, status: "ACTIVE" },
    });
    console.log("✓ Check 1 PASS: Workspaces e planos configurados.");

    // 2. Seeding Idempotente de Templates Padrão do Sistema
    console.log("\n--- Check 2: Seeding de Templates Padrão do Sistema ---");
    await AffiliatePromptTemplateService.ensureDefaultTemplates();

    const systemTemplates = await prisma.promptTemplate.findMany({
      where: { workspaceId: null },
    });

    if (systemTemplates.length !== 7) {
      throw new Error(`FAIL: Esperava 7 templates de sistema, encontrado ${systemTemplates.length}`);
    }
    console.log("✓ Check 2 PASS: Todos os 7 templates padrão do sistema foram persistidos.");

    // 3. Resolução Padrão Sem Override
    console.log("\n--- Check 3: Resolução Padrão (Fallback para Sistema) ---");
    const defaultReview = await AffiliatePromptTemplateService.getEffectiveTemplate(
      wsA.id,
      "PRODUCT_REVIEW"
    );

    if (defaultReview.isCustomOverride || !defaultReview.systemPrompt.includes("redator")) {
      throw new Error("FAIL: Resolução padrão para workspace sem override falhou!");
    }
    console.log("✓ Check 3 PASS: Template padrão do sistema resolvido com sucesso.");

    // 4. Criação e Versionamento de Custom Override
    console.log("\n--- Check 4: Criação e Versionamento de Custom Override ---");
    const customV1 = await AffiliatePromptTemplateService.saveOverride(wsA.id, "PRODUCT_REVIEW", {
      name: "Review Customizado do Tenant A",
      systemPrompt: "Você é um revisor de tecnologia sarcástico e ultra criterioso.",
      userPromptTemplate: "Analise impiedosamente o produto {{product.name}} da marca {{product.brand}}.",
    });

    if (!customV1.isCustomOverride || customV1.version !== 1) {
      throw new Error("FAIL: Criação do override v1 falhou.");
    }

    const customV2 = await AffiliatePromptTemplateService.saveOverride(wsA.id, "PRODUCT_REVIEW", {
      systemPrompt: "Você é um revisor de tecnologia ultra rigoroso v2.",
      userPromptTemplate: "Nova versão do prompt para {{product.name}}.",
    });

    if (customV2.version !== 2) {
      throw new Error(`FAIL: Versionamento do override falhou. Esperava v2, obtido v${customV2.version}`);
    }

    const resolvedA = await AffiliatePromptTemplateService.getEffectiveTemplate(wsA.id, "PRODUCT_REVIEW");
    if (!resolvedA.isCustomOverride || resolvedA.version !== 2) {
      throw new Error("FAIL: Consulta do template efetivo não retornou a versão mais recente do override!");
    }
    console.log("✓ Check 4 PASS: Criação e versionamento incremental de custom override validados.");

    // 5. Isolamento Multi-Tenant Estrito
    console.log("\n--- Check 5: Isolamento Multi-Tenant Estrito ---");
    const resolvedB = await AffiliatePromptTemplateService.getEffectiveTemplate(wsB.id, "PRODUCT_REVIEW");
    if (resolvedB.isCustomOverride || resolvedB.workspaceId !== null) {
      throw new Error("FAIL: Tenant B acessou o override customizado do Tenant A!");
    }
    console.log("✓ Check 5 PASS: Isolamento estrito entre múltiplos tenants confirmado.");

    // 6. Interpolação Segura de Variáveis (Mustache-style Rendering)
    console.log("\n--- Check 6: Interpolação de Variáveis no Prompt ---");
    const rendered = AffiliatePromptTemplateService.renderPrompt(
      "Produto: {{product.name}} | Marca: {{product.brand}} | Specs: {{product.specs.cpu}} | Extra: {{nonExistent}}",
      {
        product: {
          name: "Notebook Pro 16",
          brand: "TechBrand",
          specs: { cpu: "M3 Max" },
        },
      }
    );

    const expectedRender = "Produto: Notebook Pro 16 | Marca: TechBrand | Specs: M3 Max | Extra: ";
    if (rendered !== expectedRender) {
      throw new Error(`FAIL: Interpolação incorreta.\nEsperado: "${expectedRender}"\nRecebido: "${rendered}"`);
    }
    console.log("✓ Check 6 PASS: Interpolação de variáveis e tratamento de chaves inexistentes validados.");

    // 7. Restauração do Padrão do Sistema (Reset Override)
    console.log("\n--- Check 7: Restauração do Padrão do Sistema ---");
    await AffiliatePromptTemplateService.resetOverride(wsA.id, "PRODUCT_REVIEW");
    const afterReset = await AffiliatePromptTemplateService.getEffectiveTemplate(wsA.id, "PRODUCT_REVIEW");

    if (afterReset.isCustomOverride) {
      throw new Error("FAIL: Reset de override não restaurou o template padrão do sistema!");
    }
    console.log("✓ Check 7 PASS: Override removido e padrão do sistema restaurado com sucesso.");

    // Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.promptTemplate.deleteMany({
      where: {
        OR: [
          { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
          { workspaceId: null },
        ],
      },
    });
    await prisma.subscription.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } },
    });
    await prisma.planFeature.deleteMany({
      where: { plan: { slug: PLAN_SLUG } },
    });
    await prisma.plan.deleteMany({
      where: { slug: PLAN_SLUG },
    });
    console.log("✓ Cleanup concluído com sucesso.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 121 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 121:", error);
    process.exit(1);
  }
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
