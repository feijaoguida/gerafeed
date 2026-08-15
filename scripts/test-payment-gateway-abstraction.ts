import { getPaymentGateway, PaymentGateway } from "../src/lib/payments";

async function main() {
  console.log("=== RUNNING PAYMENT GATEWAY ABSTRACTION TESTS ===");

  const gateway: PaymentGateway = getPaymentGateway("mock");

  if (!gateway || gateway.provider !== "mock") {
    throw new Error("FAILED: getPaymentGateway did not return expected gateway instance.");
  }
  console.log("✓ PaymentGateway factory resolved successfully.");

  // 1. Test createCustomer
  const customer = await gateway.createCustomer({
    workspaceId: "ws_test_123",
    name: "Empresa Teste",
    email: "financeiro@empresa.com",
    cpfCnpj: "12.345.678/0001-90",
  });

  if (!customer.customerId || customer.provider !== "mock") {
    throw new Error("FAILED: createCustomer failed.");
  }
  console.log("✓ createCustomer passed:", customer);

  // 2. Test createSubscription
  const subscription = await gateway.createSubscription({
    workspaceId: "ws_test_123",
    customerId: customer.customerId,
    planId: "plan_pro",
    planSlug: "pro",
    planName: "Plano Pro",
    price: 97.0,
    cycle: "MONTHLY",
  });

  if (!subscription.subscriptionId || subscription.status !== "ACTIVE") {
    throw new Error("FAILED: createSubscription failed.");
  }
  console.log("✓ createSubscription passed:", subscription);

  // 3. Test getCheckoutUrl
  const checkoutUrl = await gateway.getCheckoutUrl({
    workspaceId: "ws_test_123",
    planSlug: "pro",
    userEmail: "financeiro@empresa.com",
  });

  if (!checkoutUrl.includes("checkout/pro")) {
    throw new Error("FAILED: getCheckoutUrl returned invalid URL.");
  }
  console.log("✓ getCheckoutUrl passed:", checkoutUrl);

  // 4. Test cancelSubscription
  const canceled = await gateway.cancelSubscription(subscription.subscriptionId);
  if (!canceled) {
    throw new Error("FAILED: cancelSubscription failed.");
  }
  console.log("✓ cancelSubscription passed.");

  // 5. Test handleWebhook
  const webhookResult = await gateway.handleWebhook({
    event: "PAYMENT_CONFIRMED",
    subscriptionId: subscription.subscriptionId,
  });

  if (webhookResult.type !== "PAYMENT_CONFIRMED") {
    throw new Error("FAILED: handleWebhook failed.");
  }
  console.log("✓ handleWebhook passed:", webhookResult);

  console.log("=== ALL PAYMENT GATEWAY ABSTRACTION CHECKS PASSED ===");
}

main().catch((err) => {
  console.error("Payment gateway abstraction test failed:", err);
  process.exit(1);
});
