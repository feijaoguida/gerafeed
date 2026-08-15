import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishArticleToWordPress } from "@/lib/wordpress";
import { getSessionWorkspaceId } from "@/lib/workspace";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const { id } = await params;

    const existing = await prisma.article.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Notícia não encontrada" }, { status: 404 });
    }

    try {
      const body = await request.json();
      if (typeof body?.selectedImage === "string" && ["ORIGINAL", "MODIFIED"].includes(body.selectedImage.toUpperCase())) {
        await prisma.article.update({
          where: { id: existing.id },
          data: { selectedImage: body.selectedImage.toUpperCase() },
        });
      }
    } catch {
      // Body is optional
    }

    const result = await publishArticleToWordPress(existing.id, workspaceId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/articles/[id]/approve error:", error);
    const message = error instanceof Error ? error.message : "Erro ao aprovar e publicar notícia no WordPress";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

