import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/superadmin";
import { AffiliatePromptTemplateService } from "@/lib/affiliate/prompt-template-service";

export async function PATCH(request: Request) {
  try {
    await requireSuperAdmin();
    const body = await request.json();
    const { id, active } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID do template é obrigatório." }, { status: 400 });
    }

    if (typeof active !== "boolean") {
      return NextResponse.json({ error: "Campo 'active' (booleano) é obrigatório." }, { status: 400 });
    }

    const updated = await AffiliatePromptTemplateService.setGlobalActive(id, active);
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao alterar status do template";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
