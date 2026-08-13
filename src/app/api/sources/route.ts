import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sources = await prisma.source.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(sources);
  } catch (error) {
    console.error("GET /api/sources error:", error);
    return NextResponse.json({ error: "Erro ao buscar fontes RSS" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, rssUrl, active = true } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Nome da fonte é obrigatório" }, { status: 400 });
    }

    if (!rssUrl || typeof rssUrl !== "string" || !rssUrl.trim()) {
      return NextResponse.json({ error: "URL do RSS é obrigatória" }, { status: 400 });
    }

    const source = await prisma.source.create({
      data: {
        name: name.trim(),
        rssUrl: rssUrl.trim(),
        active: Boolean(active),
      },
    });

    return NextResponse.json(source, { status: 201 });
  } catch (error) {
    console.error("POST /api/sources error:", error);
    return NextResponse.json({ error: "Erro ao cadastrar fonte RSS" }, { status: 500 });
  }
}
