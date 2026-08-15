import { NextResponse } from "next/server";
import { getConfig, setConfig } from "@/lib/config";
import { encrypt } from "@/lib/crypto";
import { AIProviderType } from "@/lib/ai";
import { getSessionWorkspaceId } from "@/lib/workspace";

export interface AIConfigStored {
  provider: AIProviderType;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export async function GET() {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const config = await getConfig<AIConfigStored>("aiProvider", workspaceId);

    if (!config) {
      // Fallback to env variable if no DB config
      const envKey = process.env.OPENAI_API_KEY || "";
      const envModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
      const hasEnvKey = Boolean(envKey && envKey !== "sk-...");

      return NextResponse.json({
        provider: "openai" as AIProviderType,
        model: envModel,
        baseUrl: "",
        isConfigured: hasEnvKey,
        hasApiKey: hasEnvKey,
        isFromEnv: true,
      });
    }

    return NextResponse.json({
      provider: config.provider || "openai",
      model: config.model || "",
      baseUrl: config.baseUrl || "",
      isConfigured: Boolean(config.provider && config.apiKey),
      hasApiKey: Boolean(config.apiKey),
      isFromEnv: false,
    });
  } catch (error) {
    console.error("GET /api/ai/config error:", error);
    return NextResponse.json({ error: "Erro ao buscar configurações de IA" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const body = await request.json();
    const { provider, apiKey, model, baseUrl } = body;

    const validProviders: AIProviderType[] = ["openai", "gemini", "anthropic", "openai-compatible"];
    if (!provider || !validProviders.includes(provider as AIProviderType)) {
      return NextResponse.json({ error: "Provedor de IA inválido." }, { status: 400 });
    }

    const existing = await getConfig<AIConfigStored>("aiProvider", workspaceId);
    let encryptedKey = existing?.apiKey || "";

    // If new API key is provided, encrypt it
    if (typeof apiKey === "string" && apiKey.trim()) {
      encryptedKey = encrypt(apiKey.trim());
    }

    if (!encryptedKey) {
      return NextResponse.json(
        { error: "A API Key do provedor de IA é obrigatória." },
        { status: 400 }
      );
    }

    const newConfigData: AIConfigStored = {
      provider: provider as AIProviderType,
      apiKey: encryptedKey,
      model: typeof model === "string" ? model.trim() : "",
      baseUrl: typeof baseUrl === "string" ? baseUrl.trim() : "",
    };

    await setConfig("aiProvider", newConfigData, workspaceId);

    return NextResponse.json({
      success: true,
      message: `Configurações do provedor ${provider} salvas com sucesso!`,
      config: {
        provider: newConfigData.provider,
        model: newConfigData.model,
        baseUrl: newConfigData.baseUrl,
        isConfigured: true,
        hasApiKey: true,
        isFromEnv: false,
      },
    });
  } catch (error) {
    console.error("POST /api/ai/config error:", error);
    return NextResponse.json({ error: "Erro ao salvar configurações de IA" }, { status: 500 });
  }
}

