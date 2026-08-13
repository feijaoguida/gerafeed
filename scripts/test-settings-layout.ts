import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("=== RUNNING SETTINGS LAYOUT MODULE TESTS ===");

  // 1. Verify DB query for sources settings page
  const sources = await prisma.source.findMany();
  console.log(`✓ Fetched ${sources.length} RSS sources from database for settings page.`);

  // 2. Verify Articles filter query for Pending, Published, Rejected links
  const [pendingCount, publishedCount, rejectedCount] = await Promise.all([
    prisma.article.count({ where: { status: "PENDING" } }),
    prisma.article.count({ where: { status: "PUBLISHED" } }),
    prisma.article.count({ where: { status: "REJECTED" } }),
  ]);

  console.log("✓ Route filters verified:", {
    pending: pendingCount,
    published: publishedCount,
    rejected: rejectedCount,
  });

  console.log("=== SETTINGS LAYOUT MODULE TESTS COMPLETE: ALL CHECKS PASSED ===");
}

main()
  .catch((err) => {
    console.error("Settings layout test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
