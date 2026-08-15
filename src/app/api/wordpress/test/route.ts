import { NextResponse } from "next/server";
import { testWordPressConnection } from "@/lib/wordpress";
import { getSessionWorkspaceId } from "@/lib/workspace";

export async function GET() {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const result = await testWordPressConnection(workspaceId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao conectar com WordPress";
    return NextResponse.json({ connected: false, error: message }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}

