import { NextResponse } from "next/server";
import { processRssSources } from "@/lib/rss";

export async function POST() {
  try {
    const result = await processRssSources(5);
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/rss/process error:", error);
    return NextResponse.json({ error: "Erro ao processar fontes RSS" }, { status: 500 });
  }
}
