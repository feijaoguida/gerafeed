import { NextResponse } from "next/server";
import { requireAffiliateWorkspace } from "@/lib/affiliate/request-auth";
import { AffiliateContentError } from "@/lib/affiliate/block-contract";
import { AffiliateService } from "@/lib/affiliate";

export async function POST(request: Request) {
  try {
    const workspaceId = await requireAffiliateWorkspace();
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
    const status = error instanceof AffiliateContentError ? error.status : message.includes("não está habilitado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
