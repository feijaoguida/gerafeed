import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/superadmin";
import { testActiveAIProviderConnection } from "@/lib/ai";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id: workspaceId } = await params;
    const body = await request.json().catch(() => ({}));

    const result = await testActiveAIProviderConnection(body, workspaceId);

    if (!result.connected) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao testar provedor de IA";
    return NextResponse.json({
      connected: false,
      provider: "desconhecido",
      model: "desconhecido",
      message,
    }, { status: 400 });
  }
}
