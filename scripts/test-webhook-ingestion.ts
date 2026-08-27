import * as dotenv from "dotenv";
dotenv.config();

import { AsaasGateway } from "../src/lib/payments/asaas";

async function runTests() {
  console.log("--- TESTE DE INGESTÃO DE WEBHOOKS ASAAS (TASK 185) ---");

  const gateway = new AsaasGateway({
    webhookToken: "test-webhook-secret-token",
  });

  // Test 1: Authentication failure with bad token
  console.log("\n1. Testando autenticação de token...");
  try {
    await gateway.handleWebhook({ event: "PAYMENT_CONFIRMED" }, { "asaas-access-token": "wrong-token" });
    console.error("FALHA: Deveria ter rejeitado token inválido!");
    process.exit(1);
  } catch (err) {
    console.log("OK: Token inválido rejeitado com sucesso ->", (err as Error).message);
  }

  // Test 2: Successful auth and event parsing
  console.log("\n2. Testando parsing de eventos de pagamento...");
  const paymentEvent = {
    id: "evt_test_payment_confirmed_123",
    event: "PAYMENT_CONFIRMED",
    dateCreated: "2026-08-27 15:00:00",
    payment: {
      id: "pay_test_999",
      customer: "cus_test_123",
      subscription: "sub_test_456",
      externalReference: "workspace_test_789",
      status: "CONFIRMED",
      value: 97.00,
    },
  };

  const parsed1 = await gateway.handleWebhook(paymentEvent, { "asaas-access-token": "test-webhook-secret-token" });
  console.log("Evento PAYMENT_CONFIRMED parseado:", {
    type: parsed1.type,
    provider: parsed1.provider,
    providerEventId: parsed1.providerEventId,
    subscriptionId: parsed1.subscriptionId,
    customerId: parsed1.customerId,
    workspaceId: parsed1.workspaceId,
  });

  if (
    parsed1.type !== "PAYMENT_CONFIRMED" ||
    parsed1.providerEventId !== "evt_test_payment_confirmed_123" ||
    parsed1.subscriptionId !== "sub_test_456" ||
    parsed1.workspaceId !== "workspace_test_789"
  ) {
    console.error("FALHA: Campos do evento PAYMENT_CONFIRMED inconsistentes!");
    process.exit(1);
  }
  console.log("OK: PAYMENT_CONFIRMED parseado com exatidão.");

  // Test 3: Subscription Event Parsing
  console.log("\n3. Testando parsing de eventos de assinatura...");
  const subEvent = {
    id: "evt_test_sub_deleted_456",
    event: "SUBSCRIPTION_DELETED",
    subscription: {
      id: "sub_test_456",
      customer: "cus_test_123",
      externalReference: "workspace_test_789",
      status: "INACTIVE",
    },
  };

  const parsed2 = await gateway.handleWebhook(subEvent, { "asaas-access-token": "test-webhook-secret-token" });
  if (parsed2.type !== "SUBSCRIPTION_DELETED" || parsed2.subscriptionId !== "sub_test_456") {
    console.error("FALHA: Evento SUBSCRIPTION_DELETED inconsistente!");
    process.exit(1);
  }
  console.log("OK: SUBSCRIPTION_DELETED parseado com sucesso.");

  // Test 4: Unknown Event Graceful Handling
  console.log("\n4. Testando evento desconhecido / evolução de payload...");
  const unknownEvent = {
    id: "evt_test_future_product_789",
    event: "NEW_UNANNOUNCED_ASAAS_FEATURE",
    extraNewField: { foo: "bar" },
  };

  const parsed3 = await gateway.handleWebhook(unknownEvent, { "asaas-access-token": "test-webhook-secret-token" });
  if (parsed3.type !== "UNKNOWN") {
    console.error("FALHA: Evento desconhecido deveria ser marcado como UNKNOWN!");
    process.exit(1);
  }
  console.log("OK: Evento desconhecido tolerado sem exceção (tipo UNKNOWN).");

  console.log("\n--- TODOS OS TESTES DO WEBHOOK PASSARAM COM SUCESSO! ---");
}

runTests().catch((err) => {
  console.error("Erro no teste de webhook:", err);
  process.exit(1);
});
