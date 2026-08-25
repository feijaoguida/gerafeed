import { prisma } from "../src/lib/prisma";
import { AsaasGateway } from "../src/lib/payments/asaas";
import { MockPaymentGateway } from "../src/lib/payments/mock";

const db = prisma as unknown as {
  billingProfile: {
    deleteMany: (args: unknown) => Promise<unknown>;
    create: (args: unknown) => Promise<unknown>;
  };
};

async function runTests() {
  console.log("=================================================");
  console.log("=== TEST: Task 182 - PaymentProvider Contract & Asaas Customer Sync ===");
  console.log("=================================================");

  // Cleanup test workspace
  await db.billingProfile.deleteMany({
    where: { workspace: { slug: "test-asaas-sync-ws" } },
  });
  await prisma.workspace.deleteMany({
    where: { slug: "test-asaas-sync-ws" },
  });

  try {
    // ----------------------------------------------------------------
    // 1. PaymentProvider Capabilities Check
    // ----------------------------------------------------------------
    console.log("\n--- 1. Testing PaymentProvider v2 Capabilities Contract ---");

    const mockGateway = new MockPaymentGateway();
    if (
      !mockGateway.capabilities ||
      !mockGateway.capabilities.customer ||
      !mockGateway.capabilities.subscription ||
      !mockGateway.capabilities.checkout ||
      !mockGateway.capabilities.webhooks
    ) {
      throw new Error("FAIL: MockPaymentGateway capabilities incorretas.");
    }

    const asaasGateway = new AsaasGateway({ apiKey: "mock_test_key" });
    if (
      !asaasGateway.capabilities ||
      !asaasGateway.capabilities.customer ||
      !asaasGateway.capabilities.subscription
    ) {
      throw new Error("FAIL: AsaasGateway capabilities incorretas.");
    }

    console.log("✓ Check 1 PASS: Contrato de capacidades v2 validado nos gateways.");

    // ----------------------------------------------------------------
    // 2. Mock Gateway Idempotent ensureCustomer
    // ----------------------------------------------------------------
    console.log("\n--- 2. Testing Mock ensureCustomer Idempotency ---");

    const mockParams = {
      workspaceId: "ws_mock_test_123",
      name: "Empresa Mock",
      email: "mock@empresa.com",
      cpfCnpj: "52998224725",
    };

    const mockRes1 = await mockGateway.ensureCustomer(mockParams);
    const mockRes2 = await mockGateway.ensureCustomer({
      ...mockParams,
      providerCustomerId: mockRes1.customerId,
    });

    console.log(`✓ Execução 1 ID: ${mockRes1.customerId}`);
    console.log(`✓ Execução 2 ID: ${mockRes2.customerId}`);

    if (mockRes1.customerId !== mockRes2.customerId) {
      throw new Error("FAIL: Mock ensureCustomer não reusou o mesmo ID.");
    }

    console.log("✓ Check 2 PASS: Idempotência do MockGateway validada.");

    // ----------------------------------------------------------------
    // 3. Asaas Customer Sync Logic & Database Persistence
    // ----------------------------------------------------------------
    console.log("\n--- 3. Testing Database Persistence & Asaas Reconciliation ---");

    const testWs = await prisma.workspace.create({
      data: { name: "Empresa Asaas Test", slug: "test-asaas-sync-ws" },
    });

    const profileData = {
      workspaceId: testWs.id,
      name: "Empresa Asaas Teste S.A.",
      cpfCnpj: "00.000.000/0001-91",
      email: "financeiro@asaastest.com",
      providerCustomerId: "cus_asaas_reconciled_999",
    };

    await db.billingProfile.create({ data: profileData });

    // Instanciar gateway com mock key para testar busca local de ID
    const testGateway = new AsaasGateway();

    // ensureCustomer com providerCustomerId existente no banco
    const syncRes1 = await testGateway.ensureCustomer({
      workspaceId: testWs.id,
      name: profileData.name,
      email: profileData.email,
      cpfCnpj: profileData.cpfCnpj,
      providerCustomerId: profileData.providerCustomerId,
    });

    console.log(`✓ Reconciliação ID no banco: ${syncRes1.customerId}`);
    if (syncRes1.customerId !== "cus_asaas_reconciled_999") {
      throw new Error("FAIL: Asaas ensureCustomer não reutilizou providerCustomerId do banco.");
    }

    // Verificar se workspace.asaasCustomerId foi persistido
    const updatedWs = await prisma.workspace.findUnique({ where: { id: testWs.id } });
    if (updatedWs?.asaasCustomerId !== "cus_asaas_reconciled_999") {
      throw new Error("FAIL: asaasCustomerId não foi persistido no Workspace.");
    }

    console.log("✓ Check 3 PASS: Reuso de ID existente no banco e persistência no Workspace validados.");

    // ----------------------------------------------------------------
    // 4. Normalized Error Handling
    // ----------------------------------------------------------------
    console.log("\n--- 4. Testing Normalized Error Handling ---");

    try {
      const emptyKeyGateway = new AsaasGateway({ apiKey: "" });
      await emptyKeyGateway.createCustomer({
        workspaceId: "test_ws",
        name: "Test",
        email: "test@test.com",
      });
      throw new Error("FAIL: Operação sem API Key deveria falhar.");
    } catch (err) {
      const msg = (err as Error).message;
      console.log(`✓ Erro normalizado capturado: ${msg}`);
      if (!msg.startsWith("[Asaas]")) {
        throw new Error("FAIL: Mensagem de erro do Asaas deve ser normalizada com prefixo [Asaas].");
      }
    }

    console.log("\n=================================================");
    console.log(">>> TODOS OS TESTES DA TASK 182 PASSARAM COM SUCESSO! <<<");
    console.log("=================================================");
  } finally {
    // Cleanup
    await db.billingProfile.deleteMany({
      where: { workspace: { slug: "test-asaas-sync-ws" } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: "test-asaas-sync-ws" },
    });
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRO NO TESTE DE PAYMENT PROVIDER CONTRACT & CUSTOMER SYNC:", err);
    process.exit(1);
  });
