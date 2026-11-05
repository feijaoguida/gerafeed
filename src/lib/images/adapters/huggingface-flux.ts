import { ImageGeneratorProvider } from "../types";

export class HuggingFaceFluxAdapter implements ImageGeneratorProvider {
  name = "Hugging Face FLUX";
  defaultModel = "black-forest-labs/FLUX.1-schnell";
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey.trim();
    this.baseUrl = baseUrl?.trim() || "https://router.huggingface.co/hf-inference";
  }

  async generateImage(
    prompt: string,
    options?: { model?: string }
  ): Promise<{ imageUrl: string; model: string }> {
    const model = options?.model?.trim() || this.defaultModel;

    // 1. If using the default FLUX.1-schnell or zero-gpu space, try ZeroGPU Gradio API first (fast and 100% free with HF token)
    if (
      model === "black-forest-labs/FLUX.1-schnell" ||
      model.toLowerCase().includes("schnell")
    ) {
      try {
        const spaceResult = await this.generateViaZeroGpuSpace(prompt);
        if (spaceResult) {
          return { imageUrl: spaceResult, model };
        }
      } catch (spaceErr) {
        console.warn("HuggingFace ZeroGPU Space fallback to router endpoint:", spaceErr);
      }
    }

    // 2. Try Hugging Face Router endpoint (for models supported by hf-inference or PRO/credit accounts)
    try {
      const routerResult = await this.generateViaRouterEndpoint(prompt, model);
      if (routerResult) {
        return { imageUrl: routerResult, model };
      }
    } catch (routerErr) {
      // If router failed and we haven't tried Space yet, try Space as fallback
      if (
        model !== "black-forest-labs/FLUX.1-schnell" &&
        !model.toLowerCase().includes("schnell")
      ) {
        try {
          const spaceResult = await this.generateViaZeroGpuSpace(prompt);
          if (spaceResult) {
            return { imageUrl: spaceResult, model };
          }
        } catch {
          // ignore space error and throw original router error
        }
      }
      throw routerErr;
    }

    throw new Error(
      "Não foi possível gerar a imagem através dos endpoints do Hugging Face. Verifique se o token de acesso tem permissões válidas."
    );
  }

  /**
   * Generates image via the official Hugging Face ZeroGPU Space API for FLUX.1-schnell
   * Authenticated with Bearer token, free tier supported.
   */
  private async generateViaZeroGpuSpace(prompt: string): Promise<string> {
    const spaceHost = "https://black-forest-labs-flux-1-schnell.hf.space";
    const callUrl = `${spaceHost}/gradio_api/call/infer`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    // Gradio infer parameters for FLUX.1-schnell: [prompt, seed, randomize_seed, width, height, num_inference_steps]
    const callRes = await fetch(callUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        data: [prompt, 0, true, 1024, 1024, 4],
      }),
      signal: AbortSignal.timeout(90000), // 90s timeout
    });

    if (!callRes.ok) {
      const errText = await callRes.text().catch(() => "");
      throw new Error(`Falha ao iniciar inferência no Space Hugging Face (HTTP ${callRes.status}): ${errText.slice(0, 200)}`);
    }

    const callJson = (await callRes.json()) as { event_id?: string };
    const eventId = callJson.event_id;
    if (!eventId) {
      throw new Error("Resposta inválida do Space Hugging Face: event_id ausente.");
    }

    // Read SSE stream until event: complete
    const sseUrl = `${spaceHost}/gradio_api/call/infer/${eventId}`;
    const sseRes = await fetch(sseUrl, {
      headers,
      signal: AbortSignal.timeout(90000),
    });

    if (!sseRes.ok) {
      throw new Error(`Falha ao obter resultado do Space Hugging Face (HTTP ${sseRes.status})`);
    }

    const sseText = await sseRes.text();
    // Parse SSE lines
    // event: complete
    // data: [{"path": "...", "url": "https://...", ...}, seed]
    let imageUrlFromSse: string | null = null;
    const lines = sseText.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("data:")) {
        const jsonStr = line.slice(5).trim();
        try {
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed) && parsed[0]?.url) {
            imageUrlFromSse = parsed[0].url;
            break;
          }
        } catch {
          // continue parsing
        }
      }
    }

    if (!imageUrlFromSse) {
      throw new Error("Não foi possível extrair a URL da imagem gerada pelo Space Hugging Face.");
    }

    return await this.downloadToDataUri(imageUrlFromSse);
  }

  /**
   * Generates image via standard Hugging Face Router / Inference endpoint
   */
  private async generateViaRouterEndpoint(
    prompt: string,
    model: string
  ): Promise<string> {
    const base = this.baseUrl.replace(/\/+$/, "");
    const endpoint = `${base}/models/${model}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        inputs: prompt,
      }),
      signal: AbortSignal.timeout(90000),
    });

    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("image/")) {
      const arrayBuffer = await res.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      return `data:${contentType};base64,${base64}`;
    }

    const text = await res.text().catch(() => "");
    if (res.status === 402) {
      throw new Error(
        "A conta Hugging Face não possui créditos pré-pagos para inferência via router de terceiros. Use o modelo FLUX.1-schnell gratuito."
      );
    }

    throw new Error(
      `Erro na Inference API do Hugging Face (HTTP ${res.status}): ${text.slice(0, 250)}`
    );
  }

  private async downloadToDataUri(url: string): Promise<string> {
    const res = await fetch(url, {
      headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : undefined,
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      throw new Error(
        `Falha ao baixar imagem gerada pelo Hugging Face: HTTP ${res.status}`
      );
    }

    const contentType = res.headers.get("content-type") || "image/webp";
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  }
}
