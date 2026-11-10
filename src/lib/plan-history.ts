import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logSystemError } from "@/lib/errors/service";

export type DecimalLike = number | string | Prisma.Decimal;

export interface RecordPlanHistoryInput {
  workspaceId: string;
  userId?: string | null;
  userEmail?: string | null;
  previousPlanId?: string | null;
  previousPlanName?: string | null;
  newPlanId: string;
  newPlanName: string;
  eventType:
    | "ACCOUNT_CREATED"
    | "CHECKOUT_STARTED"
    | "SUBSCRIPTION_ACTIVATED"
    | "PLAN_CHANGED"
    | "COUPON_APPLIED"
    | "DISCOUNT_ENDED"
    | "SUBSCRIPTION_CANCELED"
    | "SUBSCRIPTION_REACTIVATED"
    | "BACKOFFICE_UPDATE";
  billingCycle?: string;
  originalAmount: DecimalLike;
  chargedAmount: DecimalLike;
  couponId?: string | null;
  couponCode?: string | null;
  discountDurationMonths?: number | null;
  asaasSubscriptionId?: string | null;
  notes?: string | null;
}

export class PlanHistoryService {
  private static toDecimal(value: DecimalLike): Prisma.Decimal {
    if (value instanceof Prisma.Decimal) {
      return new Prisma.Decimal(value.toFixed(2));
    }
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (Number.isNaN(num)) {
      return new Prisma.Decimal("0.00");
    }
    return new Prisma.Decimal(num.toFixed(2));
  }

  /**
   * Grava um evento no histórico de planos de forma resiliente.
   * Não bloqueia a transação principal caso ocorra falha ao salvar o log histórico.
   */
  static async recordEvent(input: RecordPlanHistoryInput): Promise<void> {
    return this.recordPlanEvent(input);
  }

  static async recordPlanEvent(input: RecordPlanHistoryInput): Promise<void> {
    try {
      const origDec = this.toDecimal(input.originalAmount);
      const chargedDec = this.toDecimal(input.chargedAmount);

      await prisma.planHistory.create({
        data: {
          workspaceId: input.workspaceId,
          userId: input.userId,
          userEmail: input.userEmail,
          previousPlanId: input.previousPlanId,
          previousPlanName: input.previousPlanName,
          newPlanId: input.newPlanId,
          newPlanName: input.newPlanName,
          eventType: input.eventType,
          billingCycle: input.billingCycle || "MONTHLY",
          originalAmount: origDec,
          chargedAmount: chargedDec,
          couponId: input.couponId,
          couponCode: input.couponCode ? input.couponCode.toUpperCase().trim() : null,
          discountDurationMonths: input.discountDurationMonths,
          asaasSubscriptionId: input.asaasSubscriptionId,
          notes: input.notes,
        },
      });
    } catch (err) {
      await logSystemError({
        path: "/lib/plan-history",
        module: "BILLING",
        statusCode: 500,
        workspaceId: input.workspaceId,
        userId: input.userId,
        userEmail: input.userEmail,
        errorMessage: `Falha ao gravar evento de histórico de planos (${input.eventType}): ${err instanceof Error ? err.message : String(err)}`,
        error: err,
        query: {
          eventType: input.eventType,
          newPlanId: input.newPlanId,
          couponCode: input.couponCode,
        },
      });
    }
  }

  /**
   * Obtém a linha do tempo de histórico de planos para um workspace.
   */
  static async getWorkspacePlanHistory(workspaceId: string, limit = 50) {
    return prisma.planHistory.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        coupon: {
          select: {
            id: true,
            code: true,
            name: true,
            discountType: true,
            discountValue: true,
            durationMonths: true,
          },
        },
      },
    });
  }
}
