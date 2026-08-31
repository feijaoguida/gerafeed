import { prisma } from "@/lib/prisma";
import { BillingService } from "@/lib/billing";

export interface PublicPlanFeature {
  name: string;
  enabled: boolean;
  limit?: number | null;
  key: string;
}

export interface PublicPlan {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  monthlyPrice: number;
  annualDiscountPercent: number;
  periodicity: string;
  highlight: boolean;
  maxArticles: number;
  maxDailyArticles: number;
  maxSources: number;
  maxWordPressSites: number;
  features: PublicPlanFeature[];
}

/**
 * Busca planos ativos diretamente do banco de dados para exibição na Home pública.
 * Garante que os planos padrão existam e formata os dados para o componente de apresentação.
 */
export async function getPublicPlans(): Promise<PublicPlan[]> {
  try {
    await BillingService.ensureDefaultPlans();

    const dbPlans = await prisma.plan.findMany({
      where: { active: true },
      orderBy: { monthlyPrice: "asc" },
      include: {
        planFeatures: {
          include: {
            feature: true,
          },
        },
      },
    });

    return dbPlans.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      monthlyPrice: Number(p.monthlyPrice ?? p.price ?? 0),
      annualDiscountPercent: Number(p.annualDiscountPercent ?? 0),
      periodicity: p.periodicity ?? "MONTHLY",
      highlight: Boolean(p.highlight),
      maxArticles: p.maxArticles,
      maxDailyArticles: p.maxDailyArticles,
      maxSources: p.maxSources,
      maxWordPressSites: p.maxWordPressSites,
      features: p.planFeatures
        .filter((pf) => pf.enabled)
        .map((pf) => ({
          name: pf.feature.name,
          enabled: pf.enabled,
          limit: pf.limit,
          key: pf.feature.key,
        })),
    }));
  } catch (error) {
    console.error("[getPublicPlans] Erro ao buscar planos do banco:", error);
    return [];
  }
}
