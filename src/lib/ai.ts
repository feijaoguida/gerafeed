import { prisma } from "@/lib/prisma";
import { getConfig } from "@/lib/config";
import { PromptSettings, GeneratedArticle } from "./ai/types";
import { getActiveAIProvider } from "./ai/service";
import { processAndStoreImage } from "./imageProcessor";
import { scrapeArticleContent } from "@/lib/scraper";
import {
  ImageSettingsStored,
  ImageGenerationService,
  buildImagePrompt,
} from "@/lib/images";

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
 * and update its text and image fields in Prisma DB according to global image strategy.
 */
export async function processArticleWithAi(
  articleId: string,
  workspaceId?: string,
  options?: { force?: boolean }
) {
  const article = await prisma.article.findUnique({
    where: {
      id: articleId,
      ...(workspaceId ? { workspaceId } : {}),
    },
  });

  if (!article) {
    throw new Error(`Artigo com ID ${articleId} não encontrado.`);
  }

  const effectiveWorkspaceId = workspaceId || article.workspaceId;

  // If originalContent is not yet cached on the article, try scraping it now
  let originalContent = article.originalContent;
  if (!originalContent && article.originalUrl) {
    try {
      const scraped = await scrapeArticleContent(article.originalUrl);
      if (scraped) {
        originalContent = scraped;
        await prisma.article.update({
          where: { id: articleId },
          data: { originalContent: scraped },
        });
      }
    } catch (err) {
      console.warn(`[AI Process] Falha ao extrair conteúdo da URL ${article.originalUrl}:`, err);
    }
  }

  const categories = await prisma.wordPressCategory.findMany({
    where: { workspaceId: effectiveWorkspaceId },
    select: { id: true, name: true, slug: true },
  });

  const promptConfig = await getConfig<PromptSettings>(
    "aiPromptSettings",
    effectiveWorkspaceId
  );
  const promptSettings = promptConfig || undefined;

  const provider = await getActiveAIProvider(undefined, effectiveWorkspaceId);
  const aiResult = await provider.generateArticle({
    originalTitle: article.originalTitle || article.title || "",
    originalDescription: article.originalDescription,
    originalContent,
    categories,
    promptSettings,
  });

  // Validate suggested category exists in available list
  let validCategoryId: string | null = null;
  if (aiResult.suggestedCategoryId && categories.some((c) => c.id === aiResult.suggestedCategoryId)) {
    validCategoryId = aiResult.suggestedCategoryId;
  }

  // Process image if originalImageUrl is present
  const imageConfig = await getConfig<ImageSettingsStored>(
    "imageSettings",
    effectiveWorkspaceId
  );

  const defaultStrategy = imageConfig?.defaultStrategy || "ORIGINAL";

  let modifiedImageUrl: string | null = article.modifiedImageUrl;
  if (article.originalImageUrl) {
    const processedUrl = await processAndStoreImage(article.originalImageUrl, articleId);
    if (processedUrl) {
      modifiedImageUrl = processedUrl;
    }
  }

  const isLowScore = !aiResult.relevant || aiResult.score < 6;
  const isEmptyContent = !aiResult.title?.trim() || !aiResult.content?.trim();

  // If AI determined article is below threshold and user did not choose to force it
  if (isLowScore && !options?.force) {
    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        aiScore: aiResult.score,
        processedAt: new Date(),
      },
    });

    const portalAreaName =
      promptSettings?.portalArea === "Outro" && promptSettings?.customPortalArea?.trim()
        ? promptSettings.customPortalArea.trim()
        : promptSettings?.portalArea?.trim() || "tecnologia e negócios";

    return {
      success: false,
      notRelevant: true,
      score: aiResult.score,
      message: `A IA classificou esta notícia como abaixo da média (Score: ${aiResult.score}/10) para a área de atuação do portal (${portalAreaName}).`,
      article: updatedArticle,
      aiResult,
    };
  }

  if (isEmptyContent) {
    throw new Error("A IA não retornou título ou conteúdo válidos para o artigo.");
  }

  let generatedImageUrl: string | null = article.generatedImageUrl;
  let imagePrompt: string | null = article.imagePrompt;

  // REGRA DE OURO: A imagem com IA SÓ é gerada se a estratégia for AI_GENERATED
  if (defaultStrategy === "AI_GENERATED") {
    try {
      const prompt = await buildImagePrompt({
        title: aiResult.title || article.title || article.originalTitle || "",
        summary: aiResult.summary || article.summary || article.originalDescription,
        content: aiResult.content || article.content || originalContent,
        originalTitle: article.originalTitle,
        originalImageUrl: article.originalImageUrl,
        style: imageConfig?.imageStyle || "REALISTIC",
        customStyle: imageConfig?.customImageStyle,
        promptTemplate: imageConfig?.imagePromptTemplate,
      });

      imagePrompt = prompt;

      const genResult = await ImageGenerationService.generateImage({
        prompt,
        articleId,
        workspaceId: effectiveWorkspaceId,
        style: imageConfig?.imageStyle || "REALISTIC",
        customStyle: imageConfig?.customImageStyle,
        originalImageUrl: article.originalImageUrl,
      });

      if (genResult?.imageUrl) {
        generatedImageUrl = genResult.imageUrl;
      }
    } catch (imgErr) {
      console.warn(`[AI Process] Falha ao gerar imagem com IA para o artigo ${articleId}:`, imgErr);
    }
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
      modifiedImageUrl,
      generatedImageUrl,
      imagePrompt,
      selectedImage: defaultStrategy,
      processedAt: new Date(),
    },
  });

  return {
    success: true,
    article: updatedArticle,
    aiResult,
  };
}

/**
 * Directly applies an already generated AI result to an article.
 * Useful when the user confirms "Processar mesmo assim" after an initial low relevance score,
 * avoiding duplicate AI provider API calls and double billing.
 */
export async function applyAiResultToArticle(
  articleId: string,
  aiResult: GeneratedArticle,
  workspaceId?: string
) {
  const article = await prisma.article.findUnique({
    where: {
      id: articleId,
      ...(workspaceId ? { workspaceId } : {}),
    },
  });

  if (!article) {
    throw new Error(`Artigo com ID ${articleId} não encontrado.`);
  }

  if (!aiResult.title?.trim() || !aiResult.content?.trim()) {
    throw new Error("O resultado da IA não contém título ou conteúdo válidos para aplicar.");
  }

  const effectiveWorkspaceId = workspaceId || article.workspaceId;

  const categories = await prisma.wordPressCategory.findMany({
    where: { workspaceId: effectiveWorkspaceId },
    select: { id: true, name: true, slug: true },
  });

  let validCategoryId: string | null = null;
  if (
    aiResult.suggestedCategoryId &&
    categories.some((c) => c.id === aiResult.suggestedCategoryId)
  ) {
    validCategoryId = aiResult.suggestedCategoryId;
  }

  const imageConfig = await getConfig<ImageSettingsStored>(
    "imageSettings",
    effectiveWorkspaceId
  );
  const defaultStrategy = imageConfig?.defaultStrategy || "ORIGINAL";

  let modifiedImageUrl: string | null = article.modifiedImageUrl;
  if (article.originalImageUrl && !modifiedImageUrl) {
    const processedUrl = await processAndStoreImage(article.originalImageUrl, articleId);
    if (processedUrl) {
      modifiedImageUrl = processedUrl;
    }
  }

  // Se a estratégia for AI_GENERATED e ainda não tiver sido gerada imagem por IA, gera agora
  let generatedImageUrl: string | null = article.generatedImageUrl;
  let imagePrompt: string | null = article.imagePrompt;

  if (defaultStrategy === "AI_GENERATED" && !generatedImageUrl) {
    try {
      const prompt = await buildImagePrompt({
        title: aiResult.title,
        content: aiResult.content || article.content || article.originalContent || "",
        originalTitle: article.originalTitle,
        originalImageUrl: article.originalImageUrl,
        style: imageConfig?.imageStyle || "REALISTIC",
        customStyle: imageConfig?.customImageStyle,
        promptTemplate: imageConfig?.imagePromptTemplate,
      });

      imagePrompt = prompt;

      const genResult = await ImageGenerationService.generateImage({
        prompt,
        articleId,
        workspaceId: effectiveWorkspaceId,
        style: imageConfig?.imageStyle || "REALISTIC",
        customStyle: imageConfig?.customImageStyle,
        originalImageUrl: article.originalImageUrl,
      });

      if (genResult?.imageUrl) {
        generatedImageUrl = genResult.imageUrl;
      }
    } catch (imgErr) {
      console.warn(`[applyAiResultToArticle] Falha ao gerar imagem com IA para o artigo ${articleId}:`, imgErr);
    }
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
      modifiedImageUrl,
      generatedImageUrl,
      imagePrompt,
      selectedImage: defaultStrategy,
      processedAt: new Date(),
    },
  });

  return {
    success: true,
    article: updatedArticle,
    aiResult,
  };
}
