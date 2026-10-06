import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();
    const body = await request.json().catch(() => ({}));
    const rawRetention = Number(body?.retentionDays);
    let retentionDays: number;

    if (!isNaN(rawRetention) && rawRetention > 0) {
      retentionDays = Math.round(rawRetention);
    } else {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: "error_log_retention_days" },
      });
      retentionDays = typeof setting?.value === "number" ? setting.value : 180;
    }

    if (retentionDays < 1) {
      return NextResponse.json(
        { error: "O período de retenção deve ser de no mínimo 1 dia." },
        { status: 400 }
      );
    }


    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const deleteResult = await prisma.systemErrorLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.count,
      retentionDays,
      cutoffDate: cutoffDate.toISOString(),
      message: `${deleteResult.count} registros de erro anteriores a ${cutoffDate.toLocaleDateString("pt-BR")} foram excluídos com sucesso.`,
    });
  } catch (error: unknown) {
    console.error("POST /api/backoffice/settings/cleanup-logs error:", error);
    const message = error instanceof Error ? error.message : "Erro ao executar rotina de limpeza de logs";
    const status = message.includes("SuperAdmin") || message.includes("autenticado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
