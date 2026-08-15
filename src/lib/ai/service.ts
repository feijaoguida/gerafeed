import { getConfig, DEFAULT_WORKSPACE_ID } from "@/lib/config";
import { decrypt } from "@/lib/crypto";
import { createAIProvider } from "./factory";
import { AIProvider, AIProviderConfig, AIProviderType } from "./types";

export interface AIProviderConfigStored {
  provider: AIProviderType;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

/**
 * Returns an instance of the active AIProvider for a specific workspace.
 * Reads configuration from database (decrypting apiKey server-side).
 * Falls back to OPENAI_API_KEY environment variable if no DB configuration exists.
 */
export async function getActiveAIProvider(
  overrideConfig?: Partial<AIProviderConfigStored>,
  workspaceId: string = DEFAULT_WORKSPACE_ID
): Promise<AIProvider> {
  const dbConfig = await getConfig<AIProviderConfigStored>("aiProvider", workspaceId);

  const effectiveProvider = overrideConfig?.provider || dbConfig?.provider || "openai";
  const effectiveModel = overrideConfig?.model || dbConfig?.model || undefined;
  const effectiveBaseUrl = overrideConfig?.baseUrl || dbConfig?.baseUrl || undefined;

  let plainApiKey = "";

  // 1. If override key provided (e.g. from UI input during testing)
  if (overrideConfig?.apiKey && overrideConfig.apiKey.trim()) {
    plainApiKey = overrideConfig.apiKey.trim();
  } else if (dbConfig?.apiKey) {
    // 2. Try decrypting DB key
    try {
      plainApiKey = decrypt(dbConfig.apiKey);
    } catch (err) {
      console.error("Erro ao descriptografar API Key do provedor de IA:", err);
    }
  }

  // 3. Fallback to environment variable if no key in DB or override
  if (!plainApiKey) {
    plainApiKey = process.env.OPENAI_API_KEY || "";
  }

  if (!plainApiKey || plainApiKey === "sk-...") {
    throw new Error("Nenhuma API Key válida configurada para o provedor de IA selecionado.");
  }

  const config: AIProviderConfig = {
    provider: effectiveProvider,
    apiKey: plainApiKey,
    model: effectiveModel,
    baseUrl: effectiveBaseUrl,
  };

  return createAIProvider(config);
}

/**
 * Tests connection to the active or candidate AI Provider for a specific workspace.
 */
export async function testActiveAIProviderConnection(
  overrideConfig?: Partial<AIProviderConfigStored>,
  workspaceId: string = DEFAULT_WORKSPACE_ID
) {
  const providerInstance = await getActiveAIProvider(overrideConfig, workspaceId);
  return await providerInstance.testConnection();
}

