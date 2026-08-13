import {
  AIProvider,
  AIProviderConfig,
  GenerateArticleInput,
  GeneratedArticle,
  AIConnectionResult,
  SYSTEM_PROMPT_EDITORIAL,
} from "../types";

export class AnthropicProvider implements AIProvider {
  name = "Anthropic";
  model: string;
  private apiKey: string;
  private baseUrl: string;

  constructor(config: AIProviderConfig) {
    this.model = config.model || "claude-3-5-haiku-20241022";
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://api.anthropic.com";
  }

  async generateArticle(input: GenerateArticleInput): Promise<GeneratedArticle> {
    const userPrompt = `Analise e reescreva a seguinte notícia:

Título Original: ${input.originalTitle}
Descrição Original: ${input.originalDescription || "Nenhuma descrição fornecida."}

Categorias disponíveis no WordPress:
${JSON.stringify(input.categories, null, 2)}
`;

    const endpoint = `${this.baseUrl.replace(/\/+$/, "")}/v1/messages`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2048,
        system: `${SYSTEM_PROMPT_EDITORIAL}\n\nResponda APENAS em JSON válido sem marcações markdown extra.`,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Erro na API da Anthropic Claude (${res.status}): ${errText.substring(0, 200)}`);
    }

    const data = await res.json();
    const rawContent = data.content?.[0]?.text;
    if (!rawContent) {
      throw new Error("A API do Claude não retornou nenhum texto.");
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
      const endpoint = `${this.baseUrl.replace(/\/+$/, "")}/v1/messages`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 20,
          messages: [{ role: "user", content: "Responda: {\"status\":\"ok\"}" }],
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Falha Claude HTTP ${res.status}: ${errText.substring(0, 150)}`);
      }

      return {
        connected: true,
        provider: this.name,
        model: this.model,
        message: "Conexão com Anthropic Claude estabelecida com sucesso!",
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido na conexão com Anthropic";
      return {
        connected: false,
        provider: this.name,
        model: this.model,
        message: msg,
      };
    }
  }
}
