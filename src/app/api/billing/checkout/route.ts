import { NextResponse } from "next/server";
import { getAuthenticatedWorkspace, DEFAULT_WORKSPACE_ID } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";
import { getPaymentGateway } from "@/lib/payments";


export async function POST(request: Request) {
  try {
    const authData = await getAuthenticatedWorkspace();
    const workspaceId = authData?.workspaceId || DEFAULT_WORKSPACE_ID;
    const body = await request.json();
    const { planSlug } = body;

    if (!planSlug || typeof planSlug !== "string") {
      return NextResponse.json({ error: "Slug do plano é obrigatório" }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({
      where: { slug: planSlug.toLowerCase() },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plano selecionado não foi encontrado" }, { status: 404 });
    }

    // If Free plan is selected
    if (plan.price === 0) {
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

    // For paid plans, obtain checkout URL from payment gateway
    const gateway = getPaymentGateway();
    const checkoutUrl = await gateway.getCheckoutUrl({
      workspaceId,
      planSlug: plan.slug,
      userEmail: authData?.userEmail || "user@workspace.com",
      userName: authData?.userName || "Workspace User",
      successUrl: "/dashboard?checkout=success",
      cancelUrl: "/settings/billing?checkout=canceled",
    });

    return NextResponse.json({
      success: true,
      isFree: false,
      checkoutUrl,
    });
  } catch (error) {
    console.error("POST /api/billing/checkout error:", error);
    const message = error instanceof Error ? error.message : "Erro ao iniciar checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

