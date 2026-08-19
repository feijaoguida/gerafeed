import { prisma } from "../src/lib/prisma";
import { setConfig } from "../src/lib/config";
import { createWordPressSite } from "../src/lib/wordpress-sites";
import { assignSourceToWordPressSite } from "../src/lib/wordpress-site-sources";
import { resolvePromptType } from "../src/lib/prompt-resolution";

async function runTests() {
  console.log("--- TEST: Task 062 - Prompt Resolution Hierarchy Matrix ---");

  // Setup test workspaces
  const ws1 = await prisma.workspace.upsert({
    where: { slug: "test-prompt-res-ws1" },
    update: {},
    create: { name: "Prompt WS 1", slug: "test-prompt-res-ws1" },
  });

  const ws2 = await prisma.workspace.upsert({
    where: { slug: "test-prompt-res-ws2" },
    update: {},
    create: { name: "Prompt WS 2", slug: "test-prompt-res-ws2" },
  });

  // Set Workspace Default for WS1
  await setConfig(
    "aiPromptSettings",
    {
      portalArea: "Tecnologia",
      customPortalArea: "",
      writingStyles: ["Workspace_Style"],
      customWritingStyle: "",
    },
    ws1.id
  );

  console.log("✓ Workspaces e configurações globais preparados.");

  try {
    // 1. Create WordPress Site with default prompt
    const siteWithDefault = await createWordPressSite({
      workspaceId: ws1.id,
      name: "Site Com Default",
      url: "https://site1.test",
      username: "admin1",
      applicationPassword: "pwd",
      defaultPromptType: "Site_Default_Prompt",
    });

    const siteWithoutDefault = await createWordPressSite({
      workspaceId: ws1.id,
      name: "Site Sem Default",
      url: "https://site2.test",
      username: "admin2",
      applicationPassword: "pwd",
      defaultPromptType: null,
    });

    // 2. Create Sources
    const feedWithDefault = await prisma.source.create({
      data: {
        workspaceId: ws1.id,
        name: "Feed Com Default",
        rssUrl: "https://feed1.test/rss",
        defaultPromptType: "Feed_Default_Prompt",
      },
    });

    const feedWithoutDefault = await prisma.source.create({
      data: {
        workspaceId: ws1.id,
        name: "Feed Sem Default",
        rssUrl: "https://feed2.test/rss",
        defaultPromptType: null,
      },
    });

    // 3. Create assignments with and without override
    await assignSourceToWordPressSite({
      workspaceId: ws1.id,
      wordpressSiteId: siteWithDefault.id,
      sourceId: feedWithDefault.id,
      promptTypeOverride: "Override_Prompt",
    });

    await assignSourceToWordPressSite({
      workspaceId: ws1.id,
      wordpressSiteId: siteWithoutDefault.id,
      sourceId: feedWithDefault.id,
      promptTypeOverride: null, // No override
    });

    await assignSourceToWordPressSite({
      workspaceId: ws1.id,
      wordpressSiteId: siteWithDefault.id,
      sourceId: feedWithoutDefault.id,
      promptTypeOverride: null, // No override
    });

    await assignSourceToWordPressSite({
      workspaceId: ws1.id,
      wordpressSiteId: siteWithoutDefault.id,
      sourceId: feedWithoutDefault.id,
      promptTypeOverride: null, // No override
    });

    console.log("✓ Cenários de teste montados.");

    // --- TEST MATRIX ---

    // Case 1: Override vence Feed, Site e Workspace
    const res1 = await resolvePromptType({
      workspaceId: ws1.id,
      sourceId: feedWithDefault.id,
      wordpressSiteId: siteWithDefault.id,
    });
    console.log("Caso 1 (Todos definidos):", res1);
    if (res1.promptType !== "Override_Prompt" || res1.origin !== "OVERRIDE") {
      throw new Error(`Caso 1 FALHOU: esperado 'Override_Prompt', recebido '${res1.promptType}'`);
    }
    console.log("✓ Caso 1 PASS: Override vence Feed, Site e Workspace.");

    // Case 2: Sem Override, Feed default vence Site e Workspace
    const res2NoOverride = await resolvePromptType({
      workspaceId: ws1.id,
      sourceId: feedWithDefault.id,
      wordpressSiteId: siteWithoutDefault.id,
    });
    console.log("Caso 2 (Sem override, Feed + Site definidos):", res2NoOverride);
    if (res2NoOverride.promptType !== "Feed_Default_Prompt" || res2NoOverride.origin !== "SOURCE_DEFAULT") {
      throw new Error(`Caso 2 FALHOU: esperado 'Feed_Default_Prompt', recebido '${res2NoOverride.promptType}'`);
    }
    console.log("✓ Caso 2 PASS: Feed default vence Site default e Workspace.");

    // Case 3: Sem Override e Sem Feed default, Site default vence Workspace
    const res3 = await resolvePromptType({
      workspaceId: ws1.id,
      sourceId: feedWithoutDefault.id,
      wordpressSiteId: siteWithDefault.id,
    });
    console.log("Caso 3 (Sem override, sem feed default, Site default definido):", res3);
    if (res3.promptType !== "Site_Default_Prompt" || res3.origin !== "WORDPRESS_SITE_DEFAULT") {
      throw new Error(`Caso 3 FALHOU: esperado 'Site_Default_Prompt', recebido '${res3.promptType}'`);
    }
    console.log("✓ Caso 3 PASS: WordPress site default vence Workspace default.");

    // Case 4: Sem Override, Sem Feed default, Sem Site default -> Workspace default
    const res4 = await resolvePromptType({
      workspaceId: ws1.id,
      sourceId: feedWithoutDefault.id,
      wordpressSiteId: siteWithoutDefault.id,
    });
    console.log("Caso 4 (Nenhum nível específico definido):", res4);
    if (res4.promptType !== "Workspace_Style" || res4.origin !== "WORKSPACE_DEFAULT") {
      throw new Error(`Caso 4 FALHOU: esperado 'Workspace_Style', recebido '${res4.promptType}'`);
    }
    console.log("✓ Caso 4 PASS: Workspace default é utilizado como fallback.");

    // Case 5: Apenas sourceId informado (sem destino WP)
    const res5FeedOnly = await resolvePromptType({
      workspaceId: ws1.id,
      sourceId: feedWithDefault.id,
    });
    if (res5FeedOnly.promptType !== "Feed_Default_Prompt" || res5FeedOnly.origin !== "SOURCE_DEFAULT") {
      throw new Error("Caso 5 FALHOU: Busca apenas por Feed default falhou.");
    }
    console.log("✓ Caso 5 PASS: Resolução apenas com Feed.");

    // Case 6: Apenas wordpressSiteId informado (sem feed)
    const res6SiteOnly = await resolvePromptType({
      workspaceId: ws1.id,
      wordpressSiteId: siteWithDefault.id,
    });
    if (res6SiteOnly.promptType !== "Site_Default_Prompt" || res6SiteOnly.origin !== "WORDPRESS_SITE_DEFAULT") {
      throw new Error("Caso 6 FALHOU: Busca apenas por Site default falhou.");
    }
    console.log("✓ Caso 6 PASS: Resolução apenas com WordPress Site.");

    // Case 7: Tenant Isolation - WS2 cannot see WS1 prompt configurations
    const res7CrossTenant = await resolvePromptType({
      workspaceId: ws2.id,
      sourceId: feedWithDefault.id, // belongs to WS1
      wordpressSiteId: siteWithDefault.id, // belongs to WS1
    });
    // Should fallback to WS2 default because entities do not belong to WS2
    if (res7CrossTenant.origin !== "WORKSPACE_DEFAULT") {
      throw new Error(`Caso 7 FALHOU: Isolamento violado, origin foi '${res7CrossTenant.origin}'`);
    }
    console.log("✓ Caso 7 PASS: Isolamento multi-tenant garantido (cross-tenant ignora registros de outros workspaces).");

    console.log("\n>>> MATRIZ DE PRECEDÊNCIA DE PROMPT VALIDADA COM SUCESSO! <<<");
  } finally {
    // Cleanup
    await prisma.workspace.deleteMany({
      where: { slug: { in: ["test-prompt-res-ws1", "test-prompt-res-ws2"] } },
    });
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRO NO TESTE:", err);
    process.exit(1);
  });
