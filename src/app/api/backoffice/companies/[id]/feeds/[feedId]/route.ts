import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";
import { BillingService } from "@/lib/billing";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; feedId: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id: workspaceId, feedId } = await params;
    const body = await request.json();
    const { name, creditName, rssUrl, defaultPromptType, active, wordpressSiteIds } = body;

    // Strict tenant boundary validation
    const existingSource = await prisma.source.findUnique({
      where: { id: feedId },
    });

    if (!existingSource || existingSource.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: "Feed não encontrado ou não pertence a esta empresa." },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};
    if (typeof name === "string" && name.trim()) data.name = name.trim();
    if (typeof creditName === "string") data.creditName = creditName.trim() || null;
    if (typeof rssUrl === "string" && rssUrl.trim()) data.rssUrl = rssUrl.trim();
    if (typeof defaultPromptType === "string") {
      data.defaultPromptType = defaultPromptType.trim() || null;
    }
    if (typeof active === "boolean") {
      // If activating a previously inactive source, check limits
      if (active && !existingSource.active) {
        const limitCheck = await BillingService.checkLimit(workspaceId, "SOURCES");
        if (!limitCheck.allowed) {
          return NextResponse.json({ error: limitCheck.message }, { status: 403 });
        }
      }
      data.active = active;
    }

    await prisma.source.update({
      where: { id: feedId },
      data,
    });

    // Update WordPress associations if provided
    if (Array.isArray(wordpressSiteIds)) {
      // Remove current associations
      await prisma.wordPressSiteSource.deleteMany({
        where: {
          sourceId: feedId,
          workspaceId,
        },
      });

      if (wordpressSiteIds.length > 0) {
        const validSites = await prisma.wordPressSite.findMany({
          where: {
            id: { in: wordpressSiteIds },
            workspaceId,
          },
          select: { id: true },
        });

        if (validSites.length > 0) {
          await prisma.wordPressSiteSource.createMany({
            data: validSites.map((site) => ({
              workspaceId,
              sourceId: feedId,
              wordpressSiteId: site.id,
            })),
            skipDuplicates: true,
          });
        }
      }
    }

    const finalSource = await prisma.source.findUnique({
      where: { id: feedId },
      include: {
        wordpressSiteSources: {
          include: {
            wordpressSite: true,
          },
        },
      },
    });

    return NextResponse.json(finalSource);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar feed";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; feedId: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id: workspaceId, feedId } = await params;

    // Strict tenant boundary validation
    const existingSource = await prisma.source.findUnique({
      where: { id: feedId },
    });

    if (!existingSource || existingSource.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: "Feed não encontrado ou não pertence a esta empresa." },
        { status: 404 }
      );
    }

    // Cascade relationships in a transaction
    await prisma.$transaction([
      prisma.wordPressSiteSource.deleteMany({ where: { sourceId: feedId } }),
      prisma.article.deleteMany({ where: { sourceId: feedId } }),
      prisma.source.delete({ where: { id: feedId } }),
    ]);

    return NextResponse.json({ success: true, message: "Feed excluído com sucesso." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao excluir feed";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
