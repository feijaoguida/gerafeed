import { ImageGeneratorProvider } from "../types";

export class GoogleImagenAdapter implements ImageGeneratorProvider {
  name = "Google Imagen";
  defaultModel = "imagen-3.0-generate-002";
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || "https://generativelanguage.googleapis.com/v1beta";
  }

  async generateImage(
    prompt: string,
    options?: { model?: string }
  ): Promise<{ imageUrl: string; model: string }> {
    const model = options?.model || this.defaultModel;
    const endpoint = `${this.baseUrl.replace(/\/+$/, "")}/models/${model}:predict?key=${this.apiKey}`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: "1:1",
        },
      }),
      signal: AbortSignal.timeout(60000), // 60s timeout
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Erro na API do Google Imagen (${res.status}): ${errText.substring(0, 250)}`);
    }

    const data = (await res.json()) as {
      predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>;
    };

    const firstPrediction = data.predictions?.[0];
    if (firstPrediction?.bytesBase64Encoded) {
      const mime = firstPrediction.mimeType || "image/jpeg";
      return {
        imageUrl: `data:${mime};base64,${firstPrediction.bytesBase64Encoded}`,
        model,
      };
    }

    throw new Error("A API do Google Imagen não retornou dados de imagem válidos.");
  }
}
