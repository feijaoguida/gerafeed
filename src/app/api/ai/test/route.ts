import { NextResponse } from "next/server";
import { testActiveAIProviderConnection } from "@/lib/ai";
import { getSessionWorkspaceId } from "@/lib/workspace";

export async function POST(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    let body = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is allowed when testing already saved active config
    }

    const result = await testActiveAIProviderConnection(body, workspaceId);

    if (!result.connected) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/ai/test error:", error);
    const message = error instanceof Error ? error.message : "Erro ao testar conexão com o provedor de IA";
    return NextResponse.json({
      connected: false,
      provider: "desconhecido",
      model: "desconhecido",
      message,
    }, { status: 400 });
  }
}

