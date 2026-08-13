import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("=== RUNNING DASHBOARD MODULE TESTS ===");

  // 1. Create test records for stats verification
  const source = await prisma.source.create({
    data: {
      name: "Dashboard Test Source",
      rssUrl: "https://example.com/dash-rss",
      active: true,
    },
  });

  const category = await prisma.wordPressCategory.create({
    data: {
      wordpressId: 8881,
      name: "Dashboard Category",
      slug: "dashboard-category",
    },
  });

  const pendingArt = await prisma.article.create({
    data: {
      sourceId: source.id,
      originalUrl: "https://example.com/dash-art-1",
      originalTitle: "Notícia Pendente para Dashboard",
      status: "PENDING",
      aiScore: 92,
      suggestedCategoryId: category.id,
    },
  });

  const publishedArt = await prisma.article.create({
    data: {
      sourceId: source.id,
      originalUrl: "https://example.com/dash-art-2",
      originalTitle: "Notícia Publicada para Dashboard",
      status: "PUBLISHED",
      aiScore: 88,
      wordpressPostId: 101,
    },
  });

  // 2. Query Dashboard Stats
  const [pendingCount, publishedCount, rejectedCount, activeSourcesCount] = await Promise.all([
    prisma.article.count({ where: { status: "PENDING" } }),
    prisma.article.count({ where: { status: "PUBLISHED" } }),
    prisma.article.count({ where: { status: "REJECTED" } }),
    prisma.source.count({ where: { active: true } }),
  ]);

  console.log("✓ Dashboard Stats Calculated:", {
    pendingCount,
    publishedCount,
    rejectedCount,
    activeSourcesCount,
  });

  if (pendingCount < 1 || publishedCount < 1 || activeSourcesCount < 1) {
    throw new Error("FAILED: Dashboard stats query returned unexpected counts.");
  }

  // 3. Query Articles List with Status Filter
  const pendingArticles = await prisma.article.findMany({
    where: { status: "PENDING" },
    include: { source: true, suggestedCategory: true },
  });

  console.log(`✓ Fetched ${pendingArticles.length} pending articles for dashboard list.`);
  const foundPending = pendingArticles.find((a) => a.id === pendingArt.id);
  if (!foundPending) {
    throw new Error("FAILED: Created pending article was not found in filtered articles list query.");
  }
  console.log(`✓ Article "${foundPending.originalTitle}" correctly retrieved with source "${foundPending.source.name}" and AI score ${foundPending.aiScore}.`);

  // 4. Cleanup
  await prisma.article.delete({ where: { id: pendingArt.id } });
  await prisma.article.delete({ where: { id: publishedArt.id } });
  await prisma.wordPressCategory.delete({ where: { id: category.id } });
  await prisma.source.delete({ where: { id: source.id } });
  console.log("✓ Cleaned up test data.");

  console.log("=== DASHBOARD MODULE TESTS COMPLETE: ALL CHECKS PASSED ===");
}

main()
  .catch((err) => {
    console.error("Dashboard test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
