import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.source.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Fonte não encontrada" }, { status: 404 });
    }

    const dataToUpdate: { name?: string; rssUrl?: string; active?: boolean } = {};
    if (typeof body.name === "string" && body.name.trim()) {
      dataToUpdate.name = body.name.trim();
    }
    if (typeof body.rssUrl === "string" && body.rssUrl.trim()) {
      dataToUpdate.rssUrl = body.rssUrl.trim();
    }
    if (typeof body.active === "boolean") {
      dataToUpdate.active = body.active;
    }

    const updated = await prisma.source.update({
      where: { id },
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
    const { id } = await params;

    const existing = await prisma.source.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Fonte não encontrada" }, { status: 404 });
    }

    await prisma.source.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/sources/[id] error:", error);
    return NextResponse.json({ error: "Erro ao excluir fonte RSS" }, { status: 500 });
  }
}
