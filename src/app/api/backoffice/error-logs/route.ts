import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";

export async function GET(request: Request) {
  try {
    await requireSuperAdmin();
    const { searchParams } = new URL(request.url);

    const workspaceId = searchParams.get("workspaceId");
    const moduleFilter = searchParams.get("module");
    const search = searchParams.get("search")?.trim();
    const period = searchParams.get("period") || "7d";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(5, parseInt(searchParams.get("limit") || "25", 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.SystemErrorLogWhereInput = {};

    // 1. Filtro de Workspace / Tenant
    if (workspaceId && workspaceId !== "all") {
      if (workspaceId === "none" || workspaceId === "null") {
        where.workspaceId = null;
      } else {
        where.workspaceId = workspaceId;
      }
    }

    // 2. Filtro de Módulo
    if (moduleFilter && moduleFilter !== "all") {
      where.module = moduleFilter;
    }

    // 3. Filtro de Data / Período
    const now = new Date();
    if (period === "24h") {
      where.createdAt = { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
    } else if (period === "7d") {
      where.createdAt = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
    } else if (period === "30d") {
      where.createdAt = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
    } else if (period === "180d") {
      where.createdAt = { gte: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000) };
    } else if (period === "custom") {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          dateFilter.gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          dateFilter.lte = end;
        }
      }
      if (Object.keys(dateFilter).length > 0) {
        where.createdAt = dateFilter;
      }
    }

    // 4. Busca textual (usuário, mensagem, caminho, tela)
    if (search) {
      where.OR = [
        { errorMessage: { contains: search, mode: "insensitive" } },
        { userEmail: { contains: search, mode: "insensitive" } },
        { userName: { contains: search, mode: "insensitive" } },
        { path: { contains: search, mode: "insensitive" } },
        { screen: { contains: search, mode: "insensitive" } },
      ];
    }

    // Consultas paralelas
    const [total, logs, workspaces, count24h, count7d] = await Promise.all([
      prisma.systemErrorLog.count({ where }),
      prisma.systemErrorLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.workspace.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.systemErrorLog.count({
        where: {
          createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.systemErrorLog.count({
        where: {
          createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      logs,
      workspaces,
      stats: {
        total,
        count24h,
        count7d,
      },
      pagination: {
        page,
        limit,
        totalPages,
        total,
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/backoffice/error-logs error:", error);
    const message = error instanceof Error ? error.message : "Erro ao carregar logs de erro";
    const status = message.includes("SuperAdmin") || message.includes("autenticado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
