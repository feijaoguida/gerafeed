import { NextResponse } from "next/server";
import { processRssSources } from "@/lib/rss";
import { getSessionWorkspaceId } from "@/lib/workspace";

export async function POST() {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const result = await processRssSources(5, workspaceId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/rss/process error:", error);
    return NextResponse.json({ error: "Erro ao processar fontes RSS" }, { status: 500 });
  }
}

