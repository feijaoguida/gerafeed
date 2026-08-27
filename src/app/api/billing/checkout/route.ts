import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";
import { getPaymentGateway } from "@/lib/payments";
import { BillingProfileService } from "@/lib/billing-profile";
import { calculateAnnualPlanPrice } from "@/lib/pricing";

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

    const cycle = inputCycle === "YEARLY" ? "YEARLY" : "MONTHLY";
    const billingMethod = ["BOLETO", "PIX"].includes(inputMethod) ? inputMethod : "CREDIT_CARD";

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
        amount: computedAmount,
        status: "PENDING",
        successUrl: finalSuccessUrl,
        cancelUrl: finalCancelUrl,
      },
    });

    // Obtain hosted checkout URL from payment gateway
    const checkoutUrl = await gateway.getCheckoutUrl({
      workspaceId,
      planSlug: plan.slug,
      planId: plan.id,
      planName: plan.name,
      amount: computedAmount,
      cycle,
      customerId: customerResult.customerId,
      userEmail: profile.email,
      userName: profile.name,
      successUrl: `${finalSuccessUrl}&sessionId=${session.id}`,
      cancelUrl: `${finalCancelUrl}&sessionId=${session.id}`,
    });

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

    return NextResponse.json({
      success: true,
      isFree: false,
      sessionId: session.id,
      checkoutUrl,
      amount: computedAmount,
      cycle,
    });
  } catch (error) {
    console.error("POST /api/billing/checkout error:", error);
    const message = error instanceof Error ? error.message : "Erro ao iniciar checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
