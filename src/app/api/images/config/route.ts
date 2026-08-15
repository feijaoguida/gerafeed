import { NextResponse } from "next/server";
import { getConfig, setConfig } from "@/lib/config";
import { getSessionWorkspaceId } from "@/lib/workspace";

export interface ImageSettingsStored {
  defaultStrategy: "ORIGINAL" | "MODIFIED";
}

export async function GET() {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const config = await getConfig<ImageSettingsStored>("imageSettings", workspaceId);

    return NextResponse.json({
      defaultStrategy: config?.defaultStrategy || "ORIGINAL",
      isConfigured: Boolean(config?.defaultStrategy),
    });
  } catch (error) {
    console.error("GET /api/images/config error:", error);
    return NextResponse.json({ error: "Erro ao buscar configurações de imagem" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const body = await request.json();
    const { defaultStrategy } = body;

    if (!defaultStrategy || !["ORIGINAL", "MODIFIED"].includes(defaultStrategy)) {
      return NextResponse.json({ error: "Estratégia de imagem inválida." }, { status: 400 });
    }

    const newConfigData: ImageSettingsStored = {
      defaultStrategy,
    };

    await setConfig("imageSettings", newConfigData, workspaceId);

    return NextResponse.json({
      success: true,
      message: "Configurações de imagens salvas com sucesso!",
      config: newConfigData,
    });
  } catch (error) {
    console.error("POST /api/images/config error:", error);
    return NextResponse.json({ error: "Erro ao salvar configurações de imagens" }, { status: 500 });
  }
}

