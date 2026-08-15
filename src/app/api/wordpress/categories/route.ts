import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionWorkspaceId } from "@/lib/workspace";

export async function GET() {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const categories = await prisma.wordPressCategory.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET /api/wordpress/categories error:", error);
    return NextResponse.json({ error: "Erro ao buscar categorias do banco local" }, { status: 500 });
  }
}

