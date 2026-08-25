import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";
import { validatePlanPricing, toDecimal } from "@/lib/pricing";

export async function GET() {
  try {
    await requireSuperAdmin();
    const plans = await prisma.plan.findMany({
      orderBy: { monthlyPrice: "asc" },
      include: {
        planFeatures: {
          include: {
            feature: true,
          },
        },
        _count: {
          select: { subscriptions: true },
        },
      },
    });
    return NextResponse.json(plans);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar planos";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();
    const body = await request.json();
    const {
      name,
      slug,
      description,
      price,
      monthlyPrice,
      annualDiscountPercent,
      periodicity,
      active,
      highlight,
      maxArticles,
      maxDailyArticles,
      maxSources,
      maxWordPressSites,
      features,
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Nome do plano é obrigatório." }, { status: 400 });
    }
    if (!slug || typeof slug !== "string" || !slug.trim()) {
      return NextResponse.json({ error: "Slug do plano é obrigatório." }, { status: 400 });
    }

    const resolvedMonthlyPrice = monthlyPrice !== undefined ? monthlyPrice : (price !== undefined ? price : 0);
    const resolvedAnnualDiscount = annualDiscountPercent !== undefined ? annualDiscountPercent : 0;

    const validation = validatePlanPricing(resolvedMonthlyPrice, resolvedAnnualDiscount);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");

    const existing = await prisma.plan.findUnique({
      where: { slug: cleanSlug },
    });
    if (existing) {
      return NextResponse.json({ error: "Já existe um plano com este slug." }, { status: 409 });
    }

    const decMonthly = toDecimal(resolvedMonthlyPrice);
    const decDiscount = toDecimal(resolvedAnnualDiscount);

    const plan = await prisma.plan.create({
      data: {
        name: name.trim(),
        slug: cleanSlug,
        description: description?.trim() || null,
        monthlyPrice: decMonthly,
        annualDiscountPercent: decDiscount,
        price: decMonthly.toNumber(),
        periodicity: typeof periodicity === "string" ? periodicity : "MONTHLY",
        active: active !== undefined ? Boolean(active) : true,
        highlight: highlight !== undefined ? Boolean(highlight) : false,
        maxArticles: typeof maxArticles === "number" ? maxArticles : parseInt(maxArticles, 10) || 50,
        maxDailyArticles: typeof maxDailyArticles === "number" ? maxDailyArticles : parseInt(maxDailyArticles, 10) || 5,
        maxSources: typeof maxSources === "number" ? maxSources : parseInt(maxSources, 10) || 3,
        maxWordPressSites: typeof maxWordPressSites === "number" ? maxWordPressSites : parseInt(maxWordPressSites, 10) || 1,
        ...(Array.isArray(features) && features.length > 0
          ? {
              planFeatures: {
                create: features.map((f: { featureId: string; enabled?: boolean; limit?: number }) => ({
                  featureId: f.featureId,
                  enabled: f.enabled !== undefined ? Boolean(f.enabled) : true,
                  limit: typeof f.limit === "number" ? f.limit : null,
                })),
              },
            }
          : {}),
      },
      include: {
        planFeatures: {
          include: {
            feature: true,
          },
        },
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar plano";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
