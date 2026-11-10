import { prisma } from "../../src/lib/prisma";
import { CouponService } from "../../src/lib/coupons";
import { PlanHistoryService } from "../../src/lib/plan-history";
import { SiteAntifraudService } from "../../src/lib/site-antifraud";

async function main() {
  console.log("--- TESTANDO TASK 292: GESTÃO DE CUPONS E HISTÓRICOS NO BACKOFFICE ---");

  // 1. Obter planos pagos ativos para vincular ao cupom
  const plans = await prisma.plan.findMany({
    where: { monthlyPrice: { gt: 20 } },
    take: 2,
  });
  if (plans.length === 0) {
    throw new Error("Nenhum plano pago cadastrado no banco.");
  }
  console.log(`Planos encontrados para teste: ${plans.map((p) => p.name).join(", ")}`);

  // 2. Criar cupom promocional no estilo do pedido do usuário
  // "Plano Influencer pague nos 3 primeiros meses 19,90"
  const testCode = `INFLUENCER19_${Date.now()}`;
  console.log(`\n1. Criando cupom: ${testCode}...`);

  const coupon = await prisma.coupon.create({
    data: {
      name: "Promoção Influencer R$ 19,90",
      code: testCode,
      description: "Pague R$ 19,90 nos 3 primeiros meses de assinatura",
      discountType: "FIXED_PRICE",
      discountValue: CouponService.toDecimal(19.90),
      durationMonths: 3,
      customerType: "NEW",
      active: true,
      plans: {
        create: plans.map((p) => ({
          planId: p.id,
        })),
      },
    },
    include: {
      plans: {
        include: { plan: true },
      },
      _count: {
        select: { redemptions: true },
      },
    },
  });

  console.log("Cupom criado com sucesso:", {
    id: coupon.id,
    code: coupon.code,
    durationMonths: coupon.durationMonths,
    plansCount: coupon.plans.length,
  });

  if (coupon.plans.length !== plans.length) {
    throw new Error("Múltiplos planos não foram vinculados corretamente ao cupom.");
  }

  // 3. Testar validação do cupom pelo CouponService para Novo Cliente
  const valCheck = await CouponService.validateCouponForTarget({
    code: testCode,
    planId: plans[0].id,
    customerTypeContext: "NEW",
  });
  console.log("\n2. Validação para Novo Cliente:", valCheck);
  if (!valCheck.valid || !valCheck.pricing) {
    throw new Error("Validação do cupom falhou para Novo Cliente");
  }

  // 4. Testar bloqueio se acionado por Cliente Base (pois foi configurado como customerType: NEW)
  const baseCheck = await CouponService.validateCouponForTarget({
    code: testCode,
    planId: plans[0].id,
    customerTypeContext: "BASE",
  });
  console.log("\n3. Validação para Cliente Base (deve falhar):", baseCheck);
  if (baseCheck.valid) {
    throw new Error("Cupom configurado como NEW não deveria ser aceito para BASE");
  }

  // 5. Atualizar o cupom para customerType: BOTH
  console.log("\n4. Atualizando cupom para aceitar Ambos (BOTH)...");
  const updatedCoupon = await prisma.coupon.update({
    where: { id: coupon.id },
    data: { customerType: "BOTH" },
  });
  console.log(`Cupom atualizado para customerType: ${updatedCoupon.customerType}`);

  const bothCheck = await CouponService.validateCouponForTarget({
    code: testCode,
    planId: plans[0].id,
    customerTypeContext: "BASE",
  });
  console.log("Validação após atualização para BOTH:", bothCheck.valid);
  if (!bothCheck.valid) {
    throw new Error("Cupom atualizado para BOTH deveria ser válido para BASE");
  }

  // 6. Testar Histórico de Planos do Backoffice
  console.log("\n5. Testando gravação de PlanHistory pelo Backoffice...");
  const workspace = await prisma.workspace.findFirst();
  if (workspace) {
    await PlanHistoryService.recordPlanEvent({
      workspaceId: workspace.id,
      previousPlanId: plans[0].id,
      previousPlanName: plans[0].name,
      newPlanId: plans[0].id,
      newPlanName: plans[0].name,
      eventType: "BACKOFFICE_UPDATE",
      originalAmount: 89.90,
      chargedAmount: 19.90,
      couponCode: testCode,
      discountDurationMonths: 3,
      notes: "Teste de alteração manual pelo SuperAdmin no Backoffice",
    });

    const history = await PlanHistoryService.getWorkspacePlanHistory(workspace.id, 5);
    const hasBackofficeUpdate = history.some((h) => h.eventType === "BACKOFFICE_UPDATE");
    console.log("Histórico gravado no Backoffice:", hasBackofficeUpdate ? "OK" : "Falhou");
    if (!hasBackofficeUpdate) {
      throw new Error("PlanHistory não registrou BACKOFFICE_UPDATE");
    }
  }

  // 7. Testar Liberação de Suporte de Domínio
  console.log("\n6. Testando liberação de suporte de domínio...");
  const testDomain = `suporte-test-${Date.now()}.com.br`;
  // Registra um bloqueio
  await prisma.siteRegistrationHistory.create({
    data: {
      normalizedDomain: testDomain,
      rawUrl: `https://${testDomain}`,
      workspaceId: workspace?.id || "ws-test",
      attemptNumber: 3,
      status: "BLOCKED",
    },
  });

  const clearedCount = await SiteAntifraudService.clearDomainForWorkspace(
    testDomain,
    workspace?.id || "ws-test"
  );
  console.log(`Domínios liberados pelo suporte: ${clearedCount.count}`);
  if (clearedCount.count === 0) {
    throw new Error("Liberação de domínio pelo suporte não alterou registros");
  }

  // Limpeza
  await prisma.couponPlan.deleteMany({ where: { couponId: coupon.id } });
  await prisma.coupon.delete({ where: { id: coupon.id } });
  await prisma.siteRegistrationHistory.deleteMany({ where: { normalizedDomain: testDomain } });

  console.log("\n✅ TASK 292 VALIDADA COM 100% DE SUCESSO!");
}

main()
  .catch((err) => {
    console.error("❌ Falha no teste da Task 292:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
