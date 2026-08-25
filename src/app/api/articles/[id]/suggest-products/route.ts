import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { AffiliateSuggestionService } from "@/lib/affiliate/ai-suggestion-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const { id } = await params;

    const suggestions = await AffiliateSuggestionService.suggestAffiliateProductsForArticle(
      workspaceId,
      id
    );

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("POST /api/articles/[id]/suggest-products error:", error);
    const message =
      error instanceof Error ? error.message : "Erro ao sugerir produtos afiliados";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
