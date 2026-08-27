import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { AsaasGateway } from "../src/lib/payments/asaas";

async function main() {
  const asaas = new AsaasGateway();
  try {
    const res = await asaas.getCheckoutUrl({
      workspaceId: "ws_test_123",
      planSlug: "pro",
      planId: "test_plan",
      planName: "Pro",
      amount: 100,
      cycle: "MONTHLY",
      customerId: "cus_000005703774", // We need a real sandbox customer ID here. Let's create one.
      userEmail: "test@example.com",
    });
    console.log("Success:", res);
  } catch (err) {
    console.error("Error:", err);
  }
}

async function createCustomerAndTest() {
  const asaas = new AsaasGateway();
  try {
    const cust = await asaas.createCustomer({
      workspaceId: "ws_123",
      name: "Test User",
      email: "test@example.com",
      cpfCnpj: "00000000000"
    });
    console.log("Created customer:", cust);
    
    const res = await asaas.getCheckoutUrl({
      workspaceId: "ws_123",
      planSlug: "pro",
      planId: "test_plan",
      planName: "Pro",
      amount: 100,
      cycle: "MONTHLY",
      customerId: cust.customerId,
      userEmail: "test@example.com",
    });
    console.log("Success:", res);
  } catch (err) {
    console.error("Error:", err);
  }
}

createCustomerAndTest();
