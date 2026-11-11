import { NextResponse } from "next/server";
import {
  processArticleWithAi,
  applyAiResultToArticle,
  isValidCompletionLevel,
  CompletionLevel,
} from "@/lib/ai";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { BillingService } from "@/lib/billing";
import { handleApiError } from "@/lib/errors/service";

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
    const completionLevel: CompletionLevel | undefined = isValidCompletionLevel(
      body?.completionLevel
    )
      ? body.completionLevel
      : undefined;

    // If the user chooses "Processar mesmo assim" and aiResult was already generated with valid content,
    // apply it directly to save AI provider credits and eliminate redundant processing delay.
    if (force && existingAiResult && typeof existingAiResult === "object") {
      const hasValidContent = Boolean(
        typeof (existingAiResult as { title?: unknown }).title === "string" &&
        (existingAiResult as { title: string }).title.trim() &&
        typeof (existingAiResult as { content?: unknown }).content === "string" &&
        (existingAiResult as { content: string }).content.trim()
      );

      if (hasValidContent) {
        const result = await applyAiResultToArticle(id, existingAiResult, workspaceId);
        return NextResponse.json(result);
      }
    }

    // Check daily and monthly article limits in parallel
    const [dailyCheck, monthlyCheck] = await Promise.all([
      BillingService.checkLimit(workspaceId, "ARTICLES_DAILY"),
      BillingService.checkLimit(workspaceId, "ARTICLES"),
    ]);

    if (!dailyCheck.allowed) {
      return NextResponse.json(
        { error: dailyCheck.message, limitReached: true, resource: "ARTICLES_DAILY" },
        { status: 403 }
      );
    }

    if (!monthlyCheck.allowed) {
      return NextResponse.json(
        { error: monthlyCheck.message, limitReached: true, resource: "ARTICLES" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const wantsStream =
      searchParams.get("stream") === "1" ||
      searchParams.get("stream") === "true" ||
      request.headers.get("accept")?.includes("text/event-stream");

    if (wantsStream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const sendEvent = (event: {
            step: string;
            progress: number;
            message: string;
            article?: unknown;
            score?: number;
          }) => {
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            } catch {
              // Client disconnected
            }
          };

          try {
            sendEvent({
              step: "loading",
              progress: 5,
              message: "Permissões validadas. Iniciando processamento...",
            });

            const result = await processArticleWithAi(id, workspaceId, {
              force: force || Boolean(completionLevel),
              completionLevel,
              onProgress: sendEvent,
            });

            if (!result.success && result.notRelevant) {
              sendEvent({
                step: "done",
                progress: 100,
                message: result.message || "Notícia com relevância abaixo da média.",
                score: result.score,
                article: result.article,
              });
            }
            controller.close();
          } catch (streamErr) {
            sendEvent({
              step: "error",
              progress: 100,
              message: streamErr instanceof Error ? streamErr.message : "Erro no processamento da notícia com IA",
            });
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    const result = await processArticleWithAi(id, workspaceId, {
      force: force || Boolean(completionLevel),
      completionLevel,
    });

    if (!result.success && result.notRelevant) {
      return NextResponse.json(result, { status: 422 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const resolvedParams = await params;
    return handleApiError(error, request, {
      module: "AI",
      screen: "Artigos / Processamento IA",
      query: { articleId: resolvedParams.id },
      userFacingMessage: "Erro ao processar notícia com IA",
    });
  }
}
