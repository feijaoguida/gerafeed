import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { getConfig } from "@/lib/config";
import { handleApiError } from "@/lib/errors/service";
import {
  ImageSettingsStored,
  ImageGenerationService,
  buildImagePrompt,
  ImageStyle,
} from "@/lib/images";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const article = await prisma.article.findUnique({
      where: {
        id,
        workspaceId,
      },
    });

    if (!article) {
      return NextResponse.json(
        { error: "Artigo não encontrado ou sem permissão de acesso." },
        { status: 404 }
      );
    }

    const imageConfig = await getConfig<ImageSettingsStored>(
      "imageSettings",
      workspaceId
    );

    const style = (body?.style || imageConfig?.imageStyle || "REALISTIC") as ImageStyle;
    const customStyle = body?.customStyle || imageConfig?.customImageStyle;
    const promptTemplate = body?.promptTemplate || imageConfig?.imagePromptTemplate;

    let prompt: string = (body?.customPrompt as string | undefined)?.trim() || "";
    if (!prompt) {
      prompt = await buildImagePrompt({
        title: article.title || article.originalTitle || "",
        summary: article.summary || article.originalDescription,
        content: article.content || article.originalContent || "",
        originalTitle: article.originalTitle,
        originalImageUrl: article.originalImageUrl,
        style,
        customStyle,
        promptTemplate,
      });
    }

    const genResult = await ImageGenerationService.generateImage({
      prompt,
      articleId: id,
      workspaceId,
      style,
      customStyle,
      originalImageUrl: article.originalImageUrl,
    });

    if (!genResult || !genResult.imageUrl) {
      return NextResponse.json(
        { error: "Não foi possível gerar a imagem através do provedor configurado." },
        { status: 502 }
      );
    }

    const updatedArticle = await prisma.article.update({
      where: { id },
      data: {
        generatedImageUrl: genResult.imageUrl,
        imagePrompt: prompt,
        selectedImage: "AI_GENERATED",
      },
    });

    return NextResponse.json({
      success: true,
      imageUrl: genResult.imageUrl,
      prompt,
      provider: genResult.provider,
      article: updatedArticle,
    });
  } catch (error) {
    const resolvedParams = await params;
    return handleApiError(error, request, {
      module: "AI",
      screen: "Artigos / Geração de Imagem IA",
      query: { articleId: resolvedParams.id },
      userFacingMessage: "Erro ao gerar imagem para a notícia com IA",
    });
  }
}
