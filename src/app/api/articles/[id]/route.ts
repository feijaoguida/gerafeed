import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ArticleStatus } from "@prisma/client";
import { getSessionWorkspaceId } from "@/lib/workspace";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const { id } = await params;
    const article = await prisma.article.findFirst({
      where: { id, workspaceId },
      include: {
        source: { select: { id: true, name: true, rssUrl: true } },
        suggestedCategory: { select: { id: true, name: true, slug: true, wordpressId: true } },
        category: { select: { id: true, name: true, slug: true, wordpressId: true } },
      },
    });

    if (!article) {
      return NextResponse.json({ error: "Notícia não encontrada" }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error("GET /api/articles/[id] error:", error);
    return NextResponse.json({ error: "Erro ao buscar detalhes da notícia" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.article.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Notícia não encontrada" }, { status: 404 });
    }

    const dataToUpdate: Record<string, unknown> = {};

    if (typeof body.title === "string") dataToUpdate.title = body.title.trim();
    if (typeof body.summary === "string") dataToUpdate.summary = body.summary.trim();
    if (typeof body.content === "string") dataToUpdate.content = body.content.trim();
    if (body.categoryId === null || typeof body.categoryId === "string") {
      dataToUpdate.categoryId = body.categoryId;
    }
    if (body.suggestedCategoryId === null || typeof body.suggestedCategoryId === "string") {
      dataToUpdate.suggestedCategoryId = body.suggestedCategoryId;
    }
    if (Array.isArray(body.tags)) {
      dataToUpdate.tags = body.tags.map((t: unknown) => String(t).trim()).filter(Boolean);
    }
    if (typeof body.seoFocusKeyword === "string") dataToUpdate.seoFocusKeyword = body.seoFocusKeyword.trim();
    if (typeof body.seoTitle === "string") dataToUpdate.seoTitle = body.seoTitle.trim();
    if (typeof body.seoDescription === "string") dataToUpdate.seoDescription = body.seoDescription.trim();
    if (typeof body.status === "string" && ["PENDING", "PUBLISHED", "REJECTED"].includes(body.status.toUpperCase())) {
      dataToUpdate.status = body.status.toUpperCase() as ArticleStatus;
    }
    if (typeof body.selectedImage === "string" && ["ORIGINAL", "MODIFIED"].includes(body.selectedImage.toUpperCase())) {
      dataToUpdate.selectedImage = body.selectedImage.toUpperCase();
    }
    if (typeof body.aiScore === "number") dataToUpdate.aiScore = body.aiScore;

    const updated = await prisma.article.update({
      where: { id: existing.id },
      data: dataToUpdate,
      include: {
        source: true,
        suggestedCategory: true,
        category: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/articles/[id] error:", error);
    return NextResponse.json({ error: "Erro ao atualizar notícia" }, { status: 500 });
  }
}

