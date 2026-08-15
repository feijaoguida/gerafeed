import { NextResponse } from "next/server";
import { processArticleWithAi } from "@/lib/ai";
import { getSessionWorkspaceId } from "@/lib/workspace";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const { id } = await params;
    const result = await processArticleWithAi(id, workspaceId);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`POST /api/articles/${(await params).id}/process-ai error:`, error);
    const message = error instanceof Error ? error.message : "Erro ao processar notícia com IA";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

