import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/superadmin";
import { AffiliatePromptTemplateService } from "@/lib/affiliate/prompt-template-service";
import { CommercialArticleType } from "@/lib/affiliate/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    await requireSuperAdmin();
    const { type } = await params;
    const history = await AffiliatePromptTemplateService.getGlobalTemplateHistory(
      type as CommercialArticleType
    );
    return NextResponse.json(history);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar histórico do template";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
