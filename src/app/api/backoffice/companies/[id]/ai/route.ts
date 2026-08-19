import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";
import { getConfig, setConfig } from "@/lib/config";
import { encrypt } from "@/lib/crypto";
import { AIProviderType, PromptSettings, DEFAULT_PROMPT_SETTINGS } from "@/lib/ai";
import { AIConfigStored } from "@/app/api/ai/config/route";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id: workspaceId } = await params;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const [aiConfig, promptSettings] = await Promise.all([
      getConfig<AIConfigStored>("aiProvider", workspaceId),
      getConfig<PromptSettings>("aiPromptSettings", workspaceId),
    ]);

    const sanitizedAi = aiConfig
      ? {
          provider: aiConfig.provider || "openai",
          model: aiConfig.model || "",
          baseUrl: aiConfig.baseUrl || "",
          hasApiKey: Boolean(aiConfig.apiKey),
          isConfigured: Boolean(aiConfig.provider && aiConfig.apiKey),
        }
      : {
          provider: "openai" as AIProviderType,
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          baseUrl: "",
          hasApiKey: Boolean(process.env.OPENAI_API_KEY),
          isConfigured: Boolean(process.env.OPENAI_API_KEY),
        };

    const promptData = promptSettings || DEFAULT_PROMPT_SETTINGS;

    return NextResponse.json({
      ai: sanitizedAi,
      prompt: promptData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar configurações de IA";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id: workspaceId } = await params;
    const body = await request.json();
    const { ai, prompt } = body;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    // 1. Process AI Provider settings if provided
    if (ai) {
      const { provider, apiKey, model, baseUrl } = ai;
      const validProviders: AIProviderType[] = ["openai", "gemini", "anthropic", "openai-compatible"];

      if (provider && !validProviders.includes(provider as AIProviderType)) {
        return NextResponse.json({ error: "Provedor de IA inválido." }, { status: 400 });
      }

      const existingAi = await getConfig<AIConfigStored>("aiProvider", workspaceId);
      let encryptedKey = existingAi?.apiKey || "";

      if (typeof apiKey === "string" && apiKey.trim()) {
        encryptedKey = encrypt(apiKey.trim());
      }

      const newConfigData: AIConfigStored = {
        provider: (provider || existingAi?.provider || "openai") as AIProviderType,
        apiKey: encryptedKey,
        model: typeof model === "string" ? model.trim() : existingAi?.model || "",
        baseUrl: typeof baseUrl === "string" ? baseUrl.trim() : existingAi?.baseUrl || "",
      };

      await setConfig("aiProvider", newConfigData, workspaceId);
    }

    // 2. Process Prompt settings if provided
    if (prompt) {
      const { portalArea, customPortalArea, writingStyles, customWritingStyle } = prompt;

      const cleanedSettings: PromptSettings = {
        portalArea: typeof portalArea === "string" ? portalArea.trim() : DEFAULT_PROMPT_SETTINGS.portalArea,
        customPortalArea: typeof customPortalArea === "string" ? customPortalArea.trim() : "",
        writingStyles: Array.isArray(writingStyles)
          ? writingStyles.map((s: string) => s.trim()).filter(Boolean)
          : DEFAULT_PROMPT_SETTINGS.writingStyles,
        customWritingStyle: typeof customWritingStyle === "string" ? customWritingStyle.trim() : "",
      };

      await setConfig("aiPromptSettings", cleanedSettings, workspaceId);
    }

    return NextResponse.json({
      success: true,
      message: "Configurações de IA e Prompts salvas com sucesso!",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao salvar configurações de IA";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
