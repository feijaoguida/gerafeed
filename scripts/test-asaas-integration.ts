import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { AsaasGateway } from "../src/lib/payments/asaas";
import { POST as asaasWebhookHandler } from "../src/app/api/webhooks/asaas/route";
import { NextRequest } from "next/server";

async function main() {
  console.log("=== RUNNING ASAAS INTEGRATION & WEBHOOK VERIFICATION TESTS ===");

  const gateway = new AsaasGateway({
    apiKey: "test_api_key_mock",
    baseUrl: "https://sandbox.asaas.com/v3",
    webhookToken: "secure_webhook_token_123",
  });

  if (gateway.provider !== "asaas") {
    throw new Error("FAILED: AsaasGateway provider identifier mismatch.");
  }
  console.log("✓ AsaasGateway instance created.");

  // 1. Setup Test Workspace & Plan
  const plan = await prisma.plan.upsert({
    where: { slug: "pro" },
    create: {
      name: "Plano Pro",
      slug: "pro",
      price: 97.0,
      maxArticles: 1000,
      maxSources: 30,
    },
    update: {},
  });

  const testWorkspace = await prisma.workspace.create({
    data: {
      name: "Asaas Integration Workspace",
      slug: `asaas-ws-${Date.now()}`,
    },
  });

  const asaasSubId = `sub_asaas_${Date.now()}`;
  const subscription = await prisma.subscription.create({
    data: {
      workspaceId: testWorkspace.id,
      planId: plan.id,
      status: "INCOMPLETE",
      asaasSubscriptionId: asaasSubId,
    },
  });

  console.log("✓ Initial subscription created with status INCOMPLETE and asaasSubscriptionId:", asaasSubId);

  // 2. Test Webhook Unauthorized without valid token
  const unauthReq = new NextRequest("http://localhost:3000/api/webhooks/asaas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "asaas-access-token": "wrong_token",
    },
    body: JSON.stringify({
      event: "PAYMENT_RECEIVED",
      payment: { subscription: asaasSubId },
    }),
  });

  // Temporarily set ASAAS_WEBHOOK_TOKEN env
  process.env.ASAAS_WEBHOOK_TOKEN = "secure_webhook_token_123";

  const unauthRes = await asaasWebhookHandler(unauthReq);
  if (unauthRes.status !== 401) {
    throw new Error(`FAILED: Webhook should reject invalid token with 401, got ${unauthRes.status}`);
  }
  console.log("✓ Webhook correctly rejected unauthorized request with status 401.");

  // 3. Test Webhook PAYMENT_RECEIVED (renews subscription)
  const authReq = new NextRequest("http://localhost:3000/api/webhooks/asaas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "asaas-access-token": "secure_webhook_token_123",
    },
    body: JSON.stringify({
      event: "PAYMENT_RECEIVED",
      payment: {
        id: "pay_123456",
        subscription: asaasSubId,
        customer: "cus_123456",
        externalReference: testWorkspace.id,
        status: "RECEIVED",
      },
    }),
  });

  const authRes = await asaasWebhookHandler(authReq);
  if (authRes.status !== 200) {
    const errText = await authRes.text();
    throw new Error(`FAILED: Webhook payment received failed: ${errText}`);
  }

  const updatedSubAfterPayment = await prisma.subscription.findUniqueOrThrow({
    where: { id: subscription.id },
  });

  if (updatedSubAfterPayment.status !== "ACTIVE" || !updatedSubAfterPayment.validUntil) {
    throw new Error("FAILED: Subscription status was not updated to ACTIVE with validUntil.");
  }
  console.log("✓ Webhook PAYMENT_RECEIVED updated subscription to ACTIVE until:", updatedSubAfterPayment.validUntil);

  // 4. Test Webhook PAYMENT_OVERDUE
  const overdueReq = new NextRequest("http://localhost:3000/api/webhooks/asaas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "asaas-access-token": "secure_webhook_token_123",
    },
    body: JSON.stringify({
      event: "PAYMENT_OVERDUE",
      payment: {
        subscription: asaasSubId,
      },
    }),
  });

  await asaasWebhookHandler(overdueReq);
  const updatedSubAfterOverdue = await prisma.subscription.findUniqueOrThrow({
    where: { id: subscription.id },
  });

  if (updatedSubAfterOverdue.status !== "PAST_DUE") {
    throw new Error("FAILED: Subscription status was not updated to PAST_DUE.");
  }
  console.log("✓ Webhook PAYMENT_OVERDUE updated subscription to PAST_DUE.");

  // 5. Test Webhook SUBSCRIPTION_DELETED
  const canceledReq = new NextRequest("http://localhost:3000/api/webhooks/asaas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "asaas-access-token": "secure_webhook_token_123",
    },
    body: JSON.stringify({
      event: "SUBSCRIPTION_DELETED",
      subscription: {
        id: asaasSubId,
      },
    }),
  });

  await asaasWebhookHandler(canceledReq);
  const updatedSubAfterCanceled = await prisma.subscription.findUniqueOrThrow({
    where: { id: subscription.id },
  });

  if (updatedSubAfterCanceled.status !== "CANCELED") {
    throw new Error("FAILED: Subscription status was not updated to CANCELED.");
  }
  console.log("✓ Webhook SUBSCRIPTION_DELETED updated subscription to CANCELED.");

  // 6. Cleanup
  await prisma.subscription.deleteMany({ where: { workspaceId: testWorkspace.id } });
  await prisma.workspace.deleteMany({ where: { id: testWorkspace.id } });

  console.log("✓ Cleanup completed.");
  console.log("=== ALL ASAAS INTEGRATION & WEBHOOK CHECKS PASSED ===");
}

main()
  .catch((err) => {
    console.error("Asaas integration test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
