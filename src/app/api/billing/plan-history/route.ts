import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/errors/service";

export async function GET(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Não autenticado ou workspace não selecionado." },
        { status: 401 }
      );
    }

    const history = await prisma.planHistory.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ history });
  } catch (error) {
    return handleApiError(error, request, {
      module: "BILLING",
      screen: "Histórico de Planos",
      userFacingMessage: "Erro ao buscar histórico de planos.",
    });
  }
}

