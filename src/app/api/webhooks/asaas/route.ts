import { NextResponse } from "next/server";
import { getPaymentGateway } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const headersObj: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersObj[key.toLowerCase()] = value;
    });

    const body = await request.json();
    const gateway = getPaymentGateway("asaas");

    let eventResult;
    try {
      eventResult = await gateway.handleWebhook(body, headersObj);
    } catch (authError) {
      console.warn("Asaas webhook unauthorized:", authError);
      return NextResponse.json(
        { error: authError instanceof Error ? authError.message : "Não autorizado" },
        { status: 401 }
      );
    }

    const { type, subscriptionId, workspaceId } = eventResult;

    // Resolve subscription in DB
    let subscription = null;
    if (subscriptionId) {
      subscription = await prisma.subscription.findFirst({
        where: { asaasSubscriptionId: subscriptionId },
      });
    }

    if (!subscription && workspaceId) {
      subscription = await prisma.subscription.findUnique({
        where: { workspaceId },
      });
    }

    if (subscription) {
      if (type === "PAYMENT_CONFIRMED" || type === "PAYMENT_RECEIVED") {
        const now = new Date();
        const baseDate =
          subscription.validUntil && subscription.validUntil > now
            ? subscription.validUntil
            : now;

        const newValidUntil = new Date(baseDate);
        newValidUntil.setDate(newValidUntil.getDate() + 30);

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: "ACTIVE",
            validUntil: newValidUntil,
            currentPeriodEnd: newValidUntil,
            asaasSubscriptionId: subscriptionId || subscription.asaasSubscriptionId,
          },
        });
      } else if (type === "PAYMENT_OVERDUE") {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "PAST_DUE" },
        });
      } else if (type === "SUBSCRIPTION_DELETED" || type === "PAYMENT_DELETED") {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "CANCELED" },
        });
      }
    }

    return NextResponse.json({ received: true, event: type });
  } catch (error) {
    console.error("POST /api/webhooks/asaas error:", error);
    const message = error instanceof Error ? error.message : "Erro ao processar webhook do Asaas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
