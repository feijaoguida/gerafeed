import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";
import { getPaymentGateway } from "@/lib/payments";
import { CouponService } from "@/lib/coupons";
import { PlanHistoryService } from "@/lib/plan-history";
import { handleApiError } from "@/lib/errors/service";

export async function POST(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Não autenticado ou workspace não selecionado." },
        { status: 401 }
      );
    }

    const session = await auth();
    const userId = session?.user?.id || undefined;
    const userEmail = session?.user?.email || undefined;

    const body = await request.json();
    const { code } = body;

    const cleanCode = CouponService.normalizeCouponCode(code || "");
    if (!cleanCode) {
      return NextResponse.json(
        { error: "Por favor, informe o código do cupom de desconto." },
        { status: 400 }
      );
    }

    // 1. Carrega assinatura atual do workspace
    const subscription = await prisma.subscription.findUnique({
      where: { workspaceId },
      include: {
        plan: true,
      },
    });

    if (!subscription || subscription.status !== "ACTIVE") {
      return NextResponse.json(
        {
          error:
            "É necessário possuir uma assinatura ativa para aplicar um cupom de desconto.",
          code: "NO_ACTIVE_SUBSCRIPTION",
        },
        { status: 400 }
      );
    }

    const currentPlanPrice = Number(subscription.plan.price);
    if (currentPlanPrice <= 0) {
      return NextResponse.json(
        {
          error:
            "Cupons de desconto só podem ser aplicados a planos pagos. Faça o upgrade de plano primeiro.",
          code: "FREE_PLAN_NOT_ELIGIBLE",
        },
        { status: 400 }
      );
    }

    // Se já possui cupom ativo não expirado
    const hasActiveDiscount =
      subscription.couponId !== null &&
      (subscription.discountDurationMonths === 0 ||
        (subscription.discountDurationMonths !== null &&
          subscription.discountCyclesUsed < subscription.discountDurationMonths));

    if (hasActiveDiscount) {
      return NextResponse.json(
        {
          error:
            "Esta assinatura já possui um cupom promocional ativo. Aguarde o término do desconto vigente ou contate o suporte.",
          code: "COUPON_ALREADY_ACTIVE",
        },
        { status: 400 }
      );
    }

    // 2. Valida cupom para CLIENTE BASE
    const validation = await CouponService.validateCouponForTarget({
      code: cleanCode,
      planId: subscription.planId,
      planSlug: subscription.plan.slug,
      customerTypeContext: "BASE",
      workspaceId,
      userId,
      userEmail,
      reqPath: "/api/billing/coupons/apply",
    });

    if (!validation.valid || !validation.coupon || !validation.pricing) {
      return NextResponse.json(
        {
          error:
            validation.valid === false
              ? validation.error
              : "Cupom inválido para seu plano atual.",
          code: validation.valid === false ? validation.code : "INVALID_COUPON",
        },
        { status: 400 }
      );
    }

    const originalAmount = subscription.originalPlanAmount
      ? Number(subscription.originalPlanAmount)
      : currentPlanPrice;
    const discountedAmount = validation.pricing.discountedAmount.toNumber();

    // 3. Atualizar Assinatura no Asaas se existir asaasSubscriptionId
    const gateway = getPaymentGateway();
    if (subscription.asaasSubscriptionId) {
      const description =
        validation.coupon.durationMonths > 0
          ? `Cupom ${validation.coupon.code} aplicado: ${validation.coupon.durationMonths} faturas de R$ ${discountedAmount.toFixed(2)} e demais de R$ ${originalAmount.toFixed(2)}`
          : `Cupom ${validation.coupon.code} aplicado: Recorrência de R$ ${discountedAmount.toFixed(2)}`;

      const updateResult = await gateway.updateSubscription({
        subscriptionId: subscription.asaasSubscriptionId,
        value: discountedAmount,
        updatePendingPayments: true,
        description,
      });

      if (!updateResult.updated) {
        throw new Error("Falha ao atualizar valor da assinatura no Asaas.");
      }

      // Atualiza qualquer fatura PENDING local para o novo valor com desconto
      await prisma.invoice.updateMany({
        where: {
          workspaceId,
          subscriptionId: subscription.id,
          status: "PENDING",
        },
        data: {
          amount: discountedAmount,
        },
      });
    }

    // 4. Atualizar Subscription no banco de dados e registrar CouponRedemption
    await prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          couponId: validation.coupon.id,
          amount: discountedAmount,
          originalPlanAmount: originalAmount,
          discountedAmount: discountedAmount,
          discountDurationMonths: validation.coupon.durationMonths,
          discountCyclesUsed: 0,
        },
      });

      await tx.couponRedemption.create({
        data: {
          couponId: validation.coupon.id,
          workspaceId,
          userId: userId || null,
          planId: subscription.planId,
          originalAmount,
          discountedAmount,
          durationMonths: validation.coupon.durationMonths,
          cyclesUsed: 0,
          status: "ACTIVE",
          appliedAt: new Date(),
        },
      });

      await tx.coupon.update({
        where: { id: validation.coupon.id },
        data: {
          usedCount: { increment: 1 },
        },
      });
    });

    // 5. Gravar registro em PlanHistory
    await PlanHistoryService.recordEvent({
      workspaceId,
      userId: userId || null,
      userEmail: userEmail || null,
      previousPlanId: subscription.planId,
      previousPlanName: subscription.plan.name,
      newPlanId: subscription.planId,
      newPlanName: subscription.plan.name,
      eventType: "COUPON_APPLIED",
      billingCycle: subscription.billingCycle,
      originalAmount,
      chargedAmount: discountedAmount,
      couponId: validation.coupon.id,
      couponCode: validation.coupon.code,
      discountDurationMonths: validation.coupon.durationMonths,
      asaasSubscriptionId: subscription.asaasSubscriptionId,
      notes: `Cupom ${validation.coupon.code} aplicado pelo cliente em Plano & Cobrança (${validation.durationLabel})`,
    });

    return NextResponse.json({
      success: true,
      message: `Cupom "${validation.coupon.code}" aplicado com sucesso! Suas próximas faturas virão com o desconto.`,
      coupon: {
        id: validation.coupon.id,
        code: validation.coupon.code,
        name: validation.coupon.name,
        durationLabel: validation.durationLabel,
      },
      pricing: {
        originalAmount,
        discountedAmount,
        savingsPerCycle: validation.pricing.discountSaved.toNumber(),
      },
    });
  } catch (error) {
    return handleApiError(error, request, {
      module: "BILLING",
      screen: "Plano & Cobrança - Aplicar Cupom",
      userFacingMessage: "Erro ao aplicar cupom de desconto na assinatura.",
    });
  }
}
