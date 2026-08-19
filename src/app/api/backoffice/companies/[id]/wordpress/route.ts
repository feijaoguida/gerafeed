import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";
import { encrypt } from "@/lib/crypto";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id: workspaceId } = await params;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const sites = await prisma.wordPressSite.findMany({
      where: { workspaceId },
      include: {
        sources: {
          include: {
            source: {
              select: {
                id: true,
                name: true,
                rssUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            categories: true,
            articles: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const sanitized = sites.map((site) => ({
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
      _count: site._count,
    }));

    return NextResponse.json(sanitized);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar sites WordPress";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id: workspaceId } = await params;
    const body = await request.json();
    const {
      name,
      url,
      username,
      applicationPassword,
      defaultPromptType,
      active = true,
      sourceIds = [],
    } = body;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Nome do site WordPress é obrigatório" }, { status: 400 });
    }
    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json({ error: "URL do site WordPress é obrigatória" }, { status: 400 });
    }
    if (!username || typeof username !== "string" || !username.trim()) {
      return NextResponse.json({ error: "Usuário do WordPress é obrigatório" }, { status: 400 });
    }

    const encryptedPassword = applicationPassword ? encrypt(applicationPassword.trim()) : "";

    const site = await prisma.wordPressSite.create({
      data: {
        workspaceId,
        name: name.trim(),
        url: url.trim().replace(/\/+$/, ""),
        username: username.trim(),
        encryptedApplicationPassword: encryptedPassword,
        defaultPromptType: typeof defaultPromptType === "string" ? defaultPromptType.trim() || null : null,
        active: Boolean(active),
      },
    });

    // Associate sources if provided
    if (Array.isArray(sourceIds) && sourceIds.length > 0) {
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
            wordpressSiteId: site.id,
            sourceId: s.id,
          })),
          skipDuplicates: true,
        });
      }
    }

    const created = await prisma.wordPressSite.findUnique({
      where: { id: site.id },
      include: {
        sources: {
          include: {
            source: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        id: created?.id,
        workspaceId: created?.workspaceId,
        name: created?.name,
        url: created?.url,
        username: created?.username,
        hasPassword: Boolean(created?.encryptedApplicationPassword),
        defaultPromptType: created?.defaultPromptType,
        active: created?.active,
        createdAt: created?.createdAt,
        updatedAt: created?.updatedAt,
        sources: created?.sources,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar site WordPress";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
