import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";
import { CouponService } from "@/lib/coupons";
import { logSystemError } from "@/lib/errors/service";
import type { CouponDiscountType, CouponCustomerType } from "@prisma/client";

export async function GET() {
  try {
    await requireSuperAdmin();

    const [coupons, availablePlans] = await Promise.all([
      prisma.coupon.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          plans: {
            include: {
              plan: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  monthlyPrice: true,
                  periodicity: true,
                },
              },
            },
          },
          _count: {
            select: { redemptions: true },
          },
        },
      }),
      prisma.plan.findMany({
        where: { active: true },
        orderBy: { monthlyPrice: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          monthlyPrice: true,
          periodicity: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      coupons,
      availablePlans,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar cupons de desconto.";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;

    await logSystemError({
      path: "/api/backoffice/coupons",
      module: "BACKOFFICE",
      statusCode: status,
      errorMessage: `Falha ao listar cupons no backoffice: ${message}`,
      error,
    });

    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();
    const body = await request.json();

    const {
      name,
      code,
      description,
      discountType,
      discountValue,
      durationMonths,
      customerType,
      planIds,
      validUntil,
      maxUses,
      maxUsesPerWorkspace,
      active,
    } = body;

    // 1. Validações básicas
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "O nome do cupom é obrigatório." }, { status: 400 });
    }

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json({ error: "O código do cupom é obrigatório." }, { status: 400 });
    }

    const cleanCode = CouponService.normalizeCouponCode(code);
    if (cleanCode.length < 3) {
      return NextResponse.json({ error: "O código do cupom deve ter pelo menos 3 caracteres." }, { status: 400 });
    }

    // 2. Unicidade de código
    const existing = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Já existe um cupom cadastrado com o código "${cleanCode}".` },
        { status: 409 }
      );
    }

    // 3. Planos vinculados
    if (!Array.isArray(planIds) || planIds.length === 0) {
      return NextResponse.json(
        { error: "Selecione ao menos um plano para aplicar este cupom." },
        { status: 400 }
      );
    }

    // 4. Tipo e valor do desconto
    const validDiscountTypes: CouponDiscountType[] = ["PERCENTAGE", "FIXED_DISCOUNT", "FIXED_PRICE"];
    if (!discountType || !validDiscountTypes.includes(discountType)) {
      return NextResponse.json(
        { error: "Tipo de desconto inválido (PERCENTAGE, FIXED_DISCOUNT ou FIXED_PRICE)." },
        { status: 400 }
      );
    }

    const numDiscountValue = typeof discountValue === "string" ? parseFloat(discountValue) : Number(discountValue);
    if (Number.isNaN(numDiscountValue) || numDiscountValue <= 0) {
      return NextResponse.json(
        { error: "Informe um valor de desconto válido maior que zero." },
        { status: 400 }
      );
    }

    // 5. Duração em meses
    const parsedDuration = parseInt(String(durationMonths ?? 1), 10);
    if (Number.isNaN(parsedDuration) || parsedDuration < 0) {
      return NextResponse.json(
        { error: "O tempo de desconto deve ser um número inteiro igual ou superior a 0 (0 = Para Sempre)." },
        { status: 400 }
      );
    }

    // 6. Tipo de cliente
    const validCustomerTypes: CouponCustomerType[] = ["NEW", "BASE", "BOTH"];
    const resolvedCustomerType: CouponCustomerType = validCustomerTypes.includes(customerType)
      ? customerType
      : "NEW";

    // 7. Validação de sanidade financeira contra os planos selecionados
    const targetPlans = await prisma.plan.findMany({
      where: { id: { in: planIds } },
    });

    if (targetPlans.length === 0) {
      return NextResponse.json({ error: "Nenhum dos planos selecionados foi encontrado." }, { status: 400 });
    }

    for (const plan of targetPlans) {
      try {
        CouponService.calculateCouponPricing(plan.monthlyPrice, discountType, numDiscountValue);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro no cálculo de precificação.";
        return NextResponse.json(
          { error: `Inconsistência para o plano "${plan.name}": ${msg}` },
          { status: 400 }
        );
      }
    }

    // 8. Criação no Banco
    const parsedValidUntil = validUntil ? new Date(validUntil) : null;
    const parsedMaxUses = maxUses !== undefined && maxUses !== null && String(maxUses).trim() !== ""
      ? parseInt(String(maxUses), 10)
      : null;
    const parsedMaxUsesPerWorkspace = parseInt(String(maxUsesPerWorkspace || 1), 10) || 1;

    const createdCoupon = await prisma.coupon.create({
      data: {
        name: name.trim(),
        code: cleanCode,
        description: description ? description.trim() : null,
        discountType,
        discountValue: CouponService.toDecimal(numDiscountValue),
        durationMonths: parsedDuration,
        customerType: resolvedCustomerType,
        validUntil: parsedValidUntil,
        maxUses: parsedMaxUses,
        maxUsesPerWorkspace: parsedMaxUsesPerWorkspace,
        active: active !== undefined ? Boolean(active) : true,
        plans: {
          create: targetPlans.map((p) => ({
            planId: p.id,
          })),
        },
      },
      include: {
        plans: {
          include: {
            plan: {
              select: { id: true, name: true, slug: true, monthlyPrice: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Cupom ${createdCoupon.code} cadastrado com sucesso!`,
      coupon: createdCoupon,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao cadastrar cupom de desconto.";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;

    await logSystemError({
      path: "/api/backoffice/coupons",
      module: "BACKOFFICE",
      statusCode: status,
      errorMessage: `Falha ao criar cupom no backoffice: ${message}`,
      error,
    });

    return NextResponse.json({ error: message }, { status });
  }
}
