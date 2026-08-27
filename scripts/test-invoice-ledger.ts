import * as dotenv from "dotenv";
dotenv.config();

import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("--- TESTE DE INVOICE LEDGER (TASK 186) ---");

  const testWorkspaceId = "test-ws-invoice-ledger-" + Date.now();
  const testPaymentId = "pay_test_ledger_" + Date.now();

  // 1. Setup temporary workspace
  const workspace = await prisma.workspace.create({
    data: {
      id: testWorkspaceId,
      name: "Workspace Invoice Ledger Test",
      slug: "ws-inv-test-" + Date.now(),
    },
  });
  console.log("1. Workspace de teste criado:", workspace.id);

  try {
    // 2. Simulate PAYMENT_CREATED -> Invoice created as PENDING
    const inv1 = await prisma.invoice.upsert({
      where: {
        provider_providerPaymentId: {
          provider: "asaas",
          providerPaymentId: testPaymentId,
        },
      },
      update: {},
      create: {
        workspaceId: testWorkspaceId,
        provider: "asaas",
        providerPaymentId: testPaymentId,
        amount: 97.00,
        billingMethod: "BOLETO",
        status: "PENDING",
        dueDate: new Date(Date.now() + 86400000 * 3),
        invoiceUrl: "https://sandbox.asaas.com/i/test12345",
      },
    });

    console.log("2. Invoice criada com status PENDING:", {
      id: inv1.id,
      amount: Number(inv1.amount),
      status: inv1.status,
      billingMethod: inv1.billingMethod,
    });

    if (inv1.status !== "PENDING" || Number(inv1.amount) !== 97) {
      throw new Error("Falha na criação inicial da Invoice");
    }

    // 3. Simulate PAYMENT_CONFIRMED -> Invoice updated to CONFIRMED
    const now = new Date();
    const inv2 = await prisma.invoice.upsert({
      where: {
        provider_providerPaymentId: {
          provider: "asaas",
          providerPaymentId: testPaymentId,
        },
      },
      update: {
        status: "CONFIRMED",
        confirmedAt: now,
      },
      create: {
        workspaceId: testWorkspaceId,
        provider: "asaas",
        providerPaymentId: testPaymentId,
        amount: 97.00,
        status: "CONFIRMED",
      },
    });

    console.log("3. Invoice atualizada para CONFIRMED:", {
      id: inv2.id,
      status: inv2.status,
      confirmedAt: inv2.confirmedAt,
    });

    if (inv2.status !== "CONFIRMED" || !inv2.confirmedAt) {
      throw new Error("Falha na transição para CONFIRMED");
    }

    // 4. Simulate PAYMENT_RECEIVED -> Invoice updated to RECEIVED
    const inv3 = await prisma.invoice.upsert({
      where: {
        provider_providerPaymentId: {
          provider: "asaas",
          providerPaymentId: testPaymentId,
        },
      },
      update: {
        status: "RECEIVED",
        receivedAt: now,
      },
      create: {
        workspaceId: testWorkspaceId,
        provider: "asaas",
        providerPaymentId: testPaymentId,
        amount: 97.00,
        status: "RECEIVED",
      },
    });

    console.log("4. Invoice atualizada para RECEIVED:", {
      id: inv3.id,
      status: inv3.status,
      receivedAt: inv3.receivedAt,
    });

    if (inv3.status !== "RECEIVED" || !inv3.receivedAt) {
      throw new Error("Falha na transição para RECEIVED");
    }

    // 5. Query invoices by workspace (Tenant isolation check)
    const list = await prisma.invoice.findMany({
      where: { workspaceId: testWorkspaceId },
    });

    console.log("5. Listagem de faturas por workspace:", list.length);
    if (list.length !== 1 || list[0].id !== inv1.id) {
      throw new Error("Falha no isolamento de faturas por workspace");
    }

    console.log("\n--- TESTE DE INVOICE LEDGER CONCLUÍDO COM SUCESSO! ---");
  } finally {
    // Cleanup test data
    await prisma.invoice.deleteMany({ where: { workspaceId: testWorkspaceId } });
    await prisma.workspace.delete({ where: { id: testWorkspaceId } });
    console.log("Cleanup do workspace de teste finalizado.");
  }
}

main().catch((err) => {
  console.error("Erro no teste de invoice ledger:", err);
  process.exit(1);
});
