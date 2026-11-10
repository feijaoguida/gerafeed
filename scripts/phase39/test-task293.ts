import { prisma } from "../../src/lib/prisma";
import { BillingService } from "../../src/lib/billing";
import { CouponService } from "../../src/lib/coupons";
import { PlanHistoryService } from "../../src/lib/plan-history";

async function main() {
  console.log("--- TESTANDO TASK 293: CICLO DE VIDA DO DESCONTO RECORRENTE NO ASAAS ---");

  // 1. Obter ou criar um plano com preço cheio (ex: R$ 89,90)
  let plan = await prisma.plan.findFirst({
    where: { slug: "influencer" },
  });

  if (!plan) {
    plan = await prisma.plan.create({
      data: {
        name: "Plano Influencer",
        slug: "influencer",
        price: 89.90,
        monthlyPrice: CouponService.toDecimal(89.90),
        periodicity: "MONTHLY",
        active: true,
      },
    });
  }

  console.log(`Plano alvo: ${plan.name} (R$ ${Number(plan.monthlyPrice).toFixed(2)}/mês)`);

  // 2. Criar cupom para os 3 primeiros meses a R$ 19,90
  const couponCode = `INF19_TEST_${Date.now()}`;
  const coupon = await prisma.coupon.create({
    data: {
      name: "Influencer 3 Meses 19,90",
      code: couponCode,
      discountType: "FIXED_PRICE",
      discountValue: CouponService.toDecimal(19.90),
      durationMonths: 3,
      customerType: "BOTH",
      active: true,
      plans: {
        create: [{ planId: plan.id }],
      },
    },
  });

  // 3. Obter um workspace para teste
  const workspace = await prisma.workspace.findFirst();
  if (!workspace) throw new Error("Nenhum workspace encontrado no banco.");

  // 4. Criar ou atualizar Subscription com o cupom aplicado (R$ 19,90 durante 3 meses)
  console.log("\n1. Criando assinatura com desconto promocional de 3 meses a R$ 19,90...");
  const mockAsaasSubId = `sub_mock_${Date.now()}`;

  const sub = await prisma.subscription.upsert({
    where: { workspaceId: workspace.id },
    update: {
      planId: plan.id,
      status: "ACTIVE",
      amount: CouponService.toDecimal(19.90),
      originalPlanAmount: CouponService.toDecimal(89.90),
      discountedAmount: CouponService.toDecimal(19.90),
      discountDurationMonths: 3,
      discountCyclesUsed: 0,
      couponId: coupon.id,
      asaasSubscriptionId: mockAsaasSubId,
    },
    create: {
      workspaceId: workspace.id,
      planId: plan.id,
      status: "ACTIVE",
      amount: CouponService.toDecimal(19.90),
      originalPlanAmount: CouponService.toDecimal(89.90),
      discountedAmount: CouponService.toDecimal(19.90),
      discountDurationMonths: 3,
      discountCyclesUsed: 0,
      couponId: coupon.id,
      asaasSubscriptionId: mockAsaasSubId,
    },
  });

  // Criar resgate do cupom
  await CouponService.recordRedemption({
    couponId: coupon.id,
    workspaceId: workspace.id,
    planId: plan.id,
    subscriptionId: sub.id,
    originalAmount: 89.90,
    discountedAmount: 19.90,
    durationMonths: 3,
  });

  // 5. Simular 1ª cobrança paga (R$ 19,90)
  console.log("\n2. Simulando 1ª fatura paga (R$ 19,90)...");
  await prisma.invoice.create({
    data: {
      workspaceId: workspace.id,
      subscriptionId: sub.id,
      provider: "asaas",
      providerPaymentId: `pay_1_${Date.now()}`,
      amount: CouponService.toDecimal(19.90),
      billingMethod: "CREDIT_CARD",
      status: "CONFIRMED",
    },
  });

  const res1 = await BillingService.evaluateSubscriptionDiscountLifecycle(sub.id, {
    eventType: "PAYMENT_CONFIRMED",
  });
  console.log("Resultado ciclo 1:", res1);
  if (res1.transitionedToOriginalPrice) {
    throw new Error("Não deveria restaurar preço no 1º ciclo");
  }

  // 6. Simular 2ª cobrança paga (R$ 19,90)
  console.log("\n3. Simulando 2ª fatura paga (R$ 19,90)...");
  await prisma.invoice.create({
    data: {
      workspaceId: workspace.id,
      subscriptionId: sub.id,
      provider: "asaas",
      providerPaymentId: `pay_2_${Date.now()}`,
      amount: CouponService.toDecimal(19.90),
      billingMethod: "CREDIT_CARD",
      status: "CONFIRMED",
    },
  });

  const res2 = await BillingService.evaluateSubscriptionDiscountLifecycle(sub.id, {
    eventType: "PAYMENT_CONFIRMED",
  });
  console.log("Resultado ciclo 2:", res2);
  if (res2.transitionedToOriginalPrice) {
    throw new Error("Não deveria restaurar preço no 2º ciclo");
  }

  // 7. Simular 3ª cobrança paga (R$ 19,90) -> FIM DO PERÍODO PROMOCIONAL!
  console.log("\n4. Simulando 3ª fatura paga (R$ 19,90 - 3º e último ciclo promocional)...");
  await prisma.invoice.create({
    data: {
      workspaceId: workspace.id,
      subscriptionId: sub.id,
      provider: "asaas",
      providerPaymentId: `pay_3_${Date.now()}`,
      amount: CouponService.toDecimal(19.90),
      billingMethod: "CREDIT_CARD",
      status: "CONFIRMED",
    },
  });

  const res3 = await BillingService.evaluateSubscriptionDiscountLifecycle(sub.id, {
    eventType: "PAYMENT_CONFIRMED",
  });
  console.log("Resultado ciclo 3 (Transição para preço cheio):", res3);
  if (!res3.transitionedToOriginalPrice) {
    throw new Error("Deveria ter transitado para o preço original de R$ 89,90 no 3º ciclo");
  }

  // 8. Verificar se a Subscription foi atualizada para R$ 89,90
  const updatedSub = await prisma.subscription.findUnique({
    where: { id: sub.id },
  });
  console.log(`\nValor da assinatura atualizado no banco: R$ ${Number(updatedSub?.amount).toFixed(2)}`);
  if (Number(updatedSub?.amount) !== 89.90) {
    throw new Error(`O valor da assinatura deveria ser R$ 89,90, mas é: ${updatedSub?.amount}`);
  }

  // 9. Verificar se CouponRedemption foi marcado como COMPLETED
  const redemption = await prisma.couponRedemption.findFirst({
    where: { subscriptionId: sub.id, couponId: coupon.id },
  });
  console.log("Status da redenção do cupom:", redemption?.status, "Ciclos:", redemption?.cyclesUsed);
  if (redemption?.status !== "COMPLETED") {
    throw new Error("CouponRedemption deveria estar marcado como COMPLETED");
  }

  // 10. Verificar se o evento DISCOUNT_ENDED foi registrado em PlanHistory
  const history = await PlanHistoryService.getWorkspacePlanHistory(workspace.id, 5);
  const discountEndedEvent = history.find((h) => h.eventType === "DISCOUNT_ENDED");
  console.log("Evento DISCOUNT_ENDED encontrado no histórico:", discountEndedEvent ? "SIM" : "NÃO");
  if (!discountEndedEvent) {
    throw new Error("PlanHistory não registrou DISCOUNT_ENDED");
  }

  // Limpeza
  await prisma.invoice.deleteMany({
    where: { subscriptionId: sub.id },
  });
  await prisma.couponRedemption.deleteMany({
    where: { couponId: coupon.id },
  });
  await prisma.couponPlan.deleteMany({
    where: { couponId: coupon.id },
  });
  await prisma.coupon.delete({
    where: { id: coupon.id },
  });

  console.log("\n✅ TASK 293 VALIDADA COM 100% DE SUCESSO!");
}

main()
  .catch((err) => {
    console.error("❌ Falha no teste da Task 293:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

