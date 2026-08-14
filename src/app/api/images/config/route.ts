import { NextResponse } from "next/server";
import { getConfig, setConfig } from "@/lib/config";

export interface ImageSettingsStored {
  defaultStrategy: "ORIGINAL" | "MODIFIED";
}

export async function GET() {
  try {
    const config = await getConfig<ImageSettingsStored>("imageSettings");

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
    const body = await request.json();
    const { defaultStrategy } = body;

    if (!defaultStrategy || !["ORIGINAL", "MODIFIED"].includes(defaultStrategy)) {
      return NextResponse.json({ error: "Estratégia de imagem inválida." }, { status: 400 });
    }

    const newConfigData: ImageSettingsStored = {
      defaultStrategy,
    };

    await setConfig("imageSettings", newConfigData);

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
