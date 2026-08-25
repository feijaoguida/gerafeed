import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { AffiliateAnalyticsService } from "@/lib/affiliate";

export async function GET(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const { searchParams } = new URL(request.url);

    const periodParam = searchParams.get("period");
    const period =
      periodParam === "7d" || periodParam === "30d" || periodParam === "90d" || periodParam === "all"
        ? periodParam
        : undefined;

    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const stats = await AffiliateAnalyticsService.getDashboardStats(workspaceId, {
      period,
      startDate: startDateParam || undefined,
      endDate: endDateParam || undefined,
    });

    return NextResponse.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar estatísticas do dashboard.";
    const status =
      message.includes("não está disponível") || message.includes("não está habilitada")
        ? 403
        : message.includes("não autenticado")
        ? 401
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
