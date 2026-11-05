import { ImageGeneratorProvider } from "../types";

export class PollinationsFluxAdapter implements ImageGeneratorProvider {
  name = "Pollinations.ai";
  defaultModel = "flux";
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl?.trim() || "https://image.pollinations.ai";
  }

  async generateImage(
    prompt: string,
    options?: { model?: string }
  ): Promise<{ imageUrl: string; model: string }> {
    const model = options?.model?.trim() || this.defaultModel;
    const base = this.baseUrl.replace(/\/+$/, "");

    const url = `${base}/prompt/${encodeURIComponent(prompt)}?model=${encodeURIComponent(
      model
    )}&width=1024&height=1024&nologo=true`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(90000), // 90s timeout
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(
        `Erro ao gerar imagem na Pollinations.ai (HTTP ${res.status}): ${errText.slice(0, 200)}`
      );
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return {
      imageUrl: `data:${contentType};base64,${base64}`,
      model,
    };
  }
}
