import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { PublicationSyncService } from "@/lib/publisher";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const { id } = await params;

    const result = await PublicationSyncService.republishArticle(workspaceId, id);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Falha na republicação do artigo" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Artigo republicado com sucesso no WordPress com ofertas e preços sincronizados.",
      postId: result.postId,
      postUrl: result.postUrl,
    });
  } catch (error) {
    console.error("POST /api/articles/[id]/republish error:", error);
    const message = error instanceof Error ? error.message : "Erro ao republicar artigo";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
