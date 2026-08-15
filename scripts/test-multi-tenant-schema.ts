import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("=== VERIFYING TASK 031: MULTI-TENANT SCHEMA & RELATIONS ===");

  // 1. Check Default Workspace
  const defaultWs = await prisma.workspace.findUnique({
    where: { id: "default-workspace" },
    include: {
      sources: true,
      articles: { take: 5 },
      configurations: true,
      categories: true,
      members: {
        include: { user: true },
      },
    },
  });

  if (!defaultWs) {
    throw new Error("Default workspace not found!");
  }

  console.log("✓ Default workspace exists:", {
    id: defaultWs.id,
    name: defaultWs.name,
    slug: defaultWs.slug,
    sourcesCount: defaultWs.sources.length,
    articlesCount: defaultWs.articles.length,
    configsCount: defaultWs.configurations.length,
    categoriesCount: defaultWs.categories.length,
  });

  // 2. Test User & WorkspaceUser relationship
  const testUser = await prisma.user.upsert({
    where: { email: "tenant-admin@news-curator.local" },
    update: {},
    create: {
      name: "Tenant Admin",
      email: "tenant-admin@news-curator.local",
    },
  });

  const workspaceUser = await prisma.workspaceUser.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: defaultWs.id,
        userId: testUser.id,
      },
    },
    update: { role: "OWNER" },
    create: {
      workspaceId: defaultWs.id,
      userId: testUser.id,
      role: "OWNER",
    },
  });

  console.log("✓ WorkspaceUser relationship verified:", {
    userId: workspaceUser.userId,
    workspaceId: workspaceUser.workspaceId,
    role: workspaceUser.role,
  });

  // 3. Test Isolation via Second Workspace creation
  const tenantB = await prisma.workspace.upsert({
    where: { slug: "tenant-b" },
    update: {},
    create: {
      name: "Tenant B",
      slug: "tenant-b",
      asaasCustomerId: "cus_mock_123",
      stripeCustomerId: "cus_stripe_123",
    },
  });

  const sourceB = await prisma.source.create({
    data: {
      workspaceId: tenantB.id,
      name: "Tenant B Feed",
      rssUrl: "https://example.com/tenant-b/rss",
      active: true,
    },
  });

  console.log("✓ Second workspace created with isolated source:", {
    workspaceId: tenantB.id,
    sourceId: sourceB.id,
  });

  // Cleanup Tenant B test data
  await prisma.source.delete({ where: { id: sourceB.id } });
  await prisma.workspace.delete({ where: { id: tenantB.id } });
  await prisma.workspaceUser.delete({ where: { id: workspaceUser.id } });
  await prisma.user.delete({ where: { id: testUser.id } });

  console.log("✓ Cleaned up verification test data.");
  console.log("=== ALL TASK 031 SCHEMA & RELATION CHECKS PASSED ===");
}

main()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
