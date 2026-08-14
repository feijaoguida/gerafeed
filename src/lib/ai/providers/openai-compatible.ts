import {
  AIProvider,
  AIProviderConfig,
  GenerateArticleInput,
  GeneratedArticle,
  AIConnectionResult,
  buildSystemPrompt,
} from "../types";

export class OpenAICompatibleProvider implements AIProvider {
  name = "OpenAI-Compatible";
  model: string;
  private apiKey: string;
  private baseUrl: string;

  constructor(config: AIProviderConfig) {
    this.model = config.model || "deepseek-chat";
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://api.deepseek.com/v1";
  }

  async generateArticle(input: GenerateArticleInput): Promise<GeneratedArticle> {
    const systemPrompt = buildSystemPrompt(input.promptSettings);
    const userPrompt = `Analise e reescreva a seguinte notícia:

Título Original: ${input.originalTitle}
Descrição Original: ${input.originalDescription || "Nenhuma descrição fornecida."}

Categorias disponíveis no WordPress:
${JSON.stringify(input.categories, null, 2)}
`;

    const cleanBaseUrl = this.baseUrl.replace(/\/+$/, "");
    const endpoint = cleanBaseUrl.endsWith("/chat/completions")
      ? cleanBaseUrl
      : `${cleanBaseUrl}/chat/completions`;

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
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Erro na API OpenAI-Compatible (${res.status}): ${errText.substring(0, 200)}`);
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error("A API OpenAI-Compatible não retornou nenhum texto.");
    }

    // Clean any markdown code fences if present
    const cleanJson = rawContent.replace(/```json\s*/g, "").replace(/```\s*$/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return {
      relevant: Boolean(parsed.relevant),
      score: typeof parsed.score === "number" ? parsed.score : 5.0,
      title: parsed.title || input.originalTitle,
      summary: parsed.summary || "",
      content: parsed.content || `<p>${input.originalTitle}</p>`,
      suggestedCategoryId: parsed.suggestedCategoryId || null,
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
      seoFocusKeyword: parsed.seoFocusKeyword || "",
      seoTitle: parsed.seoTitle || parsed.title || input.originalTitle,
      seoDescription: parsed.seoDescription || parsed.summary || "",
    };
  }

  async testConnection(): Promise<AIConnectionResult> {
    try {
      const cleanBaseUrl = this.baseUrl.replace(/\/+$/, "");
      const endpoint = cleanBaseUrl.endsWith("/chat/completions")
        ? cleanBaseUrl
        : `${cleanBaseUrl}/chat/completions`;

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
          model: this.model,
          messages: [{ role: "user", content: "Responda: {\"status\":\"ok\"}" }],
          max_tokens: 15,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Falha OpenAI-Compatible HTTP ${res.status}: ${errText.substring(0, 150)}`);
      }

      return {
        connected: true,
        provider: this.name,
        model: this.model,
        message: `Conexão com endpoint OpenAI-Compatible (${this.model}) estabelecida com sucesso!`,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido na conexão OpenAI-Compatible";
      return {
        connected: false,
        provider: this.name,
        model: this.model,
        message: msg,
      };
    }
  }
}
