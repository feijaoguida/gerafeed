import { prisma } from "../src/lib/prisma";
import { createWordPressSite, getWordPressSites } from "../src/lib/wordpress-sites";
import { assignSourceToWordPressSite, getSourcesForWordPressSite } from "../src/lib/wordpress-site-sources";

async function runTests() {
  console.log("--- TEST: Task 063 - WordPress Settings Multi-Site API & Features ---");

  // Setup test workspaces
  const ws1 = await prisma.workspace.upsert({
    where: { slug: "test-wp-ui-ws1" },
    update: {},
    create: { name: "WP UI WS 1", slug: "test-wp-ui-ws1" },
  });

  const ws2 = await prisma.workspace.upsert({
    where: { slug: "test-wp-ui-ws2" },
    update: {},
    create: { name: "WP UI WS 2", slug: "test-wp-ui-ws2" },
  });

  console.log("✓ Workspaces de teste preparados:", ws1.id, ws2.id);

  try {
    // 1. Create WordPress Sites in WS1
    const site1 = await createWordPressSite({
      workspaceId: ws1.id,
      name: "Portal Notícias Tecnologia",
      url: "https://tech.example.com",
      username: "tech_admin",
      applicationPassword: "tech-pass-1234",
      defaultPromptType: "ANALYTICAL",
    });

    const site2 = await createWordPressSite({
      workspaceId: ws1.id,
      name: "Portal Humor Brasil",
      url: "https://humor.example.com",
      username: "humor_admin",
      applicationPassword: "humor-pass-5678",
      defaultPromptType: "HUMORISTIC",
    });

    console.log("✓ 2 sites criados no Workspace 1:", site1.name, site2.name);

    // 2. Create Sources in WS1
    const source1 = await prisma.source.create({
      data: {
        workspaceId: ws1.id,
        name: "TechCrunch RSS",
        rssUrl: "https://techcrunch.com/feed",
        defaultPromptType: "INFORMATIVE",
      },
    });

    const source2 = await prisma.source.create({
      data: {
        workspaceId: ws1.id,
        name: "Piadas RSS",
        rssUrl: "https://piadas.com/feed",
        defaultPromptType: "HUMORISTIC",
      },
    });

    // 3. Assign Feeds to Sites with Overrides
    const assign1 = await assignSourceToWordPressSite({
      workspaceId: ws1.id,
      wordpressSiteId: site1.id,
      sourceId: source1.id,
      promptTypeOverride: "HIGH_TECH",
    });

    const assign2 = await assignSourceToWordPressSite({
      workspaceId: ws1.id,
      wordpressSiteId: site2.id,
      sourceId: source1.id,
      promptTypeOverride: "HUMOR_TECH", // Same feed, different override on Site 2
    });

    const assign3 = await assignSourceToWordPressSite({
      workspaceId: ws1.id,
      wordpressSiteId: site2.id,
      sourceId: source2.id,
      promptTypeOverride: null,
    });

    console.log("✓ Feeds associados aos sites com overrides distintos:", assign1.id, assign2.id, assign3.id);

    // 4. Verify listings and site isolation
    const ws1Sites = await getWordPressSites(ws1.id);
    if (ws1Sites.length !== 2) {
      throw new Error(`Esperado 2 sites para WS1, obtido: ${ws1Sites.length}`);
    }

    const ws2Sites = await getWordPressSites(ws2.id);
    if (ws2Sites.length !== 0) {
      throw new Error("VULNERABILIDADE: WS2 conseguiu listar sites de WS1!");
    }
    console.log("✓ Listagem e isolamento multi-tenant de sites validados.");

    // 5. Verify source assignments for each site
    const site1Sources = await getSourcesForWordPressSite(ws1.id, site1.id);
    if (site1Sources.length !== 1 || site1Sources[0].promptTypeOverride !== "HIGH_TECH") {
      throw new Error("Vínculo do Site 1 incorreto.");
    }

    const site2Sources = await getSourcesForWordPressSite(ws1.id, site2.id);
    const site2Source1 = site2Sources.find((s: { sourceId: string }) => s.sourceId === source1.id);
    if (site2Sources.length !== 2 || site2Source1?.promptTypeOverride !== "HUMOR_TECH") {
      throw new Error("Vínculo do Site 2 incorreto.");
    }
    console.log("✓ Feeds atribuídos a cada site possuem overrides específicos independentes.");

    // 6. Test Category Sync Model Scoping
    const category = await prisma.wordPressCategory.upsert({
      where: {
        workspaceId_wordpressId: {
          workspaceId: ws1.id,
          wordpressId: 101,
        },
      },
      update: {
        name: "Inteligência Artificial",
        slug: "ia",
        wordpressSiteId: site1.id,
      },
      create: {
        workspaceId: ws1.id,
        wordpressSiteId: site1.id,
        wordpressId: 101,
        name: "Inteligência Artificial",
        slug: "ia",
      },
    });

    if (category.wordpressSiteId !== site1.id) {
      throw new Error("Categoria não foi vinculada ao site WordPress!");
    }
    console.log("✓ Sincronização de categoria vinculada ao WordPressSite validada:", category.id);

    console.log("\n>>> TODOS OS TESTES DA TASK 063 PASSARAM COM SUCESSO! <<<");
  } finally {
    // Cleanup
    await prisma.workspace.deleteMany({
      where: { slug: { in: ["test-wp-ui-ws1", "test-wp-ui-ws2"] } },
    });
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRO NO TESTE:", err);
    process.exit(1);
  });
