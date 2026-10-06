import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { BillingService } from "@/lib/billing";
import { handleApiError } from "@/lib/errors/service";

export async function GET(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const sources = await prisma.source.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(sources);
  } catch (error) {
    return handleApiError(error, request, {
      module: "RSS",
      screen: "Fontes RSS",
      userFacingMessage: "Erro ao buscar fontes RSS",
    });
  }
}

export async function POST(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const body = await request.json();
    const { name, creditName, rssUrl, defaultPromptType, active = true } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Nome da fonte é obrigatório" }, { status: 400 });
    }

    if (!rssUrl || typeof rssUrl !== "string" || !rssUrl.trim()) {
      return NextResponse.json({ error: "URL do RSS é obrigatória" }, { status: 400 });
    }

    // Check billing limit for active sources
    if (Boolean(active)) {
      const limitCheck = await BillingService.checkLimit(workspaceId, "SOURCES");
      if (!limitCheck.allowed) {
        return NextResponse.json({ error: limitCheck.message }, { status: 403 });
      }
    }

    const source = await prisma.source.create({
      data: {
        workspaceId,
        name: name.trim(),
        creditName: typeof creditName === "string" ? creditName.trim() || null : null,
        rssUrl: rssUrl.trim(),
        defaultPromptType: typeof defaultPromptType === "string" ? defaultPromptType.trim() || null : null,
        active: Boolean(active),
      },
    });

    return NextResponse.json(source, { status: 201 });
  } catch (error) {
    return handleApiError(error, request, {
      module: "RSS",
      screen: "Fontes RSS",
      userFacingMessage: "Erro ao cadastrar fonte RSS",
    });
  }
}


