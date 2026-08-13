import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [pendingCount, publishedCount, rejectedCount, activeSourcesCount] = await Promise.all([
      prisma.article.count({ where: { status: "PENDING" } }),
      prisma.article.count({ where: { status: "PUBLISHED" } }),
      prisma.article.count({ where: { status: "REJECTED" } }),
      prisma.source.count({ where: { active: true } }),
    ]);

    return NextResponse.json({
      pendingCount,
      publishedCount,
      rejectedCount,
      activeSourcesCount,
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error);
    return NextResponse.json({ error: "Erro ao buscar estatísticas do dashboard" }, { status: 500 });
  }
}
