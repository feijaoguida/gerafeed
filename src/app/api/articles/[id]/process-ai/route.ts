import { NextResponse } from "next/server";
import { processArticleWithAi } from "@/lib/ai";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { BillingService } from "@/lib/billing";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const workspaceId = await getSessionWorkspaceId();

    // Check daily article limit first (stricter)
    const dailyCheck = await BillingService.checkLimit(workspaceId, "ARTICLES_DAILY");
    if (!dailyCheck.allowed) {
      return NextResponse.json(
        { error: dailyCheck.message, limitReached: true, resource: "ARTICLES_DAILY" },
        { status: 403 }
      );
    }

    // Check monthly article limit
    const monthlyCheck = await BillingService.checkLimit(workspaceId, "ARTICLES");
    if (!monthlyCheck.allowed) {
      return NextResponse.json(
        { error: monthlyCheck.message, limitReached: true, resource: "ARTICLES" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const result = await processArticleWithAi(id, workspaceId);

    if (!result.success && result.notRelevant) {
      return NextResponse.json(result, { status: 422 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(`POST /api/articles/${(await params).id}/process-ai error:`, error);
    const message = error instanceof Error ? error.message : "Erro ao processar notícia com IA";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
