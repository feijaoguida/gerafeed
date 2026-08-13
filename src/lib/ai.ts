import { prisma } from "@/lib/prisma";
import { getActiveAIProvider } from "./ai/service";

export * from "./ai/index";

export interface AiProcessResult {
  relevant: boolean;
  score: number;
  title: string;
  summary: string;
  content: string;
  suggestedCategorySlug: string | null;
  tags: string[];
  focusKeyword: string;
  metaTitle: string;
  metaDescription: string;
}

/**
 * Process a single article by ID using the configured active AIProvider (OpenAI, Gemini, Anthropic, OpenAI-Compatible)
 * and update its fields in Prisma DB.
 */
export async function processArticleWithAi(articleId: string) {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
  });

  if (!article) {
    throw new Error(`Artigo com ID ${articleId} não encontrado.`);
  }

  const categories = await prisma.wordPressCategory.findMany({
    select: { id: true, name: true, slug: true },
  });

  const provider = await getActiveAIProvider();
  const aiResult = await provider.generateArticle({
    originalTitle: article.originalTitle,
    originalDescription: article.originalDescription,
    categories,
  });

  // Validate suggested category exists in available list
  let validCategoryId: string | null = null;
  if (aiResult.suggestedCategoryId && categories.some((c) => c.id === aiResult.suggestedCategoryId)) {
    validCategoryId = aiResult.suggestedCategoryId;
  }

  const updatedArticle = await prisma.article.update({
    where: { id: articleId },
    data: {
      aiScore: aiResult.score,
      title: aiResult.title,
      summary: aiResult.summary,
      content: aiResult.content,
      suggestedCategoryId: validCategoryId,
      tags: aiResult.tags,
      seoFocusKeyword: aiResult.seoFocusKeyword,
      seoTitle: aiResult.seoTitle,
      seoDescription: aiResult.seoDescription,
    },
  });

  return {
    success: true,
    article: updatedArticle,
    aiResult,
  };
}
