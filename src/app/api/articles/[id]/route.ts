import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { ArticlePersistenceService } from "@/lib/affiliate/article-persistence-service";
import { AffiliateContentError } from "@/lib/affiliate/block-contract";

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
        source: { select: { id: true, name: true, rssUrl: true, creditName: true } },
        wordpressSite: { select: { id: true, name: true, url: true } },
        suggestedCategory: { select: { id: true, name: true, slug: true, wordpressId: true } },
        category: { select: { id: true, name: true, slug: true, wordpressId: true } },
        articleProducts: {
          orderBy: { position: "asc" },
          include: {
            product: {
              include: {
                category: true,
                offers: {
                  where: { status: "ACTIVE" },
                  orderBy: { price: "asc" },
                },
              },
            },
            offer: true,
          },
        },
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

    const updated = await ArticlePersistenceService.validateAndSaveArticle(
      workspaceId,
      id,
      body
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/articles/[id] error:", error);
    if (error instanceof AffiliateContentError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Erro ao atualizar notícia";
    const status = message.includes("não está habilitado")
      ? 403
      : message.includes("não encontrada") || message.includes("não encontrado")
      ? 404
      : message.includes("oferta") || message.includes("Oferta")
      ? 409
      : message.includes("inválido") || message.includes("obrigatório")
      ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

