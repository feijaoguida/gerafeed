import { NextResponse } from "next/server";
import { requireAffiliateWorkspace } from "@/lib/affiliate/request-auth";
import { AffiliateContentError } from "@/lib/affiliate/block-contract";
import { AffiliateService } from "@/lib/affiliate";

export async function POST(request: Request) {
  try {
    const workspaceId = await requireAffiliateWorkspace();
    const body = await request.json();

    const result = await AffiliateService.confirmImport(workspaceId, body);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao confirmar importação do produto.";
    const status = error instanceof AffiliateContentError ? error.status :
      message.includes("não está habilitado") || message.includes("limite de produtos")
        ? 403
        : message.includes("obrigatór")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
