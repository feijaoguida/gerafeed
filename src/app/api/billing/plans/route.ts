import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BillingService } from "@/lib/billing";

export async function GET() {
  try {
    await BillingService.ensureDefaultPlans();
    const plans = await prisma.plan.findMany({
      orderBy: { monthlyPrice: "asc" },
      include: {
        planFeatures: {
          include: {
            feature: true,
          },
        },
      },
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error("GET /api/billing/plans error:", error);
    return NextResponse.json({ error: "Erro ao buscar planos" }, { status: 500 });
  }
}
