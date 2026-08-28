import { prisma } from "@/lib/prisma";
import { DEFAULT_WORKSPACE_ID } from "@/lib/workspace";
import {
  LimitResource,
  LimitCheckResult,
  SEED_PLANS,
} from "./billing-constants";

export * from "./billing-constants";


export const SEED_FEATURES = [
  {
    key: "affiliate_module",
    name: "Módulo de Afiliados",
    description: "Habilita acesso à plataforma e ferramentas de curadoria e conteúdo de afiliados",
    valueType: "BOOLEAN" as const,
    active: true,
  },
  {
    key: "affiliate_analytics",
    name: "Analytics de Afiliados",
    description: "Métricas e rastreamento de cliques e conversões de links afiliados",
    valueType: "BOOLEAN" as const,
    active: true,
  },
  {
    key: "affiliate_max_products",
    name: "Limite de Produtos Afiliados",
    description: "Quantidade máxima de produtos cadastrados no catálogo de afiliados",
    valueType: "QUANTITY" as const,
    active: true,
  },
  {
    key: "affiliate_max_programs",
    name: "Limite de Programas de Afiliados",
    description: "Quantidade máxima de programas/marketplaces de afiliados ativos",
    valueType: "QUANTITY" as const,
    active: true,
  },
  {
    key: "ai_unlimited_niches",
    name: "Nichos de Portal Ilimitados",
    description: "Permite selecionar qualquer área de atuação do portal. Quando desabilitado, somente Política, Negócios e Meio Ambiente estão disponíveis.",
    valueType: "BOOLEAN" as const,
    active: true,
  },
  {
    key: "ai_unlimited_styles",
    name: "Estilos de Escrita Ilimitados",
    description: "Permite selecionar qualquer estilo de escrita. Quando desabilitado, somente Sério, Informativo, Alegre e Atraente estão disponíveis.",
    valueType: "BOOLEAN" as const,
    active: true,
  },
  {
    key: "ai_advanced_providers",
    name: "Provedores de IA Avançados",
    description: "Permite selecionar Gemini e Anthropic como provedores. Quando desabilitado, somente OpenAI e OpenAI-Compatible estão disponíveis.",
    valueType: "BOOLEAN" as const,
    active: true,
  },
];

export class BillingService {
  /**
   * Ensures default features exist in the database.
   */
  static async ensureDefaultFeatures() {
    for (const feat of SEED_FEATURES) {
      const existing = await prisma.feature.findUnique({
        where: { key: feat.key },
      });
      if (!existing) {
        await prisma.feature.create({
          data: feat,
        });
      }
    }
  }

  /**
   * Ensures default plans and features exist in the database.
   * Only creates default plans if they do not exist; never overwrites user customizations.
   */
  static async ensureDefaultPlans() {
    await this.ensureDefaultFeatures();
    for (const plan of SEED_PLANS) {
      const existing = await prisma.plan.findUnique({
        where: { slug: plan.slug },
      });
      if (!existing) {
        await prisma.plan.create({
          data: plan,
        });
      }
    }
  }

  /**
   * Retrieves the active subscription and plan for a workspace.
   * If none exists, creates and assigns the default Free plan.
   * Evaluates lifecycle status, grace period and period end access.
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

    const now = new Date();

    // 1. If subscription is CANCELED, EXPIRED or SUSPENDED
    if (sub.status === "CANCELED" || sub.status === "EXPIRED" || sub.status === "SUSPENDED") {
      // If access period ended, fallback to Free plan entitlements
      if (!sub.validUntil || sub.validUntil <= now) {
        const freePlan = await prisma.plan.findUnique({ where: { slug: "free" } });
        if (freePlan && sub.planId !== freePlan.id) {
          return {
            ...sub,
            plan: freePlan,
          };
        }
      }
    }

    // 2. If subscription is PAST_DUE and grace period has ended
    if (sub.status === "PAST_DUE") {
      if (sub.gracePeriodEndsAt && sub.gracePeriodEndsAt < now) {
        const freePlan = await prisma.plan.findUnique({ where: { slug: "free" } });
        if (freePlan && sub.planId !== freePlan.id) {
          return {
            ...sub,
            status: "SUSPENDED" as const,
            plan: freePlan,
          };
        }
      }
    }

    return sub;
  }

  /**
   * Cancels subscription at period end (without fidelity penalties).
   */
  static async cancelSubscription(workspaceId: string) {
    const sub = await prisma.subscription.findUnique({
      where: { workspaceId },
      include: { plan: true },
    });

    if (!sub) {
      throw new Error("Assinatura não encontrada para este workspace.");
    }

    const updated = await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
        status: "CANCELED",
      },
      include: { plan: true },
    });

    return updated;
  }

  /**
   * Reactivates a canceled subscription if period has not expired.
   */
  static async reactivateSubscription(workspaceId: string) {
    const sub = await prisma.subscription.findUnique({
      where: { workspaceId },
      include: { plan: true },
    });

    if (!sub) {
      throw new Error("Assinatura não encontrada para este workspace.");
    }

    const now = new Date();
    if (sub.validUntil && sub.validUntil <= now) {
      throw new Error("O período da assinatura expirou. Inicie uma nova contratação.");
    }

    const updated = await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        cancelAtPeriodEnd: false,
        canceledAt: null,
        status: "ACTIVE",
      },
      include: { plan: true },
    });

    return updated;
  }

  /**
   * Schedules a plan change for the next billing cycle.
   */
  static async schedulePlanChange(workspaceId: string, targetPlanId: string) {
    const sub = await prisma.subscription.findUnique({
      where: { workspaceId },
      include: { plan: true },
    });

    if (!sub) {
      throw new Error("Assinatura não encontrada para este workspace.");
    }

    const targetPlan = await prisma.plan.findUnique({
      where: { id: targetPlanId },
    });

    if (!targetPlan) {
      throw new Error("Plano de destino não encontrado.");
    }

    const updated = await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        pendingPlanId: targetPlan.id,
      },
      include: { plan: true },
    });

    return updated;
  }

  /**
   * Synchronizes a workspace subscription with Asaas gateway.
   * Checks subscription status and payment status directly in Asaas API.
   * If payment is CONFIRMED or RECEIVED, activates the subscription and updates planId immediately.
   */
  static async syncWorkspaceWithGateway(workspaceId: string) {
    const sub = await prisma.subscription.findUnique({
      where: { workspaceId },
      include: { plan: true },
    });

    if (!sub || !sub.asaasSubscriptionId) {
      return { synced: false, reason: "No Asaas subscription linked." };
    }

    try {
      const { getPaymentGateway } = await import("@/lib/payments");
      const gateway = getPaymentGateway("asaas") as unknown as {
        getSubscription: (id: string) => Promise<Record<string, unknown> | null>;
        getSubscriptionPayments: (id: string) => Promise<Array<Record<string, unknown>>>;
      };

      const [asaasSub, payments] = await Promise.all([
        gateway.getSubscription(sub.asaasSubscriptionId),
        gateway.getSubscriptionPayments(sub.asaasSubscriptionId),
      ]);

      let isPaid = false;
      for (const p of payments) {
        if (p.status === "CONFIRMED" || p.status === "RECEIVED") {
          isPaid = true;
          break;
        }
      }

      if (isPaid || asaasSub?.status === "ACTIVE") {
        const isYearly = sub.billingCycle === "YEARLY" || sub.plan?.periodicity === "YEARLY";
        const daysToAdd = isYearly ? 365 : 30;

        const now = new Date();
        const baseDate = sub.validUntil && sub.validUntil > now ? sub.validUntil : now;
        const newValidUntil = new Date(baseDate);
        newValidUntil.setDate(newValidUntil.getDate() + daysToAdd);

        let targetPlanId = sub.pendingPlanId;
        if (!targetPlanId && sub.plan.slug === "free" && asaasSub) {
          const descStr = typeof asaasSub.description === "string" ? asaasSub.description.replace("Assinatura News Curator - ", "").trim() : "";
          const valNum = typeof asaasSub.value === "number" ? asaasSub.value : Number(asaasSub.value);
          const matchedPlan = await prisma.plan.findFirst({
            where: {
              OR: [
                ...(descStr ? [{ name: { contains: descStr, mode: "insensitive" as const } }] : []),
                ...(valNum ? [{ price: valNum }, { monthlyPrice: valNum }] : []),
              ],
            },
          });
          if (matchedPlan) targetPlanId = matchedPlan.id;
        }
        if (!targetPlanId) targetPlanId = sub.planId;

        const updated = await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: "ACTIVE",
            planId: targetPlanId,
            pendingPlanId: null,
            validUntil: newValidUntil,
            currentPeriodEnd: newValidUntil,
            nextDueDate: asaasSub?.nextDueDate ? new Date(String(asaasSub.nextDueDate)) : undefined,
          },
          include: { plan: true },
        });

        // Also upsert invoice ledger
        for (const p of payments) {
          if (!p.id) continue;
          const providerPaymentId = String(p.id);
          const paymentValue = typeof p.value === "number" ? p.value : Number(p.value) || 0;
          const billingMethod =
            p.billingType === "PIX" ? "PIX" : p.billingType === "BOLETO" ? "BOLETO" : "CREDIT_CARD";

          let invoiceStatus: "PENDING" | "CONFIRMED" | "RECEIVED" | "OVERDUE" | "REFUNDED" | "PARTIALLY_REFUNDED" | "CANCELED" | "FAILED" = "PENDING";
          if (p.status === "CONFIRMED") invoiceStatus = "CONFIRMED";
          else if (p.status === "RECEIVED") invoiceStatus = "RECEIVED";
          else if (p.status === "OVERDUE") invoiceStatus = "OVERDUE";
          else if (p.status === "REFUNDED") invoiceStatus = "REFUNDED";
          else if (p.status === "DELETED") invoiceStatus = "CANCELED";

          await prisma.invoice.upsert({
            where: {
              provider_providerPaymentId: { provider: "asaas", providerPaymentId },
            },
            update: {
              status: invoiceStatus,
              amount: paymentValue,
              billingMethod,
              subscriptionId: sub.id,
              dueDate: p.dueDate ? new Date(String(p.dueDate)) : undefined,
              confirmedAt: p.confirmedDate ? new Date(String(p.confirmedDate)) : undefined,
              receivedAt: p.paymentDate ? new Date(String(p.paymentDate)) : undefined,
              invoiceUrl: typeof p.invoiceUrl === "string" ? p.invoiceUrl : undefined,
              bankSlipUrl: typeof p.bankSlipUrl === "string" ? p.bankSlipUrl : undefined,
            },
            create: {
              workspaceId,
              subscriptionId: sub.id,
              provider: "asaas",
              providerPaymentId,
              amount: paymentValue,
              billingMethod,
              status: invoiceStatus,
              dueDate: p.dueDate ? new Date(String(p.dueDate)) : null,
              confirmedAt: p.confirmedDate ? new Date(String(p.confirmedDate)) : null,
              receivedAt: p.paymentDate ? new Date(String(p.paymentDate)) : null,
              invoiceUrl: typeof p.invoiceUrl === "string" ? p.invoiceUrl : null,
              bankSlipUrl: typeof p.bankSlipUrl === "string" ? p.bankSlipUrl : null,
            },
          });
        }

        return { synced: true, activated: true, plan: updated.plan };
      }

      return { synced: true, activated: false, asaasStatus: asaasSub?.status };
    } catch (err) {
      console.warn("[BillingService] Error syncing with gateway:", err);
      return { synced: false, error: (err as Error).message };
    }
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
      // Count articles processed by AI in current month (processedAt != null)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const current = await prisma.article.count({
        where: {
          workspaceId,
          processedAt: {
            not: null,
            gte: startOfMonth,
          },
        },
      });

      const allowed = current < plan.maxArticles;
      const renewsOn = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return {
        allowed,
        current,
        limit: plan.maxArticles,
        resource: "ARTICLES",
        planName: plan.name,
        message: allowed
          ? undefined
          : `Limite mensal de artigos atingido para o plano ${plan.name} (${current}/${plan.maxArticles} este mês). Renova em ${renewsOn.toLocaleDateString("pt-BR")}. Faça upgrade para continuar.`,
      };
    }

    if (resource === "ARTICLES_DAILY") {
      // Count articles processed today (processedAt != null, within current day)
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const current = await prisma.article.count({
        where: {
          workspaceId,
          processedAt: {
            not: null,
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      const allowed = current < plan.maxDailyArticles;
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      return {
        allowed,
        current,
        limit: plan.maxDailyArticles,
        resource: "ARTICLES_DAILY",
        planName: plan.name,
        message: allowed
          ? undefined
          : `Limite diário de artigos atingido para o plano ${plan.name} (${current}/${plan.maxDailyArticles} hoje). Renova amanhã em ${tomorrow.toLocaleDateString("pt-BR")}. Faça upgrade para aumentar o limite.`,
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

    if (resource === "WORDPRESS_SITES") {
      // Count all WordPress sites for the workspace
      const current = await prisma.wordPressSite.count({
        where: { workspaceId },
      });

      const allowed = current < plan.maxWordPressSites;
      return {
        allowed,
        current,
        limit: plan.maxWordPressSites,
        resource: "WORDPRESS_SITES",
        planName: plan.name,
        message: allowed
          ? undefined
          : `Limite de sites WordPress atingido para o plano ${plan.name} (${current}/${plan.maxWordPressSites}). Faça upgrade para adicionar mais sites.`,
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

  /**
   * Retrieves the PlanFeature record for a given workspace and feature key.
   * Returns null if subscription, plan, feature or PlanFeature does not exist.
   */
  static async getPlanFeature(workspaceId: string = DEFAULT_WORKSPACE_ID, featureKey: string) {
    const sub = await this.getWorkspaceSubscription(workspaceId);
    const cleanKey = featureKey.trim().toLowerCase();

    return prisma.planFeature.findFirst({
      where: {
        planId: sub.planId,
        feature: {
          key: cleanKey,
          active: true,
        },
      },
      include: {
        feature: true,
      },
    });
  }

  /**
   * Checks whether a feature is enabled for the workspace.
   * Returns false if the plan does not have the feature or if enabled is false.
   */
  static async hasFeature(workspaceId: string = DEFAULT_WORKSPACE_ID, featureKey: string): Promise<boolean> {
    const planFeature = await this.getPlanFeature(workspaceId, featureKey);
    if (!planFeature) return false;
    return Boolean(planFeature.enabled);
  }

  /**
   * Retrieves the feature limit configuration for a workspace.
   */
  static async getFeatureLimit(
    workspaceId: string = DEFAULT_WORKSPACE_ID,
    featureKey: string
  ): Promise<{ enabled: boolean; limit: number | null; featureKey: string; planName: string }> {
    const sub = await this.getWorkspaceSubscription(workspaceId);
    const planFeature = await this.getPlanFeature(workspaceId, featureKey);

    if (!planFeature || !planFeature.enabled) {
      return {
        enabled: false,
        limit: 0,
        featureKey: featureKey.trim().toLowerCase(),
        planName: sub.plan.name,
      };
    }

    return {
      enabled: true,
      limit: planFeature.limit, // null means unlimited
      featureKey: featureKey.trim().toLowerCase(),
      planName: sub.plan.name,
    };
  }

  /**
   * Asserts that a feature is enabled for the workspace.
   * Throws an Error if not enabled.
   */
  static async assertFeature(
    workspaceId: string = DEFAULT_WORKSPACE_ID,
    featureKey: string,
    customMessage?: string
  ): Promise<void> {
    const enabled = await this.hasFeature(workspaceId, featureKey);
    if (!enabled) {
      const cleanKey = featureKey.trim().toLowerCase();
      throw new Error(
        customMessage || `A funcionalidade '${cleanKey}' não está habilitada no seu plano atual. Faça upgrade para ter acesso.`
      );
    }
  }

  /**
   * Checks if current usage is within the feature quantity limit.
   */
  static async checkFeatureLimit(
    workspaceId: string = DEFAULT_WORKSPACE_ID,
    featureKey: string,
    currentCount: number
  ): Promise<{ allowed: boolean; current: number; limit: number | null; message?: string; planName: string }> {
    const info = await this.getFeatureLimit(workspaceId, featureKey);

    if (!info.enabled) {
      return {
        allowed: false,
        current: currentCount,
        limit: 0,
        planName: info.planName,
        message: `A funcionalidade '${info.featureKey}' não está disponível no plano ${info.planName}.`,
      };
    }

    if (info.limit === null) {
      return {
        allowed: true,
        current: currentCount,
        limit: null,
        planName: info.planName,
      };
    }

    const allowed = currentCount < info.limit;
    return {
      allowed,
      current: currentCount,
      limit: info.limit,
      planName: info.planName,
      message: allowed
        ? undefined
        : `Limite atingido para '${info.featureKey}' no plano ${info.planName} (${currentCount}/${info.limit}). Faça upgrade para aumentar o limite.`,
    };
  }

  /**
   * Asserts that a feature quantity limit has not been reached.
   */
  static async assertFeatureLimit(
    workspaceId: string = DEFAULT_WORKSPACE_ID,
    featureKey: string,
    currentCount: number,
    customMessage?: string
  ): Promise<void> {
    const check = await this.checkFeatureLimit(workspaceId, featureKey, currentCount);
    if (!check.allowed) {
      throw new Error(customMessage || check.message || `Limite excedido para a funcionalidade '${featureKey}'.`);
    }
  }
}

