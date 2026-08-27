import * as dotenv from "dotenv";
dotenv.config();

import { AsaasGateway } from "../src/lib/payments/asaas";

async function main() {
  console.log("--- TESTE E2E ASAAS BILLING GATEWAY ---");
  const apiKey = process.env.ASAAS_API_KEY;
  console.log("Ambiente:", process.env.ASAAS_ENVIRONMENT || "sandbox");
  console.log("API Key configurada:", apiKey ? `${apiKey.slice(0, 15)}...` : "NÃO");

  if (!apiKey) {
    console.error("ERRO: ASAAS_API_KEY não encontrada no .env");
    process.exit(1);
  }

  const gateway = new AsaasGateway();

  // 1. Ensure Customer
  console.log("\n1. Testando ensureCustomer...");
  const customerResult = await gateway.ensureCustomer({
    workspaceId: "test-workspace-e2e-" + Date.now(),
    name: "Gerafeed Assinante Teste",
    email: `teste-${Date.now()}@gerafeed.com.br`,
    cpfCnpj: "24971563792",
    phone: "11999998888",
  });

  console.log("Customer Result:", customerResult);

  if (!customerResult.customerId) {
    console.error("ERRO: Falha ao obter customerId!");
    process.exit(1);
  }

  // 2. Create Subscription & Get Checkout URL
  console.log("\n2. Testando getCheckoutUrl (Criação de assinatura + Fatura)...");
  const checkoutUrl = await gateway.getCheckoutUrl({
    workspaceId: "test-workspace-e2e",
    planSlug: "pro",
    planId: "plan_pro_test",
    planName: "Profissional",
    amount: 97.00,
    cycle: "MONTHLY",
    customerId: customerResult.customerId,
    userEmail: "teste@gerafeed.com.br",
    userName: "Gerafeed Assinante Teste",
    billingType: "BOLETO",
    successUrl: "https://www.gerafeed.com.br/settings/billing?checkout=success",
    cancelUrl: "https://www.gerafeed.com.br/settings/billing?checkout=canceled",
  });

  console.log("Checkout URL gerada com sucesso:", checkoutUrl);

  if (!checkoutUrl || !checkoutUrl.startsWith("http")) {
    console.error("ERRO: URL de Checkout inválida!");
    process.exit(1);
  }

  console.log("\n--- TESTE E2E ASAAS FINALIZADO COM SUCESSO! ---");
}

main().catch((err) => {
  console.error("Erro na execução do teste E2E:", err);
  process.exit(1);
});
