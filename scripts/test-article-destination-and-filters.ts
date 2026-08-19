import { prisma } from "../src/lib/prisma";
import { createWordPressSite } from "../src/lib/wordpress-sites";

async function runTests() {
  console.log("--- TEST: Task 065 - Article Destination and Filters ---");

  // Setup test workspaces
  const ws1 = await prisma.workspace.upsert({
    where: { slug: "test-art-filters-ws1" },
    update: {},
    create: { name: "Article Filters WS 1", slug: "test-art-filters-ws1" },
  });

  const ws2 = await prisma.workspace.upsert({
    where: { slug: "test-art-filters-ws2" },
    update: {},
    create: { name: "Article Filters WS 2", slug: "test-art-filters-ws2" },
  });

  console.log("✓ Workspaces de teste preparados:", ws1.id, ws2.id);

  try {
    // 1. Create WordPress Sites in WS1
    const wpSiteTech = await createWordPressSite({
      workspaceId: ws1.id,
      name: "Tech Portal",
      url: "https://tech.test.com",
      username: "tech_adm",
      applicationPassword: "pass",
    });

    const wpSiteHumor = await createWordPressSite({
      workspaceId: ws1.id,
      name: "Humor Portal",
      url: "https://humor.test.com",
      username: "humor_adm",
      applicationPassword: "pass",
    });

    // 2. Create Sources in WS1
    const sourceTech = await prisma.source.create({
      data: {
        workspaceId: ws1.id,
        name: "Tech Feed",
        rssUrl: "https://tech.feed/rss",
        active: true,
      },
    });

    const sourceHumor = await prisma.source.create({
      data: {
        workspaceId: ws1.id,
        name: "Humor Feed",
        rssUrl: "https://humor.feed/rss",
        active: true,
      },
    });

    // 3. Create Articles with different dates, destinations and sources
    const dateOld = new Date("2026-08-01T10:00:00Z");
    const dateMid = new Date("2026-08-10T15:00:00Z");
    const dateNew = new Date("2026-08-17T12:00:00Z");

    const art1 = await prisma.article.create({
      data: {
        workspaceId: ws1.id,
        sourceId: sourceTech.id,
        wordpressSiteId: wpSiteTech.id,
        originalUrl: "https://tech.test.com/news-1",
        originalTitle: "Notícia Tech Antiga",
        originalPublishedAt: dateOld,
        status: "PENDING",
      },
    });

    const art2 = await prisma.article.create({
      data: {
        workspaceId: ws1.id,
        sourceId: sourceTech.id,
        wordpressSiteId: wpSiteTech.id,
        originalUrl: "https://tech.test.com/news-2",
        originalTitle: "Notícia Tech Média",
        originalPublishedAt: dateMid,
        status: "PUBLISHED",
      },
    });

    const art3 = await prisma.article.create({
      data: {
        workspaceId: ws1.id,
        sourceId: sourceHumor.id,
        wordpressSiteId: wpSiteHumor.id,
        originalUrl: "https://humor.test.com/news-3",
        originalTitle: "Notícia Humor Recente",
        originalPublishedAt: dateNew,
        status: "PENDING",
      },
    });

    // Article in WS2 to test tenant isolation
    const sourceWs2 = await prisma.source.create({
      data: {
        workspaceId: ws2.id,
        name: "WS2 Feed",
        rssUrl: "https://ws2.feed/rss",
        active: true,
      },
    });

    await prisma.article.create({
      data: {
        workspaceId: ws2.id,
        sourceId: sourceWs2.id,
        originalUrl: "https://ws2.test.com/news-other",
        originalTitle: "Notícia de outro Workspace",
        originalPublishedAt: dateNew,
        status: "PENDING",
      },
    });

    console.log("✓ Artigos criados:", art1.id, art2.id, art3.id);

    // 4. Test Filter: Date Range (originalPublishedAt between 2026-08-05 and 2026-08-15)
    const dateFiltered = await prisma.article.findMany({
      where: {
        workspaceId: ws1.id,
        originalPublishedAt: {
          gte: new Date("2026-08-05T00:00:00Z"),
          lte: new Date("2026-08-15T23:59:59Z"),
        },
      },
    });
    if (dateFiltered.length !== 1 || dateFiltered[0].id !== art2.id) {
      throw new Error(`Filtro por data falhou. Esperado 1 (art2), obtido: ${dateFiltered.length}`);
    }
    console.log("✓ Filtro por intervalo de data editorial (originalPublishedAt) validado.");

    // 5. Test Filter: Feed (sourceId)
    const feedFiltered = await prisma.article.findMany({
      where: {
        workspaceId: ws1.id,
        sourceId: sourceTech.id,
      },
    });
    if (feedFiltered.length !== 2) {
      throw new Error(`Filtro por Feed falhou. Esperado 2, obtido: ${feedFiltered.length}`);
    }
    console.log("✓ Filtro por Feed / Source validado.");

    // 6. Test Filter: WordPress Site (wordpressSiteId)
    const wpFiltered = await prisma.article.findMany({
      where: {
        workspaceId: ws1.id,
        wordpressSiteId: wpSiteHumor.id,
      },
    });
    if (wpFiltered.length !== 1 || wpFiltered[0].id !== art3.id) {
      throw new Error(`Filtro por WordPress Site falhou. Esperado 1, obtido: ${wpFiltered.length}`);
    }
    console.log("✓ Filtro por Destino WordPress validado.");

    // 7. Test Combined Filters (Status + Feed + WordPress + Date)
    const combinedFiltered = await prisma.article.findMany({
      where: {
        workspaceId: ws1.id,
        status: "PENDING",
        sourceId: sourceTech.id,
        wordpressSiteId: wpSiteTech.id,
        originalPublishedAt: {
          lte: new Date("2026-08-05T00:00:00Z"),
        },
      },
    });
    if (combinedFiltered.length !== 1 || combinedFiltered[0].id !== art1.id) {
      throw new Error("Filtros combinados falharam.");
    }
    console.log("✓ Filtros combinados (Status + Feed + WP + Data) validados com sucesso.");

    // 8. Test Multi-tenant Isolation: WS2 cannot see WS1 articles
    const ws2Articles = await prisma.article.findMany({
      where: { workspaceId: ws2.id },
    });
    if (ws2Articles.length !== 1 || ws2Articles[0].originalTitle !== "Notícia de outro Workspace") {
      throw new Error("Isolamento multi-tenant violado nos Artigos!");
    }
    console.log("✓ Isolamento multi-tenant estrito validado.");

    console.log("\n>>> TODOS OS TESTES DA TASK 065 PASSARAM COM SUCESSO! <<<");
  } finally {
    // Cleanup
    await prisma.workspace.deleteMany({
      where: { slug: { in: ["test-art-filters-ws1", "test-art-filters-ws2"] } },
    });
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRO NO TESTE:", err);
    process.exit(1);
  });
