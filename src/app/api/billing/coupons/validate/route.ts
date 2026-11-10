import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CouponService } from "@/lib/coupons";
import { auth } from "@/auth";
import { logSystemError } from "@/lib/errors/service";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();
    const { code, planSlug, planId, cycle, customerTypeContext } = body;

    const cleanCode = CouponService.normalizeCouponCode(code || "");
    if (!cleanCode) {
      return NextResponse.json(
        { valid: false, error: "Por favor, digite o código do cupom." },
        { status: 400 }
      );
    }

    const resolvedContext: "NEW" | "BASE" =
      customerTypeContext === "BASE" ? "BASE" : "NEW";

    const workspaceId = session?.user?.workspaceId || undefined;
    const userId = session?.user?.id || undefined;
    const userEmail = session?.user?.email || undefined;

    // 1. Busca o cupom com seus planos vinculados
    const coupon = await prisma.coupon.findUnique({
      where: { code: cleanCode },
      include: {
        plans: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!coupon) {
      await logSystemError({
        path: "/api/billing/coupons/validate",
        module: "BILLING",
        statusCode: 404,
        workspaceId,
        userId,
        userEmail,
        errorMessage: `Tentativa de validar cupom inexistente: "${cleanCode}"`,
        query: { code: cleanCode, customerTypeContext: resolvedContext },
      });

      return NextResponse.json(
        {
          valid: false,
          error: `Cupom "${cleanCode}" não foi encontrado ou é inválido.`,
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Se o usuário estiver no /register sem plano ou com "free" e o cupom possui planos pagos
    let targetPlan = coupon.plans[0]?.plan || null;
    let suggestedPlanSlug: string | undefined;

    if (planSlug && planSlug !== "free") {
      const match = coupon.plans.find((cp) => cp.plan.slug === planSlug || cp.planId === planId);
      if (match) {
        targetPlan = match.plan;
      }
    } else if (coupon.plans.length > 0) {
      targetPlan = coupon.plans[0].plan;
      suggestedPlanSlug = targetPlan.slug;
    }

    // 2. Valida com CouponService
    const validation = await CouponService.validateCouponForTarget({
      code: cleanCode,
      planId: targetPlan?.id,
      planSlug: targetPlan?.slug,
      customerTypeContext: resolvedContext,
      workspaceId,
      userId,
      userEmail,
      reqPath: "/api/billing/coupons/validate",
    });

    if (!validation.valid) {
      return NextResponse.json(
        {
          valid: false,
          error: validation.error,
          code: validation.code,
        },
        { status: 400 }
      );
    }

    // 3. Montar resumo amigável de precificação
    const pricing = validation.pricing;
    const orig = pricing ? Number(pricing.originalAmount) : Number(targetPlan?.monthlyPrice || 0);
    const disc = pricing ? Number(pricing.discountedAmount) : 0;
    const savings = pricing ? Number(pricing.discountSaved) : 0;

    const durationLabel = CouponService.formatDurationLabel(coupon.durationMonths);

    let summaryText = "";
    if (coupon.durationMonths === 0) {
      summaryText = `R$ ${disc.toFixed(2)}/mês permanente (economia de R$ ${savings.toFixed(2)}/mês)`;
    } else if (coupon.durationMonths === 1) {
      summaryText = `R$ ${disc.toFixed(2)} no primeiro mês (depois R$ ${orig.toFixed(2)}/mês)`;
    } else {
      summaryText = `R$ ${disc.toFixed(2)}/mês nos ${coupon.durationMonths} primeiros meses (depois R$ ${orig.toFixed(2)}/mês)`;
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        durationMonths: coupon.durationMonths,
        durationLabel,
        customerType: coupon.customerType,
        plans: coupon.plans.map((cp) => ({
          id: cp.plan.id,
          name: cp.plan.name,
          slug: cp.plan.slug,
        })),
      },
      pricing: targetPlan
        ? {
            planId: targetPlan.id,
            planSlug: targetPlan.slug,
            planName: targetPlan.name,
            originalAmount: orig,
            discountedAmount: disc,
            savingsPerCycle: savings,
            cycle: cycle || "MONTHLY",
            summaryText,
          }
        : null,
      suggestedPlanSlug,
    });
  } catch (error) {
    console.error("POST /api/billing/coupons/validate error:", error);
    const message = error instanceof Error ? error.message : "Erro interno ao validar cupom.";

    await logSystemError({
      path: "/api/billing/coupons/validate",
      module: "BILLING",
      statusCode: 500,
      errorMessage: `Erro inesperado na validação de cupom: ${message}`,
      error,
    });

    return NextResponse.json(
      { valid: false, error: message, code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

