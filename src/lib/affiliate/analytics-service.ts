import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";

export interface AnalyticsDateFilter {
  period?: "7d" | "30d" | "90d" | "all";
  startDate?: Date | string;
  endDate?: Date | string;
  skipEntitlementCheck?: boolean;
}

export interface TopItem {
  id: string;
  name: string;
  subtitle?: string | null;
  clicks: number;
  percentage: number;
}

export interface TimeSeriesPoint {
  date: string;
  formattedDate: string;
  clicks: number;
}

export interface AffiliateDashboardStats {
  period: "7d" | "30d" | "90d" | "all" | "custom";
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
  summary: {
    totalProducts: number;
    totalActiveOffers: number;
    totalAffiliateArticles: number;
    totalAllTimeClicks: number;
    periodClicks: number;
  };
  timeSeries: TimeSeriesPoint[];
  topProducts: TopItem[];
  topArticles: TopItem[];
  topComponents: TopItem[];
  topSites: TopItem[];
}

export class AffiliateAnalyticsService {
  /**
   * Calculates dashboard analytics and click rankings for a workspace.
   * Enforces tenant isolation and the AFFILIATE_ANALYTICS plan entitlement.
   */
  static async getDashboardStats(
    workspaceId: string,
    filter: AnalyticsDateFilter = {}
  ): Promise<AffiliateDashboardStats> {
    if (!workspaceId) {
      throw new Error("workspaceId é obrigatório para acessar o dashboard de afiliados.");
    }

    // 1. Entitlement verification
    if (!filter.skipEntitlementCheck) {
      await BillingService.assertFeature(
        workspaceId,
        AFFILIATE_FEATURES.ANALYTICS,
        "O recurso de Analytics de Afiliados não está disponível no seu plano. Faça upgrade para desbloquear relatórios e métricas avançadas."
      );
    }

    // 2. Date filtering calculation
    const now = new Date();
    let startDate: Date | undefined;
    let endDate: Date | undefined = now;
    let periodType: "7d" | "30d" | "90d" | "all" | "custom" = filter.period || "30d";

    if (filter.startDate || filter.endDate) {
      periodType = "custom";
      if (filter.startDate) startDate = new Date(filter.startDate);
      if (filter.endDate) endDate = new Date(filter.endDate);
    } else {
      switch (filter.period) {
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "all":
          startDate = undefined;
          break;
        case "30d":
        default:
          periodType = "30d";
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    // 3. Summary queries (tenant-isolated)
    const [
      totalProducts,
      totalActiveOffers,
      totalAffiliateArticles,
      totalAllTimeClicks,
      clicksInPeriod,
    ] = await Promise.all([
      prisma.product.count({
        where: { workspaceId },
      }),
      prisma.productOffer.count({
        where: { workspaceId, status: "ACTIVE" },
      }),
      prisma.article.count({
        where: {
          workspaceId,
          commercialType: { not: null },
        },
      }),
      prisma.affiliateClick.count({
        where: { workspaceId },
      }),
      prisma.affiliateClick.findMany({
        where: {
          workspaceId,
          ...(startDate || endDate
            ? {
                createdAt: {
                  ...(startDate ? { gte: startDate } : {}),
                  ...(endDate ? { lte: endDate } : {}),
                },
              }
            : {}),
        },
        select: {
          id: true,
          productId: true,
          articleId: true,
          offerId: true,
          component: true,
          createdAt: true,
          product: {
            select: { id: true, name: true, brand: true },
          },
          article: {
            select: {
              id: true,
              title: true,
              wordpressSite: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const periodClicksCount = clicksInPeriod.length;

    // 4. Time series grouping by date (YYYY-MM-DD)
    const timeMap = new Map<string, number>();

    // Pre-populate days if standard period (e.g. 7d or 30d)
    if (startDate && (periodType === "7d" || periodType === "30d")) {
      const daysCount = periodType === "7d" ? 7 : 30;
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().split("T")[0];
        timeMap.set(key, 0);
      }
    }

    for (const click of clicksInPeriod) {
      const dateKey = click.createdAt.toISOString().split("T")[0];
      timeMap.set(dateKey, (timeMap.get(dateKey) || 0) + 1);
    }

    const timeSeries: TimeSeriesPoint[] = Array.from(timeMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, clicks]) => {
        const [, m, d] = date.split("-");
        return {
          date,
          formattedDate: `${d}/${m}`,
          clicks,
        };
      });

    // 5. Aggregate Top Products
    const productClickMap = new Map<string, { id: string; name: string; brand: string | null; clicks: number }>();
    for (const click of clicksInPeriod) {
      if (!click.productId) continue;
      const existing = productClickMap.get(click.productId);
      const name = click.product?.name || "Produto Desconhecido";
      const brand = click.product?.brand || null;

      if (existing) {
        existing.clicks++;
      } else {
        productClickMap.set(click.productId, {
          id: click.productId,
          name,
          brand,
          clicks: 1,
        });
      }
    }

    const topProducts: TopItem[] = Array.from(productClickMap.values())
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10)
      .map((item) => ({
        id: item.id,
        name: item.name,
        subtitle: item.brand,
        clicks: item.clicks,
        percentage: periodClicksCount > 0 ? Math.round((item.clicks / periodClicksCount) * 100) : 0,
      }));

    // 6. Aggregate Top Articles
    const articleClickMap = new Map<string, { id: string; title: string; clicks: number }>();
    for (const click of clicksInPeriod) {
      if (!click.articleId) continue;
      const existing = articleClickMap.get(click.articleId);
      const title = click.article?.title || "Artigo sem título";

      if (existing) {
        existing.clicks++;
      } else {
        articleClickMap.set(click.articleId, {
          id: click.articleId,
          title,
          clicks: 1,
        });
      }
    }

    const topArticles: TopItem[] = Array.from(articleClickMap.values())
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10)
      .map((item) => ({
        id: item.id,
        name: item.title,
        clicks: item.clicks,
        percentage: periodClicksCount > 0 ? Math.round((item.clicks / periodClicksCount) * 100) : 0,
      }));

    // 7. Aggregate Top Components (PRODUCT_CARD, COMPARISON_TABLE, CTA, etc.)
    const componentClickMap = new Map<string, number>();
    const componentLabels: Record<string, string> = {
      PRODUCT_CARD: "Card de Produto",
      COMPARISON_TABLE: "Tabela Comparativa",
      CTA: "Botão de Ação / CTA",
    };

    for (const click of clicksInPeriod) {
      const comp = click.component || "OUTROS";
      componentClickMap.set(comp, (componentClickMap.get(comp) || 0) + 1);
    }

    const topComponents: TopItem[] = Array.from(componentClickMap.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([comp, count]) => ({
        id: comp,
        name: componentLabels[comp] || comp,
        clicks: count,
        percentage: periodClicksCount > 0 ? Math.round((count / periodClicksCount) * 100) : 0,
      }));

    // 8. Aggregate Top WordPress Sites
    const siteClickMap = new Map<string, { id: string; name: string; clicks: number }>();
    for (const click of clicksInPeriod) {
      const site = click.article?.wordpressSite;
      const siteId = site?.id || "SEM_DESTINO";
      const siteName = site?.name || "Sem destino associado";

      const existing = siteClickMap.get(siteId);
      if (existing) {
        existing.clicks++;
      } else {
        siteClickMap.set(siteId, {
          id: siteId,
          name: siteName,
          clicks: 1,
        });
      }
    }

    const topSites: TopItem[] = Array.from(siteClickMap.values())
      .sort((a, b) => b.clicks - a.clicks)
      .map((item) => ({
        id: item.id,
        name: item.name,
        clicks: item.clicks,
        percentage: periodClicksCount > 0 ? Math.round((item.clicks / periodClicksCount) * 100) : 0,
      }));

    return {
      period: periodType,
      dateRange: {
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
      },
      summary: {
        totalProducts,
        totalActiveOffers,
        totalAffiliateArticles,
        totalAllTimeClicks,
        periodClicks: periodClicksCount,
      },
      timeSeries,
      topProducts,
      topArticles,
      topComponents,
      topSites,
    };
  }
}
