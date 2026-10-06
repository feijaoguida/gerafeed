import { getConfig, DEFAULT_WORKSPACE_ID } from "@/lib/config";
import { decrypt } from "@/lib/crypto";
import {
  ImageSettingsStored,
  ImageCredentialsResolved,
  ImageProviderType,
} from "./types";
import { AIProviderConfigStored } from "../ai/service";

/**
 * Resolves the active image provider credentials for a specific workspace.
 * Follows the user specification:
 * - If useSameKeyAsTextAi === true:
 *   - OpenAI -> inherits same key, provider "openai", model "dall-e-3"
 *   - Gemini -> inherits same key, provider "gemini", model "imagen-3.0-generate-002"
 *   - OpenRouter/OpenAI-Compatible -> inherits same key, provider "openrouter", model "black-forest-labs/flux-1-schnell"
 *   - Anthropic -> cannot inherit (Claude does not generate images); throws friendly error unless customApiKey is configured
 * - If useSameKeyAsTextAi === false:
 *   - Uses customApiKey and imageProvider configured in ImageSettings
 */
export async function resolveImageCredentials(
  workspaceId: string = DEFAULT_WORKSPACE_ID
): Promise<ImageCredentialsResolved> {
  const imageSettings = await getConfig<ImageSettingsStored>("imageSettings", workspaceId);
  const textAiConfig = await getConfig<AIProviderConfigStored>("aiProvider", workspaceId);

  const activeTextProvider = textAiConfig?.provider || "openai";
  const useSameKey = imageSettings?.useSameKeyAsTextAi !== false;

  // 1. If user opted for dedicated key or if text provider is Anthropic (which lacks image generation)
  if (!useSameKey || activeTextProvider === "anthropic") {
    let dedicatedKey = "";
    if (imageSettings?.customApiKey) {
      try {
        dedicatedKey = decrypt(imageSettings.customApiKey);
      } catch (err) {
        console.error("Erro ao descriptografar customApiKey de imagem:", err);
      }
    }

    if (!dedicatedKey && activeTextProvider === "anthropic") {
      throw new Error(
        "A Anthropic (Claude) não possui API de geração de imagens. Para gerar imagens com IA, configure uma chave de API para OpenAI, Gemini ou OpenRouter em Configurações > Imagens."
      );
    }

    if (dedicatedKey) {
      const provider: ImageProviderType = imageSettings?.imageProvider || "openai";
      let defaultModel = "dall-e-3";
      if (provider === "gemini") defaultModel = "imagen-3.0-generate-002";
      if (provider === "openrouter") defaultModel = "black-forest-labs/flux-1-schnell";

      return {
        provider,
        apiKey: dedicatedKey,
        model: imageSettings?.customModel || defaultModel,
        isInheritedFromTextAi: false,
      };
    }
  }

  // 2. Key Inheritance from active text AI
  let textApiKey = "";
  if (textAiConfig?.apiKey) {
    try {
      textApiKey = decrypt(textAiConfig.apiKey);
    } catch (err) {
      console.error("Erro ao descriptografar API Key da LLM de texto:", err);
    }
  }

  if (!textApiKey) {
    // Fallback to environment variable if available
    textApiKey = process.env.OPENAI_API_KEY || "";
  }

  if (activeTextProvider === "openai") {
    if (!textApiKey || textApiKey === "sk-...") {
      throw new Error("Nenhuma API Key válida da OpenAI encontrada para geração de imagem com DALL-E 3.");
    }
    return {
      provider: "openai",
      apiKey: textApiKey,
      model: "dall-e-3",
      isInheritedFromTextAi: true,
      inheritedTextProvider: "OpenAI",
    };
  }

  if (activeTextProvider === "gemini") {
    if (!textApiKey) {
      throw new Error("Nenhuma API Key válida do Google Gemini encontrada para geração de imagem com Imagen 3.");
    }
    return {
      provider: "gemini",
      apiKey: textApiKey,
      model: "imagen-3.0-generate-002",
      isInheritedFromTextAi: true,
      inheritedTextProvider: "Google Gemini",
    };
  }

  if (activeTextProvider === "openai-compatible") {
    if (!textApiKey) {
      throw new Error("Nenhuma API Key válida encontrada para o endpoint OpenAI-Compatible / OpenRouter.");
    }
    return {
      provider: "openrouter",
      apiKey: textApiKey,
      model: "black-forest-labs/flux.2-klein-4b",
      baseUrl: textAiConfig?.baseUrl || "https://openrouter.ai/api/v1",
      isInheritedFromTextAi: true,
      inheritedTextProvider: "OpenRouter",
    };
  }

  // Fallback to OpenAI if configured
  if (textApiKey && textApiKey !== "sk-...") {
    return {
      provider: "openai",
      apiKey: textApiKey,
      model: "dall-e-3",
      isInheritedFromTextAi: true,
      inheritedTextProvider: "OpenAI",
    };
  }

  throw new Error("Nenhuma chave de API de IA configurada para geração de imagem.");
}
