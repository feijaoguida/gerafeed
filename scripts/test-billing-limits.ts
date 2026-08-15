import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { BillingService } from "../src/lib/billing";

async function main() {
  console.log("=== RUNNING BILLING SCHEMA & LIMITS VERIFICATION TESTS ===");

  // 1. Ensure Default Plans
  await BillingService.ensureDefaultPlans();
  const plans = await prisma.plan.findMany({ orderBy: { price: "asc" } });
  console.log(`✓ Default plans verified (${plans.length} plans loaded: ${plans.map((p) => p.name).join(", ")})`);

  if (plans.length < 3) {
    throw new Error("FAILED: Default plans (free, starter, pro) were not properly seeded.");
  }

  // 2. Create custom test plan with strict limits for testing
  const testPlan = await prisma.plan.create({
    data: {
      name: "Mini Test Plan",
      slug: `mini-test-${Date.now()}`,
      price: 10.0,
      maxArticles: 2,
      maxSources: 1,
    },
  });

  const testWorkspace = await prisma.workspace.create({
    data: {
      name: "Billing Test Workspace",
      slug: `billing-test-${Date.now()}`,
    },
  });

  // Assign test plan to workspace
  await prisma.subscription.create({
    data: {
      workspaceId: testWorkspace.id,
      planId: testPlan.id,
      status: "ACTIVE",
    },
  });

  console.log("✓ Test workspace created with limits: maxArticles=2, maxSources=1");

  // 3. Test Sources limit
  const initialSourcesCheck = await BillingService.checkLimit(testWorkspace.id, "SOURCES");
  if (!initialSourcesCheck.allowed || initialSourcesCheck.current !== 0) {
    throw new Error("FAILED: Initial sources limit check failed.");
  }

  // Add 1 active source
  const source1 = await prisma.source.create({
    data: {
      workspaceId: testWorkspace.id,
      name: "Source 1",
      rssUrl: "https://example.com/rss1",
      active: true,
    },
  });

  const sourcesCheckAfter1 = await BillingService.checkLimit(testWorkspace.id, "SOURCES");
  if (sourcesCheckAfter1.allowed) {
    throw new Error("FAILED: Sources check should be NOT allowed after reaching limit (1/1).");
  }
  console.log("✓ Source limit correctly blocked at 1/1 active sources:", sourcesCheckAfter1.message);

  let sourceAssertBlocked = false;
  try {
    await BillingService.assertLimit(testWorkspace.id, "SOURCES");
  } catch {
    sourceAssertBlocked = true;
  }
  if (!sourceAssertBlocked) {
    throw new Error("FAILED: assertLimit did not throw error when source limit was exceeded.");
  }
  console.log("✓ assertLimit threw exception as expected for exceeded sources limit.");

  // 4. Test Articles limit
  const initialArticlesCheck = await BillingService.checkLimit(testWorkspace.id, "ARTICLES");
  if (!initialArticlesCheck.allowed || initialArticlesCheck.current !== 0) {
    throw new Error("FAILED: Initial articles limit check failed.");
  }

  // Create 2 articles
  await prisma.article.create({
    data: {
      workspaceId: testWorkspace.id,
      sourceId: source1.id,
      originalUrl: `https://example.com/art-1-${Date.now()}`,
      originalTitle: "Artigo 1",
    },
  });

  await prisma.article.create({
    data: {
      workspaceId: testWorkspace.id,
      sourceId: source1.id,
      originalUrl: `https://example.com/art-2-${Date.now()}`,
      originalTitle: "Artigo 2",
    },
  });

  const articlesCheckAfter2 = await BillingService.checkLimit(testWorkspace.id, "ARTICLES");
  if (articlesCheckAfter2.allowed) {
    throw new Error("FAILED: Articles check should be NOT allowed after reaching limit (2/2).");
  }
  console.log("✓ Article limit correctly blocked at 2/2 monthly articles:", articlesCheckAfter2.message);

  let articleAssertBlocked = false;
  try {
    await BillingService.assertLimit(testWorkspace.id, "ARTICLES");
  } catch {
    articleAssertBlocked = true;
  }
  if (!articleAssertBlocked) {
    throw new Error("FAILED: assertLimit did not throw error when article limit was exceeded.");
  }
  console.log("✓ assertLimit threw exception as expected for exceeded articles limit.");

  // 5. Test Upgrade to Pro Plan
  const proPlan = await prisma.plan.findUniqueOrThrow({ where: { slug: "pro" } });
  await prisma.subscription.update({
    where: { workspaceId: testWorkspace.id },
    data: { planId: proPlan.id },
  });

  const upgradedSourcesCheck = await BillingService.checkLimit(testWorkspace.id, "SOURCES");
  const upgradedArticlesCheck = await BillingService.checkLimit(testWorkspace.id, "ARTICLES");

  if (!upgradedSourcesCheck.allowed || !upgradedArticlesCheck.allowed) {
    throw new Error("FAILED: Upgraded plan should allow actions under new higher limits.");
  }
  console.log("✓ Upgraded workspace to Pro plan: actions now allowed successfully:", {
    sources: `${upgradedSourcesCheck.current}/${upgradedSourcesCheck.limit}`,
    articles: `${upgradedArticlesCheck.current}/${upgradedArticlesCheck.limit}`,
  });

  // 6. Cleanup
  await prisma.article.deleteMany({ where: { workspaceId: testWorkspace.id } });
  await prisma.source.deleteMany({ where: { workspaceId: testWorkspace.id } });
  await prisma.subscription.deleteMany({ where: { workspaceId: testWorkspace.id } });
  await prisma.workspace.deleteMany({ where: { id: testWorkspace.id } });
  await prisma.plan.delete({ where: { id: testPlan.id } });

  console.log("✓ Test cleanup completed.");
  console.log("=== ALL BILLING SCHEMA & LIMITS CHECKS PASSED ===");
}

main()
  .catch((err) => {
    console.error("Billing test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
