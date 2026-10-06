import { resolveImageCredentials } from "./credentials";
import { OpenAiDalleAdapter } from "./adapters/openai-dalle";
import { GoogleImagenAdapter } from "./adapters/gemini-imagen";
import { OpenRouterFluxAdapter } from "./adapters/openrouter-flux";
import {
  ImageGeneratorProvider,
  GenerateImageInput,
  GeneratedImageResult,
  ImageCredentialsResolved,
} from "./types";
import { DEFAULT_WORKSPACE_ID } from "@/lib/config";

export function createImageGenerator(credentials: ImageCredentialsResolved): ImageGeneratorProvider {
  switch (credentials.provider) {
    case "openai":
      return new OpenAiDalleAdapter(credentials.apiKey, credentials.baseUrl);
    case "gemini":
      return new GoogleImagenAdapter(credentials.apiKey, credentials.baseUrl);
    case "openrouter":
      return new OpenRouterFluxAdapter(credentials.apiKey, credentials.baseUrl);
    default:
      throw new Error(`Provedor de imagem não suportado: ${credentials.provider}`);
  }
}

export class ImageGenerationService {
  /**
   * Generates a new AI image for the given prompt and options,
   * automatically resolving workspace credentials and active provider.
   */
  static async generateImage(
    input: GenerateImageInput
  ): Promise<GeneratedImageResult> {
    const workspaceId = input.workspaceId || DEFAULT_WORKSPACE_ID;
    const credentials = await resolveImageCredentials(workspaceId);
    const generator = createImageGenerator(credentials);

    const modelToUse = credentials.model || generator.defaultModel;

    const result = await generator.generateImage(input.prompt, {
      model: modelToUse,
    });

    return {
      imageUrl: result.imageUrl,
      promptUsed: input.prompt,
      provider: generator.name,
      model: result.model,
    };
  }

  /**
   * Checks whether the current workspace has an active image provider available.
   * Does not throw, returns status and details.
   */
  static async checkProviderStatus(workspaceId: string = DEFAULT_WORKSPACE_ID): Promise<{
    available: boolean;
    provider?: string;
    isInherited?: boolean;
    error?: string;
  }> {
    try {
      const credentials = await resolveImageCredentials(workspaceId);
      return {
        available: true,
        provider: credentials.provider,
        isInherited: credentials.isInheritedFromTextAi,
      };
    } catch (err) {
      return {
        available: false,
        error: err instanceof Error ? err.message : "Erro ao resolver provedor de imagens",
      };
    }
  }
}
