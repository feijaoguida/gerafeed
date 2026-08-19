import { prisma } from "../src/lib/prisma";
import { createWordPressSite } from "../src/lib/wordpress-sites";
import {
  assignSourceToWordPressSite,
  updateWordPressSiteSource,
  removeSourceFromWordPressSite,
  getSourcesForWordPressSite,
  getWordPressSitesForSource,
} from "../src/lib/wordpress-site-sources";

async function runTests() {
  console.log("--- TEST: Task 061 - Source ↔ WordPress Assignment (N:N) ---");

  // Setup test workspaces
  const ws1 = await prisma.workspace.upsert({
    where: { slug: "test-assign-ws1" },
    update: {},
    create: { name: "Test WS 1", slug: "test-assign-ws1" },
  });

  const ws2 = await prisma.workspace.upsert({
    where: { slug: "test-assign-ws2" },
    update: {},
    create: { name: "Test WS 2", slug: "test-assign-ws2" },
  });

  console.log("✓ Workspaces criados:", ws1.id, ws2.id);

  try {
    // Create WordPress Sites in WS1
    const siteA = await createWordPressSite({
      workspaceId: ws1.id,
      name: "Site Humor",
      url: "https://humor.test",
      username: "admin1",
      applicationPassword: "pwd1",
      defaultPromptType: "HUMORISTIC",
    });

    const siteB = await createWordPressSite({
      workspaceId: ws1.id,
      name: "Site Notícias Gerais",
      url: "https://gerais.test",
      username: "admin2",
      applicationPassword: "pwd2",
      defaultPromptType: "INFORMATIVE",
    });

    // Create Sources in WS1
    const feed1 = await prisma.source.create({
      data: {
        workspaceId: ws1.id,
        name: "G1 Geral",
        rssUrl: "https://g1.globo.com/rss",
        defaultPromptType: "INFORMATIVE",
      },
    });

    const feed2 = await prisma.source.create({
      data: {
        workspaceId: ws1.id,
        name: "Sensacionalista",
        rssUrl: "https://sensacionalista.com.br/rss",
        defaultPromptType: "HUMORISTIC",
      },
    });

    console.log("✓ Sites e Feeds criados no Workspace 1.");

    // 1. One feed in two sites: feed1 -> siteA and feed1 -> siteB
    const assign1 = await assignSourceToWordPressSite({
      workspaceId: ws1.id,
      wordpressSiteId: siteA.id,
      sourceId: feed1.id,
      promptTypeOverride: "HUMORISTIC", // override on Site A
    });

    const assign2 = await assignSourceToWordPressSite({
      workspaceId: ws1.id,
      wordpressSiteId: siteB.id,
      sourceId: feed1.id,
      // No override on Site B
    });

    console.log("✓ 1 Feed associado a 2 Sites WordPress com sucesso (1:N):", assign1.id, assign2.id);

    // 2. Two feeds in one site: feed2 -> siteA (now siteA has feed1 and feed2)
    const assign3 = await assignSourceToWordPressSite({
      workspaceId: ws1.id,
      wordpressSiteId: siteA.id,
      sourceId: feed2.id,
    });

    console.log("✓ 2 Feeds associados ao mesmo Site WordPress com sucesso (N:1):", assign3.id);

    // 3. Verify N:N listing
    const siteASources = await getSourcesForWordPressSite(ws1.id, siteA.id);
    if (siteASources.length !== 2) {
      throw new Error(`Esperado 2 feeds para Site A, encontrado: ${siteASources.length}`);
    }
    console.log("✓ Site A possui 2 feeds associados:", siteASources.map((s: { source: { name: string } }) => s.source.name));

    const feed1Sites = await getWordPressSitesForSource(ws1.id, feed1.id);
    if (feed1Sites.length !== 2) {
      throw new Error(`Esperado 2 sites para Feed 1, encontrado: ${feed1Sites.length}`);
    }
    console.log("✓ Feed 1 está associado a 2 sites:", feed1Sites.map((s: { wordpressSite: { name: string } }) => s.wordpressSite.name));

    // 4. Verify unique constraint / upsert behavior
    const reAssign = await assignSourceToWordPressSite({
      workspaceId: ws1.id,
      wordpressSiteId: siteA.id,
      sourceId: feed1.id,
      promptTypeOverride: "CRITICAL",
    });
    if (reAssign.id !== assign1.id || reAssign.promptTypeOverride !== "CRITICAL") {
      throw new Error("Upsert / Unicidade falhou na re-associação do mesmo feed.");
    }
    console.log("✓ Unicidade de vínculo (wordpressSiteId, sourceId) garantida via upsert.");

    // 5. Active / Inactive toggle without removing feed
    await updateWordPressSiteSource(ws1.id, assign3.id, { active: false });
    const activeOnlySiteA = await getSourcesForWordPressSite(ws1.id, siteA.id, { activeOnly: true });
    if (activeOnlySiteA.length !== 1) {
      throw new Error(`Esperado 1 feed ativo para Site A após inativação, obtido: ${activeOnlySiteA.length}`);
    }
    // Verify feed2 still exists
    const feed2Check = await prisma.source.findUnique({ where: { id: feed2.id } });
    if (!feed2Check) {
      throw new Error("Feed original foi indevidamente removido ao inativar vínculo!");
    }
    console.log("✓ Desativação de vínculo não remove o Feed e respeita activeOnly.");

    // 6. Test Tenant Isolation
    let tenantErrorCaught = false;
    try {
      // WS2 tries to link WS1's site with WS1's feed
      await assignSourceToWordPressSite({
        workspaceId: ws2.id,
        wordpressSiteId: siteA.id,
        sourceId: feed1.id,
      });
    } catch {
      tenantErrorCaught = true;
    }
    if (!tenantErrorCaught) {
      throw new Error("VULNERABILIDADE: WS2 conseguiu criar vínculo com entidades de WS1!");
    }

    const ws2SiteSources = await getSourcesForWordPressSite(ws2.id, siteA.id);
    if (ws2SiteSources.length > 0) {
      throw new Error("VULNERABILIDADE: WS2 conseguiu listar fontes de Site de WS1!");
    }
    console.log("✓ Isolamento multi-tenant de vínculos validado com sucesso.");

    // 7. Remove assignment and verify feed persists
    await removeSourceFromWordPressSite(ws1.id, siteA.id, feed1.id);
    const siteASourcesAfterDelete = await getSourcesForWordPressSite(ws1.id, siteA.id);
    if (siteASourcesAfterDelete.length !== 1) {
      throw new Error("Remoção de vínculo falhou.");
    }
    const feed1Check = await prisma.source.findUnique({ where: { id: feed1.id } });
    if (!feed1Check) {
      throw new Error("Feed original foi indevidamente removido ao deletar vínculo!");
    }
    console.log("✓ Remoção de vínculo remove apenas o relacionamento N:N e mantém o Feed intacto.");

    console.log("\n>>> TODOS OS TESTES DA TASK 061 PASSARAM COM SUCESSO! <<<");
  } finally {
    // Cleanup
    await prisma.workspace.deleteMany({
      where: { slug: { in: ["test-assign-ws1", "test-assign-ws2"] } },
    });
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRO NO TESTE:", err);
    process.exit(1);
  });
