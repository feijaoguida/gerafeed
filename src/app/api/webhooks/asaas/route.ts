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

    const { type, providerEventId, subscriptionId, paymentId, workspaceId, customerId } = eventResult;
    console.log(
      `[Asaas Webhook] Event parsed: ${type}, ProviderEventId: ${providerEventId || "N/A"}, Subscription ID: ${subscriptionId || "N/A"}, Workspace ID: ${workspaceId || "N/A"}`
    );

    // 1. Idempotency Check via ProviderWebhookEvent
    let webhookEventRecord = null;
    if (providerEventId) {
      const existingEvent = await prisma.providerWebhookEvent.findUnique({
        where: {
          provider_providerEventId: {
            provider: "asaas",
            providerEventId,
          },
        },
      });

      if (existingEvent) {
        if (existingEvent.status === "PROCESSED") {
          console.log(`[Asaas Webhook] Duplicate event detected and already processed: ${providerEventId}. Responding 200 OK.`);
          return NextResponse.json({ received: true, event: type, duplicate: true });
        }
        webhookEventRecord = existingEvent;
      } else {
        webhookEventRecord = await prisma.providerWebhookEvent.create({
          data: {
            provider: "asaas",
            providerEventId,
            eventType: type,
            resourceId: subscriptionId || paymentId || undefined,
            status: "PENDING",
            payload: JSON.stringify(body),
          },
        });
      }
    }

    try {
      // 2. Resolve Subscription in DB
      let subscription = null;
      if (subscriptionId) {
        subscription = await prisma.subscription.findFirst({
          where: { asaasSubscriptionId: subscriptionId },
          include: { plan: true },
        });
      }

      if (!subscription && workspaceId) {
        subscription = await prisma.subscription.findUnique({
          where: { workspaceId },
          include: { plan: true },
        });
      }

      if (subscription) {
        console.log(`[Asaas Webhook] Found subscription in database: ${subscription.id} (Plan: ${subscription.plan?.name || subscription.planId})`);

        if (type === "PAYMENT_CONFIRMED" || type === "PAYMENT_RECEIVED") {
          const isYearly = subscription.plan?.periodicity === "YEARLY" || subscription.billingCycle === "YEARLY";
          const daysToAdd = isYearly ? 365 : 30;

          const now = new Date();
          const baseDate =
            subscription.validUntil && subscription.validUntil > now
              ? subscription.validUntil
              : now;

          const newValidUntil = new Date(baseDate);
          newValidUntil.setDate(newValidUntil.getDate() + daysToAdd);

          const targetPlanId = subscription.pendingPlanId || subscription.planId;

          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: "ACTIVE",
              planId: targetPlanId,
              pendingPlanId: null,
              validUntil: newValidUntil,
              currentPeriodEnd: newValidUntil,
              asaasSubscriptionId: subscriptionId || subscription.asaasSubscriptionId,
              providerSubscriptionId: subscriptionId || (subscription as unknown as { providerSubscriptionId?: string }).providerSubscriptionId,
              providerCustomerId: customerId || (subscription as unknown as { providerCustomerId?: string }).providerCustomerId,
            },
          });

          console.log(`[Asaas Webhook] Subscription ${subscription.id} activated/renewed on plan ${targetPlanId} until ${newValidUntil.toISOString()} (+${daysToAdd} days).`);
        } else if (type === "PAYMENT_OVERDUE" || type === "PAYMENT_CHARGEBACK_REQUESTED") {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: "PAST_DUE" },
          });
          console.log(`[Asaas Webhook] Subscription ${subscription.id} marked as PAST_DUE due to ${type}.`);
        } else if (
          type === "SUBSCRIPTION_DELETED" ||
          type === "SUBSCRIPTION_INACTIVATED" ||
          type === "PAYMENT_DELETED" ||
          type === "PAYMENT_REFUNDED"
        ) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: "CANCELED" },
          });
          console.log(`[Asaas Webhook] Subscription ${subscription.id} marked as CANCELED due to ${type}.`);
        } else if (type === "PAYMENT_CREATED") {
          console.log(`[Asaas Webhook] Payment created for subscription ${subscription.id}. Awaiting payment.`);
        } else if (type === "SUBSCRIPTION_CREATED" || type === "SUBSCRIPTION_UPDATED") {
          if (subscriptionId && subscription.asaasSubscriptionId !== subscriptionId) {
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: {
                asaasSubscriptionId: subscriptionId,
                providerSubscriptionId: subscriptionId,
              },
            });
          }
        }
      } else {
        console.warn(`[Asaas Webhook] No matching local subscription found for subscriptionId: ${subscriptionId} or workspaceId: ${workspaceId}`);
      }

      // 3. Upsert Invoice Ledger record
      const rawPayment = (body as { payment?: Record<string, unknown> })?.payment;
      if (rawPayment && rawPayment.id) {
        const providerPaymentId = String(rawPayment.id);
        const paymentValue = typeof rawPayment.value === "number" ? rawPayment.value : Number(rawPayment.value) || 0;
        const billingMethod =
          rawPayment.billingType === "PIX"
            ? "PIX"
            : rawPayment.billingType === "BOLETO"
            ? "BOLETO"
            : "CREDIT_CARD";

        let invoiceStatus: "PENDING" | "CONFIRMED" | "RECEIVED" | "OVERDUE" | "REFUNDED" | "PARTIALLY_REFUNDED" | "CANCELED" | "FAILED" = "PENDING";
        if (type === "PAYMENT_CONFIRMED") invoiceStatus = "CONFIRMED";
        else if (type === "PAYMENT_RECEIVED") invoiceStatus = "RECEIVED";
        else if (type === "PAYMENT_OVERDUE") invoiceStatus = "OVERDUE";
        else if (type === "PAYMENT_REFUNDED") invoiceStatus = "REFUNDED";
        else if (type === "PAYMENT_PARTIALLY_REFUNDED") invoiceStatus = "PARTIALLY_REFUNDED";
        else if (type === "PAYMENT_DELETED") invoiceStatus = "CANCELED";
        else if (type === "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED") invoiceStatus = "FAILED";

        const targetWorkspaceId = workspaceId || (subscription ? subscription.workspaceId : null);

        if (targetWorkspaceId) {
          const dueDate = rawPayment.dueDate ? new Date(String(rawPayment.dueDate)) : null;
          const confirmedAt = type === "PAYMENT_CONFIRMED" || rawPayment.confirmedDate ? new Date(String(rawPayment.confirmedDate || new Date().toISOString())) : null;
          const receivedAt = type === "PAYMENT_RECEIVED" || rawPayment.paymentDate ? new Date(String(rawPayment.paymentDate || new Date().toISOString())) : null;
          const overdueAt = type === "PAYMENT_OVERDUE" ? new Date() : null;
          const refundedAt = type === "PAYMENT_REFUNDED" || type === "PAYMENT_PARTIALLY_REFUNDED" ? new Date() : null;

          await prisma.invoice.upsert({
            where: {
              provider_providerPaymentId: {
                provider: "asaas",
                providerPaymentId,
              },
            },
            update: {
              status: invoiceStatus,
              amount: paymentValue,
              billingMethod,
              subscriptionId: subscription?.id || undefined,
              dueDate: dueDate || undefined,
              confirmedAt: confirmedAt || undefined,
              receivedAt: receivedAt || undefined,
              overdueAt: overdueAt || undefined,
              refundedAt: refundedAt || undefined,
              providerStatus: String(rawPayment.status || type),
              invoiceUrl: typeof rawPayment.invoiceUrl === "string" ? rawPayment.invoiceUrl : undefined,
              bankSlipUrl: typeof rawPayment.bankSlipUrl === "string" ? rawPayment.bankSlipUrl : undefined,
              creditDate: rawPayment.creditDate ? new Date(String(rawPayment.creditDate)) : undefined,
            },
            create: {
              workspaceId: targetWorkspaceId,
              subscriptionId: subscription?.id || null,
              provider: "asaas",
              providerPaymentId,
              amount: paymentValue,
              billingMethod,
              status: invoiceStatus,
              dueDate,
              confirmedAt,
              receivedAt,
              overdueAt,
              refundedAt,
              providerStatus: String(rawPayment.status || type),
              invoiceUrl: typeof rawPayment.invoiceUrl === "string" ? rawPayment.invoiceUrl : null,
              bankSlipUrl: typeof rawPayment.bankSlipUrl === "string" ? rawPayment.bankSlipUrl : null,
              creditDate: rawPayment.creditDate ? new Date(String(rawPayment.creditDate)) : null,
            },
          });
          console.log(`[Asaas Webhook] Invoice ledger upserted: ${providerPaymentId} -> ${invoiceStatus} (R$ ${paymentValue})`);
        }
      }

      // 4. Mark Webhook Event as PROCESSED
      if (webhookEventRecord) {
        await prisma.providerWebhookEvent.update({
          where: { id: webhookEventRecord.id },
          data: {
            status: "PROCESSED",
            processedAt: new Date(),
          },
        });
      }

      return NextResponse.json({ received: true, event: type });
    } catch (processError) {
      if (webhookEventRecord) {
        await prisma.providerWebhookEvent.update({
          where: { id: webhookEventRecord.id },
          data: {
            status: "FAILED",
            errorCode: processError instanceof Error ? processError.message : String(processError),
          },
        });
      }
      throw processError;
    }
  } catch (error) {
    console.error("POST /api/webhooks/asaas error:", error);
    const message = error instanceof Error ? error.message : "Erro ao processar webhook do Asaas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
