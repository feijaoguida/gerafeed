import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { AffiliateService } from "@/lib/affiliate";

export async function POST(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const body = await request.json();
    const { affiliateUrl, providerCode } = body;

    if (!affiliateUrl || typeof affiliateUrl !== "string" || !affiliateUrl.trim()) {
      return NextResponse.json(
        { error: "A URL de afiliado é obrigatória." },
        { status: 400 }
      );
    }

    const preview = await AffiliateService.previewImport(workspaceId, {
      affiliateUrl: affiliateUrl.trim(),
      providerCode,
    });

    return NextResponse.json(preview);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao gerar preview de importação.";
    const status = message.includes("não está habilitado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
