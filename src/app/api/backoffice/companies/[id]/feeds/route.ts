import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";
import { BillingService } from "@/lib/billing";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id: workspaceId } = await params;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const whereClause: Record<string, unknown> = {
      workspaceId,
    };

    if (search.trim()) {
      whereClause.OR = [
        { name: { contains: search.trim(), mode: "insensitive" } },
        { creditName: { contains: search.trim(), mode: "insensitive" } },
        { rssUrl: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const sources = await prisma.source.findMany({
      where: whereClause,
      include: {
        wordpressSiteSources: {
          include: {
            wordpressSite: {
              select: {
                id: true,
                name: true,
                url: true,
              },
            },
          },
        },
        _count: {
          select: {
            articles: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(sources);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar feeds";
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
    const { name, creditName, rssUrl, defaultPromptType, active = true, wordpressSiteIds = [] } = body;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Nome do feed é obrigatório" }, { status: 400 });
    }

    if (!rssUrl || typeof rssUrl !== "string" || !rssUrl.trim()) {
      return NextResponse.json({ error: "URL do RSS é obrigatória" }, { status: 400 });
    }

    // Check billing limit
    if (Boolean(active)) {
      const limitCheck = await BillingService.checkLimit(workspaceId, "SOURCES");
      if (!limitCheck.allowed) {
        return NextResponse.json({ error: limitCheck.message }, { status: 403 });
      }
    }

    // Create source
    const source = await prisma.source.create({
      data: {
        workspaceId,
        name: name.trim(),
        creditName: typeof creditName === "string" ? creditName.trim() || null : null,
        rssUrl: rssUrl.trim(),
        defaultPromptType: typeof defaultPromptType === "string" ? defaultPromptType.trim() || null : null,
        active: Boolean(active),
      },
    });

    // Associate WordPress sites if valid for this workspace
    if (Array.isArray(wordpressSiteIds) && wordpressSiteIds.length > 0) {
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
            sourceId: source.id,
            wordpressSiteId: site.id,
          })),
          skipDuplicates: true,
        });
      }
    }

    const created = await prisma.source.findUnique({
      where: { id: source.id },
      include: {
        wordpressSiteSources: {
          include: {
            wordpressSite: true,
          },
        },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar feed";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
