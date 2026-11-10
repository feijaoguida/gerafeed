import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";
import { getPaymentGateway } from "@/lib/payments";
import { BillingProfileService } from "@/lib/billing-profile";
import { calculateAnnualPlanPrice } from "@/lib/pricing";
import { handleApiError } from "@/lib/errors/service";
import { auth } from "@/auth";
import { CouponService } from "@/lib/coupons";
import { PlanHistoryService } from "@/lib/plan-history";

const FORBIDDEN_CARD_KEYS = [
  "cardNumber",
  "cardCvv",
  "cvv",
  "expiryMonth",
  "expiryYear",
  "cardHolder",
  "creditCard",
];

export async function POST(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    if (!workspaceId) {
      return NextResponse.json({ error: "Não autenticado ou workspace não selecionado." }, { status: 401 });
    }

    const body = await request.json();

    // Security check 1: Reject any credit card fields
    const bodyKeys = Object.keys(body || {});
    const hasCardField = bodyKeys.some((k) =>
      FORBIDDEN_CARD_KEYS.some((fk) => k.toLowerCase().includes(fk.toLowerCase()))
    );
    if (hasCardField) {
      return NextResponse.json(
        { error: "Dados de cartão de crédito não são permitidos nesta operação." },
        { status: 400 }
      );
    }

    const { planSlug, planId: inputPlanId, cycle: inputCycle, billingMethod: inputMethod, successUrl, cancelUrl } = body;

    // Resolve plan server-side
    let plan = null;
    if (inputPlanId) {
      plan = await prisma.plan.findUnique({ where: { id: inputPlanId } });
    } else if (planSlug) {
      plan = await prisma.plan.findUnique({ where: { slug: String(planSlug).toLowerCase() } });
    }

    if (!plan || !plan.active) {
      return NextResponse.json({ error: "Plano selecionado não foi encontrado ou está inativo." }, { status: 404 });
    }

    const cycle: "MONTHLY" | "YEARLY" = inputCycle === "YEARLY" ? "YEARLY" : "MONTHLY";
    const billingMethod: "CREDIT_CARD" | "BOLETO" | "PIX" = ["BOLETO", "PIX"].includes(inputMethod) ? inputMethod : "CREDIT_CARD";

    // Server-side amount computation (Never trust client amount)
    const planAny = plan as unknown as { price: number; monthlyPrice?: number | string; annualDiscountPercent?: number | string };
    const monthlyPrice = planAny.monthlyPrice !== undefined ? Number(planAny.monthlyPrice) : plan.price;
    const discountPercent = planAny.annualDiscountPercent !== undefined ? Number(planAny.annualDiscountPercent) : 0;
    const computedAmount =
      cycle === "YEARLY"
        ? calculateAnnualPlanPrice(monthlyPrice, discountPercent).toNumber()
        : monthlyPrice;

    // Free Plan activation flow
    if (computedAmount === 0) {
      await prisma.subscription.upsert({
        where: { workspaceId },
        update: {
          planId: plan.id,
          status: "ACTIVE",
        },
        create: {
          workspaceId,
          planId: plan.id,
          status: "ACTIVE",
        },
      });

      return NextResponse.json({
        success: true,
        isFree: true,
        message: "Plano gratuito ativado com sucesso!",
        url: "/dashboard",
      });
    }

    const sessionUser = await auth();
    const userId = sessionUser?.user?.id;
    const userEmail = sessionUser?.user?.email;

    // Check if Customer is NEW or BASE
    const hasPaidInvoices = await prisma.invoice.count({
      where: {
        workspaceId,
        status: { in: ["CONFIRMED", "RECEIVED"] },
      },
    });
    const customerTypeContext: "NEW" | "BASE" = hasPaidInvoices > 0 ? "BASE" : "NEW";

    let finalAmount = computedAmount;
    let originalAmount = computedAmount;
    let couponRecord: {
      id: string;
      code: string;
      name: string;
      durationMonths: number;
      durationLabel: string;
    } | null = null;
    let couponPricingSummary: string | null = null;

    if (body.couponCode && typeof body.couponCode === "string" && body.couponCode.trim()) {
      const cleanCode = CouponService.normalizeCouponCode(body.couponCode);
      const couponValidation = await CouponService.validateCouponForTarget({
        code: cleanCode,
        planId: plan.id,
        planSlug: plan.slug,
        customerTypeContext,
        workspaceId,
        userId,
        userEmail,
        reqPath: "/api/billing/checkout",
      });

      if (!couponValidation.valid) {
        return NextResponse.json(
          {
            error: couponValidation.error,
            code: couponValidation.code || "INVALID_COUPON",
          },
          { status: 400 }
        );
      }

      if (couponValidation.pricing && couponValidation.coupon) {
        finalAmount = couponValidation.pricing.discountedAmount.toNumber();
        originalAmount = couponValidation.pricing.originalAmount.toNumber();
        couponRecord = {
          id: couponValidation.coupon.id,
          code: couponValidation.coupon.code,
          name: couponValidation.coupon.name,
          durationMonths: couponValidation.coupon.durationMonths,
          durationLabel: couponValidation.durationLabel,
        };
        couponPricingSummary = `${couponRecord.code} (${couponRecord.durationLabel}) — De R$ ${originalAmount.toFixed(2)} por R$ ${finalAmount.toFixed(2)}`;
      }
    }

    // Check BillingProfile (Required before paid checkout)
    const profile = await BillingProfileService.getProfile(workspaceId);
    if (!profile || !profile.name || !profile.email || !profile.cpfCnpj) {
      return NextResponse.json(
        {
          error:
            "É necessário cadastrar os Dados de Cobrança (Nome, E-mail e CPF/CNPJ) em 'Configurações > Plano & Cobrança' antes de contratar um plano.",
          code: "BILLING_PROFILE_REQUIRED",
        },
        { status: 400 }
      );
    }

    // Customer Sync with Gateway (Idempotent)
    const gateway = getPaymentGateway();
    const customerResult = await gateway.ensureCustomer({
      workspaceId,
      name: profile.name,
      email: profile.email,
      cpfCnpj: profile.cpfCnpj,
      phone: profile.mobilePhone || undefined,
      providerCustomerId: profile.providerCustomerId || undefined,
      postalCode: profile.postalCode || undefined,
      address: profile.address || undefined,
      addressNumber: profile.addressNumber || undefined,
      complement: profile.complement || undefined,
      province: profile.province || undefined,
      city: profile.city || undefined,
      state: profile.state || undefined,
    });

    if (!customerResult || !customerResult.customerId) {
      return NextResponse.json(
        {
          error: "Não foi possível vincular ou criar os dados do cliente no gateway de pagamento.",
        },
        { status: 400 }
      );
    }

    // Create BillingCheckoutSession in DB
    const finalSuccessUrl = successUrl || "/settings/billing?checkout=success";
    const finalCancelUrl = cancelUrl || "/settings/billing?checkout=canceled";

    const dbCheckoutSession = (prisma as unknown as {
      billingCheckoutSession: {
        create: (args: unknown) => Promise<{ id: string }>;
        update: (args: unknown) => Promise<unknown>;
      };
    }).billingCheckoutSession;

    const session = await dbCheckoutSession.create({
      data: {
        workspaceId,
        planId: plan.id,
        cycle,
        billingMethod,
        amount: finalAmount,
        originalAmount: couponRecord ? originalAmount : null,
        couponId: couponRecord?.id || null,
        couponCode: couponRecord?.code || null,
        status: "PENDING",
        successUrl: finalSuccessUrl,
        cancelUrl: finalCancelUrl,
      },
    });

    // Obtain hosted checkout URL and subscription from payment gateway
    const resolvedBillingType =
      billingMethod === "PIX" ? "PIX" : billingMethod === "CREDIT_CARD" ? "CREDIT_CARD" : "BOLETO";

    const appBaseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      (process.env.NODE_ENV === "production" ? "https://www.gerafeed.com.br" : "https://www.gerafeed.com.br");

    const fullSuccessUrl = finalSuccessUrl.startsWith("http")
      ? `${finalSuccessUrl}&sessionId=${session.id}`
      : `${appBaseUrl}${finalSuccessUrl}&sessionId=${session.id}`;

    const fullCancelUrl = finalCancelUrl.startsWith("http")
      ? `${finalCancelUrl}&sessionId=${session.id}`
      : `${appBaseUrl}${finalCancelUrl}&sessionId=${session.id}`;

    const subscriptionResult = await gateway.createSubscription({
      workspaceId,
      customerId: customerResult.customerId,
      planId: plan.id,
      planSlug: plan.slug,
      planName: plan.name,
      price: finalAmount,
      billingType: resolvedBillingType,
      cycle,
      successUrl: fullSuccessUrl,
      cancelUrl: fullCancelUrl,
    });

    const checkoutUrl = subscriptionResult.paymentUrl || subscriptionResult.invoiceUrl;

    if (!checkoutUrl) {
      throw new Error("O gateway de pagamento não retornou a URL da fatura de checkout.");
    }

    // Update CheckoutSession with checkoutUrl
    await dbCheckoutSession.update({
      where: { id: session.id },
      data: {
        checkoutUrl,
        providerCheckoutId: customerResult.customerId,
      },
    });

    // Upsert subscription with pendingPlanId, asaasSubscriptionId and coupon fields
    const existingSub = await prisma.subscription.findUnique({
      where: { workspaceId },
    });

    const subscriptionData = {
      pendingPlanId: plan.id,
      asaasSubscriptionId: subscriptionResult.subscriptionId,
      providerSubscriptionId: subscriptionResult.subscriptionId,
      billingCycle: cycle,
      billingMethod,
      amount: finalAmount,
      originalPlanAmount: couponRecord ? originalAmount : null,
      discountedAmount: couponRecord ? finalAmount : null,
      couponId: couponRecord?.id || null,
      discountDurationMonths: couponRecord ? couponRecord.durationMonths : null,
      discountCyclesUsed: 0,
      annualDiscountPercentSnapshot: discountPercent,
      providerCustomerId: customerResult.customerId,
    };

    if (!existingSub) {
      await prisma.subscription.create({
        data: {
          workspaceId,
          planId: plan.id,
          status: "INCOMPLETE",
          ...subscriptionData,
        },
      });
    } else {
      await prisma.subscription.update({
        where: { id: existingSub.id },
        data: subscriptionData,
      });
    }

    // Se cupom aplicado, registra resgate e incrementa usedCount
    if (couponRecord) {
      await prisma.couponRedemption.create({
        data: {
          couponId: couponRecord.id,
          workspaceId,
          userId: userId || null,
          planId: plan.id,
          originalAmount,
          discountedAmount: finalAmount,
          durationMonths: couponRecord.durationMonths,
          cyclesUsed: 0,
          status: "ACTIVE",
          appliedAt: new Date(),
        },
      });

      await prisma.coupon.update({
        where: { id: couponRecord.id },
        data: {
          usedCount: { increment: 1 },
        },
      });
    }

    // Registra eventos no histórico de planos
    await PlanHistoryService.recordEvent({
      workspaceId,
      userId: userId || null,
      userEmail: userEmail || null,
      previousPlanId: existingSub?.planId || null,
      newPlanId: plan.id,
      newPlanName: plan.name,
      eventType: "CHECKOUT_STARTED",
      billingCycle: cycle,
      originalAmount,
      chargedAmount: finalAmount,
      couponId: couponRecord?.id || null,
      couponCode: couponRecord?.code || null,
      discountDurationMonths: couponRecord?.durationMonths || null,
      asaasSubscriptionId: subscriptionResult.subscriptionId,
      notes: couponRecord
        ? `Checkout iniciado com cupom ${couponRecord.code} (${couponPricingSummary || couponRecord.name})`
        : `Checkout iniciado para o plano ${plan.name}`,
    });

    if (couponRecord) {
      await PlanHistoryService.recordEvent({
        workspaceId,
        userId: userId || null,
        userEmail: userEmail || null,
        previousPlanId: existingSub?.planId || null,
        newPlanId: plan.id,
        newPlanName: plan.name,
        eventType: "COUPON_APPLIED",
        billingCycle: cycle,
        originalAmount,
        chargedAmount: finalAmount,
        couponId: couponRecord.id,
        couponCode: couponRecord.code,
        discountDurationMonths: couponRecord.durationMonths,
        asaasSubscriptionId: subscriptionResult.subscriptionId,
        notes: `Cupom ${couponRecord.code} aplicado na assinatura inicial: ${couponPricingSummary || couponRecord.name}`,
      });
    }

    return NextResponse.json({
      success: true,
      isFree: false,
      sessionId: session.id,
      checkoutUrl,
      amount: finalAmount,
      originalAmount: couponRecord ? originalAmount : undefined,
      coupon: couponRecord ? { code: couponRecord.code } : undefined,
      cycle,
    });
  } catch (error) {
    return handleApiError(error, request, {
      module: "BILLING",
      screen: "Checkout de Assinatura",
      userFacingMessage: "Erro ao iniciar checkout.",
    });
  }
}

