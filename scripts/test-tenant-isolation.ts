import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { getConfig, setConfig } from "../src/lib/config";


async function main() {
  console.log("=== RUNNING TENANT ISOLATION VERIFICATION TESTS ===");

  const wsAId = `tenant-test-a-${Date.now()}`;
  const wsBId = `tenant-test-b-${Date.now()}`;

  // 1. Create two isolated workspaces
  const wsA = await prisma.workspace.create({
    data: {
      id: wsAId,
      name: "Workspace Alpha (Tech)",
      slug: `alpha-${Date.now()}`,
    },
  });

  const wsB = await prisma.workspace.create({
    data: {
      id: wsBId,
      name: "Workspace Beta (Agro)",
      slug: `beta-${Date.now()}`,
    },
  });

  console.log("✓ Created two test workspaces:", { wsA: wsA.id, wsB: wsB.id });

  // 2. Create Sources for each workspace
  const sourceA = await prisma.source.create({
    data: {
      workspaceId: wsA.id,
      name: "Alpha Tech Feed",
      rssUrl: "https://example.com/alpha/rss",
      active: true,
    },
  });

  const sourceB = await prisma.source.create({
    data: {
      workspaceId: wsB.id,
      name: "Beta Agro Feed",
      rssUrl: "https://example.com/beta/rss",
      active: true,
    },
  });

  // Verify Sources isolation
  const sourcesA = await prisma.source.findMany({ where: { workspaceId: wsA.id } });
  const sourcesB = await prisma.source.findMany({ where: { workspaceId: wsB.id } });

  if (sourcesA.length !== 1 || sourcesA[0].id !== sourceA.id) {
    throw new Error("FAILED: Workspace A leaked or missed source.");
  }
  if (sourcesB.length !== 1 || sourcesB[0].id !== sourceB.id) {
    throw new Error("FAILED: Workspace B leaked or missed source.");
  }
  console.log("✓ Source isolation verified.");

  // 3. Create Articles for each workspace
  const articleA = await prisma.article.create({
    data: {
      workspaceId: wsA.id,
      sourceId: sourceA.id,
      originalUrl: `https://example.com/article-a-${Date.now()}`,
      originalTitle: "Notícia Tech Alpha",
      status: "PENDING",
    },
  });

  const articleB = await prisma.article.create({
    data: {
      workspaceId: wsB.id,
      sourceId: sourceB.id,
      originalUrl: `https://example.com/article-b-${Date.now()}`,
      originalTitle: "Notícia Agro Beta",
      status: "PENDING",
    },
  });

  // Verify Articles isolation
  const articlesA = await prisma.article.findMany({ where: { workspaceId: wsA.id } });
  const articlesB = await prisma.article.findMany({ where: { workspaceId: wsB.id } });

  if (articlesA.length !== 1 || articlesA[0].id !== articleA.id) {
    throw new Error("FAILED: Workspace A leaked or missed article.");
  }
  if (articlesB.length !== 1 || articlesB[0].id !== articleB.id) {
    throw new Error("FAILED: Workspace B leaked or missed article.");
  }
  console.log("✓ Article list isolation verified.");

  // 4. Test Cross-Tenant Access Prevention (Workspace A cannot find or update Article B)
  const crossArticleLookup = await prisma.article.findFirst({
    where: { id: articleB.id, workspaceId: wsA.id },
  });
  if (crossArticleLookup !== null) {
    throw new Error("SECURITY FAILURE: Workspace A was able to access Article B!");
  }

  const crossSourceLookup = await prisma.source.findFirst({
    where: { id: sourceB.id, workspaceId: wsA.id },
  });
  if (crossSourceLookup !== null) {
    throw new Error("SECURITY FAILURE: Workspace A was able to access Source B!");
  }
  console.log("✓ Cross-tenant access prevention verified (0 leaks).");

  // 5. Test Configuration Isolation
  await setConfig("aiPromptSettings", { portalArea: "Tecnologia & IA" }, wsA.id);
  await setConfig("aiPromptSettings", { portalArea: "Agronegócio & Clima" }, wsB.id);

  const configA = await getConfig<{ portalArea: string }>("aiPromptSettings", wsA.id);
  const configB = await getConfig<{ portalArea: string }>("aiPromptSettings", wsB.id);

  if (configA?.portalArea !== "Tecnologia & IA") {
    throw new Error(`FAILED: Config A mismatch: ${configA?.portalArea}`);
  }
  if (configB?.portalArea !== "Agronegócio & Clima") {
    throw new Error(`FAILED: Config B mismatch: ${configB?.portalArea}`);
  }
  console.log("✓ Configuration isolation verified:", {
    wsA: configA.portalArea,
    wsB: configB.portalArea,
  });

  // 6. Test Category Isolation
  await prisma.wordPressCategory.create({
    data: {
      workspaceId: wsA.id,
      wordpressId: 101,
      name: "Inovação Alpha",
      slug: "inovacao-alpha",
    },
  });

  await prisma.wordPressCategory.create({
    data: {
      workspaceId: wsB.id,
      wordpressId: 101, // Same WP ID but different tenant!
      name: "Inovação Beta",
      slug: "inovacao-beta",
    },
  });


  const catsA = await prisma.wordPressCategory.findMany({ where: { workspaceId: wsA.id } });
  const catsB = await prisma.wordPressCategory.findMany({ where: { workspaceId: wsB.id } });

  if (catsA.length !== 1 || catsA[0].name !== "Inovação Alpha") {
    throw new Error("FAILED: Category isolation for Workspace A failed.");
  }
  if (catsB.length !== 1 || catsB[0].name !== "Inovação Beta") {
    throw new Error("FAILED: Category isolation for Workspace B failed.");
  }
  console.log("✓ Same WordPress category ID stored independently per tenant verified.");

  // 7. Cleanup
  await prisma.article.deleteMany({ where: { workspaceId: { in: [wsA.id, wsB.id] } } });
  await prisma.source.deleteMany({ where: { workspaceId: { in: [wsA.id, wsB.id] } } });
  await prisma.wordPressCategory.deleteMany({ where: { workspaceId: { in: [wsA.id, wsB.id] } } });
  await prisma.configuration.deleteMany({ where: { workspaceId: { in: [wsA.id, wsB.id] } } });
  await prisma.workspace.deleteMany({ where: { id: { in: [wsA.id, wsB.id] } } });

  console.log("✓ Cleaned up all test workspaces and records.");
  console.log("=== ALL TENANT ISOLATION CHECKS PASSED ===");
}

main()
  .catch((err) => {
    console.error("Tenant isolation verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
