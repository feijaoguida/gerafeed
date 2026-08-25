import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { AffiliateService } from "@/lib/affiliate";

export async function POST(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const body = await request.json();

    const result = await AffiliateService.confirmImport(workspaceId, body);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao confirmar importação do produto.";
    const status =
      message.includes("não está habilitado") || message.includes("limite de produtos")
        ? 403
        : message.includes("obrigatór")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
