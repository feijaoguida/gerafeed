import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { ArticlePlacementService } from "@/lib/affiliate/placement-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const { id } = await params;

    const placements = await ArticlePlacementService.getArticlePlacements(
      workspaceId,
      id
    );

    return NextResponse.json(placements);
  } catch (error) {
    console.error("GET /api/articles/[id]/placements error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar placements do artigo" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const { id } = await params;
    const body = await request.json();

    if (Array.isArray(body?.placements)) {
      const synced = await ArticlePlacementService.syncPlacements(
        workspaceId,
        id,
        body.placements
      );
      return NextResponse.json(synced);
    }

    const created = await ArticlePlacementService.createPlacement(workspaceId, {
      ...body,
      articleId: id,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/articles/[id]/placements error:", error);
    const message =
      error instanceof Error ? error.message : "Erro ao salvar placement de afiliado";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
