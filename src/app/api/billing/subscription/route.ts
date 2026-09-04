import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { BillingService, AI_FEATURES } from "@/lib/billing";

export async function GET() {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const subscription = await BillingService.getWorkspaceSubscription(workspaceId);

    const articlesCheck = await BillingService.checkLimit(workspaceId, "ARTICLES");
    const sourcesCheck = await BillingService.checkLimit(workspaceId, "SOURCES");

    // Load AI feature entitlements
    const [unlimitedNiches, unlimitedStyles, advancedProviders] = await Promise.all([
      BillingService.hasFeature(workspaceId, AI_FEATURES.UNLIMITED_NICHES),
      BillingService.hasFeature(workspaceId, AI_FEATURES.UNLIMITED_STYLES),
      BillingService.hasFeature(workspaceId, AI_FEATURES.ADVANCED_PROVIDERS),
    ]);

    // In addition to aiFeatures, return active feature keys for consistency
    const planFeatures = await prisma.planFeature.findMany({
      where: {
        planId: subscription.planId,
        enabled: true,
      },
      include: { feature: true },
    });
    const features = planFeatures.map((pf) => pf.feature.key);

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: subscription.plan,
        validUntil: subscription.validUntil,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
      usage: {
        articles: {
          current: articlesCheck.current,
          limit: articlesCheck.limit,
          allowed: articlesCheck.allowed,
        },
        sources: {
          current: sourcesCheck.current,
          limit: sourcesCheck.limit,
          allowed: sourcesCheck.allowed,
        },
      },
      features,
      aiFeatures: {
        unlimitedNiches,
        unlimitedStyles,
        advancedProviders,
      },
    });
  } catch (error) {
    console.error("GET /api/billing/subscription error:", error);
    return NextResponse.json(
      { error: "Erro ao consultar dados da assinatura do workspace" },
      { status: 500 }
    );
  }
}
