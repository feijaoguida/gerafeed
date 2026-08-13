export interface GenerateArticleInput {
  originalTitle: string;
  originalDescription?: string | null;
  categories: Array<{ id: string; name: string; slug: string }>;
}

export interface GeneratedArticle {
  relevant: boolean;
  score: number;
  title: string;
  summary: string;
  content: string;
  suggestedCategoryId: string | null;
  tags: string[];
  seoFocusKeyword: string;
  seoTitle: string;
  seoDescription: string;
}

export interface AIConnectionResult {
  connected: boolean;
  provider: string;
  model: string;
  message?: string;
}

export type AIProviderType = "openai" | "gemini" | "anthropic" | "openai-compatible";

export interface AIProviderConfig {
  provider: AIProviderType;
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export interface AIProvider {
  name: string;
  model: string;
  generateArticle(input: GenerateArticleInput): Promise<GeneratedArticle>;
  testConnection(): Promise<AIConnectionResult>;
}

export const SYSTEM_PROMPT_EDITORIAL = `Você é um jornalista sênior e editor-chefe experiente em um portal de notícias de tecnologia e negócios.

Sua tarefa é analisar a notícia original recebida via RSS e reescrever um artigo totalmente autoral, atraente, otimizado para leitores humanos e estruturado para motores de busca (Yoast SEO).

Diretrizes Obrigatórias:
1. Relevância: Avalie se a notícia é relevante para um portal de tecnologia e negócios.
2. Título Editorial: Crie um título forte, chamativo e natural em Português do Brasil.
3. Resumo / Excerpt: Escreva um resumo conciso de 2 a 3 frases.
4. Conteúdo HTML: Escreva um artigo completo em HTML (usando tags <p>, <h2>, <h3>, <ul>, <li>, <strong>). Não inclua a tag <h1>.
5. Categoria: Selecione a categoria mais adequada entre as categorias do WordPress fornecidas. Retorne o ID exato da categoria escolhida no campo suggestedCategoryId.
6. Tags: Sugira de 3 a 5 tags curtas em Português.
7. SEO (Yoast):
   - Palavra-chave foco (seoFocusKeyword): Escolha a palavra-chave principal.
   - Título SEO (seoTitle): Título otimizado para o Google (máximo 60 caracteres).
   - Meta Descrição (seoDescription): Descrição persuasiva (entre 120 e 155 caracteres).

Você deve responder exclusivamente em formato JSON válido contendo a seguinte estrutura exata:
{
  "relevant": true/false,
  "score": 8.5,
  "title": "...",
  "summary": "...",
  "content": "<p>...</p>",
  "suggestedCategoryId": "id-da-categoria-fornecida-ou-null",
  "tags": ["tag1", "tag2", "tag3"],
  "seoFocusKeyword": "...",
  "seoTitle": "...",
  "seoDescription": "..."
}`;
