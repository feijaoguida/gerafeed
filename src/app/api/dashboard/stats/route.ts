import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { BillingService } from "@/lib/billing";

export async function GET() {
  try {
    const workspaceId = await getSessionWorkspaceId();

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [
      pendingCount,
      publishedCount,
      rejectedCount,
      activeSourcesCount,
      productsCount,
      offersCount,
      affiliateClicksCount,
      wordpressSitesCount,
      articlesDailyUsed,
      articlesMonthlyUsed,
      sub,
    ] = await Promise.all([
      prisma.article.count({ where: { workspaceId, status: "PENDING" } }),
      prisma.article.count({ where: { workspaceId, status: "PUBLISHED" } }),
      prisma.article.count({ where: { workspaceId, status: "REJECTED" } }),
      prisma.source.count({ where: { workspaceId, active: true } }),
      prisma.product.count({ where: { workspaceId } }),
      prisma.productOffer.count({ where: { workspaceId, status: "ACTIVE" } }),
      prisma.affiliateClick.count({ where: { workspaceId } }),
      prisma.wordPressSite.count({ where: { workspaceId } }),
      prisma.article.count({
        where: {
          workspaceId,
          processedAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      prisma.article.count({
        where: {
          workspaceId,
          processedAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      BillingService.getWorkspaceSubscription(workspaceId),
    ]);

    const plan = sub.plan;

    return NextResponse.json({
      pendingCount,
      publishedCount,
      rejectedCount,
      activeSourcesCount,
      productsCount,
      offersCount,
      affiliateClicksCount,
      wordpressSitesCount,
      planUsage: {
        planName: plan.name,
        planSlug: plan.slug,
        subscriptionStatus: sub.status,
        articlesDaily: {
          used: articlesDailyUsed,
          limit: plan.maxDailyArticles,
          remaining: Math.max(0, plan.maxDailyArticles - articlesDailyUsed),
          percentage: plan.maxDailyArticles > 0 ? Math.min(100, Math.round((articlesDailyUsed / plan.maxDailyArticles) * 100)) : 0,
        },
        articlesMonthly: {
          used: articlesMonthlyUsed,
          limit: plan.maxArticles,
          remaining: Math.max(0, plan.maxArticles - articlesMonthlyUsed),
          percentage: plan.maxArticles > 0 ? Math.min(100, Math.round((articlesMonthlyUsed / plan.maxArticles) * 100)) : 0,
        },
        wordpressSites: {
          used: wordpressSitesCount,
          limit: plan.maxWordPressSites,
          remaining: Math.max(0, plan.maxWordPressSites - wordpressSitesCount),
          percentage: plan.maxWordPressSites > 0 ? Math.min(100, Math.round((wordpressSitesCount / plan.maxWordPressSites) * 100)) : 0,
        },
        sources: {
          used: activeSourcesCount,
          limit: plan.maxSources,
          remaining: Math.max(0, plan.maxSources - activeSourcesCount),
          percentage: plan.maxSources > 0 ? Math.min(100, Math.round((activeSourcesCount / plan.maxSources) * 100)) : 0,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error);
    return NextResponse.json({ error: "Erro ao buscar estatísticas do dashboard" }, { status: 500 });
  }
}
