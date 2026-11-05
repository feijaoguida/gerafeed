import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { BillingService } from "@/lib/billing";
import { getConfig } from "@/lib/config";
import { handleApiError } from "@/lib/errors/service";
import {
  processArticleWithAi,
  isValidCompletionLevel,
  CompletionLevel,
} from "@/lib/ai";
import {
  distributeImagesInHtmlContent,
  escapeHtmlText,
  processAndStoreImage,
} from "@/lib/imageProcessor";
import {
  ImageSettingsStored,
  ImageGenerationService,
  buildImagePrompt,
  ImageStyle,
} from "@/lib/images";

interface BodyImageItem {
  imageUrl: string;
  caption?: string | null;
  alt?: string | null;
}

/**
 * Formats plain text into clean HTML paragraphs (<p>...</p>) without altering any words.
 */
export function formatRawTextToHtmlParagraphs(rawText: string): string {
  const blocks = rawText
    .trim()
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (blocks.length === 0) return "";

  return blocks
    .map((block) => {
      const lines = block
        .split(/\r?\n/)
        .map((line) => escapeHtmlText(line.trim()))
        .filter(Boolean);
      return `<p>${lines.join("<br />")}</p>`;
    })
    .join("\n\n");
}

export async function POST(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login para continuar." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const rawText = typeof body?.rawText === "string" ? body.rawText.trim() : "";
    if (!rawText) {
      return NextResponse.json(
        {
          error:
            "Informe o texto base, ideias de pauta ou entrevista para criar a matéria.",
        },
        { status: 400 }
      );
    }

    if (rawText.length > 100_000) {
      return NextResponse.json(
        { error: "O texto enviado excede o limite máximo de 100.000 caracteres." },
        { status: 400 }
      );
    }

    const titleHint =
      typeof body?.title === "string" && body.title.trim()
        ? body.title.trim().slice(0, 250)
        : "";

    const completionLevel: CompletionLevel = isValidCompletionLevel(
      body?.completionLevel
    )
      ? body.completionLevel
      : "MEDIUM";

    const processWithAi = body?.processWithAi !== false;

    // Validate WordPress Site ownership if provided
    let validWordpressSiteId: string | null = null;
    if (typeof body?.wordpressSiteId === "string" && body.wordpressSiteId.trim()) {
      const site = await prisma.wordPressSite.findFirst({
        where: { id: body.wordpressSiteId.trim(), workspaceId },
        select: { id: true },
      });
      if (site) {
        validWordpressSiteId = site.id;
      }
    }

    // Validate WordPress Category ownership if provided
    let validCategoryId: string | null = null;
    if (typeof body?.categoryId === "string" && body.categoryId.trim()) {
      const cat = await prisma.wordPressCategory.findFirst({
        where: { id: body.categoryId.trim(), workspaceId },
        select: { id: true },
      });
      if (cat) {
        validCategoryId = cat.id;
      }
    }

    // Check Billing Limits before processing with AI
    if (processWithAi) {
      const dailyCheck = await BillingService.checkLimit(
        workspaceId,
        "ARTICLES_DAILY"
      );
      if (!dailyCheck.allowed) {
        return NextResponse.json(
          {
            error: dailyCheck.message,
            limitReached: true,
            resource: "ARTICLES_DAILY",
          },
          { status: 403 }
        );
      }

      const monthlyCheck = await BillingService.checkLimit(
        workspaceId,
        "ARTICLES"
      );
      if (!monthlyCheck.allowed) {
        return NextResponse.json(
          {
            error: monthlyCheck.message,
            limitReached: true,
            resource: "ARTICLES",
          },
          { status: 403 }
        );
      }
    }

    // Extract optional uploaded cover image
    const coverImageUrl =
      typeof body?.coverImage?.imageUrl === "string" &&
      body.coverImage.imageUrl.trim()
        ? body.coverImage.imageUrl.trim()
        : null;
    let coverModifiedUrl =
      typeof body?.coverImage?.modifiedImageUrl === "string" &&
      body.coverImage.modifiedImageUrl.trim()
        ? body.coverImage.modifiedImageUrl.trim()
        : null;

    // Extract optional body images to insert inside the article HTML
    const rawBodyImages: BodyImageItem[] = Array.isArray(body?.bodyImages)
      ? body.bodyImages
          .filter(
            (item: unknown): item is BodyImageItem =>
              Boolean(
                item &&
                  typeof item === "object" &&
                  typeof (item as BodyImageItem).imageUrl === "string" &&
                  (item as BodyImageItem).imageUrl.trim()
              )
          )
          .slice(0, 12)
      : [];

    const fallbackTitle =
      titleHint ||
      rawText
        .split(/\r?\n/)[0]
        ?.replace(/[#*>-]/g, "")
        .trim()
        .slice(0, 110) ||
      "Matéria Editorial";

    const fallbackHtml = formatRawTextToHtmlParagraphs(rawText);

    // 1. Create initial Article record in Prisma
    const createdArticle = await prisma.article.create({
      data: {
        workspaceId,
        originalTitle: fallbackTitle,
        originalDescription: rawText.slice(0, 300),
        originalContent: rawText,
        originalPublishedAt: new Date(),
        title: fallbackTitle,
        summary: rawText.slice(0, 220),
        content: fallbackHtml,
        wordpressSiteId: validWordpressSiteId,
        categoryId: validCategoryId,
        originalImageUrl: coverImageUrl,
        modifiedImageUrl: coverModifiedUrl,
        selectedImage: "ORIGINAL",
        status: "PENDING",
      },
    });

    if (coverImageUrl && !coverModifiedUrl) {
      coverModifiedUrl = await processAndStoreImage(
        coverImageUrl,
        createdArticle.id
      );
      if (coverModifiedUrl) {
        await prisma.article.update({
          where: { id: createdArticle.id },
          data: { modifiedImageUrl: coverModifiedUrl },
        });
      }
    }

    // 2. Process with AI using the selected CompletionLevel (FORMAT_ONLY, LIGHT, MEDIUM, LARGE)
    let aiWarning: string | null = null;
    if (processWithAi) {
      try {
        await processArticleWithAi(createdArticle.id, workspaceId, {
          force: true,
          completionLevel,
        });
      } catch (aiErr) {
        // If FORMAT_ONLY was chosen and AI provider is not configured, fallback gracefully to deterministic HTML formatting
        if (completionLevel === "FORMAT_ONLY") {
          aiWarning =
            "Texto formatado em parágrafos localmente (provedor de IA não respondeu para gerar metadados extras).";
          await prisma.article.update({
            where: { id: createdArticle.id },
            data: {
              title: fallbackTitle,
              content: fallbackHtml,
              processedAt: new Date(),
            },
          });
        } else {
          // Clean up created draft if AI fails on LIGHT/MEDIUM/LARGE so user can retry cleanly
          await prisma.article
            .delete({ where: { id: createdArticle.id } })
            .catch(() => {});
          throw aiErr;
        }
      }
    }

    // Fetch current state of article after AI text generation
    let currentArticle = await prisma.article.findUnique({
      where: { id: createdArticle.id },
    });

    if (!currentArticle) {
      throw new Error("Erro ao recuperar matéria recém-criada.");
    }

    // Preserve explicit user-selected category if set
    if (validCategoryId && currentArticle.categoryId !== validCategoryId) {
      currentArticle = await prisma.article.update({
        where: { id: createdArticle.id },
        data: { categoryId: validCategoryId },
      });
    }

    // 3. Optional on-demand AI Image Generation ("Criar Fotos através da Matéria")
    const generateAiImage = Boolean(body?.generateAiImage);
    const insertAiImageInBody = Boolean(body?.insertAiImageInBody);
    let imageGenerationWarning: string | null = null;

    if (generateAiImage) {
      try {
        const imageConfig = await getConfig<ImageSettingsStored>(
          "imageSettings",
          workspaceId
        );
        const style: ImageStyle =
          body?.imageStyle || imageConfig?.imageStyle || "REALISTIC";
        const customStyle: string | undefined =
          body?.customImageStyle || imageConfig?.customImageStyle;
        const customPrompt =
          typeof body?.customImagePrompt === "string"
            ? body.customImagePrompt.trim()
            : "";

        const prompt =
          customPrompt ||
          (await buildImagePrompt({
            title:
              currentArticle.title ||
              currentArticle.originalTitle ||
              fallbackTitle,
            summary:
              currentArticle.summary || currentArticle.originalDescription,
            content:
              currentArticle.content || currentArticle.originalContent || rawText,
            originalTitle: currentArticle.originalTitle,
            originalImageUrl: currentArticle.originalImageUrl,
            style,
            customStyle,
            promptTemplate: imageConfig?.imagePromptTemplate,
          }));

        const genResult = await ImageGenerationService.generateImage({
          prompt,
          articleId: currentArticle.id,
          workspaceId,
          style,
          customStyle,
          originalImageUrl: currentArticle.originalImageUrl,
        });

        if (genResult?.imageUrl) {
          currentArticle = await prisma.article.update({
            where: { id: currentArticle.id },
            data: {
              generatedImageUrl: genResult.imageUrl,
              imagePrompt: prompt,
              // Set AI_GENERATED as active cover unless user explicitly uploaded a cover and only asked for AI image in body
              selectedImage:
                coverImageUrl && insertAiImageInBody
                  ? "ORIGINAL"
                  : "AI_GENERATED",
            },
          });

          if (insertAiImageInBody) {
            rawBodyImages.push({
              imageUrl: genResult.imageUrl,
              caption: currentArticle.title || fallbackTitle,
              alt: currentArticle.title || fallbackTitle,
            });
          }
        }
      } catch (imgErr) {
        imageGenerationWarning =
          imgErr instanceof Error
            ? imgErr.message
            : "Não foi possível gerar a foto por IA agora; você pode gerá-la na tela de revisão.";
      }
    }

    // 4. Distribute uploaded / generated body images into article HTML content
    if (rawBodyImages.length > 0) {
      const updatedHtmlContent = distributeImagesInHtmlContent(
        currentArticle.content || fallbackHtml,
        rawBodyImages
      );

      currentArticle = await prisma.article.update({
        where: { id: currentArticle.id },
        data: { content: updatedHtmlContent },
      });
    }

    return NextResponse.json({
      success: true,
      article: currentArticle,
      completionLevel,
      aiWarning,
      imageGenerationWarning,
    });
  } catch (error) {
    return handleApiError(error, request, {
      module: "AI",
      screen: "Criação Manual de Matéria / Pauta",
      userFacingMessage: "Erro ao criar e processar matéria a partir do texto",
    });
  }
}

