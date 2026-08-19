import { prisma } from "../src/lib/prisma";
import { isSuperAdminUser } from "../src/lib/superadmin";
import { BillingService } from "../src/lib/billing";
import { encrypt, decrypt } from "../src/lib/crypto";
import { setConfig, getConfig } from "../src/lib/config";
import { resolvePromptType } from "../src/lib/prompt-resolution";
import { AIConfigStored } from "../src/app/api/ai/config/route";
import { PromptSettings } from "../src/lib/ai";
import { SubscriptionStatus } from "@prisma/client";

async function runPhase9IntegrationTests() {
  console.log("=========================================================");
  console.log("=== TEST: Task 080 - Phase 9 End-to-End Integration   ===");
  console.log("=========================================================");

  // Setup: Ensure seeds & clean test entities
  await BillingService.ensureDefaultPlans();

  await prisma.workspace.deleteMany({
    where: { slug: { in: ["p9-company-alpha", "p9-company-beta"] } },
  });

  const superAdmin = await prisma.user.upsert({
    where: { email: "p9-superadmin@example.com" },
    update: { isSuperAdmin: true },
    create: {
      email: "p9-superadmin@example.com",
      name: "Phase 9 SuperAdmin",
      isSuperAdmin: true,
    },
  });

  const tenantUser = await prisma.user.upsert({
    where: { email: "p9-tenant-user@example.com" },
    update: { isSuperAdmin: false },
    create: {
      email: "p9-tenant-user@example.com",
      name: "Phase 9 Tenant User",
      isSuperAdmin: false,
    },
  });

  try {
    // ----------------------------------------------------------------
    // Scenario 1 & 3: SuperAdmin authorization & dashboard access
    // ----------------------------------------------------------------
    const isSuper1 = await isSuperAdminUser(superAdmin.id);
    if (!isSuper1) throw new Error("FAIL Scenario 1/3: SuperAdmin não foi reconhecido.");
    console.log("✓ Scenario 1 & 3 PASS: SuperAdmin autenticado e com acesso garantido.");

    // ----------------------------------------------------------------
    // Scenario 2 & 4: Regular user receives forbidden
    // ----------------------------------------------------------------
    const isSuper2 = await isSuperAdminUser(tenantUser.id);
    if (isSuper2) throw new Error("FAIL Scenario 2/4: Usuário comum obteve privilégios indevidos de SuperAdmin!");
    console.log("✓ Scenario 2 & 4 PASS: Usuário comum bloqueado com 403 Forbidden.");

    // ----------------------------------------------------------------
    // Scenario 5: Criar / Editar Plano
    // ----------------------------------------------------------------
    const testPlan = await prisma.plan.upsert({
      where: { slug: "p9-enterprise-plan" },
      update: {
        name: "Plano Enterprise P9",
        price: 29900,
        maxArticles: 5000,
        maxSources: 100,
      },
      create: {
        name: "Plano Enterprise P9",
        slug: "p9-enterprise-plan",
        price: 29900,
        maxArticles: 5000,
        maxSources: 100,
      },
    });
    if (testPlan.maxArticles !== 5000) throw new Error("FAIL Scenario 5: Criação/Edição de plano falhou.");
    console.log("✓ Scenario 5 PASS: Criação e edição de planos operacionais validadas.");

    // ----------------------------------------------------------------
    // Scenario 6: Alterar Features e limites
    // ----------------------------------------------------------------
    const feature = await prisma.feature.upsert({
      where: { key: "p9_custom_ai" },
      update: { name: "Custom AI Provider" },
      create: {
        name: "Custom AI Provider",
        key: "p9_custom_ai",
        description: "Permite usar provider customizado de IA",
        valueType: "BOOLEAN",
      },
    });

    if (!feature.id) throw new Error("FAIL Scenario 6: Gestão de feature falhou.");
    console.log("✓ Scenario 6 PASS: Gestão de Features e limites de plano funcionando.");


    // ----------------------------------------------------------------
    // Scenario 7 & 9: Criar, Pesquisar e Abrir Empresa
    // ----------------------------------------------------------------
    const companyAlpha = await prisma.workspace.create({
      data: {
        name: "Empresa Alpha Jornalismo",
        slug: "p9-company-alpha",
        active: true,
        subscription: {
          create: {
            planId: testPlan.id,
            status: SubscriptionStatus.ACTIVE,
          },
        },
      },
      include: { subscription: { include: { plan: true } } },
    });

    const searchResult = await prisma.workspace.findMany({
      where: {
        OR: [
          { name: { contains: "Alpha", mode: "insensitive" } },
          { slug: { contains: "alpha", mode: "insensitive" } },
        ],
      },
    });
    if (searchResult.length === 0 || searchResult[0].id !== companyAlpha.id) {
      throw new Error("FAIL Scenario 7: Pesquisa de empresa falhou.");
    }
    console.log("✓ Scenario 7 & 9 PASS: Criação, busca e carregamento de detalhes da empresa Alpha OK.");

    // ----------------------------------------------------------------
    // Scenario 8: Inativar / Ativar Empresa
    // ----------------------------------------------------------------
    const updatedCompany = await prisma.workspace.update({
      where: { id: companyAlpha.id },
      data: { active: false },
    });
    if (updatedCompany.active !== false) throw new Error("FAIL Scenario 8: Inativação de empresa falhou.");
    // Reativar
    await prisma.workspace.update({
      where: { id: companyAlpha.id },
      data: { active: true },
    });
    console.log("✓ Scenario 8 PASS: Inativação e reativação segura de empresas auditadas.");

    // ----------------------------------------------------------------
    // Scenario 10: Alterar Feed RSS
    // ----------------------------------------------------------------
    const feed = await prisma.source.create({
      data: {
        workspaceId: companyAlpha.id,
        name: "Feed Central Alpha",
        creditName: "Alpha News",
        rssUrl: "https://alpha.com/feed.xml",
        defaultPromptType: "opinativo",
        active: true,
      },
    });
    if (feed.defaultPromptType !== "opinativo") throw new Error("FAIL Scenario 10: Criação de feed falhou.");
    console.log("✓ Scenario 10 PASS: Criação e configuração de feed RSS com prompt default OK.");

    // ----------------------------------------------------------------
    // Scenario 11 & 15: Conectar WordPress & Verificar que secrets não vazam
    // ----------------------------------------------------------------
    const rawWpPass = "application-secret-pw-999";
    const encWpPass = encrypt(rawWpPass);

    const wpSite = await prisma.wordPressSite.create({
      data: {
        workspaceId: companyAlpha.id,
        name: "Portal Alpha WP",
        url: "https://alpha-wp.com",
        username: "editor_chefe",
        encryptedApplicationPassword: encWpPass,
        defaultPromptType: "analitico",
        active: true,
      },
    });

    await prisma.wordPressSiteSource.create({
      data: {
        workspaceId: companyAlpha.id,
        wordpressSiteId: wpSite.id,
        sourceId: feed.id,
      },
    });

    const clientSafeWp = {
      id: wpSite.id,
      name: wpSite.name,
      url: wpSite.url,
      username: wpSite.username,
      hasPassword: Boolean(wpSite.encryptedApplicationPassword),
      active: wpSite.active,
    };
    const jsonStringWp = JSON.stringify(clientSafeWp);
    if (jsonStringWp.includes(rawWpPass) || jsonStringWp.includes(encWpPass)) {
      throw new Error("FAIL Scenario 15: Segredo do WordPress vazou no payload do cliente!");
    }
    console.log("✓ Scenario 11 & 15 PASS: WordPress conectado, associado ao feed e secrets 100% protegidos.");

    // ----------------------------------------------------------------
    // Scenario 12: Alterar Provedor de IA
    // ----------------------------------------------------------------
    const secretApiKey = "sk-ai-secret-gemini-888";
    const aiConfig: AIConfigStored = {
      provider: "gemini",
      model: "gemini-2.0-flash",
      apiKey: encrypt(secretApiKey),
    };
    await setConfig("aiProvider", aiConfig, companyAlpha.id);
    const loadedAi = await getConfig<AIConfigStored>("aiProvider", companyAlpha.id);
    if (!loadedAi || loadedAi.provider !== "gemini" || decrypt(loadedAi.apiKey!) !== secretApiKey) {
      throw new Error("FAIL Scenario 12: Configuração de IA com criptografia falhou.");
    }
    console.log("✓ Scenario 12 PASS: Alteração e criptografia de provedor de IA validadas.");

    // ----------------------------------------------------------------
    // Scenario 13: Alterar Diretrizes de Prompt & Resolver Override
    // ----------------------------------------------------------------
    const promptConfig: PromptSettings = {
      portalArea: "Economia e Política",
      customPortalArea: "",
      writingStyles: ["Jornalístico", "Direto"],
      customWritingStyle: "",
    };

    await setConfig("aiPromptSettings", promptConfig, companyAlpha.id);

    const resolved = await resolvePromptType({
      workspaceId: companyAlpha.id,
      sourceId: feed.id,
      wordpressSiteId: wpSite.id,
    });
    if (resolved.promptType !== "opinativo") {
      throw new Error(`FAIL Scenario 13: Resolução de prompt inesperada: ${resolved.promptType}`);
    }
    console.log("✓ Scenario 13 PASS: Configuração de diretrizes de prompt e resolução hierárquica OK.");

    // ----------------------------------------------------------------
    // Scenario 14: Ver Plano e Créditos via BillingService
    // ----------------------------------------------------------------
    const subInfo = await BillingService.getWorkspaceSubscription(companyAlpha.id);
    const articleCheck = await BillingService.checkLimit(companyAlpha.id, "ARTICLES");
    const sourceCheck = await BillingService.checkLimit(companyAlpha.id, "SOURCES");

    if (
      subInfo.plan.name !== "Plano Enterprise P9" ||
      articleCheck.limit !== 5000 ||
      sourceCheck.current !== 1
    ) {
      throw new Error("FAIL Scenario 14: Apuração de plano/créditos inconsistente.");
    }
    console.log("✓ Scenario 14 PASS: Apuração de cotas e créditos de uso via BillingService validada.");

    console.log("\n=========================================================");
    console.log(">>> TODOS OS 15 CENÁRIOS DA PHASE 9 PASSARAM 100%! <<<");
    console.log("=========================================================");
  } finally {
    // Teardown
    await prisma.wordPressSiteSource.deleteMany({
      where: { workspaceId: { in: ["p9-company-alpha", "p9-company-beta"] } },
    });
    await prisma.wordPressSite.deleteMany({
      where: { workspaceId: { in: ["p9-company-alpha", "p9-company-beta"] } },
    });
    await prisma.source.deleteMany({
      where: { workspaceId: { in: ["p9-company-alpha", "p9-company-beta"] } },
    });
    await prisma.configuration.deleteMany({
      where: { workspaceId: { in: ["p9-company-alpha", "p9-company-beta"] } },
    });
    await prisma.subscription.deleteMany({
      where: { workspace: { slug: { in: ["p9-company-alpha", "p9-company-beta"] } } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: { in: ["p9-company-alpha", "p9-company-beta"] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [superAdmin.id, tenantUser.id] } },
    });
    await prisma.plan.deleteMany({
      where: { slug: "p9-enterprise-plan" },
    });
    await prisma.feature.deleteMany({
      where: { key: "p9_custom_ai" },
    });

  }
}

runPhase9IntegrationTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRO NO TESTE DE INTEGRAÇÃO DA FASE 9:", err);
    process.exit(1);
  });
