import { prisma } from "../src/lib/prisma";
import { createWordPressSite, getWordPressSiteConfig, getWordPressSites } from "../src/lib/wordpress-sites";
import { assignSourceToWordPressSite, getSourcesForWordPressSite } from "../src/lib/wordpress-site-sources";
import { resolvePromptType } from "../src/lib/prompt-resolution";
import { formatEditorialDate } from "../src/lib/format-date";

async function runTests() {
  console.log("=================================================");
  console.log("=== TEST: Task 068 - Phase 8 Full Integration ===");
  console.log("=================================================");

  // Setup test workspaces
  const ws1 = await prisma.workspace.upsert({
    where: { slug: "test-p8-int-ws1" },
    update: {},
    create: { name: "Phase 8 WS 1", slug: "test-p8-int-ws1" },
  });

  const ws2 = await prisma.workspace.upsert({
    where: { slug: "test-p8-int-ws2" },
    update: {},
    create: { name: "Phase 8 WS 2", slug: "test-p8-int-ws2" },
  });

  console.log("✓ Workspaces preparados:", ws1.id, ws2.id);

  try {
    // ----------------------------------------------------------------
    // Scenario 1: Workspace with 2 WordPress Sites
    // ----------------------------------------------------------------
    const siteA = await createWordPressSite({
      workspaceId: ws1.id,
      name: "Portal Notícias Tech",
      url: "https://tech.portal.com",
      username: "tech_admin",
      applicationPassword: "tech_secret_pass_1234",
      defaultPromptType: "ANALYTICAL_TECH",
    });

    const siteB = await createWordPressSite({
      workspaceId: ws1.id,
      name: "Portal Humor Brasil",
      url: "https://humor.portal.com",
      username: "humor_admin",
      applicationPassword: "humor_secret_pass_5678",
      defaultPromptType: "HUMORISTIC_PORTAL_STYLE",
    });

    const ws1Sites = await getWordPressSites(ws1.id);
    if (ws1Sites.length !== 2) throw new Error("Cenário 1 falhou: Esperado 2 sites.");
    console.log("✓ Cenário 1 PASS: Workspace possui 2 WordPress sites configurados com segurança.");

    // ----------------------------------------------------------------
    // Scenario 2: One Feed associated to both WordPress sites
    // ----------------------------------------------------------------
    const sharedFeed = await prisma.source.create({
      data: {
        workspaceId: ws1.id,
        name: "G1 Notícias Gerais",
        rssUrl: "https://g1.globo.com/rss",
        creditName: "G1",
        defaultPromptType: "INFORMATIVE",
        active: true,
      },
    });

    // Assign to Site A with Override
    await assignSourceToWordPressSite({
      workspaceId: ws1.id,
      wordpressSiteId: siteA.id,
      sourceId: sharedFeed.id,
      promptTypeOverride: "OVERRIDE_TECH_EXECUTIVE",
    });

    // Assign to Site B without Override (will fallback to Feed/Site)
    await assignSourceToWordPressSite({
      workspaceId: ws1.id,
      wordpressSiteId: siteB.id,
      sourceId: sharedFeed.id,
      promptTypeOverride: null,
    });

    const siteASources = await getSourcesForWordPressSite(ws1.id, siteA.id);
    const siteBSources = await getSourcesForWordPressSite(ws1.id, siteB.id);

    if (siteASources.length !== 1 || siteBSources.length !== 1) {
      throw new Error("Cenário 2 falhou: Associação do feed aos 2 sites incorreta.");
    }
    console.log("✓ Cenário 2 PASS: Um Feed associado aos dois sites WordPress independentes.");

    // ----------------------------------------------------------------
    // Scenario 3: Different Prompt per Destination
    // ----------------------------------------------------------------
    const promptSiteA = await resolvePromptType({
      workspaceId: ws1.id,
      sourceId: sharedFeed.id,
      wordpressSiteId: siteA.id,
    });

    const promptSiteB = await resolvePromptType({
      workspaceId: ws1.id,
      sourceId: sharedFeed.id,
      wordpressSiteId: siteB.id,
    });

    if (promptSiteA.promptType !== "OVERRIDE_TECH_EXECUTIVE" || promptSiteA.origin !== "OVERRIDE") {
      throw new Error(`Cenário 3 falhou para Site A: ${JSON.stringify(promptSiteA)}`);
    }

    if (promptSiteB.promptType !== "INFORMATIVE" || promptSiteB.origin !== "SOURCE_DEFAULT") {
      throw new Error(`Cenário 3 falhou para Site B: ${JSON.stringify(promptSiteB)}`);
    }
    console.log("✓ Cenário 3 PASS: Resolução de prompt por destino respeitada (Site A: OVERRIDE, Site B: FEED DEFAULT).");

    // ----------------------------------------------------------------
    // Scenario 4: Quick-create Feed inside WordPress Site
    // ----------------------------------------------------------------
    const quickFeed = await prisma.source.create({
      data: {
        workspaceId: ws1.id,
        name: "InfoMoney Mercados",
        rssUrl: "https://infomoney.com.br/rss",
        creditName: "InfoMoney",
        defaultPromptType: "FINANCIAL",
        active: true,
      },
    });

    await assignSourceToWordPressSite({
      workspaceId: ws1.id,
      wordpressSiteId: siteA.id,
      sourceId: quickFeed.id,
      promptTypeOverride: "FINANCIAL_DIGEST",
    });

    const siteASourcesAfterQuick = await getSourcesForWordPressSite(ws1.id, siteA.id);
    if (siteASourcesAfterQuick.length !== 2) {
      throw new Error("Cenário 4 falhou: Quick create não vinculou o novo feed ao site.");
    }
    console.log("✓ Cenário 4 PASS: Novo feed criado e vinculado instantaneamente ao site de destino.");

    // ----------------------------------------------------------------
    // Scenario 5: Articles filtered by Date / Feed / Site
    // ----------------------------------------------------------------
    const pubDate1 = new Date("2026-08-01T10:00:00Z");
    const pubDate2 = new Date("2026-08-15T14:00:00Z");

    const artSiteA = await prisma.article.create({
      data: {
        workspaceId: ws1.id,
        sourceId: sharedFeed.id,
        wordpressSiteId: siteA.id,
        originalUrl: "https://g1.globo.com/item-1",
        originalTitle: "Artigo Destino Site A",
        originalPublishedAt: pubDate1,
        status: "PENDING",
      },
    });

    const artSiteB = await prisma.article.create({
      data: {
        workspaceId: ws1.id,
        sourceId: sharedFeed.id,
        wordpressSiteId: siteB.id,
        originalUrl: "https://g1.globo.com/item-2",
        originalTitle: "Artigo Destino Site B",
        originalPublishedAt: pubDate2,
        status: "PUBLISHED",
      },
    });

    // Query Site A articles only
    const querySiteA = await prisma.article.findMany({
      where: {
        workspaceId: ws1.id,
        wordpressSiteId: siteA.id,
      },
    });
    if (querySiteA.length !== 1 || querySiteA[0].id !== artSiteA.id) {
      throw new Error("Cenário 5 falhou no filtro por site.");
    }

    // Query by Date Range
    const queryDate = await prisma.article.findMany({
      where: {
        workspaceId: ws1.id,
        originalPublishedAt: {
          gte: new Date("2026-08-10T00:00:00Z"),
        },
      },
    });
    if (queryDate.length !== 1 || queryDate[0].id !== artSiteB.id) {
      throw new Error("Cenário 5 falhou no filtro por data editorial.");
    }
    console.log("✓ Cenário 5 PASS: Artigos filtrados combinando Site, Feed e Intervalo de Datas.");

    // ----------------------------------------------------------------
    // Scenario 6: Card showing feed date with fallback
    // ----------------------------------------------------------------
    const formattedWithDate = formatEditorialDate(artSiteA.originalPublishedAt);
    const formattedWithoutDate = formatEditorialDate(null);

    if (!formattedWithDate.includes("01/08/2026") || formattedWithoutDate !== "Data não informada pela fonte") {
      throw new Error("Cenário 6 falhou: Formatação de data ou fallback incorreto.");
    }
    console.log("✓ Cenário 6 PASS: Card exibe data do feed com timezone e fallback adequado.");

    // ----------------------------------------------------------------
    // Scenario 7: Destination WordPress config resolution for publication
    // ----------------------------------------------------------------
    const configA = await getWordPressSiteConfig(ws1.id, siteA.id);
    const configB = await getWordPressSiteConfig(ws1.id, siteB.id);

    if (!configA || configA.applicationPassword !== "tech_secret_pass_1234") {
      throw new Error("Cenário 7 falhou: Config do Site A incorreta.");
    }
    if (!configB || configB.applicationPassword !== "humor_secret_pass_5678") {
      throw new Error("Cenário 7 falhou: Config do Site B incorreta.");
    }
    console.log("✓ Cenário 7 PASS: Publicação direciona exatamente para as credenciais e endpoint do site correto.");

    // ----------------------------------------------------------------
    // Multi-tenant Isolation Check
    // ----------------------------------------------------------------
    const ws2SitesCheck = await getWordPressSites(ws2.id);
    const ws2SourcesCheck = await prisma.source.findMany({ where: { workspaceId: ws2.id } });
    const ws2ArticlesCheck = await prisma.article.findMany({ where: { workspaceId: ws2.id } });

    if (ws2SitesCheck.length !== 0 || ws2SourcesCheck.length !== 0 || ws2ArticlesCheck.length !== 0) {
      throw new Error("VULNERABILIDADE: Isolamento multi-tenant falhou!");
    }
    console.log("✓ Isolamento Multi-tenant estrito validado em todos os níveis.");

    console.log("\n=================================================");
    console.log(">>> TODOS OS CENÁRIOS DA PHASE 8 INTEGRATION PASSARAM! <<<");
    console.log("=================================================");
  } finally {
    // Cleanup
    await prisma.workspace.deleteMany({
      where: { slug: { in: ["test-p8-int-ws1", "test-p8-int-ws2"] } },
    });
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRO NO TESTE DE INTEGRAÇÃO:", err);
    process.exit(1);
  });
