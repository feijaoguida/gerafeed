import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";
import { BillingService } from "@/lib/billing";

export async function GET(request: Request) {
  try {
    await requireSuperAdmin();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status"); // "active" | "inactive" | null
    const planSlug = searchParams.get("plan");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10)));
    const skip = (page - 1) * pageSize;

    // Filter building
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status === "active") {
      where.active = true;
    } else if (status === "inactive") {
      where.active = false;
    }

    if (planSlug) {
      where.subscription = {
        plan: {
          slug: planSlug,
        },
      };
    }

    const [total, workspaces] = await Promise.all([
      prisma.workspace.count({ where }),
      prisma.workspace.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          subscription: {
            include: {
              plan: true,
            },
          },
          _count: {
            select: {
              members: true,
              sources: true,
              wordpressSites: true,
            },
          },
        },
      }),
    ]);

    // Calculate usage for each workspace without N+1 queries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const workspaceIds = workspaces.map((ws) => ws.id);

    const [articlesGrouped, sourcesGrouped] = await Promise.all([
      workspaceIds.length > 0
        ? prisma.article.groupBy({
            by: ["workspaceId"],
            where: {
              workspaceId: { in: workspaceIds },
              processedAt: {
                not: null,
                gte: startOfMonth,
              },
            },
            _count: { _all: true },
          })
        : [],
      workspaceIds.length > 0
        ? prisma.source.groupBy({
            by: ["workspaceId"],
            where: {
              workspaceId: { in: workspaceIds },
              active: true,
            },
            _count: { _all: true },
          })
        : [],
    ]);

    const articlesMap = new Map(articlesGrouped.map((g) => [g.workspaceId, g._count._all]));
    const sourcesMap = new Map(sourcesGrouped.map((g) => [g.workspaceId, g._count._all]));

    const companiesWithUsage = workspaces.map((ws) => {
      const articlesProcessed = articlesMap.get(ws.id) ?? 0;
      const activeSourcesCount = sourcesMap.get(ws.id) ?? 0;
      const plan = ws.subscription?.plan;
      const maxArticles = plan?.maxArticles ?? 50;
      const maxSources = plan?.maxSources ?? 3;

      return {
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        active: ws.active,
        createdAt: ws.createdAt,
        plan: plan ? { name: plan.name, slug: plan.slug } : { name: "Gratuito", slug: "free" },
        stats: {
          membersCount: ws._count.members,
          sourcesCount: ws._count.sources,
          activeSourcesCount,
          wordpressCount: ws._count.wordpressSites,
          articlesProcessedThisMonth: articlesProcessed,
          maxArticles,
          maxSources,
        },
      };
    });

    return NextResponse.json({
      companies: companiesWithUsage,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar empresas";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();
    const body = await request.json();
    const { name, slug, planSlug, website, phone } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Nome da empresa é obrigatório." }, { status: 400 });
    }
    if (!slug || typeof slug !== "string" || !slug.trim()) {
      return NextResponse.json({ error: "Slug da empresa é obrigatório." }, { status: 400 });
    }

    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");

    const existing = await prisma.workspace.findUnique({
      where: { slug: cleanSlug },
    });
    if (existing) {
      return NextResponse.json({ error: "Já existe uma empresa cadastrada com este slug." }, { status: 409 });
    }

    let cleanWebsite = typeof website === "string" && website.trim() ? website.trim() : null;
    if (cleanWebsite && !cleanWebsite.startsWith("http://") && !cleanWebsite.startsWith("https://")) {
      cleanWebsite = `https://${cleanWebsite}`;
    }
    const cleanPhone = typeof phone === "string" && phone.trim() ? phone.trim() : null;

    // Resolve plan
    let targetPlan = null;
    if (planSlug) {
      targetPlan = await prisma.plan.findUnique({ where: { slug: planSlug } });
    }
    if (!targetPlan) {
      await BillingService.ensureDefaultPlans();
      targetPlan = await prisma.plan.findUnique({ where: { slug: "free" } });
    }

    const workspace = await prisma.workspace.create({
      data: {
        name: name.trim(),
        slug: cleanSlug,
        website: cleanWebsite,
        phone: cleanPhone,
        active: true,
        ...(targetPlan
          ? {
              subscription: {
                create: {
                  planId: targetPlan.id,
                  status: "ACTIVE",
                },
              },
            }
          : {}),
      },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar empresa";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
