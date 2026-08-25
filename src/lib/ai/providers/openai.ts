import OpenAI from "openai";
import {
  AIProvider,
  AIProviderConfig,
  GenerateArticleInput,
  GeneratedArticle,
  AIConnectionResult,
  buildSystemPrompt,
  parseAIJsonResponse,
} from "../types";

export class OpenAIProvider implements AIProvider {
  name = "OpenAI";
  model: string;
  private client: OpenAI;

  constructor(config: AIProviderConfig) {
    this.model = config.model || "gpt-4o-mini";
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || undefined,
    });
  }

  async generateArticle(input: GenerateArticleInput): Promise<GeneratedArticle> {
    const systemPrompt = buildSystemPrompt(input.promptSettings);
    const userPrompt = `Analise e reescreva a seguinte notícia:

Título Original: ${input.originalTitle}
Descrição Original: ${input.originalDescription || "Nenhuma descrição fornecida."}${
      input.originalContent ? `\n\nConteúdo Completo da Matéria Original:\n${input.originalContent}` : ""
    }

Categorias disponíveis no WordPress:
${JSON.stringify(input.categories, null, 2)}
`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const rawContent = response.choices[0]?.message?.content;
    if (!rawContent) {
      throw new Error("A API da OpenAI não retornou nenhum conteúdo.");
    }

    const parsed = parseAIJsonResponse<Record<string, unknown>>(rawContent);
    return {
      relevant: Boolean(parsed.relevant),
      score: typeof parsed.score === "number" ? parsed.score : 5.0,
      title: typeof parsed.title === "string" ? parsed.title : input.originalTitle,
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      content: typeof parsed.content === "string" ? parsed.content : `<p>${input.originalTitle}</p>`,
      suggestedCategoryId: typeof parsed.suggestedCategoryId === "string" ? parsed.suggestedCategoryId : null,
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
      seoFocusKeyword: typeof parsed.seoFocusKeyword === "string" ? parsed.seoFocusKeyword : "",
      seoTitle:
        typeof parsed.seoTitle === "string"
          ? parsed.seoTitle
          : typeof parsed.title === "string"
          ? parsed.title
          : input.originalTitle,
      seoDescription:
        typeof parsed.seoDescription === "string"
          ? parsed.seoDescription
          : typeof parsed.summary === "string"
          ? parsed.summary
          : "",
    };
  }

  async testConnection(): Promise<AIConnectionResult> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: "Responda 'ok' em JSON: {\"status\": \"ok\"}" }],
        response_format: { type: "json_object" },
        max_tokens: 15,
      });

      if (response.choices[0]?.message?.content) {
        return {
          connected: true,
          provider: this.name,
          model: this.model,
          message: "Conexão com OpenAI estabelecida com sucesso!",
        };
      }
      throw new Error("Sem resposta válida do modelo.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido na conexão com OpenAI";
      return {
        connected: false,
        provider: this.name,
        model: this.model,
        message: msg,
      };
    }
  }
}
