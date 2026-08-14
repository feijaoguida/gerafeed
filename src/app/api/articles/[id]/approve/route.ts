import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishArticleToWordPress } from "@/lib/wordpress";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    try {
      const body = await request.json();
      if (typeof body?.selectedImage === "string" && ["ORIGINAL", "MODIFIED"].includes(body.selectedImage.toUpperCase())) {
        await prisma.article.update({
          where: { id },
          data: { selectedImage: body.selectedImage.toUpperCase() },
        });
      }
    } catch {
      // Body is optional
    }

    const result = await publishArticleToWordPress(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/articles/[id]/approve error:", error);
    const message = error instanceof Error ? error.message : "Erro ao aprovar e publicar notícia no WordPress";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
