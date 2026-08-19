import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
              },
            },
          },
        },
        sources: true,
        wordpressSites: true,
        configurations: true,
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    // Calculate usage
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [articlesProcessedThisMonth, totalArticlesCount] = await Promise.all([
      prisma.article.count({
        where: {
          workspaceId: id,
          processedAt: {
            not: null,
            gte: startOfMonth,
          },
        },
      }),
      prisma.article.count({
        where: { workspaceId: id },
      }),
    ]);

    // Sanitize WordPress sites (secrets protection)
    const sanitizedWordPressSites = workspace.wordpressSites.map((site) => ({
      id: site.id,
      name: site.name,
      url: site.url,
      username: site.username,
      hasPassword: Boolean(site.encryptedApplicationPassword),
      defaultPromptType: site.defaultPromptType,
      active: site.active,
      createdAt: site.createdAt,
    }));

    // Sanitize configurations (secrets protection)
    const sanitizedConfigurations = workspace.configurations.map((cfg) => {
      const parsed = cfg.value && typeof cfg.value === "object" ? { ...cfg.value as Record<string, unknown> } : {};
      if ("apiKey" in parsed) {
        parsed.hasApiKey = Boolean(parsed.apiKey);
        delete parsed.apiKey;
      }
      if ("password" in parsed) {
        parsed.hasPassword = Boolean(parsed.password);
        delete parsed.password;
      }
      return {
        id: cfg.id,
        key: cfg.key,
        value: parsed,
        createdAt: cfg.createdAt,
        updatedAt: cfg.updatedAt,
      };
    });

    return NextResponse.json({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      active: workspace.active,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
      subscription: workspace.subscription,
      members: workspace.members,
      sources: workspace.sources,
      wordpressSites: sanitizedWordPressSites,
      configurations: sanitizedConfigurations,
      stats: {
        articlesProcessedThisMonth,
        totalArticlesCount,
        activeSourcesCount: workspace.sources.filter((s) => s.active).length,
        totalSourcesCount: workspace.sources.length,
        wordpressCount: workspace.wordpressSites.length,
        membersCount: workspace.members.length,
        maxArticles: workspace.subscription?.plan?.maxArticles ?? 50,
        maxSources: workspace.subscription?.plan?.maxSources ?? 3,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar empresa";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json();
    const { name, slug, active, planId } = body;

    const data: Record<string, unknown> = {};
    if (typeof name === "string" && name.trim()) data.name = name.trim();
    if (typeof slug === "string" && slug.trim()) {
      data.slug = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    }
    if (typeof active === "boolean") data.active = active;

    await prisma.workspace.update({
      where: { id },
      data,
    });

    // Update plan if requested
    if (planId) {
      await prisma.subscription.upsert({
        where: { workspaceId: id },
        update: { planId, status: "ACTIVE" },
        create: {
          workspaceId: id,
          planId,
          status: "ACTIVE",
        },
      });
    }

    const fullWorkspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    return NextResponse.json(fullWorkspace);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar empresa";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    // Safe inactivate
    await prisma.workspace.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ success: true, message: "Empresa inativada com sucesso." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao inativar empresa";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
