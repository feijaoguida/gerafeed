import { prisma } from "@/lib/prisma";
import { DEFAULT_WORKSPACE_ID } from "@/lib/workspace";

export type LimitResource = "ARTICLES" | "SOURCES";

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  resource: LimitResource;
  planName: string;
  message?: string;
}

export const SEED_PLANS = [
  {
    slug: "free",
    name: "Plano Gratuito",
    price: 0,
    maxArticles: 50,
    maxSources: 3,
  },
  {
    slug: "starter",
    name: "Plano Starter",
    price: 47.0,
    maxArticles: 200,
    maxSources: 10,
  },
  {
    slug: "pro",
    name: "Plano Pro",
    price: 97.0,
    maxArticles: 1000,
    maxSources: 30,
  },
];

export class BillingService {
  /**
   * Ensures default plans exist in the database.
   */
  static async ensureDefaultPlans() {
    for (const plan of SEED_PLANS) {
      await prisma.plan.upsert({
        where: { slug: plan.slug },
        update: {
          name: plan.name,
          price: plan.price,
          maxArticles: plan.maxArticles,
          maxSources: plan.maxSources,
        },
        create: plan,
      });
    }
  }

  /**
   * Retrieves the active subscription and plan for a workspace.
   * If none exists, creates and assigns the default Free plan.
   */
  static async getWorkspaceSubscription(workspaceId: string = DEFAULT_WORKSPACE_ID) {
    let sub = await prisma.subscription.findUnique({
      where: { workspaceId },
      include: { plan: true },
    });

    if (!sub) {
      // Ensure Free plan exists
      let freePlan = await prisma.plan.findUnique({
        where: { slug: "free" },
      });

      if (!freePlan) {
        await this.ensureDefaultPlans();
        freePlan = await prisma.plan.findUnique({
          where: { slug: "free" },
        });
      }

      if (!freePlan) {
        throw new Error("Não foi possível inicializar o plano gratuito padrão.");
      }

      sub = await prisma.subscription.create({
        data: {
          workspaceId,
          planId: freePlan.id,
          status: "ACTIVE",
        },
        include: { plan: true },
      });
    }

    return sub;
  }

  /**
   * Checks whether the workspace has reached its limit for articles (per month) or active sources.
   */
  static async checkLimit(
    workspaceId: string = DEFAULT_WORKSPACE_ID,
    resource: LimitResource
  ): Promise<LimitCheckResult> {
    const sub = await this.getWorkspaceSubscription(workspaceId);
    const plan = sub.plan;

    if (resource === "ARTICLES") {
      // Count articles created in current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const current = await prisma.article.count({
        where: {
          workspaceId,
          createdAt: {
            gte: startOfMonth,
          },
        },
      });

      const allowed = current < plan.maxArticles;
      return {
        allowed,
        current,
        limit: plan.maxArticles,
        resource: "ARTICLES",
        planName: plan.name,
        message: allowed
          ? undefined
          : `Limite de artigos atingido para o plano ${plan.name} (${current}/${plan.maxArticles} neste mês). Faça upgrade para continuar.`,
      };
    }

    if (resource === "SOURCES") {
      // Count active sources
      const current = await prisma.source.count({
        where: {
          workspaceId,
          active: true,
        },
      });

      const allowed = current < plan.maxSources;
      return {
        allowed,
        current,
        limit: plan.maxSources,
        resource: "SOURCES",
        planName: plan.name,
        message: allowed
          ? undefined
          : `Limite de fontes RSS ativas atingido para o plano ${plan.name} (${current}/${plan.maxSources}). Faça upgrade para adicionar mais fontes.`,
      };
    }

    throw new Error(`Recurso desconhecido para verificação de limite: ${resource}`);
  }

  /**
   * Asserts that a limit has not been reached. Throws an Error if reached.
   */
  static async assertLimit(
    workspaceId: string = DEFAULT_WORKSPACE_ID,
    resource: LimitResource
  ): Promise<LimitCheckResult> {
    const result = await this.checkLimit(workspaceId, resource);
    if (!result.allowed) {
      throw new Error(result.message || `Limite atingido para ${resource}.`);
    }
    return result;
  }
}
