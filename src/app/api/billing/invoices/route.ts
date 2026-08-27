import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const workspaceId = await getSessionWorkspaceId();
    if (!workspaceId) {
      return NextResponse.json({ error: "Não autenticado ou workspace não selecionado." }, { status: 401 });
    }

    const invoices = await prisma.invoice.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        provider: true,
        providerPaymentId: true,
        amount: true,
        billingMethod: true,
        status: true,
        dueDate: true,
        confirmedAt: true,
        receivedAt: true,
        overdueAt: true,
        refundedAt: true,
        invoiceUrl: true,
        bankSlipUrl: true,
        creditDate: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("GET /api/billing/invoices error:", error);
    const message = error instanceof Error ? error.message : "Erro ao carregar histórico de faturas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
