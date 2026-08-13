import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Testing PostgreSQL database connection with Prisma...");

  // Clean up previous test data if any
  await prisma.article.deleteMany({ where: { originalUrl: "https://example.com/test-article-1" } });
  await prisma.source.deleteMany({ where: { rssUrl: "https://example.com/rss.xml" } });

  // 1. Create a Source
  const source = await prisma.source.create({
    data: {
      name: "Test Source",
      rssUrl: "https://example.com/rss.xml",
      active: true,
    },
  });
  console.log("✓ Source created:", source.id);

  // 2. Create an Article
  const article = await prisma.article.create({
    data: {
      sourceId: source.id,
      originalUrl: "https://example.com/test-article-1",
      originalTitle: "Test Article Title",
      originalDescription: "Description of test article",
      status: "PENDING",
    },
  });
  console.log("✓ Article created:", article.id);

  // 3. Test uniqueness constraint on originalUrl (RF04)
  let duplicatePrevented = false;
  try {
    await prisma.article.create({
      data: {
        sourceId: source.id,
        originalUrl: "https://example.com/test-article-1",
        originalTitle: "Duplicate Test Article Title",
      },
    });
  } catch {
    duplicatePrevented = true;
    console.log("✓ Uniqueness constraint verified for originalUrl (RF04)");
  }

  if (!duplicatePrevented) {
    throw new Error("FAILED: Uniqueness constraint on originalUrl was not enforced!");
  }

  // 4. Cleanup
  await prisma.article.delete({ where: { id: article.id } });
  await prisma.source.delete({ where: { id: source.id } });
  console.log("✓ Cleaned up test data.");
  console.log("DATABASE TEST COMPLETE: ALL CHECKS PASSED.");
}

main()
  .catch((e) => {
    console.error("Database test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
