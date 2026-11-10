import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { BillingService } from "@/lib/billing";
import { handleApiError } from "@/lib/errors/service";

export async function POST(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    if (!workspaceId) {
      return NextResponse.json({ error: "Não autenticado ou workspace não selecionado." }, { status: 401 });
    }

    const updated = await BillingService.cancelSubscription(workspaceId);

    return NextResponse.json({
      success: true,
      message: "Renovação automática cancelada. Seu acesso permanecerá ativo até o final do período vigente.",
      subscription: updated,
    });
  } catch (error) {
    return handleApiError(error, request, {
      module: "BILLING",
      screen: "Cancelamento de Assinatura",
      userFacingMessage: "Erro ao cancelar renovação automática da assinatura.",
    });
  }
}
