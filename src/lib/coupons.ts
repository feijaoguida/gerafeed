import { Prisma, CouponDiscountType, CouponCustomerType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logSystemError } from "@/lib/errors/service";

export type DecimalLike = number | string | Prisma.Decimal;

export interface CouponPricingResult {
  originalAmount: Prisma.Decimal;
  discountedAmount: Prisma.Decimal;
  discountSaved: Prisma.Decimal;
}

export interface ValidateCouponParams {
  code: string;
  planId?: string | null;
  planSlug?: string | null;
  customerTypeContext: "NEW" | "BASE";
  workspaceId?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  reqPath?: string;
}

export interface CouponValidationSuccess {
  valid: true;
  coupon: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    discountType: CouponDiscountType;
    discountValue: Prisma.Decimal;
    durationMonths: number;
    customerType: CouponCustomerType;
    validUntil: Date | null;
    maxUses: number | null;
    usedCount: number;
    plans: Array<{ planId: string; planSlug?: string; planName?: string }>;
  };
  pricing?: CouponPricingResult;
  durationLabel: string;
}

export interface CouponValidationFailure {
  valid: false;
  error: string;
  code?: string;
}

export type CouponValidationResult = CouponValidationSuccess | CouponValidationFailure;

export class CouponService {
  /**
   * Normaliza o código do cupom: maiúsculas, trim e remoção de espaços duplos.
   */
  static normalizeCouponCode(code: string): string {
    return (code || "").trim().toUpperCase().replace(/\s+/g, "");
  }

  /**
   * Converte valor DecimalLike para Prisma.Decimal com 2 casas decimais.
   */
  static toDecimal(value: DecimalLike): Prisma.Decimal {
    if (value instanceof Prisma.Decimal) {
      return new Prisma.Decimal(value.toFixed(2));
    }
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (Number.isNaN(num)) {
      throw new Error(`Valor decimal inválido: ${value}`);
    }
    return new Prisma.Decimal(num.toFixed(2));
  }

  /**
   * Formata o rótulo de duração para exibição ao usuário e logs.
   * 0 -> "Para Sempre", 1 -> "1º Mês", 3 -> "3 Primeiros Meses", N -> "N Meses"
   */
  static formatDurationLabel(durationMonths: number): string {
    if (durationMonths === 0) {
      return "Para Sempre";
    }
    if (durationMonths === 1) {
      return "Primeiro Mês";
    }
    return `${durationMonths} Primeiros Meses`;
  }

  /**
   * Calcula o preço com desconto aplicado com base no tipo de desconto do cupom.
   * - PERCENTAGE: ex 20% -> (planPrice * 0.8)
   * - FIXED_DISCOUNT: ex R$ 70 -> (planPrice - 70)
   * - FIXED_PRICE: ex R$ 19,90 -> R$ 19,90 direto
   */
  static calculateCouponPricing(
    planPrice: DecimalLike,
    discountType: CouponDiscountType,
    discountValue: DecimalLike
  ): CouponPricingResult {
    const originalAmount = this.toDecimal(planPrice);
    const dVal = this.toDecimal(discountValue);

    let discountedAmount: Prisma.Decimal;

    switch (discountType) {
      case "PERCENTAGE": {
        const percent = dVal.toNumber();
        if (percent <= 0 || percent >= 100) {
          throw new Error("Percentual de desconto deve ser maior que 0% e menor que 100%.");
        }
        const factor = new Prisma.Decimal((100 - percent) / 100);
        discountedAmount = originalAmount.mul(factor);
        break;
      }
      case "FIXED_DISCOUNT": {
        discountedAmount = originalAmount.sub(dVal);
        break;
      }
      case "FIXED_PRICE": {
        discountedAmount = dVal;
        break;
      }
      default:
        throw new Error(`Tipo de desconto não suportado: ${discountType}`);
    }

    // Normaliza para 2 casas decimais
    discountedAmount = new Prisma.Decimal(discountedAmount.toFixed(2));

    // Validação de sanidade: o valor com desconto deve ser menor que o original e > 0
    if (discountedAmount.gte(originalAmount)) {
      throw new Error(
        `O valor com desconto (R$ ${discountedAmount}) não pode ser maior ou igual ao valor original (R$ ${originalAmount}).`
      );
    }

    // Regra do gateway (mínimo Asaas para faturamento é tipicamente R$ 5,00)
    if (discountedAmount.lt(5.0)) {
      throw new Error(
        `O valor final da cobrança (R$ ${discountedAmount}) é inferior ao valor mínimo permitido de R$ 5,00.`
      );
    }

    const discountSaved = originalAmount.sub(discountedAmount);

    return {
      originalAmount,
      discountedAmount,
      discountSaved,
    };
  }

  /**
   * Valida se o cupom existe, está ativo, dentro da validade, aplicável ao tipo de cliente e plano.
   * Qualquer rejeição gera log auditável em SystemErrorLog.
   */
  static async validateCouponForTarget(
    params: ValidateCouponParams
  ): Promise<CouponValidationResult> {
    const normalizedCode = this.normalizeCouponCode(params.code);
    const reqPath = params.reqPath || "/api/billing/coupons/validate";

    if (!normalizedCode) {
      return {
        valid: false,
        error: "Código de cupom não informado.",
        code: "EMPTY_CODE",
      };
    }

    try {
      const coupon = await prisma.coupon.findUnique({
        where: { code: normalizedCode },
        include: {
          plans: {
            include: {
              plan: {
                select: { id: true, slug: true, name: true, monthlyPrice: true },
              },
            },
          },
        },
      });

      if (!coupon) {
        await logSystemError({
          path: reqPath,
          module: "BILLING",
          statusCode: 404,
          workspaceId: params.workspaceId,
          userId: params.userId,
          userEmail: params.userEmail,
          errorMessage: `Tentativa de uso de cupom inexistente: "${normalizedCode}"`,
          query: { code: normalizedCode, context: params.customerTypeContext },
        });
        return {
          valid: false,
          error: `Cupom "${normalizedCode}" não foi encontrado ou é inválido.`,
          code: "NOT_FOUND",
        };
      }

      if (!coupon.active) {
        await logSystemError({
          path: reqPath,
          module: "BILLING",
          statusCode: 400,
          workspaceId: params.workspaceId,
          userId: params.userId,
          userEmail: params.userEmail,
          errorMessage: `Tentativa de uso de cupom inativo: "${normalizedCode}"`,
          query: { code: normalizedCode, couponId: coupon.id },
        });
        return {
          valid: false,
          error: `O cupom "${coupon.code}" está inativo no momento.`,
          code: "INACTIVE",
        };
      }

      const now = new Date();
      if (coupon.validFrom && coupon.validFrom > now) {
        await logSystemError({
          path: reqPath,
          module: "BILLING",
          statusCode: 400,
          workspaceId: params.workspaceId,
          userId: params.userId,
          userEmail: params.userEmail,
          errorMessage: `Tentativa de uso de cupom ainda não iniciado: "${normalizedCode}"`,
          query: { validFrom: coupon.validFrom, now },
        });
        return {
          valid: false,
          error: `O cupom "${coupon.code}" ainda não está em vigor.`,
          code: "NOT_STARTED",
        };
      }

      if (coupon.validUntil && coupon.validUntil < now) {
        await logSystemError({
          path: reqPath,
          module: "BILLING",
          statusCode: 400,
          workspaceId: params.workspaceId,
          userId: params.userId,
          userEmail: params.userEmail,
          errorMessage: `Tentativa de uso de cupom expirado: "${normalizedCode}"`,
          query: { validUntil: coupon.validUntil, now },
        });
        return {
          valid: false,
          error: `O cupom "${coupon.code}" expirou em ${coupon.validUntil.toLocaleDateString("pt-BR")}.`,
          code: "EXPIRED",
        };
      }

      // Validação de limite global de usos
      if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
        await logSystemError({
          path: reqPath,
          module: "BILLING",
          statusCode: 400,
          workspaceId: params.workspaceId,
          userId: params.userId,
          userEmail: params.userEmail,
          errorMessage: `Limite global de usos atingido para o cupom "${coupon.code}" (${coupon.usedCount}/${coupon.maxUses})`,
        });
        return {
          valid: false,
          error: `O limite de utilizações deste cupom foi esgotado.`,
          code: "MAX_USES_REACHED",
        };
      }

      // Validação de tipo de cliente (Novo vs Base)
      if (coupon.customerType !== "BOTH") {
        if (coupon.customerType === "NEW" && params.customerTypeContext !== "NEW") {
          await logSystemError({
            path: reqPath,
            module: "BILLING",
            statusCode: 403,
            workspaceId: params.workspaceId,
            userId: params.userId,
            userEmail: params.userEmail,
            errorMessage: `Cupom "${coupon.code}" é exclusivo para Novos Clientes, mas foi acionado por Cliente Base`,
          });
          return {
            valid: false,
            error: `Este cupom é exclusivo para novas assinaturas e não pode ser aplicado em contas já existentes.`,
            code: "NEW_CUSTOMERS_ONLY",
          };
        }

        if (coupon.customerType === "BASE" && params.customerTypeContext !== "BASE") {
          await logSystemError({
            path: reqPath,
            module: "BILLING",
            statusCode: 403,
            workspaceId: params.workspaceId,
            userId: params.userId,
            userEmail: params.userEmail,
            errorMessage: `Cupom "${coupon.code}" é exclusivo para Clientes da Base, mas foi acionado no Cadastro/Novo`,
          });
          return {
            valid: false,
            error: `Este cupom é exclusivo para clientes com conta ativa em upgrade/alteração de plano.`,
            code: "BASE_CUSTOMERS_ONLY",
          };
        }
      }

      // Validação de limite por workspace (se workspaceId informado)
      if (params.workspaceId) {
        const redemptionCount = await prisma.couponRedemption.count({
          where: {
            couponId: coupon.id,
            workspaceId: params.workspaceId,
            status: { in: ["ACTIVE", "COMPLETED"] },
          },
        });

        if (redemptionCount >= coupon.maxUsesPerWorkspace) {
          await logSystemError({
            path: reqPath,
            module: "BILLING",
            statusCode: 400,
            workspaceId: params.workspaceId,
            userId: params.userId,
            userEmail: params.userEmail,
            errorMessage: `Workspace "${params.workspaceId}" já utilizou o cupom "${coupon.code}" ${redemptionCount} vez(es) (limite: ${coupon.maxUsesPerWorkspace})`,
          });
          return {
            valid: false,
            error: `Sua conta já utilizou este cupom anteriormente.`,
            code: "WORKSPACE_LIMIT_REACHED",
          };
        }
      }

      // Validação de compatibilidade de plano
      let targetPlan: { id: string; slug: string; name: string; monthlyPrice: Prisma.Decimal } | null = null;

      if (params.planId || params.planSlug) {
        const matchingPlanRelation = coupon.plans.find((cp) => {
          if (params.planId && cp.planId === params.planId) return true;
          if (params.planSlug && cp.plan.slug === params.planSlug) return true;
          return false;
        });

        if (!matchingPlanRelation) {
          const eligiblePlanNames = coupon.plans.map((p) => p.plan.name).join(", ");
          await logSystemError({
            path: reqPath,
            module: "BILLING",
            statusCode: 400,
            workspaceId: params.workspaceId,
            userId: params.userId,
            userEmail: params.userEmail,
            errorMessage: `Cupom "${coupon.code}" não é válido para o plano informado (${params.planId || params.planSlug}). Válido para: ${eligiblePlanNames}`,
          });
          return {
            valid: false,
            error: `Este cupom não é aplicável ao plano selecionado. Válido exclusivamente para: ${eligiblePlanNames || "outros planos"}.`,
            code: "INCOMPATIBLE_PLAN",
          };
        }

        targetPlan = matchingPlanRelation.plan;
      }

      let pricing: CouponPricingResult | undefined;
      if (targetPlan) {
        try {
          pricing = this.calculateCouponPricing(
            targetPlan.monthlyPrice,
            coupon.discountType,
            coupon.discountValue
          );
        } catch (calcError) {
          const msg = calcError instanceof Error ? calcError.message : "Erro ao calcular desconto do cupom.";
          await logSystemError({
            path: reqPath,
            module: "BILLING",
            statusCode: 400,
            workspaceId: params.workspaceId,
            userId: params.userId,
            userEmail: params.userEmail,
            errorMessage: `Falha no cálculo do cupom "${coupon.code}": ${msg}`,
          });
          return {
            valid: false,
            error: msg,
            code: "CALCULATION_ERROR",
          };
        }
      }

      return {
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          durationMonths: coupon.durationMonths,
          customerType: coupon.customerType,
          validUntil: coupon.validUntil,
          maxUses: coupon.maxUses,
          usedCount: coupon.usedCount,
          plans: coupon.plans.map((cp) => ({
            planId: cp.planId,
            planSlug: cp.plan.slug,
            planName: cp.plan.name,
          })),
        },
        pricing,
        durationLabel: this.formatDurationLabel(coupon.durationMonths),
      };
    } catch (err) {
      await logSystemError({
        path: reqPath,
        module: "BILLING",
        statusCode: 500,
        workspaceId: params.workspaceId,
        userId: params.userId,
        userEmail: params.userEmail,
        errorMessage: `Erro inesperado na validação do cupom "${normalizedCode}": ${err instanceof Error ? err.message : String(err)}`,
        error: err,
      });
      return {
        valid: false,
        error: "Ocorreu um erro interno ao validar o cupom. Tente novamente ou contate o suporte.",
        code: "INTERNAL_ERROR",
      };
    }
  }

  /**
   * Registra a redenção do cupom e incrementa o contador global de usos.
   */
  static async recordRedemption(params: {
    couponId: string;
    workspaceId: string;
    userId?: string | null;
    planId: string;
    subscriptionId?: string | null;
    originalAmount: Prisma.Decimal | number;
    discountedAmount: Prisma.Decimal | number;
    durationMonths: number;
  }): Promise<void> {
    const origDec = this.toDecimal(params.originalAmount);
    const discDec = this.toDecimal(params.discountedAmount);

    await prisma.$transaction([
      prisma.couponRedemption.create({
        data: {
          couponId: params.couponId,
          workspaceId: params.workspaceId,
          userId: params.userId,
          planId: params.planId,
          subscriptionId: params.subscriptionId,
          originalAmount: origDec,
          discountedAmount: discDec,
          durationMonths: params.durationMonths,
          cyclesUsed: 0,
          status: "ACTIVE",
        },
      }),
      prisma.coupon.update({
        where: { id: params.couponId },
        data: {
          usedCount: { increment: 1 },
        },
      }),
    ]);
  }
}

