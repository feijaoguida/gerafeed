import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionWorkspaceId } from "@/lib/workspace";

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

    const dataToUpdate: { name?: string; creditName?: string | null; rssUrl?: string; active?: boolean } = {};
    if (typeof body.name === "string" && body.name.trim()) {
      dataToUpdate.name = body.name.trim();
    }
    if (typeof body.creditName === "string") {
      dataToUpdate.creditName = body.creditName.trim() || null;
    } else if (body.creditName === null) {
      dataToUpdate.creditName = null;
    }
    if (typeof body.rssUrl === "string" && body.rssUrl.trim()) {
      dataToUpdate.rssUrl = body.rssUrl.trim();
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
    console.error("PATCH /api/sources/[id] error:", error);
    return NextResponse.json({ error: "Erro ao atualizar fonte RSS" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
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
    console.error("DELETE /api/sources/[id] error:", error);
    return NextResponse.json({ error: "Erro ao excluir fonte RSS" }, { status: 500 });
  }
}

