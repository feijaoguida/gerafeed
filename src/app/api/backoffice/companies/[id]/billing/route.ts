import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";
import { BillingService } from "@/lib/billing";
import { BillingProfileService, maskCpfCnpj } from "@/lib/billing-profile";
import { SubscriptionStatus } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id: workspaceId } = await params;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    // Reuse BillingService for single source of truth
    const subscription = await BillingService.getWorkspaceSubscription(workspaceId);
    const articlesLimit = await BillingService.checkLimit(workspaceId, "ARTICLES");
    const sourcesLimit = await BillingService.checkLimit(workspaceId, "SOURCES");
    const rawProfile = await BillingProfileService.getProfile(workspaceId);

    const totalArticlesCount = await prisma.article.count({ where: { workspaceId } });
    const totalSourcesCount = await prisma.source.count({ where: { workspaceId } });

    const billingProfile = rawProfile
      ? {
          ...rawProfile,
          maskedCpfCnpj: maskCpfCnpj(rawProfile.cpfCnpj),
        }
      : null;

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        active: (workspace as unknown as { active?: boolean }).active ?? true,
        asaasCustomerId: workspace.asaasCustomerId,
        stripeCustomerId: workspace.stripeCustomerId,
        createdAt: workspace.createdAt,
      },
      billingProfile,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: subscription.plan,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      },
      usage: {
        articles: {
          currentMonth: articlesLimit.current,
          limit: articlesLimit.limit,
          remaining: articlesLimit.limit === -1 ? null : Math.max(0, articlesLimit.limit - articlesLimit.current),
          allowed: articlesLimit.allowed,
          totalAllTime: totalArticlesCount,
        },
        sources: {
          active: sourcesLimit.current,
          limit: sourcesLimit.limit,
          remaining: sourcesLimit.limit === -1 ? null : Math.max(0, sourcesLimit.limit - sourcesLimit.current),
          allowed: sourcesLimit.allowed,
          totalRegistered: totalSourcesCount,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar dados de cobrança";
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
    const { id: workspaceId } = await params;
    const body = await request.json();
    const { planId, status, asaasCustomerId, stripeCustomerId, billingProfile } = body;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { subscription: true },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    // 1. Update customer IDs on workspace if provided
    const workspaceData: { asaasCustomerId?: string; stripeCustomerId?: string } = {};
    if (typeof asaasCustomerId === "string") workspaceData.asaasCustomerId = asaasCustomerId.trim() || undefined;
    if (typeof stripeCustomerId === "string") workspaceData.stripeCustomerId = stripeCustomerId.trim() || undefined;

    if (Object.keys(workspaceData).length > 0) {
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: workspaceData,
      });
    }

    // 2. Update billing profile if provided by SuperAdmin
    if (billingProfile && typeof billingProfile === "object") {
      await BillingProfileService.upsertProfile(workspaceId, billingProfile);
    }

    // 3. Update subscription plan and status
    if (planId || status) {
      let validStatus: SubscriptionStatus | undefined;
      if (status && Object.values(SubscriptionStatus).includes(status as SubscriptionStatus)) {
        validStatus = status as SubscriptionStatus;
      }

      if (planId) {
        const planExists = await prisma.plan.findUnique({ where: { id: planId } });
        if (!planExists) {
          return NextResponse.json({ error: "Plano informado não existe." }, { status: 400 });
        }
      }

      const existingSub = await prisma.subscription.findUnique({ where: { workspaceId } });

      if (existingSub) {
        await prisma.subscription.update({
          where: { workspaceId },
          data: {
            ...(planId ? { planId } : {}),
            ...(validStatus ? { status: validStatus } : {}),
          },
        });
      } else {
        const defaultPlan = planId || (await BillingService.getWorkspaceSubscription(workspaceId)).planId;
        await prisma.subscription.create({
          data: {
            workspaceId,
            planId: defaultPlan,
            status: validStatus || SubscriptionStatus.ACTIVE,
          },
        });
      }
    }

    const updatedSub = await BillingService.getWorkspaceSubscription(workspaceId);
    const updatedProfile = await BillingProfileService.getProfile(workspaceId);

    return NextResponse.json({
      success: true,
      message: "Dados de faturamento e assinatura atualizados com sucesso!",
      subscription: updatedSub,
      billingProfile: updatedProfile
        ? { ...updatedProfile, maskedCpfCnpj: maskCpfCnpj(updatedProfile.cpfCnpj) }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar faturamento";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
