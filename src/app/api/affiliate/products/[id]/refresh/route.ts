import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { ProductRefreshService } from "@/lib/affiliate";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const workspaceId = await getSessionWorkspaceId();
    const body = await request.json().catch(() => ({}));

    const result = await ProductRefreshService.refreshProduct(
      workspaceId,
      id,
      body
    );
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar ofertas do produto.";
    const status =
      message.includes("não está habilitado")
        ? 403
        : message.includes("não encontrado")
        ? 404
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
