import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionWorkspaceId } from "@/lib/workspace";
import {
  getWordPressSiteById,
  updateWordPressSite,
  deleteWordPressSite,
  sanitizeWordPressSite,
} from "@/lib/wordpress-sites";
import { getSourcesForWordPressSite } from "@/lib/wordpress-site-sources";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workspaceId = await getSessionWorkspaceId();

    const site = await getWordPressSiteById(workspaceId, id);
    if (!site) {
      return NextResponse.json(
        { error: "Site WordPress não encontrado." },
        { status: 404 }
      );
    }

    const assignedSources = await getSourcesForWordPressSite(workspaceId, id);
    const allWorkspaceSources = await prisma.source.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
    });

    const categoryCount = await prisma.wordPressCategory.count({
      where: {
        workspaceId,
        wordpressSiteId: id,
      },
    });

    return NextResponse.json({
      success: true,
      site: sanitizeWordPressSite(site),
      assignedSources,
      allSources: allWorkspaceSources,
      categoryCount,
    });
  } catch (error) {
    console.error("GET /api/wordpress/sites/[id] error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar detalhes do site WordPress." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workspaceId = await getSessionWorkspaceId();
    const body = await request.json();

    const updateData: {
      name?: string;
      url?: string;
      username?: string;
      applicationPassword?: string;
      defaultPromptType?: string | null;
      active?: boolean;
      isDefault?: boolean;
    } = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.url !== undefined) updateData.url = body.url;
    if (body.username !== undefined) updateData.username = body.username;
    if (body.defaultPromptType !== undefined) updateData.defaultPromptType = body.defaultPromptType;
    if (body.active !== undefined) updateData.active = body.active;
    if (body.isDefault !== undefined) updateData.isDefault = body.isDefault === true;
    if (body.applicationPassword && body.applicationPassword.trim()) {
      updateData.applicationPassword = body.applicationPassword.trim();
    }

    const updated = await updateWordPressSite(workspaceId, id, updateData);

    return NextResponse.json({
      success: true,
      message: "Site WordPress atualizado com sucesso!",
      site: sanitizeWordPressSite(updated),
    });
  } catch (error: unknown) {
    console.error("PATCH /api/wordpress/sites/[id] error:", error);
    const message = error instanceof Error ? error.message : "Erro ao atualizar site WordPress.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workspaceId = await getSessionWorkspaceId();

    await deleteWordPressSite(workspaceId, id);

    return NextResponse.json({
      success: true,
      message: "Site WordPress removido com sucesso!",
    });
  } catch (error: unknown) {
    console.error("DELETE /api/wordpress/sites/[id] error:", error);
    const message = error instanceof Error ? error.message : "Erro ao remover site WordPress.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
