import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionWorkspaceId } from "@/lib/workspace";
import {
  assignSourceToWordPressSite,
  updateWordPressSiteSource,
  removeSourceFromWordPressSite,
} from "@/lib/wordpress-site-sources";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: wordpressSiteId } = await params;
    const workspaceId = await getSessionWorkspaceId();
    const body = await request.json();

    let targetSourceId = body.sourceId;

    // Support Quick-Create: if newSource is provided, create the source first
    if (body.newSource) {
      const { name, rssUrl, creditName, defaultPromptType } = body.newSource;
      if (!name || !name.trim()) {
        return NextResponse.json({ error: "Nome da nova fonte RSS é obrigatório." }, { status: 400 });
      }
      if (!rssUrl || !rssUrl.trim()) {
        return NextResponse.json({ error: "URL da nova fonte RSS é obrigatória." }, { status: 400 });
      }

      const createdSource = await prisma.source.create({
        data: {
          workspaceId,
          name: name.trim(),
          rssUrl: rssUrl.trim(),
          creditName: creditName?.trim() || null,
          defaultPromptType: defaultPromptType?.trim() || null,
          active: true,
        },
      });

      targetSourceId = createdSource.id;
    }

    if (!targetSourceId) {
      return NextResponse.json(
        { error: "sourceId ou newSource são obrigatórios." },
        { status: 400 }
      );
    }

    const assignment = await assignSourceToWordPressSite({
      workspaceId,
      wordpressSiteId,
      sourceId: targetSourceId,
      promptTypeOverride: body.promptTypeOverride !== undefined ? body.promptTypeOverride : undefined,
      active: body.active !== undefined ? body.active : true,
    });

    return NextResponse.json({
      success: true,
      message: "Fonte associada ao site WordPress com sucesso!",
      assignment,
    });
  } catch (error: unknown) {
    console.error("POST /api/wordpress/sites/[id]/sources error:", error);
    const message = error instanceof Error ? error.message : "Erro ao associar fonte ao WordPress.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: wordpressSiteId } = await params;
    const workspaceId = await getSessionWorkspaceId();
    const body = await request.json();

    const { assignmentId, sourceId, promptTypeOverride, active } = body;

    let targetAssignmentId = assignmentId;
    if (!targetAssignmentId && sourceId) {
      const existing = await prisma.wordPressSiteSource.findFirst({
        where: {
          workspaceId,
          wordpressSiteId,
          sourceId,
        },
      });
      if (existing) {
        targetAssignmentId = existing.id;
      }
    }

    if (!targetAssignmentId) {
      return NextResponse.json(
        { error: "assignmentId ou sourceId são obrigatórios." },
        { status: 400 }
      );
    }

    const updated = await updateWordPressSiteSource(workspaceId, targetAssignmentId, {
      promptTypeOverride,
      active,
    });

    return NextResponse.json({
      success: true,
      message: "Vínculo atualizado com sucesso!",
      assignment: updated,
    });
  } catch (error: unknown) {
    console.error("PATCH /api/wordpress/sites/[id]/sources error:", error);
    const message = error instanceof Error ? error.message : "Erro ao atualizar vínculo.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: wordpressSiteId } = await params;
    const workspaceId = await getSessionWorkspaceId();

    const url = new URL(request.url);
    const sourceId = url.searchParams.get("sourceId");

    if (!sourceId) {
      return NextResponse.json(
        { error: "sourceId é obrigatório na query string." },
        { status: 400 }
      );
    }

    await removeSourceFromWordPressSite(workspaceId, wordpressSiteId, sourceId);

    return NextResponse.json({
      success: true,
      message: "Vínculo removido com sucesso!",
    });
  } catch (error: unknown) {
    console.error("DELETE /api/wordpress/sites/[id]/sources error:", error);
    const message = error instanceof Error ? error.message : "Erro ao desassociar fonte.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
