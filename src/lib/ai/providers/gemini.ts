import {
  AIProvider,
  AIProviderConfig,
  GenerateArticleInput,
  GeneratedArticle,
  AIConnectionResult,
  SYSTEM_PROMPT_EDITORIAL,
} from "../types";

export class GeminiProvider implements AIProvider {
  name = "Gemini";
  model: string;
  private apiKey: string;
  private baseUrl: string;

  constructor(config: AIProviderConfig) {
    this.model = config.model || "gemini-1.5-flash";
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://generativelanguage.googleapis.com/v1beta";
  }

  async generateArticle(input: GenerateArticleInput): Promise<GeneratedArticle> {
    const userPrompt = `Analise e reescreva a seguinte notícia:

Título Original: ${input.originalTitle}
Descrição Original: ${input.originalDescription || "Nenhuma descrição fornecida."}

Categorias disponíveis no WordPress:
${JSON.stringify(input.categories, null, 2)}
`;

    const endpoint = `${this.baseUrl.replace(/\/+$/, "")}/models/${this.model}:generateContent?key=${this.apiKey}`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: `${SYSTEM_PROMPT_EDITORIAL}\n\n${userPrompt}` }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
        }
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Erro na API do Google Gemini (${res.status}): ${errText.substring(0, 200)}`);
    }

    const data = await res.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) {
      throw new Error("A API do Gemini não retornou nenhum texto.");
    }

    const parsed = JSON.parse(rawContent);
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
      const endpoint = `${this.baseUrl.replace(/\/+$/, "")}/models/${this.model}:generateContent?key=${this.apiKey}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Responda apenas: {\"status\":\"ok\"}" }] }],
          generationConfig: { responseMimeType: "application/json" }
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Falha Gemini HTTP ${res.status}: ${errText.substring(0, 150)}`);
      }

      return {
        connected: true,
        provider: this.name,
        model: this.model,
        message: "Conexão com Google Gemini estabelecida com sucesso!",
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido na conexão com Gemini";
      return {
        connected: false,
        provider: this.name,
        model: this.model,
        message: msg,
      };
    }
  }
}
