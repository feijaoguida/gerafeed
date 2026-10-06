import OpenAI from "openai";
import { ImageGeneratorProvider } from "../types";

export class OpenAiDalleAdapter implements ImageGeneratorProvider {
  name = "OpenAI DALL-E";
  defaultModel = "dall-e-3";
  private client: OpenAI;

  constructor(apiKey: string, baseUrl?: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: baseUrl || undefined,
    });
  }

  async generateImage(
    prompt: string,
    options?: { model?: string }
  ): Promise<{ imageUrl: string; model: string }> {
    const model = options?.model || this.defaultModel;

    const response = await this.client.images.generate({
      model,
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "b64_json",
    });

    const b64 = response.data?.[0]?.b64_json;
    if (b64) {
      return {
        imageUrl: `data:image/png;base64,${b64}`,
        model,
      };
    }

    const url = response.data?.[0]?.url;
    if (url) {
      // Download and convert to Data URI
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Falha ao baixar imagem gerada pelo DALL-E: HTTP ${res.status}`);
      }
      const buffer = await res.arrayBuffer();
      const base64Data = Buffer.from(buffer).toString("base64");
      return {
        imageUrl: `data:image/png;base64,${base64Data}`,
        model,
      };
    }

    throw new Error("A API do OpenAI DALL-E não retornou nenhuma imagem.");
  }
}
