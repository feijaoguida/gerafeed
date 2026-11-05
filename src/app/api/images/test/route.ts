import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { ImageGenerationService } from "@/lib/images";

export async function POST() {
  try {
    const workspaceId = await getSessionWorkspaceId();
    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: "Não autorizado." },
        { status: 401 }
      );
    }

    const testPrompt =
      "A clean editorial photo of a cup of coffee on a rustic wooden desk, warm morning light, minimalist aesthetic, 8k resolution";

    const result = await ImageGenerationService.generateImage({
      prompt: testPrompt,
      workspaceId,
      style: "REALISTIC",
    });

    return NextResponse.json({
      success: true,
      provider: result.provider,
      model: result.model,
      imageUrl: result.imageUrl,
      message: `Imagem gerada com sucesso via ${result.provider} (${result.model})!`,
    });
  } catch (error) {
    console.error("POST /api/images/test error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao testar geração de imagem com o provedor configurado.";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 400 }
    );
  }
}
