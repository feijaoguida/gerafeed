import { AIProvider, AIProviderConfig } from "./types";
import { OpenAIProvider } from "./providers/openai";
import { GeminiProvider } from "./providers/gemini";
import { AnthropicProvider } from "./providers/anthropic";
import { OpenAICompatibleProvider } from "./providers/openai-compatible";

/**
 * Factory function to instantiate the correct AIProvider based on configuration.
 */
export function createAIProvider(config: AIProviderConfig): AIProvider {
  if (!config || !config.provider) {
    throw new Error("Configuração de provedor de IA inválida.");
  }

  switch (config.provider) {
    case "openai":
      return new OpenAIProvider(config);
    case "gemini":
      return new GeminiProvider(config);
    case "anthropic":
      return new AnthropicProvider(config);
    case "openai-compatible":
      return new OpenAICompatibleProvider(config);
    default:
      throw new Error(`Provedor de IA '${(config as { provider: string }).provider}' não suportado.`);
  }
}
