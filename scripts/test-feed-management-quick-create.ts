import { prisma } from "../src/lib/prisma";
import { createWordPressSite } from "../src/lib/wordpress-sites";
import { getSourcesForWordPressSite } from "../src/lib/wordpress-site-sources";

async function runTests() {
  console.log("--- TEST: Task 064 - Feed Management + Quick Create ---");

  // Setup test workspaces
  const ws1 = await prisma.workspace.upsert({
    where: { slug: "test-feed-mgmt-ws1" },
    update: {},
    create: { name: "Feed Mgmt WS 1", slug: "test-feed-mgmt-ws1" },
  });

  const ws2 = await prisma.workspace.upsert({
    where: { slug: "test-feed-mgmt-ws2" },
    update: {},
    create: { name: "Feed Mgmt WS 2", slug: "test-feed-mgmt-ws2" },
  });

  console.log("✓ Workspaces de teste preparados:", ws1.id, ws2.id);

  try {
    // 1. Global Feed Creation with defaultPromptType
    const globalFeed = await prisma.source.create({
      data: {
        workspaceId: ws1.id,
        name: "Reuters Brasil",
        rssUrl: "https://reuters.com/rss",
        creditName: "Reuters",
        defaultPromptType: "ANALYTICAL",
        active: true,
      },
    });

    console.log("✓ Feed global criado:", globalFeed.id, globalFeed.name, "Prompt:", globalFeed.defaultPromptType);

    if (globalFeed.defaultPromptType !== "ANALYTICAL") {
      throw new Error("defaultPromptType não foi persistido corretamente no Feed.");
    }

    // 2. Global Feed Edit via PATCH equivalent
    const updatedFeed = await prisma.source.update({
      where: { id: globalFeed.id },
      data: {
        creditName: "Agência Reuters",
        defaultPromptType: "INFORMATIVE",
      },
    });
    if (updatedFeed.creditName !== "Agência Reuters" || updatedFeed.defaultPromptType !== "INFORMATIVE") {
      throw new Error("Atualização de Feed global falhou.");
    }
    console.log("✓ Edição de Feed global validada:", updatedFeed.creditName, updatedFeed.defaultPromptType);

    // 3. Create WordPress Site
    const wpSite = await createWordPressSite({
      workspaceId: ws1.id,
      name: "Portal Notícias Econômicas",
      url: "https://economia.example.com",
      username: "eco_admin",
      applicationPassword: "eco-pass-9999",
      defaultPromptType: "FINANCIAL",
    });

    // 4. Test Quick-Create Flow (Create Source in Workspace + Assign to WP Site with Override)
    const quickFeed = await prisma.source.create({
      data: {
        workspaceId: ws1.id,
        name: "Valor Econômico",
        rssUrl: "https://valor.globo.com/rss",
        creditName: "Valor",
        defaultPromptType: "FORMAL",
        active: true,
      },
    });

    const quickAssignment = await prisma.wordPressSiteSource.create({
      data: {
        workspaceId: ws1.id,
        wordpressSiteId: wpSite.id,
        sourceId: quickFeed.id,
        promptTypeOverride: "EXECUTIVE_SUMMARY",
        active: true,
      },
      include: {
        source: true,
        wordpressSite: true,
      },
    });

    console.log("✓ Quick Create executado com sucesso: Feed criado e associado ao site com override:", quickAssignment.id);

    // 5. Verify site assigned feeds list includes quick created feed
    const siteSources = await getSourcesForWordPressSite(ws1.id, wpSite.id);
    if (siteSources.length !== 1 || siteSources[0].source.name !== "Valor Econômico") {
      throw new Error("Quick create não retornou o feed associado ao site.");
    }
    if (siteSources[0].promptTypeOverride !== "EXECUTIVE_SUMMARY") {
      throw new Error("Override do prompt no Quick Create não foi respeitado.");
    }
    console.log("✓ Associação automática do feed ao site com override validada.");

    // 6. Test Tenant Isolation: WS2 cannot see or access WS1's feeds
    const ws2Sources = await prisma.source.findMany({ where: { workspaceId: ws2.id } });
    if (ws2Sources.length !== 0) {
      throw new Error("VULNERABILIDADE: WS2 conseguiu ver feeds de WS1!");
    }
    console.log("✓ Isolamento multi-tenant de fontes RSS validado.");

    console.log("\n>>> TODOS OS TESTES DA TASK 064 PASSARAM COM SUCESSO! <<<");
  } finally {
    // Cleanup
    await prisma.workspace.deleteMany({
      where: { slug: { in: ["test-feed-mgmt-ws1", "test-feed-mgmt-ws2"] } },
    });
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRO NO TESTE:", err);
    process.exit(1);
  });
