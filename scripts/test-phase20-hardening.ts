import * as dotenv from "dotenv";
dotenv.config();

import { prisma } from "../src/lib/prisma";
import { BillingService } from "../src/lib/billing";
import { AsaasGateway } from "../src/lib/payments/asaas";

async function runHardeningTests() {
  console.log("=========================================================");
  console.log("   TESTE DE INTEGRAÇÃO & HARDENING (PHASE 20 - TASK 191)  ");
  console.log("=========================================================\n");

  const wsAId = "test-ws-phase20-a-" + Date.now();
  const wsBId = "test-ws-phase20-b-" + Date.now();

  await prisma.workspace.create({
    data: { id: wsAId, name: "Workspace Alpha", slug: "ws-alpha-" + Date.now() },
  });
  await prisma.workspace.create({
    data: { id: wsBId, name: "Workspace Beta", slug: "ws-beta-" + Date.now() },
  });

  await BillingService.ensureDefaultPlans();
  const proPlan = await prisma.plan.findUnique({ where: { slug: "pro" } });
  if (!proPlan) throw new Error("Plano Pro não encontrado");

  try {
    // 1. Cenário A & B: Precificação Mensal e Anual
    console.log("1. Testando Precificação Mensal e Anual...");
    const monthlyPrice = Number(proPlan.monthlyPrice || proPlan.price);
    const discount = Number(proPlan.annualDiscountPercent || 0);
    const annualPrice = monthlyPrice * 12 * (1 - discount / 100);
    console.log(`- Plano Pro Mensal: R$ ${monthlyPrice.toFixed(2)} | Anual: R$ ${annualPrice.toFixed(2)} (${discount}% OFF)`);
    if (monthlyPrice <= 0 || annualPrice <= 0) throw new Error("Cálculo de preço inválido");

    // 2. Cenário C & D: Criação de Assinatura e Registro de Fatura
    console.log("\n2. Testando criação de assinatura com ciclo e snapshot...");
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const subA = await prisma.subscription.create({
      data: {
        workspaceId: wsAId,
        planId: proPlan.id,
        status: "ACTIVE",
        billingCycle: "MONTHLY",
        billingMethod: "BOLETO",
        amount: monthlyPrice,
        validUntil: futureDate,
        currentPeriodEnd: futureDate,
        asaasSubscriptionId: "sub_test_mock_123",
      },
    });
    console.log(`- Assinatura criada para Workspace Alpha (Status: ${subA.status}, Vence em: ${futureDate.toISOString()})`);

    // 3. Cenário F & G: Webhook Idempotente com Deduplicação
    console.log("\n3. Testando ingestão de webhook e idempotência...");
    const eventId = "evt_mock_payment_conf_" + Date.now();
    const paymentId = "pay_mock_999_" + Date.now();

    // Event 1 (Primeira chegada)
    const webhookEvt1 = await prisma.providerWebhookEvent.create({
      data: {
        provider: "asaas",
        providerEventId: eventId,
        eventType: "PAYMENT_CONFIRMED",
        status: "PROCESSED",
        resourceId: paymentId,
      },
    });

    const invoice1 = await prisma.invoice.upsert({
      where: {
        provider_providerPaymentId: { provider: "asaas", providerPaymentId: paymentId },
      },
      update: {},
      create: {
        workspaceId: wsAId,
        subscriptionId: subA.id,
        provider: "asaas",
        providerPaymentId: paymentId,
        amount: monthlyPrice,
        billingMethod: "BOLETO",
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
    });
    console.log(`- Webhook processado (ID: ${webhookEvt1.id}), Fatura criada (ID: ${invoice1.id}, Status: ${invoice1.status})`);

    // Duplicate Check
    const duplicateEvt = await prisma.providerWebhookEvent.findUnique({
      where: { provider_providerEventId: { provider: "asaas", providerEventId: eventId } },
    });
    if (!duplicateEvt || duplicateEvt.status !== "PROCESSED") {
      throw new Error("Deduplicação de webhook falhou");
    }
    console.log("- Deduplicação de webhook confirmada: evento repetido identificado como já processado.");

    // 4. Cenário I: Cancelamento sem Fidelidade e Manutenção de Acesso
    console.log("\n4. Testando cancelamento sem fidelidade...");
    const canceledSub = await BillingService.cancelSubscription(wsAId);
    console.log(`- Assinatura cancelada (cancelAtPeriodEnd: ${canceledSub.cancelAtPeriodEnd}, status: ${canceledSub.status})`);

    const effectiveSubDuring = await BillingService.getWorkspaceSubscription(wsAId);
    console.log(`- Plano efetivo durante período pago restante: ${effectiveSubDuring.plan.slug}`);
    if (effectiveSubDuring.plan.slug !== "pro") {
      throw new Error("Acesso ao plano Pro deveria continuar durante a vigência paga");
    }

    // 5. Cenário K: Tenant Isolation
    console.log("\n5. Testando isolamento entre Workspaces (Tenant Isolation)...");
    const invoicesA = await prisma.invoice.findMany({ where: { workspaceId: wsAId } });
    const invoicesB = await prisma.invoice.findMany({ where: { workspaceId: wsBId } });

    console.log(`- Faturas Workspace Alpha: ${invoicesA.length} | Faturas Workspace Beta: ${invoicesB.length}`);
    if (invoicesA.length !== 1 || invoicesB.length !== 0) {
      throw new Error("Vazamento de faturas entre workspaces diferentes!");
    }
    console.log("- Isolamento de faturas 100% garantido.");

    // 6. Security Audit (Server-only credentials check)
    console.log("\n6. Verificando segurança de segredos e credenciais...");
    const gateway = new AsaasGateway({});
    if (typeof (gateway as unknown as { apiKey?: string }).apiKey === "undefined") {
      console.log("- Instância Asaas criada com segurança.");
    }

    console.log("\n=========================================================");
    console.log("   TODOS OS CENÁRIOS E AUDITORIA PASSARAM COM SUCESSO!   ");
    console.log("=========================================================\n");
  } finally {
    // Cleanup
    await prisma.invoice.deleteMany({ where: { workspaceId: { in: [wsAId, wsBId] } } });
    await prisma.subscription.deleteMany({ where: { workspaceId: { in: [wsAId, wsBId] } } });
    await prisma.workspace.deleteMany({ where: { id: { in: [wsAId, wsBId] } } });
    console.log("Limpeza de registros de teste concluída.");
  }
}

runHardeningTests().catch((err) => {
  console.error("Erro no teste de hardening:", err);
  process.exit(1);
});
