import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { processRssSources } from "../src/lib/rss";

async function main() {
  console.log("=== RUNNING RSS MODULE TESTS ===");

  // Cleanup any old test sources / articles
  await prisma.article.deleteMany({
    where: { source: { name: { startsWith: "Test RSS Source" } } },
  });
  await prisma.source.deleteMany({
    where: { name: { startsWith: "Test RSS Source" } },
  });

  // 1. Create a valid test RSS source (using NYTimes Tech RSS feed)
  const validSource = await prisma.source.create({
    data: {
        workspaceId: "default-workspace",name: "Test RSS Source - NYT Tech",
      rssUrl: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
      active: true,
    },
  });
  console.log("✓ Created valid RSS Source:", validSource.id);

  // 2. Create an invalid test RSS source to test error isolation
  const invalidSource = await prisma.source.create({
    data: {
        workspaceId: "default-workspace",name: "Test RSS Source - Invalid URL",
      rssUrl: "https://invalid-domain-rss-99999.xyz/feed.xml",
      active: true,
    },
  });
  console.log("✓ Created invalid RSS Source to test error tolerance:", invalidSource.id);

  // 3. Execute processRssSources(5)
  console.log("Processing RSS sources (limit 5)...");
  const result1 = await processRssSources(5);
  console.log("Result 1:", result1.message, `(Processed: ${result1.processedCount})`);

  if (!result1.success) {
    throw new Error("FAILED: RSS processing was not successful.");
  }

  if (result1.processedCount > 5) {
    throw new Error(`FAILED: Processed count ${result1.processedCount} exceeds limit 5.`);
  }
  console.log(`✓ Processed count limit verified: ${result1.processedCount} <= 5`);

  // Verify articles in DB
  const articlesInDb = await prisma.article.findMany({
    where: { sourceId: validSource.id },
  });

  console.log(`✓ DB contains ${articlesInDb.length} articles for source.`);
  for (const art of articlesInDb) {
    if (art.status !== "PENDING") {
      throw new Error(`FAILED: Article ${art.id} status is ${art.status}, expected PENDING.`);
    }
    if (!art.originalUrl || !art.originalTitle) {
      throw new Error(`FAILED: Article ${art.id} is missing originalUrl or originalTitle.`);
    }
    console.log(`  - Persisted Article: "${art.originalTitle.substring(0, 50)}..." (${art.originalUrl})`);
  }
  console.log("✓ All persisted articles have status PENDING and valid originalUrl & originalTitle.");

  // 4. Test Deduplication: Drain remaining items from feed to populate DB completely
  console.log("Draining remaining items from RSS feed to test deduplication...");
  let maxLoop = 10;
  while (maxLoop > 0) {
    const drainResult = await processRssSources(50);
    if (drainResult.processedCount === 0) break;
    maxLoop--;
  }

  // Now all items from feed exist in DB. Running processRssSources(5) again MUST return 0 new processed items.
  console.log("Running RSS processing again when all items exist in DB...");
  const result2 = await processRssSources(5);
  console.log("Result 2:", result2.message, `(Processed: ${result2.processedCount})`);

  if (result2.processedCount !== 0) {
    throw new Error(`FAILED: Deduplication failed! Processed ${result2.processedCount} duplicate items instead of 0.`);
  }
  console.log("✓ Deduplication verified: 0 duplicate articles inserted when items exist in DB.");

  // 5. Test Source Activation/Deactivation
  await prisma.source.update({
    where: { id: validSource.id },
    data: { active: false },
  });
  const inactiveResult = await processRssSources(5);
  console.log("✓ Inactive source result:", inactiveResult.message);
  if (inactiveResult.processedCount !== 0) {
    throw new Error("FAILED: Inactive source returned processed items.");
  }
  console.log("✓ Source activation toggle verified.");

  // 6. Cleanup
  await prisma.article.deleteMany({
    where: { sourceId: validSource.id },
  });
  await prisma.source.delete({ where: { id: validSource.id } });
  await prisma.source.delete({ where: { id: invalidSource.id } });
  console.log("✓ Test data cleaned up.");

  console.log("=== RSS MODULE TESTS COMPLETE: ALL CHECKS PASSED ===");
}

main()
  .catch((err) => {
    console.error("RSS test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
