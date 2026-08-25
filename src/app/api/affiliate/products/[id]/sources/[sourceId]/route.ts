import { NextRequest, NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { ProductReferenceSourceService } from "@/lib/affiliate/reference-source-service";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; sourceId: string }> }
) {
  try {
    const { sourceId } = await context.params;
    const workspaceId = await getSessionWorkspaceId();

    await ProductReferenceSourceService.deleteReferenceSource(workspaceId, sourceId);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = (err as Error).message || "Erro ao excluir fonte de referência.";
    const status = message.includes("Não autorizado")
      ? 401
      : message.includes("não encontrada")
      ? 404
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
