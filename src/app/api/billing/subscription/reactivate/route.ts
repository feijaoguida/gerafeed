import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { BillingService } from "@/lib/billing";

export async function POST() {
  try {
    const workspaceId = await getSessionWorkspaceId();
    if (!workspaceId) {
      return NextResponse.json({ error: "Não autenticado ou workspace não selecionado." }, { status: 401 });
    }

    const updated = await BillingService.reactivateSubscription(workspaceId);

    return NextResponse.json({
      success: true,
      message: "Assinatura reativada com sucesso!",
      subscription: updated,
    });
  } catch (error) {
    console.error("POST /api/billing/subscription/reactivate error:", error);
    const message = error instanceof Error ? error.message : "Erro ao reativar assinatura";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
