import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionWorkspaceId } from "@/lib/workspace";

export async function GET() {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const [pendingCount, publishedCount, rejectedCount, activeSourcesCount] = await Promise.all([
      prisma.article.count({ where: { workspaceId, status: "PENDING" } }),
      prisma.article.count({ where: { workspaceId, status: "PUBLISHED" } }),
      prisma.article.count({ where: { workspaceId, status: "REJECTED" } }),
      prisma.source.count({ where: { workspaceId, active: true } }),
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

