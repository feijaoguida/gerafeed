import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";
import { getPaymentGateway } from "@/lib/payments";
import { AsaasGateway } from "@/lib/payments/asaas";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id: workspaceId } = await params;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        subscription: {
          include: { plan: true },
        },
        billingProfile: true,
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const gateway = getPaymentGateway("asaas") as AsaasGateway;
    const logs: string[] = [];

    // 1. Ensure / Sync Customer in Asaas
    let customerId = workspace.asaasCustomerId || workspace.billingProfile?.providerCustomerId;
    if (!customerId && workspace.billingProfile) {
      const custResult = await gateway.ensureCustomer({
        workspaceId: workspace.id,
        name: workspace.billingProfile.name || workspace.name,
        email: workspace.billingProfile.email,
        cpfCnpj: workspace.billingProfile.cpfCnpj,
        phone: workspace.billingProfile.mobilePhone || undefined,
      });
      customerId = custResult.customerId;
      logs.push(`Cliente sincronizado no Asaas: ${customerId}`);
    } else if (customerId) {
      logs.push(`Cliente Asaas existente: ${customerId}`);
    }

    // 2. Reconcile Subscription if ID is available
    const subscription = workspace.subscription;
    let syncedInvoicesCount = 0;

    if (subscription?.asaasSubscriptionId) {
      const asaasSub = await gateway.getSubscription(subscription.asaasSubscriptionId);
      if (asaasSub) {
        logs.push(`Assinatura Asaas encontrada: ${subscription.asaasSubscriptionId} (Status: ${asaasSub.status})`);

        let localStatus: "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" = "ACTIVE";
        if (asaasSub.status === "ACTIVE") localStatus = "ACTIVE";
        else if (asaasSub.status === "OVERDUE") localStatus = "PAST_DUE";
        else if (asaasSub.status === "INACTIVE" || asaasSub.status === "DELETED") localStatus = "CANCELED";

        const nextDueDate = asaasSub.nextDueDate ? new Date(String(asaasSub.nextDueDate)) : subscription.nextDueDate;

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: localStatus,
            nextDueDate,
            providerSubscriptionId: subscription.asaasSubscriptionId,
            providerCustomerId: (asaasSub.customer as string) || customerId || undefined,
          },
        });
        logs.push(`Status local atualizado para: ${localStatus}`);

        // Sync Payments / Invoices from Asaas
        const payments = await gateway.getSubscriptionPayments(subscription.asaasSubscriptionId);
        logs.push(`Cobranças encontradas no Asaas: ${payments.length}`);

        for (const p of payments) {
          if (!p.id) continue;
          const providerPaymentId = String(p.id);
          const paymentValue = typeof p.value === "number" ? p.value : Number(p.value) || 0;
          const billingMethod =
            p.billingType === "PIX"
              ? "PIX"
              : p.billingType === "BOLETO"
              ? "BOLETO"
              : "CREDIT_CARD";

          let invoiceStatus: "PENDING" | "CONFIRMED" | "RECEIVED" | "OVERDUE" | "REFUNDED" | "PARTIALLY_REFUNDED" | "CANCELED" | "FAILED" = "PENDING";
          if (p.status === "CONFIRMED") invoiceStatus = "CONFIRMED";
          else if (p.status === "RECEIVED") invoiceStatus = "RECEIVED";
          else if (p.status === "OVERDUE") invoiceStatus = "OVERDUE";
          else if (p.status === "REFUNDED") invoiceStatus = "REFUNDED";
          else if (p.status === "DELETED") invoiceStatus = "CANCELED";

          const dueDate = p.dueDate ? new Date(String(p.dueDate)) : null;
          const confirmedAt = p.confirmedDate ? new Date(String(p.confirmedDate)) : null;
          const receivedAt = p.paymentDate ? new Date(String(p.paymentDate)) : null;
          const overdueAt = p.status === "OVERDUE" ? new Date() : null;

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
              subscriptionId: subscription.id,
              dueDate: dueDate || undefined,
              confirmedAt: confirmedAt || undefined,
              receivedAt: receivedAt || undefined,
              overdueAt: overdueAt || undefined,
              providerStatus: String(p.status || ""),
              invoiceUrl: typeof p.invoiceUrl === "string" ? p.invoiceUrl : undefined,
              bankSlipUrl: typeof p.bankSlipUrl === "string" ? p.bankSlipUrl : undefined,
            },
            create: {
              workspaceId,
              subscriptionId: subscription.id,
              provider: "asaas",
              providerPaymentId,
              amount: paymentValue,
              billingMethod,
              status: invoiceStatus,
              dueDate,
              confirmedAt,
              receivedAt,
              overdueAt,
              providerStatus: String(p.status || ""),
              invoiceUrl: typeof p.invoiceUrl === "string" ? p.invoiceUrl : null,
              bankSlipUrl: typeof p.bankSlipUrl === "string" ? p.bankSlipUrl : null,
            },
          });
          syncedInvoicesCount++;
        }
        logs.push(`Faturas sincronizadas com sucesso: ${syncedInvoicesCount}`);
      }
    } else {
      logs.push("Nenhuma assinatura Asaas vinculada a este workspace para reconciliar.");
    }

    const updatedWorkspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        subscription: { include: { plan: true } },
        invoices: { orderBy: { createdAt: "desc" } },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Reconciliação executada com sucesso!",
      logs,
      workspace: updatedWorkspace,
    });
  } catch (error) {
    console.error("POST /api/backoffice/companies/[id]/reconcile error:", error);
    const message = error instanceof Error ? error.message : "Erro ao reconciliar cobrança com Asaas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
