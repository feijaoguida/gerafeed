import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { GET as getPlansHandler } from "../src/app/api/billing/plans/route";
import { GET as getSubscriptionHandler } from "../src/app/api/billing/subscription/route";
import { POST as checkoutHandler } from "../src/app/api/billing/checkout/route";
import { NextRequest } from "next/server";

async function main() {
  console.log("=== RUNNING CHECKOUT & BILLING API VERIFICATION TESTS ===");

  // 1. Test GET /api/billing/plans
  const plansRes = await getPlansHandler();
  if (plansRes.status !== 200) {
    throw new Error(`FAILED: getPlans returned status ${plansRes.status}`);
  }
  const plansData = await plansRes.json();
  console.log(`✓ GET /api/billing/plans returned ${plansData.length} plans:`, plansData.map((p: { name: string }) => p.name));

  if (!Array.isArray(plansData) || plansData.length < 3) {
    throw new Error("FAILED: Plans list should contain at least 3 plans.");
  }

  // 2. Test GET /api/billing/subscription for default workspace
  const subRes = await getSubscriptionHandler();
  if (subRes.status !== 200) {
    throw new Error(`FAILED: getSubscription returned status ${subRes.status}`);
  }
  const subData = await subRes.json();
  console.log("✓ GET /api/billing/subscription returned:", {
    plan: subData.subscription?.plan?.name,
    status: subData.subscription?.status,
    articlesUsage: subData.usage?.articles,
    sourcesUsage: subData.usage?.sources,
  });

  if (!subData.subscription || !subData.usage) {
    throw new Error("FAILED: Subscription response missing data.");
  }

  // 3. Test POST /api/billing/checkout for Free plan
  const freeReq = new NextRequest("http://localhost:3000/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planSlug: "free" }),
  });

  const freeRes = await checkoutHandler(freeReq);
  const freeData = await freeRes.json();
  if (freeRes.status !== 200 || !freeData.isFree) {
    throw new Error("FAILED: Checkout for Free plan failed.");
  }
  console.log("✓ POST /api/billing/checkout for Free plan activated instantly:", freeData);

  // 4. Test POST /api/billing/checkout for Pro plan
  const proReq = new NextRequest("http://localhost:3000/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planSlug: "pro" }),
  });

  const proRes = await checkoutHandler(proReq);
  const proData = await proRes.json();
  if (proRes.status !== 200 || !proData.checkoutUrl) {
    throw new Error("FAILED: Checkout for Pro plan failed.");
  }
  console.log("✓ POST /api/billing/checkout for Pro plan returned checkoutUrl:", proData.checkoutUrl);

  console.log("=== ALL CHECKOUT & BILLING API CHECKS PASSED ===");
}

main()
  .catch((err) => {
    console.error("Checkout tests failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
