import * as dotenv from "dotenv";
dotenv.config();

import { prisma } from "../src/lib/prisma";
import { BillingService } from "../src/lib/billing";

async function main() {
  console.log("--- TESTE DE LIFECYCLE DE ASSINATURAS E ACCESS CONTROL (TASK 187) ---");

  const testWorkspaceId = "test-ws-lifecycle-" + Date.now();

  // 1. Setup workspace
  const workspace = await prisma.workspace.create({
    data: {
      id: testWorkspaceId,
      name: "Workspace Lifecycle Test",
      slug: "ws-life-test-" + Date.now(),
    },
  });
  console.log("1. Workspace criado:", workspace.id);

  // Ensure default plans exist
  await BillingService.ensureDefaultPlans();
  const proPlan = await prisma.plan.findUnique({ where: { slug: "pro" } });
  if (!proPlan) throw new Error("Plano Pro não encontrado");

  try {
    // 2. Create Active PRO subscription with validUntil +30 days
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const sub = await prisma.subscription.create({
      data: {
        workspaceId: testWorkspaceId,
        planId: proPlan.id,
        status: "ACTIVE",
        billingCycle: "MONTHLY",
        amount: 97.00,
        validUntil: futureDate,
        currentPeriodEnd: futureDate,
      },
    });
    console.log("2. Assinatura Pro criada com status ACTIVE até:", futureDate.toISOString());

    // 3. Verify access control on ACTIVE plan
    const activeSub = await BillingService.getWorkspaceSubscription(testWorkspaceId);
    console.log("3. Plano efetivo retornado:", activeSub.plan.slug);
    if (activeSub.plan.slug !== "pro") {
      throw new Error("Deveria retornar o plano Pro");
    }

    // 4. Cancel subscription without fidelity (cancelAtPeriodEnd = true)
    console.log("4. Cancelando assinatura...");
    const canceled = await BillingService.cancelSubscription(testWorkspaceId);
    console.log("Cancelamento registrado:", {
      status: canceled.status,
      cancelAtPeriodEnd: canceled.cancelAtPeriodEnd,
      canceledAt: canceled.canceledAt,
    });

    if (!canceled.cancelAtPeriodEnd || canceled.status !== "CANCELED") {
      throw new Error("Falha no cancelamento sem fidelidade");
    }

    // 5. Access should STILL be PRO because validUntil is in the future
    const subDuringPeriod = await BillingService.getWorkspaceSubscription(testWorkspaceId);
    console.log("5. Plano durante vigência paga (mesmo cancelado):", subDuringPeriod.plan.slug);
    if (subDuringPeriod.plan.slug !== "pro") {
      throw new Error("Acesso ao plano Pro deveria permanecer até o fim da vigência paga");
    }

    // 6. Test Reactivation
    console.log("6. Reativando assinatura...");
    const reactivated = await BillingService.reactivateSubscription(testWorkspaceId);
    if (reactivated.cancelAtPeriodEnd || reactivated.status !== "ACTIVE") {
      throw new Error("Falha na reativação da assinatura");
    }
    console.log("Assinatura reativada com sucesso:", reactivated.status);

    // 7. Simulate Expired Period (validUntil in the past)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: "CANCELED",
        validUntil: pastDate,
        currentPeriodEnd: pastDate,
      },
    });

    const expiredSub = await BillingService.getWorkspaceSubscription(testWorkspaceId);
    console.log("7. Plano após vigência expirada:", expiredSub.plan.slug);
    if (expiredSub.plan.slug !== "free") {
      throw new Error("Deveria fazer fallback para o plano Free após expiração da vigência");
    }

    console.log("\n--- TESTE DE LIFECYCLE CONCLUÍDO COM SUCESSO! ---");
  } finally {
    // Cleanup
    await prisma.subscription.deleteMany({ where: { workspaceId: testWorkspaceId } });
    await prisma.workspace.delete({ where: { id: testWorkspaceId } });
    console.log("Cleanup finalizado.");
  }
}

main().catch((err) => {
  console.error("Erro no teste de lifecycle:", err);
  process.exit(1);
});
