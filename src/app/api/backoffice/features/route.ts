import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superadmin";

export async function GET() {
  try {
    await requireSuperAdmin();
    const features = await prisma.feature.findMany({
      orderBy: { key: "asc" },
      include: {
        _count: {
          select: { planFeatures: true },
        },
      },
    });
    return NextResponse.json(features);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar features";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();
    const body = await request.json();
    const { key, name, description, valueType, active } = body;

    if (!key || typeof key !== "string" || !key.trim()) {
      return NextResponse.json({ error: "Chave única da feature é obrigatória." }, { status: 400 });
    }
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Nome da feature é obrigatório." }, { status: 400 });
    }

    const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");

    const existing = await prisma.feature.findUnique({
      where: { key: cleanKey },
    });
    if (existing) {
      return NextResponse.json({ error: "Já existe uma feature cadastrada com esta chave." }, { status: 409 });
    }

    const feature = await prisma.feature.create({
      data: {
        key: cleanKey,
        name: name.trim(),
        description: description?.trim() || null,
        valueType: valueType === "QUANTITY" ? "QUANTITY" : "BOOLEAN",
        active: active !== undefined ? Boolean(active) : true,
      },
    });

    return NextResponse.json(feature, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar feature";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
