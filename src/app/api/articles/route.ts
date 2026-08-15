import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ArticleStatus } from "@prisma/client";
import { getSessionWorkspaceId } from "@/lib/workspace";

export async function GET(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");

    const whereClause: { workspaceId: string; status?: ArticleStatus } = {
      workspaceId,
    };

    if (statusParam && ["PENDING", "PUBLISHED", "REJECTED"].includes(statusParam.toUpperCase())) {
      whereClause.status = statusParam.toUpperCase() as ArticleStatus;
    }

    const articles = await prisma.article.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        source: {
          select: { id: true, name: true, rssUrl: true },
        },
        suggestedCategory: {
          select: { id: true, name: true, slug: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json(articles);
  } catch (error) {
    console.error("GET /api/articles error:", error);
    return NextResponse.json({ error: "Erro ao buscar notícias" }, { status: 500 });
  }
}

