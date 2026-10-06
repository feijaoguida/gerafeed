import { NextResponse } from "next/server";
import { getConfig, setConfig } from "@/lib/config";
import { encrypt } from "@/lib/crypto";
import { getSessionWorkspaceId } from "@/lib/workspace";
import {
  ImageSettingsStored,
  ImageStrategy,
  ImageStyle,
  ImageProviderType,
  DEFAULT_IMAGE_SETTINGS,
} from "@/lib/images/types";

export type { ImageSettingsStored };

export async function GET() {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const config = await getConfig<ImageSettingsStored>("imageSettings", workspaceId);

    // Get active text AI provider for key inheritance and UI context
    const textAiConfig = await getConfig<{
      provider?: string;
      apiKey?: string;
    }>("aiProvider", workspaceId);

    const activeTextProvider = textAiConfig?.provider || "openai";
    const textProviderSupportsImage = ["openai", "gemini", "openai-compatible"].includes(
      activeTextProvider
    );

    let inheritedImageProvider: ImageProviderType | null = null;
    let inheritedModel: string | null = null;

    if (activeTextProvider === "openai") {
      inheritedImageProvider = "openai";
      inheritedModel = "dall-e-3";
    } else if (activeTextProvider === "gemini") {
      inheritedImageProvider = "gemini";
      inheritedModel = "imagen-3.0-generate-002";
    } else if (activeTextProvider === "openai-compatible") {
      inheritedImageProvider = "openrouter";
      inheritedModel = "black-forest-labs/flux-1-schnell";
    }

    const defaultStrategy = config?.defaultStrategy || DEFAULT_IMAGE_SETTINGS.defaultStrategy;
    const imageStyle = config?.imageStyle || DEFAULT_IMAGE_SETTINGS.imageStyle;
    const customImageStyle = config?.customImageStyle || "";
    const imagePromptTemplate =
      config?.imagePromptTemplate || DEFAULT_IMAGE_SETTINGS.imagePromptTemplate;
    const useSameKeyAsTextAi =
      config?.useSameKeyAsTextAi !== undefined
        ? config.useSameKeyAsTextAi
        : activeTextProvider !== "anthropic";

    const imageProvider =
      config?.imageProvider || (useSameKeyAsTextAi && inheritedImageProvider ? inheritedImageProvider : undefined);

    const hasCustomApiKey = Boolean(config?.customApiKey);

    return NextResponse.json({
      defaultStrategy,
      imageStyle,
      customImageStyle,
      imagePromptTemplate,
      imageProvider,
      useSameKeyAsTextAi,
      hasCustomApiKey,
      customModel: config?.customModel || "",
      isConfigured: Boolean(config?.defaultStrategy),
      textAiContext: {
        activeTextProvider,
        textProviderSupportsImage,
        inheritedImageProvider,
        inheritedModel,
      },
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

    const {
      defaultStrategy,
      imageStyle,
      customImageStyle,
      imagePromptTemplate,
      imageProvider,
      useSameKeyAsTextAi,
      customApiKey,
      customModel,
    } = body;

    const validStrategies: ImageStrategy[] = ["ORIGINAL", "MODIFIED", "AI_GENERATED"];
    if (!defaultStrategy || !validStrategies.includes(defaultStrategy)) {
      return NextResponse.json({ error: "Estratégia de imagem inválida." }, { status: 400 });
    }

    const validStyles: ImageStyle[] = [
      "REALISTIC",
      "CARTOON",
      "DRAWING",
      "SATIRICAL_CARTOON",
      "CUSTOM",
    ];

    const finalStyle: ImageStyle =
      imageStyle && validStyles.includes(imageStyle) ? imageStyle : "REALISTIC";

    const existing = await getConfig<ImageSettingsStored>("imageSettings", workspaceId);

    let finalEncryptedKey = existing?.customApiKey || "";
    if (typeof customApiKey === "string" && customApiKey.trim() && !customApiKey.includes("****")) {
      finalEncryptedKey = encrypt(customApiKey.trim());
    }

    const finalUseSameKey =
      typeof useSameKeyAsTextAi === "boolean" ? useSameKeyAsTextAi : true;

    const validProviders: ImageProviderType[] = ["openai", "gemini", "openrouter"];
    const finalProvider: ImageProviderType | undefined =
      imageProvider && validProviders.includes(imageProvider) ? imageProvider : existing?.imageProvider;

    const newConfigData: ImageSettingsStored = {
      defaultStrategy,
      imageStyle: finalStyle,
      customImageStyle: typeof customImageStyle === "string" ? customImageStyle.trim() : "",
      imagePromptTemplate:
        typeof imagePromptTemplate === "string" && imagePromptTemplate.trim()
          ? imagePromptTemplate.trim()
          : DEFAULT_IMAGE_SETTINGS.imagePromptTemplate,
      imageProvider: finalProvider,
      useSameKeyAsTextAi: finalUseSameKey,
      customApiKey: finalEncryptedKey || undefined,
      customModel: typeof customModel === "string" ? customModel.trim() : undefined,
    };

    await setConfig("imageSettings", newConfigData, workspaceId);

    return NextResponse.json({
      success: true,
      message: "Configurações de imagens salvas com sucesso!",
      config: {
        defaultStrategy: newConfigData.defaultStrategy,
        imageStyle: newConfigData.imageStyle,
        customImageStyle: newConfigData.customImageStyle,
        imagePromptTemplate: newConfigData.imagePromptTemplate,
        imageProvider: newConfigData.imageProvider,
        useSameKeyAsTextAi: newConfigData.useSameKeyAsTextAi,
        hasCustomApiKey: Boolean(newConfigData.customApiKey),
        customModel: newConfigData.customModel,
      },
    });
  } catch (error) {
    console.error("POST /api/images/config error:", error);
    return NextResponse.json({ error: "Erro ao salvar configurações de imagens" }, { status: 500 });
  }
}
