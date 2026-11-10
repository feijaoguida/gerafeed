import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";
import { CouponService } from "@/lib/coupons";
import { logSystemError } from "@/lib/errors/service";
import type { CouponDiscountType, CouponCustomerType } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        plans: {
          include: {
            plan: true,
          },
        },
        redemptions: {
          take: 50,
          orderBy: { appliedAt: "desc" },
          include: {
            workspace: {
              select: { id: true, name: true, slug: true },
            },
            plan: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Cupom não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar cupom.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json();

    const existingCoupon = await prisma.coupon.findUnique({
      where: { id },
      include: { plans: true },
    });

    if (!existingCoupon) {
      return NextResponse.json({ error: "Cupom não encontrado." }, { status: 404 });
    }

    const updateData: {
      name?: string;
      code?: string;
      description?: string | null;
      discountType?: CouponDiscountType;
      discountValue?: ReturnType<typeof CouponService.toDecimal>;
      durationMonths?: number;
      customerType?: CouponCustomerType;
      validUntil?: Date | null;
      maxUses?: number | null;
      maxUsesPerWorkspace?: number;
      active?: boolean;
    } = {};

    if (body.name !== undefined && body.name.trim()) {
      updateData.name = body.name.trim();
    }

    if (body.code !== undefined && body.code.trim()) {
      const cleanCode = CouponService.normalizeCouponCode(body.code);
      if (cleanCode !== existingCoupon.code) {
        const dup = await prisma.coupon.findUnique({ where: { code: cleanCode } });
        if (dup) {
          return NextResponse.json(
            { error: `Já existe outro cupom com o código "${cleanCode}".` },
            { status: 409 }
          );
        }
        updateData.code = cleanCode;
      }
    }

    if (body.description !== undefined) {
      updateData.description = body.description ? body.description.trim() : null;
    }

    if (body.active !== undefined) {
      updateData.active = Boolean(body.active);
    }

    if (body.durationMonths !== undefined) {
      const duration = parseInt(String(body.durationMonths), 10);
      if (!Number.isNaN(duration) && duration >= 0) {
        updateData.durationMonths = duration;
      }
    }

    if (body.customerType !== undefined) {
      const validTypes: CouponCustomerType[] = ["NEW", "BASE", "BOTH"];
      if (validTypes.includes(body.customerType)) {
        updateData.customerType = body.customerType;
      }
    }

    if (body.discountType !== undefined && body.discountValue !== undefined) {
      const numVal = typeof body.discountValue === "string" ? parseFloat(body.discountValue) : Number(body.discountValue);
      if (numVal > 0) {
        updateData.discountType = body.discountType;
        updateData.discountValue = CouponService.toDecimal(numVal);
      }
    }

    if (body.validUntil !== undefined) {
      updateData.validUntil = body.validUntil ? new Date(body.validUntil) : null;
    }

    if (body.maxUses !== undefined) {
      updateData.maxUses = body.maxUses ? parseInt(String(body.maxUses), 10) : null;
    }

    if (body.maxUsesPerWorkspace !== undefined) {
      updateData.maxUsesPerWorkspace = parseInt(String(body.maxUsesPerWorkspace), 10) || 1;
    }

    // Se novos planos foram especificados, sincronizar relação CouponPlan
    if (Array.isArray(body.planIds) && body.planIds.length > 0) {
      await prisma.$transaction([
        prisma.couponPlan.deleteMany({ where: { couponId: id } }),
        prisma.couponPlan.createMany({
          data: body.planIds.map((pId: string) => ({
            couponId: id,
            planId: pId,
          })),
        }),
      ]);
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: updateData,
      include: {
        plans: {
          include: { plan: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Cupom atualizado com sucesso!",
      coupon: updated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar cupom.";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;

    await logSystemError({
      path: "/api/backoffice/coupons/[id]",
      module: "BACKOFFICE",
      statusCode: status,
      errorMessage: `Falha ao atualizar cupom no backoffice: ${message}`,
      error,
    });

    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        _count: {
          select: { redemptions: true, subscriptions: true },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Cupom não encontrado." }, { status: 404 });
    }

    // Se o cupom já foi usado por alguma conta ou assinatura, desativa com segurança em vez de apagar
    if (coupon._count.redemptions > 0 || coupon._count.subscriptions > 0) {
      await prisma.coupon.update({
        where: { id },
        data: { active: false },
      });

      return NextResponse.json({
        success: true,
        inactivated: true,
        message: "O cupom possui histórico de uso e foi inativado com segurança para preservar a integridade das assinaturas.",
      });
    }

    // Se nunca foi usado, pode ser deletado fisicamente
    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Cupom excluído com sucesso!",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao excluir cupom.";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;

    await logSystemError({
      path: "/api/backoffice/coupons/[id]",
      module: "BACKOFFICE",
      statusCode: status,
      errorMessage: `Falha ao excluir cupom no backoffice: ${message}`,
      error,
    });

    return NextResponse.json({ error: message }, { status });
  }
}

