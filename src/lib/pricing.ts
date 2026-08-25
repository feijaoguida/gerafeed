import { Prisma } from "@prisma/client";

export type DecimalLike = Prisma.Decimal | number | string;

/**
 * Converts a DecimalLike input into a Prisma.Decimal safely.
 */
export function toDecimal(val: DecimalLike): Prisma.Decimal {
  if (val instanceof Prisma.Decimal) return val;
  if (typeof val === "number" || typeof val === "string") {
    return new Prisma.Decimal(val);
  }
  return new Prisma.Decimal(0);
}

/**
 * Calculates annual plan price given monthlyPrice and annualDiscountPercent.
 * Formula:
 *   annualBase = monthlyPrice * 12
 *   annualDiscount = annualBase * (annualDiscountPercent / 100)
 *   annualAmount = annualBase - annualDiscount
 * Rounded to 2 decimal places (monetary rounding).
 */
export function calculateAnnualPlanPrice(
  monthlyPriceInput: DecimalLike,
  annualDiscountPercentInput: DecimalLike
): Prisma.Decimal {
  const monthlyPrice = toDecimal(monthlyPriceInput);
  const discountPercent = toDecimal(annualDiscountPercentInput);

  if (monthlyPrice.lessThanOrEqualTo(0)) {
    return new Prisma.Decimal(0);
  }

  const annualBase = monthlyPrice.mul(12);
  const discountFactor = new Prisma.Decimal(1).sub(discountPercent.div(100));
  const rawAnnualAmount = annualBase.mul(discountFactor);

  // Round to 2 decimal places
  return rawAnnualAmount.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

/**
 * Calculates annual savings given monthlyPrice and annualDiscountPercent.
 * Formula:
 *   annualBase = monthlyPrice * 12
 *   annualSavings = annualBase - calculateAnnualPlanPrice(monthlyPrice, annualDiscountPercent)
 */
export function calculateAnnualSavings(
  monthlyPriceInput: DecimalLike,
  annualDiscountPercentInput: DecimalLike
): Prisma.Decimal {
  const monthlyPrice = toDecimal(monthlyPriceInput);
  if (monthlyPrice.lessThanOrEqualTo(0)) {
    return new Prisma.Decimal(0);
  }

  const annualBase = monthlyPrice.mul(12);
  const annualAmount = calculateAnnualPlanPrice(monthlyPriceInput, annualDiscountPercentInput);
  const savings = annualBase.sub(annualAmount);

  return savings.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

/**
 * Validates plan pricing constraints.
 * Rules:
 *   monthlyPrice >= 0
 *   annualDiscountPercent >= 0
 *   annualDiscountPercent < 100
 */
export function validatePlanPricing(
  monthlyPriceInput: DecimalLike,
  annualDiscountPercentInput: DecimalLike
): { valid: boolean; error?: string } {
  try {
    const monthlyPrice = toDecimal(monthlyPriceInput);
    const annualDiscountPercent = toDecimal(annualDiscountPercentInput);

    if (monthlyPrice.lessThan(0)) {
      return { valid: false, error: "O preço mensal não pode ser negativo." };
    }

    if (annualDiscountPercent.lessThan(0)) {
      return { valid: false, error: "O desconto anual não pode ser negativo." };
    }

    if (annualDiscountPercent.greaterThanOrEqualTo(100)) {
      return { valid: false, error: "O desconto anual deve ser menor que 100%." };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Valores monetários ou de percentual inválidos." };
  }
}

/**
 * Formats a monetary value to BRL string format (e.g. "R$ 29,90").
 */
export function formatCurrency(amountInput: DecimalLike): string {
  const dec = toDecimal(amountInput);
  const num = dec.toNumber();
  return `R$ ${num.toFixed(2).replace(".", ",")}`;
}
