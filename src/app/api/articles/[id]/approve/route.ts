import { NextResponse } from "next/server";
import { publishArticleToWordPress } from "@/lib/wordpress";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await publishArticleToWordPress(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/articles/[id]/approve error:", error);
    const message = error instanceof Error ? error.message : "Erro ao aprovar e publicar notícia no WordPress";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
