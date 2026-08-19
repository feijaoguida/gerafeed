import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json();
    const { name, description, valueType, active } = body;

    const data: Record<string, unknown> = {};
    if (typeof name === "string" && name.trim()) data.name = name.trim();
    if (description !== undefined) data.description = typeof description === "string" ? description.trim() : null;
    if (valueType === "BOOLEAN" || valueType === "QUANTITY") data.valueType = valueType;
    if (typeof active === "boolean") data.active = active;

    const updated = await prisma.feature.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar feature";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    await prisma.feature.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Feature excluída com sucesso." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao excluir feature";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
