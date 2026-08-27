import { AsaasGateway } from "../src/lib/payments/asaas";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function main() {
  const asaas = new AsaasGateway();
  try {
    const res = await asaas.getCheckoutUrl({
      workspaceId: "ws_test_123",
      planSlug: "pro",
      planName: "Pro",
      amount: 100,
      cycle: "MONTHLY",
      userEmail: "test@example.com",
    });
    console.log("Success:", res);
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
