import { ImageGeneratorProvider } from "../types";

export class OpenRouterFluxAdapter implements ImageGeneratorProvider {
  name = "OpenRouter FLUX";
  defaultModel = "black-forest-labs/flux.2-klein-4b";
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || "https://openrouter.ai/api/v1";
  }

  async generateImage(
    prompt: string,
    options?: { model?: string }
  ): Promise<{ imageUrl: string; model: string }> {
    const model = options?.model || this.defaultModel;
    const base = this.baseUrl.replace(/\/+$/, "");

    // Tenta primeiro via /images/generations se for o endpoint padrão do OpenRouter
    const endpoint = `${base}/images/generations`;

    let res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "HTTP-Referer": "https://gerafeed.com.br",
        "X-Title": "GeraFeed News Curator",
      },
      body: JSON.stringify({
        model,
        prompt,
      }),
      signal: AbortSignal.timeout(90000), // 90s timeout
    });

    // Se /images/generations retornar 404, faz fallback para /chat/completions
    if (res.status === 404) {
      res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": "https://gerafeed.com.br",
          "X-Title": "GeraFeed News Curator",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: AbortSignal.timeout(90000),
      });
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      if (res.status === 402) {
        throw new Error(
          "Saldo insuficiente no OpenRouter para gerar imagens com IA. Adicione créditos em openrouter.ai/credits."
        );
      }
      throw new Error(`Erro na API do OpenRouter (${res.status}): ${errText.substring(0, 250)}`);
    }

    const data = (await res.json()) as {
      data?: Array<{ url?: string; b64_json?: string }>;
      choices?: Array<{
        message?: {
          content?: string;
          images?: Array<{ url?: string; b64_json?: string }>;
        };
      }>;
    };

    // Caso retorne no formato padrão de /images/generations
    if (data.data?.[0]?.b64_json) {
      return {
        imageUrl: `data:image/png;base64,${data.data[0].b64_json}`,
        model,
      };
    }
    if (data.data?.[0]?.url) {
      const downloaded = await this.downloadToDataUri(data.data[0].url);
      return { imageUrl: downloaded, model };
    }

    const choice = data.choices?.[0]?.message;

    // 1. Check if images array exists
    const firstImage = choice?.images?.[0];
    if (firstImage?.b64_json) {
      return {
        imageUrl: `data:image/png;base64,${firstImage.b64_json}`,
        model,
      };
    }
    if (firstImage?.url) {
      const downloaded = await this.downloadToDataUri(firstImage.url);
      return { imageUrl: downloaded, model };
    }

    // 2. Parse from content (often markdown ![...](url) or direct URL or data URI)
    const content = choice?.content?.trim();
    if (content) {
      if (content.startsWith("data:image/")) {
        return { imageUrl: content, model };
      }

      // Check markdown image regex: ![...](https://...)
      const markdownMatch = content.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
      if (markdownMatch?.[1]) {
        const downloaded = await this.downloadToDataUri(markdownMatch[1]);
        return { imageUrl: downloaded, model };
      }

      // Check direct URL regex: https://...
      const urlMatch = content.match(/https?:\/\/[^\s"']+/);
      if (urlMatch?.[0]) {
        const downloaded = await this.downloadToDataUri(urlMatch[0]);
        return { imageUrl: downloaded, model };
      }
    }

    throw new Error("A API do OpenRouter não retornou nenhuma imagem válida.");
  }

  private async downloadToDataUri(url: string): Promise<string> {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      throw new Error(`Falha ao baixar imagem gerada pelo OpenRouter: HTTP ${res.status}`);
    }
    const contentType = res.headers.get("content-type") || "image/png";
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  }
}
