import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { validateSafeRemoteUrl } from "@/lib/affiliate/ssrf";
import { handleApiError } from "@/lib/errors/service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.source.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Fonte não encontrada" }, { status: 404 });
    }

    const dataToUpdate: {
      name?: string;
      creditName?: string | null;
      rssUrl?: string;
      defaultPromptType?: string | null;
      active?: boolean;
    } = {};
    if (typeof body.name === "string" && body.name.trim()) {
      dataToUpdate.name = body.name.trim();
    }
    if (typeof body.creditName === "string") {
      dataToUpdate.creditName = body.creditName.trim() || null;
    } else if (body.creditName === null) {
      dataToUpdate.creditName = null;
    }
    if (typeof body.rssUrl === "string" && body.rssUrl.trim()) {
      const sanitizedUrl = body.rssUrl.trim();
      try {
        await validateSafeRemoteUrl(sanitizedUrl);
      } catch (urlErr) {
        return NextResponse.json(
          { error: urlErr instanceof Error ? urlErr.message : "URL de RSS inválida ou não permitida." },
          { status: 400 }
        );
      }
      dataToUpdate.rssUrl = sanitizedUrl;
    }
    if (typeof body.defaultPromptType === "string") {
      dataToUpdate.defaultPromptType = body.defaultPromptType.trim() || null;
    } else if (body.defaultPromptType === null) {
      dataToUpdate.defaultPromptType = null;
    }
    if (typeof body.active === "boolean") {
      dataToUpdate.active = body.active;
    }

    const updated = await prisma.source.update({
      where: { id: existing.id },
      data: dataToUpdate,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error, request, {
      module: "RSS",
      screen: "Fontes RSS",
      userFacingMessage: "Erro ao atualizar fonte RSS",
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const { id } = await params;

    const existing = await prisma.source.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Fonte não encontrada" }, { status: 404 });
    }

    await prisma.source.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, request, {
      module: "RSS",
      screen: "Fontes RSS",
      userFacingMessage: "Erro ao excluir fonte RSS",
    });
  }
}

