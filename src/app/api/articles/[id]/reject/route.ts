import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionWorkspaceId } from "@/lib/workspace";

export async function POST(
  _request: Request,
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

    const updated = await prisma.article.update({
      where: { id: existing.id },
      data: { status: "REJECTED" },
    });

    return NextResponse.json({
      success: true,
      message: "Notícia rejeitada com sucesso.",
      article: updated,
    });
  } catch (error) {
    console.error("POST /api/articles/[id]/reject error:", error);
    return NextResponse.json({ error: "Erro ao rejeitar notícia" }, { status: 500 });
  }
}

