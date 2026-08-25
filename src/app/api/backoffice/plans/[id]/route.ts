import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";
import { validatePlanPricing, toDecimal } from "@/lib/pricing";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    const plan = await prisma.plan.findUnique({
      where: { id },
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

    if (!plan) {
      return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar plano";
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

    const existingPlan = await prisma.plan.findUnique({ where: { id } });
    if (!existingPlan) {
      return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
    }

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

    const newMonthlyPrice = monthlyPrice !== undefined 
      ? monthlyPrice 
      : (price !== undefined ? price : ((existingPlan as { monthlyPrice?: unknown; price?: number }).monthlyPrice ?? existingPlan.price ?? 0));
    const newAnnualDiscount = annualDiscountPercent !== undefined 
      ? annualDiscountPercent 
      : ((existingPlan as { annualDiscountPercent?: unknown }).annualDiscountPercent ?? 0);

    if (monthlyPrice !== undefined || annualDiscountPercent !== undefined || price !== undefined) {
      const validation = validatePlanPricing(newMonthlyPrice, newAnnualDiscount);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (typeof name === "string" && name.trim()) updateData.name = name.trim();
    if (typeof slug === "string" && slug.trim()) {
      updateData.slug = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    }
    if (description !== undefined) updateData.description = typeof description === "string" ? description.trim() : null;
    
    if (monthlyPrice !== undefined || price !== undefined) {
      const decMonthly = toDecimal(newMonthlyPrice);
      updateData.monthlyPrice = decMonthly;
      updateData.price = decMonthly.toNumber();
    }
    if (annualDiscountPercent !== undefined) {
      updateData.annualDiscountPercent = toDecimal(newAnnualDiscount);
    }

    if (typeof periodicity === "string") updateData.periodicity = periodicity;
    if (typeof active === "boolean") updateData.active = active;
    if (typeof highlight === "boolean") updateData.highlight = highlight;
    if (maxArticles !== undefined) updateData.maxArticles = typeof maxArticles === "number" ? maxArticles : parseInt(maxArticles, 10) || 50;
    if (maxDailyArticles !== undefined) updateData.maxDailyArticles = typeof maxDailyArticles === "number" ? maxDailyArticles : parseInt(maxDailyArticles, 10) || 5;
    if (maxSources !== undefined) updateData.maxSources = typeof maxSources === "number" ? maxSources : parseInt(maxSources, 10) || 3;
    if (maxWordPressSites !== undefined) updateData.maxWordPressSites = typeof maxWordPressSites === "number" ? maxWordPressSites : parseInt(maxWordPressSites, 10) || 1;

    // Execute plan update
    await prisma.plan.update({
      where: { id },
      data: updateData,
    });

    // If features array is provided, sync planFeatures
    if (Array.isArray(features)) {
      // Remove existing features for this plan
      await prisma.planFeature.deleteMany({
        where: { planId: id },
      });

      // Insert new feature links
      for (const f of features) {
        if (f.featureId) {
          await prisma.planFeature.create({
            data: {
              planId: id,
              featureId: f.featureId,
              enabled: f.enabled !== undefined ? Boolean(f.enabled) : true,
              limit: typeof f.limit === "number" ? f.limit : null,
            },
          });
        }
      }
    }

    const fullPlan = await prisma.plan.findUnique({
      where: { id },
      include: {
        planFeatures: {
          include: {
            feature: true,
          },
        },
      },
    });

    return NextResponse.json(fullPlan);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar plano";
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

    const subscriptionsCount = await prisma.subscription.count({
      where: { planId: id },
    });

    if (subscriptionsCount > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir um plano com assinaturas vinculadas. Desative-o." },
        { status: 400 }
      );
    }

    await prisma.plan.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Plano excluído com sucesso." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao excluir plano";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
