import { prisma } from "../../src/lib/prisma";
import { CouponService } from "../../src/lib/coupons";
import { PlanHistoryService } from "../../src/lib/plan-history";

async function main() {
  console.log("=== INICIANDO TESTE INTEGRADO TASK 294: CUPOM NO CADASTRO & CHECKOUT ===");

  const timestamp = Date.now();
  const testEmail = `user.test294.${timestamp}@example.com`;
  const couponCode = `TASK294_${timestamp}`;
  const baseOnlyCouponCode = `BASEONLY_${timestamp}`;

  // 1. Obter um plano pago (ex: influencer ou pro)
  const paidPlan = await prisma.plan.findFirst({
    where: {
      active: true,
      price: { gt: 30 },
    },
  });

  if (!paidPlan) {
    throw new Error("Nenhum plano pago encontrado no banco de dados.");
  }

  const originalPrice = Number(paidPlan.price);
  const promoPrice = 19.90;
  console.log(`[1] Plano selecionado: "${paidPlan.name}" (Slug: ${paidPlan.slug}, Preço Original: R$ ${originalPrice})`);

  // 2. Criar cupom para Cliente Novo (NEW)
  const newCustomerCoupon = await prisma.coupon.create({
    data: {
      code: couponCode,
      name: "Promoção Task 294 Novos Clientes",
      description: "R$ 19,90 nos primeiros 3 meses",
      discountType: "FIXED_PRICE",
      discountValue: promoPrice,
      durationMonths: 3,
      customerType: "NEW",
      active: true,
      plans: {
        create: {
          planId: paidPlan.id,
        },
      },
    },
    include: { plans: true },
  });

  console.log(`[2] Cupom criado para Cliente Novo: ${newCustomerCoupon.code}`);

  // 3. Criar cupom exclusivo para Cliente Base (BASE)
  const baseCoupon = await prisma.coupon.create({
    data: {
      code: baseOnlyCouponCode,
      name: "Promoção Exclusiva Base",
      discountType: "PERCENTAGE",
      discountValue: 20,
      durationMonths: 1,
      customerType: "BASE",
      active: true,
      plans: {
        create: {
          planId: paidPlan.id,
        },
      },
    },
  });

  console.log(`[3] Cupom exclusivo para Cliente Base criado: ${baseCoupon.code}`);

  // 4. Testar validação de cupom para Cliente Novo
  const valSuccess = await CouponService.validateCouponForTarget({
    code: couponCode,
    planId: paidPlan.id,
    planSlug: paidPlan.slug,
    customerTypeContext: "NEW",
    reqPath: "/api/billing/coupons/validate",
  });

  if (!valSuccess.valid || !valSuccess.pricing) {
    throw new Error(`Falha ao validar cupom para cliente novo: ${valSuccess.valid ? "" : valSuccess.error}`);
  }

  const discountedAmount = valSuccess.pricing.discountedAmount.toNumber();
  const originalAmount = valSuccess.pricing.originalAmount.toNumber();

  console.log(`[4] Validação do cupom ${couponCode} bem-sucedida:`);
  console.log(`    - Valor Original: R$ ${originalAmount}`);
  console.log(`    - Valor Promocional: R$ ${discountedAmount}`);
  console.log(`    - Duração: ${valSuccess.durationLabel}`);

  if (discountedAmount !== promoPrice) {
    throw new Error(`Preço com desconto incorreto. Esperado ${promoPrice}, obteve ${discountedAmount}`);
  }

  // 5. Testar rejeição de cupom BASE para contexto NEW
  const valBaseRejected = await CouponService.validateCouponForTarget({
    code: baseOnlyCouponCode,
    planId: paidPlan.id,
    planSlug: paidPlan.slug,
    customerTypeContext: "NEW",
    reqPath: "/api/billing/coupons/validate",
  });

  if (valBaseRejected.valid) {
    throw new Error("Cupom BASE não deveria ser válido para contexto NEW!");
  }

  console.log(`[5] Cupom BASE rejeitado corretamente para contexto NEW: "${valBaseRejected.error}"`);

  // 6. Criar workspace de teste simulando cadastro
  const testWorkspace = await prisma.workspace.create({
    data: {
      name: `Workspace Task 294 ${timestamp}`,
      slug: `ws-294-${timestamp}`,
    },
  });

  // Grava evento inicial ACCOUNT_CREATED
  await PlanHistoryService.recordEvent({
    workspaceId: testWorkspace.id,
    newPlanId: paidPlan.id,
    newPlanName: paidPlan.name,
    eventType: "ACCOUNT_CREATED",
    billingCycle: "MONTHLY",
    originalAmount: 0,
    chargedAmount: 0,
    notes: `Conta e Workspace criados por ${testEmail}`,
  });

  console.log(`[6] Workspace de teste criado: ${testWorkspace.id}`);

  // 7. Simular fluxo de checkout com cupom aplicado
  const asaasSubId = `sub_mock_294_${timestamp}`;

  // Cria CheckoutSession
  const checkoutSession = await prisma.billingCheckoutSession.create({
    data: {
      workspaceId: testWorkspace.id,
      planId: paidPlan.id,
      cycle: "MONTHLY",
      billingMethod: "CREDIT_CARD",
      amount: discountedAmount,
      originalAmount: originalAmount,
      couponId: newCustomerCoupon.id,
      couponCode: newCustomerCoupon.code,
      status: "PENDING",
    },
  });
  console.log(`Checkout session criada: ${checkoutSession.id}`);

  // Cria/Atualiza Subscription com dados do cupom
  const sub = await prisma.subscription.create({
    data: {
      workspaceId: testWorkspace.id,
      planId: paidPlan.id,
      pendingPlanId: paidPlan.id,
      status: "INCOMPLETE",
      asaasSubscriptionId: asaasSubId,
      providerSubscriptionId: asaasSubId,
      billingCycle: "MONTHLY",
      billingMethod: "CREDIT_CARD",
      amount: discountedAmount,
      originalPlanAmount: originalAmount,
      discountedAmount: discountedAmount,
      couponId: newCustomerCoupon.id,
      discountDurationMonths: newCustomerCoupon.durationMonths,
      discountCyclesUsed: 0,
    },
  });

  // Cria CouponRedemption
  const redemption = await prisma.couponRedemption.create({
    data: {
      couponId: newCustomerCoupon.id,
      workspaceId: testWorkspace.id,
      planId: paidPlan.id,
      originalAmount: originalAmount,
      discountedAmount: discountedAmount,
      durationMonths: newCustomerCoupon.durationMonths,
      cyclesUsed: 0,
      status: "ACTIVE",
      appliedAt: new Date(),
    },
  });

  await prisma.coupon.update({
    where: { id: newCustomerCoupon.id },
    data: { usedCount: { increment: 1 } },
  });

  // Registra eventos no histórico de planos
  await PlanHistoryService.recordEvent({
    workspaceId: testWorkspace.id,
    newPlanId: paidPlan.id,
    newPlanName: paidPlan.name,
    eventType: "CHECKOUT_STARTED",
    billingCycle: "MONTHLY",
    originalAmount,
    chargedAmount: discountedAmount,
    couponId: newCustomerCoupon.id,
    couponCode: newCustomerCoupon.code,
    discountDurationMonths: newCustomerCoupon.durationMonths,
    asaasSubscriptionId: asaasSubId,
    notes: `Checkout iniciado com cupom ${newCustomerCoupon.code}`,
  });

  await PlanHistoryService.recordEvent({
    workspaceId: testWorkspace.id,
    newPlanId: paidPlan.id,
    newPlanName: paidPlan.name,
    eventType: "COUPON_APPLIED",
    billingCycle: "MONTHLY",
    originalAmount,
    chargedAmount: discountedAmount,
    couponId: newCustomerCoupon.id,
    couponCode: newCustomerCoupon.code,
    discountDurationMonths: newCustomerCoupon.durationMonths,
    asaasSubscriptionId: asaasSubId,
    notes: `Cupom ${newCustomerCoupon.code} aplicado na assinatura inicial: R$ ${discountedAmount}`,
  });

  console.log(`[7] Checkout com cupom persistido:`);
  console.log(`    - Subscription ID: ${sub.id}`);
  console.log(`    - Amount cobrado: R$ ${Number(sub.amount)}`);
  console.log(`    - Preço original guardado: R$ ${Number(sub.originalPlanAmount)}`);
  console.log(`    - Duração do desconto: ${sub.discountDurationMonths} meses`);
  console.log(`    - Resgate registrado: ${redemption.id}`);

  // 8. Verificar histórico de planos registrado
  const historyEvents = await prisma.planHistory.findMany({
    where: { workspaceId: testWorkspace.id },
    orderBy: { createdAt: "asc" },
  });

  console.log(`[8] Eventos de histórico de plano gravados: ${historyEvents.length}`);
  for (const ev of historyEvents) {
    console.log(`    - [${ev.eventType}] ${ev.newPlanName} | Original: R$ ${Number(ev.originalAmount)} | Cobrado: R$ ${Number(ev.chargedAmount)} | Cupom: ${ev.couponCode || "nenhum"}`);
  }

  if (historyEvents.length < 3) {
    throw new Error(`Esperado pelo menos 3 eventos de histórico, encontrado: ${historyEvents.length}`);
  }

  // 9. Verificar contagem de uso do cupom incrementada
  const updatedCoupon = await prisma.coupon.findUnique({
    where: { id: newCustomerCoupon.id },
  });

  console.log(`[9] Contagem de uso do cupom: ${updatedCoupon?.usedCount}`);
  if (updatedCoupon?.usedCount !== 1) {
    throw new Error(`Contagem de uso do cupom incorreta. Esperado 1, obteve ${updatedCoupon?.usedCount}`);
  }

  // Limpeza
  await prisma.planHistory.deleteMany({ where: { workspaceId: testWorkspace.id } });
  await prisma.couponRedemption.deleteMany({ where: { workspaceId: testWorkspace.id } });
  await prisma.subscription.deleteMany({ where: { workspaceId: testWorkspace.id } });
  await prisma.billingCheckoutSession.deleteMany({ where: { workspaceId: testWorkspace.id } });
  await prisma.workspace.delete({ where: { id: testWorkspace.id } });
  await prisma.couponPlan.deleteMany({ where: { couponId: { in: [newCustomerCoupon.id, baseCoupon.id] } } });
  await prisma.coupon.deleteMany({ where: { id: { in: [newCustomerCoupon.id, baseCoupon.id] } } });

  console.log("=== TESTE TASK 294 CONCLUÍDO COM SUCESSO! ===");
}

main().catch((err) => {
  console.error("ERRO NO TESTE TASK 294:", err);
  process.exit(1);
});
