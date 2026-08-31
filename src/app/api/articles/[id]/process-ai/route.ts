import { NextResponse } from "next/server";
import { processArticleWithAi, applyAiResultToArticle } from "@/lib/ai";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { BillingService } from "@/lib/billing";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const force = Boolean(body?.force);
    const existingAiResult = body?.aiResult;

    // If the user chooses "Processar mesmo assim" and aiResult was already generated,
    // apply it directly to save AI provider credits and eliminate redundant processing delay.
    if (force && existingAiResult && typeof existingAiResult === "object") {
      const result = await applyAiResultToArticle(id, existingAiResult, workspaceId);
      return NextResponse.json(result);
    }

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

    const result = await processArticleWithAi(id, workspaceId, { force });

    if (!result.success && result.notRelevant) {
      return NextResponse.json(result, { status: 422 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const resolvedParams = await params;
    console.error(`POST /api/articles/${resolvedParams.id}/process-ai error:`, error);
    const message = error instanceof Error ? error.message : "Erro ao processar notícia com IA";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
