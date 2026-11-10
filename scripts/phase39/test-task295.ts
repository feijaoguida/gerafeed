import { prisma } from "../../src/lib/prisma";
import { CouponService } from "../../src/lib/coupons";
import { PlanHistoryService } from "../../src/lib/plan-history";
import { BillingService } from "../../src/lib/billing";
import { getPaymentGateway } from "../../src/lib/payments";

async function main() {
  console.log("=== INICIANDO TESTE INTEGRADO TASK 295: CUPOM PARA CLIENTE BASE & HISTÓRICO ===");

  const timestamp = Date.now();
  const baseCouponCode = `BASEPROMO_${timestamp}`;
  const newOnlyCouponCode = `NEWONLY_${timestamp}`;

  // 1. Obter plano pago
  const plan = await prisma.plan.findFirst({
    where: {
      active: true,
      price: { gt: 30 },
    },
  });

  if (!plan) {
    throw new Error("Plano pago não encontrado para testes.");
  }

  const originalPrice = Number(plan.price);
  console.log(`[1] Plano selecionado: "${plan.name}" (Preço Original: R$ ${originalPrice})`);

  // 2. Criar cupom para Cliente Base (BASE) com 20% de desconto por 3 meses
  const baseCoupon = await prisma.coupon.create({
    data: {
      code: baseCouponCode,
      name: "Promoção Cliente Base 20% OFF",
      discountType: "PERCENTAGE",
      discountValue: 20,
      durationMonths: 3,
      customerType: "BASE",
      active: true,
      plans: {
        create: {
          planId: plan.id,
        },
      },
    },
  });

  // Criar cupom exclusivo para Cliente Novo (NEW)
  const newOnlyCoupon = await prisma.coupon.create({
    data: {
      code: newOnlyCouponCode,
      name: "Exclusivo Novos Clientes",
      discountType: "FIXED_PRICE",
      discountValue: 19.90,
      durationMonths: 1,
      customerType: "NEW",
      active: true,
      plans: {
        create: {
          planId: plan.id,
        },
      },
    },
  });

  console.log(`[2] Cupons criados: BASE (${baseCoupon.code}) e NEW (${newOnlyCoupon.code})`);

  // 3. Testar validação para Cliente Base
  const baseValidation = await CouponService.validateCouponForTarget({
    code: baseCouponCode,
    planId: plan.id,
    planSlug: plan.slug,
    customerTypeContext: "BASE",
    reqPath: "/api/billing/coupons/apply",
  });

  if (!baseValidation.valid || !baseValidation.pricing) {
    throw new Error(`Falha ao validar cupom BASE: ${baseValidation.valid ? "" : baseValidation.error}`);
  }

  const expectedDiscounted = Math.round(originalPrice * 0.8 * 100) / 100;
  const actualDiscounted = baseValidation.pricing.discountedAmount.toNumber();

  console.log(`[3] Validação de cupom BASE OK:`);
  console.log(`    - Original: R$ ${baseValidation.pricing.originalAmount.toNumber()}`);
  console.log(`    - Promocional: R$ ${actualDiscounted} (Esperado: R$ ${expectedDiscounted})`);

  if (Math.abs(actualDiscounted - expectedDiscounted) > 0.05) {
    throw new Error(`Cálculo de percentual incorreto. Esperado ${expectedDiscounted}, obteve ${actualDiscounted}`);
  }

  // 4. Testar rejeição de cupom NEW em contexto BASE
  const rejectedCheck = await CouponService.validateCouponForTarget({
    code: newOnlyCouponCode,
    planId: plan.id,
    planSlug: plan.slug,
    customerTypeContext: "BASE",
    reqPath: "/api/billing/coupons/apply",
  });

  if (rejectedCheck.valid) {
    throw new Error("Cupom NEW deveria ter sido rejeitado em contexto BASE!");
  }

  console.log(`[4] Rejeição de cupom NEW em contexto BASE validada: "${rejectedCheck.error}"`);

  // 5. Criar Workspace com Assinatura Ativa e Mock Asaas
  const testWorkspace = await prisma.workspace.create({
    data: {
      name: `Workspace Base ${timestamp}`,
      slug: `ws-base-${timestamp}`,
    },
  });

  const asaasSubId = `sub_mock_base_${timestamp}`;
  const subscription = await prisma.subscription.create({
    data: {
      workspaceId: testWorkspace.id,
      planId: plan.id,
      status: "ACTIVE",
      billingCycle: "MONTHLY",
      billingMethod: "CREDIT_CARD",
      amount: originalPrice,
      asaasSubscriptionId: asaasSubId,
      providerSubscriptionId: asaasSubId,
    },
  });

  console.log(`[5] Workspace e assinatura ativa criados: ${subscription.id}`);

  // 6. Aplicar cupom na assinatura existente e atualizar no Asaas
  const gateway = getPaymentGateway();
  const updateResult = await gateway.updateSubscription({
    subscriptionId: asaasSubId,
    value: actualDiscounted,
    updatePendingPayments: true,
    description: `Cupom ${baseCoupon.code} aplicado na recorrência`,
  });

  if (!updateResult.updated) {
    throw new Error("Falha ao atualizar assinatura no gateway");
  }

  console.log(`[6] Gateway Asaas atualizado com updatePendingPayments: true: R$ ${actualDiscounted}`);

  // Atualiza Subscription no DB
  const updatedSub = await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      couponId: baseCoupon.id,
      amount: actualDiscounted,
      originalPlanAmount: originalPrice,
      discountedAmount: actualDiscounted,
      discountDurationMonths: baseCoupon.durationMonths,
      discountCyclesUsed: 0,
    },
  });

  // Registra CouponRedemption
  const redemption = await prisma.couponRedemption.create({
    data: {
      couponId: baseCoupon.id,
      workspaceId: testWorkspace.id,
      planId: plan.id,
      originalAmount: originalPrice,
      discountedAmount: actualDiscounted,
      durationMonths: baseCoupon.durationMonths,
      cyclesUsed: 0,
      status: "ACTIVE",
      appliedAt: new Date(),
    },
  });

  await prisma.coupon.update({
    where: { id: baseCoupon.id },
    data: { usedCount: { increment: 1 } },
  });

  // Grava evento histórico
  await PlanHistoryService.recordEvent({
    workspaceId: testWorkspace.id,
    newPlanId: plan.id,
    newPlanName: plan.name,
    eventType: "COUPON_APPLIED",
    billingCycle: "MONTHLY",
    originalAmount: originalPrice,
    chargedAmount: actualDiscounted,
    couponId: baseCoupon.id,
    couponCode: baseCoupon.code,
    discountDurationMonths: baseCoupon.durationMonths,
    asaasSubscriptionId: asaasSubId,
    notes: `Cupom ${baseCoupon.code} aplicado em Plano & Cobrança`,
  });

  console.log(`[7] Subscription atualizada com cupom:`);
  console.log(`    - Novo Amount: R$ ${Number(updatedSub.amount)}`);
  console.log(`    - Original Plan Amount: R$ ${Number(updatedSub.originalPlanAmount)}`);
  console.log(`    - Resgate ID: ${redemption.id}`);

  // 8. Testar Cancelamento e Reativação com gravação em PlanHistory
  console.log("[8] Testando cancelamento e reativação...");
  await BillingService.cancelSubscription(testWorkspace.id);
  await BillingService.reactivateSubscription(testWorkspace.id);

  // 9. Consultar histórico completo do Workspace
  const historyList = await prisma.planHistory.findMany({
    where: { workspaceId: testWorkspace.id },
    orderBy: { createdAt: "asc" },
  });

  console.log(`[9] Total de eventos gravados em PlanHistory: ${historyList.length}`);
  for (const h of historyList) {
    console.log(`    - [${h.eventType}] ${h.newPlanName} | Original: R$ ${Number(h.originalAmount)} | Cobrado: R$ ${Number(h.chargedAmount)} | Cupom: ${h.couponCode || "nenhum"}`);
  }

  const eventTypes = historyList.map((h) => h.eventType);
  if (!eventTypes.includes("COUPON_APPLIED")) {
    throw new Error("Evento COUPON_APPLIED não encontrado no histórico!");
  }
  if (!eventTypes.includes("SUBSCRIPTION_CANCELED")) {
    throw new Error("Evento SUBSCRIPTION_CANCELED não encontrado no histórico!");
  }
  if (!eventTypes.includes("SUBSCRIPTION_REACTIVATED")) {
    throw new Error("Evento SUBSCRIPTION_REACTIVATED não encontrado no histórico!");
  }

  // Limpeza
  await prisma.planHistory.deleteMany({ where: { workspaceId: testWorkspace.id } });
  await prisma.couponRedemption.deleteMany({ where: { workspaceId: testWorkspace.id } });
  await prisma.subscription.deleteMany({ where: { workspaceId: testWorkspace.id } });
  await prisma.workspace.delete({ where: { id: testWorkspace.id } });
  await prisma.couponPlan.deleteMany({ where: { couponId: { in: [baseCoupon.id, newOnlyCoupon.id] } } });
  await prisma.coupon.deleteMany({ where: { id: { in: [baseCoupon.id, newOnlyCoupon.id] } } });

  console.log("=== TESTE TASK 295 CONCLUÍDO COM SUCESSO! ===");
}

main().catch((err) => {
  console.error("ERRO NO TESTE TASK 295:", err);
  process.exit(1);
});
