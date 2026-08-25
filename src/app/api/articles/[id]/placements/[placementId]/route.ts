import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { ArticlePlacementService } from "@/lib/affiliate/placement-service";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; placementId: string }> }
) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const { placementId } = await params;

    await ArticlePlacementService.deletePlacement(workspaceId, placementId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/articles/[id]/placements/[placementId] error:", error);
    const message =
      error instanceof Error ? error.message : "Erro ao remover placement";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
