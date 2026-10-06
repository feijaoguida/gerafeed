import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";

export async function GET() {
  try {
    await requireSuperAdmin();

    const [settingsList, totalLogs, oldestLog] = await Promise.all([
      prisma.systemSetting.findMany(),
      prisma.systemErrorLog.count(),
      prisma.systemErrorLog.findFirst({
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      }),
    ]);

    const settingsMap: Record<string, unknown> = {};
    for (const item of settingsList) {
      settingsMap[item.key] = item.value;
    }

    // Default se não configurado
    const retentionDays =
      typeof settingsMap.error_log_retention_days === "number"
        ? settingsMap.error_log_retention_days
        : 180;

    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const eligibleForCleanupCount = await prisma.systemErrorLog.count({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return NextResponse.json({
      settings: {
        ...settingsMap,
        error_log_retention_days: retentionDays,
      },
      stats: {
        totalLogs,
        oldestLogDate: oldestLog?.createdAt || null,
        retentionDays,
        eligibleForCleanupCount,
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/backoffice/settings error:", error);
    const message = error instanceof Error ? error.message : "Erro ao carregar configurações";
    const status = message.includes("SuperAdmin") || message.includes("autenticado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireSuperAdmin();
    const body = await request.json().catch(() => ({}));
    const { key, value, settings } = body;

    const updates: Array<{ key: string; value: unknown; description?: string }> = [];

    if (settings && typeof settings === "object") {
      for (const [k, v] of Object.entries(settings)) {
        updates.push({ key: k, value: v });
      }
    } else if (key && value !== undefined) {
      updates.push({ key, value });
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma configuração fornecida para atualização." },
        { status: 400 }
      );
    }

    // Validações de negócio
    for (const item of updates) {
      if (item.key === "error_log_retention_days") {
        const days = Number(item.value);
        if (isNaN(days) || days < 1 || days > 3650) {
          return NextResponse.json(
            { error: "O tempo de retenção de logs deve ser entre 1 e 3650 dias." },
            { status: 400 }
          );
        }
        item.value = Math.round(days);
        item.description = "Tempo de retenção de logs de erro em dias antes do expurgo automático";
      }
    }

    for (const item of updates) {
      await prisma.systemSetting.upsert({
        where: { key: item.key },
        update: {
          value: item.value as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          description: item.description,
        },
        create: {
          key: item.key,
          value: item.value as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          description: item.description,
        },
      });
    }

    return NextResponse.json({ success: true, message: "Configurações salvas com sucesso." });
  } catch (error: unknown) {
    console.error("PATCH /api/backoffice/settings error:", error);
    const message = error instanceof Error ? error.message : "Erro ao salvar configurações";
    const status = message.includes("SuperAdmin") || message.includes("autenticado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
