import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";
import { encrypt } from "@/lib/crypto";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; siteId: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id: workspaceId, siteId } = await params;

    const site = await prisma.wordPressSite.findFirst({
      where: { id: siteId, workspaceId },
      include: {
        sources: {
          include: {
            source: true,
          },
        },
        categories: true,
        _count: {
          select: {
            articles: true,
          },
        },
      },
    });

    if (!site) {
      return NextResponse.json({ error: "Site WordPress não encontrado nesta empresa." }, { status: 404 });
    }

    return NextResponse.json({
      id: site.id,
      workspaceId: site.workspaceId,
      name: site.name,
      url: site.url,
      username: site.username,
      hasPassword: Boolean(site.encryptedApplicationPassword),
      defaultPromptType: site.defaultPromptType,
      active: site.active,
      createdAt: site.createdAt,
      updatedAt: site.updatedAt,
      sources: site.sources,
      categories: site.categories,
      _count: site._count,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao buscar site WordPress";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; siteId: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id: workspaceId, siteId } = await params;
    const body = await request.json();
    const {
      name,
      url,
      username,
      applicationPassword,
      defaultPromptType,
      active,
      sourceIds,
    } = body;

    const existing = await prisma.wordPressSite.findFirst({
      where: { id: siteId, workspaceId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Site WordPress não encontrado nesta empresa." }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (typeof name === "string" && name.trim()) data.name = name.trim();
    if (typeof url === "string" && url.trim()) data.url = url.trim().replace(/\/+$/, "");
    if (typeof username === "string" && username.trim()) data.username = username.trim();
    if (typeof defaultPromptType === "string") {
      data.defaultPromptType = defaultPromptType.trim() || null;
    }
    if (typeof active === "boolean") data.active = active;

    // Encrypt new application password only if provided
    if (typeof applicationPassword === "string" && applicationPassword.trim()) {
      data.encryptedApplicationPassword = encrypt(applicationPassword.trim());
    }

    await prisma.wordPressSite.update({
      where: { id: siteId },
      data,
    });

    // Update associated sources if provided
    if (Array.isArray(sourceIds)) {
      await prisma.wordPressSiteSource.deleteMany({
        where: { wordpressSiteId: siteId, workspaceId },
      });

      if (sourceIds.length > 0) {
        const validSources = await prisma.source.findMany({
          where: {
            id: { in: sourceIds },
            workspaceId,
          },
          select: { id: true },
        });

        if (validSources.length > 0) {
          await prisma.wordPressSiteSource.createMany({
            data: validSources.map((s) => ({
              workspaceId,
              wordpressSiteId: siteId,
              sourceId: s.id,
            })),
            skipDuplicates: true,
          });
        }
      }
    }

    const finalSite = await prisma.wordPressSite.findUnique({
      where: { id: siteId },
      include: {
        sources: {
          include: {
            source: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: finalSite?.id,
      workspaceId: finalSite?.workspaceId,
      name: finalSite?.name,
      url: finalSite?.url,
      username: finalSite?.username,
      hasPassword: Boolean(finalSite?.encryptedApplicationPassword),
      defaultPromptType: finalSite?.defaultPromptType,
      active: finalSite?.active,
      createdAt: finalSite?.createdAt,
      updatedAt: finalSite?.updatedAt,
      sources: finalSite?.sources,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar site WordPress";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; siteId: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id: workspaceId, siteId } = await params;

    const existing = await prisma.wordPressSite.findFirst({
      where: { id: siteId, workspaceId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Site WordPress não encontrado nesta empresa." }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.wordPressSiteSource.deleteMany({ where: { wordpressSiteId: siteId } }),
      prisma.wordPressCategory.deleteMany({ where: { wordpressSiteId: siteId } }),
      prisma.article.updateMany({
        where: { wordpressSiteId: siteId },
        data: { wordpressSiteId: null },
      }),
      prisma.wordPressSite.delete({ where: { id: siteId } }),
    ]);

    return NextResponse.json({ success: true, message: "Site WordPress excluído com sucesso." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao excluir site WordPress";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
