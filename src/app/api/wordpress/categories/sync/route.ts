import { NextResponse } from "next/server";
import { syncWordPressCategories } from "@/lib/wordpress";
import { getSessionWorkspaceId } from "@/lib/workspace";

export async function POST() {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const result = await syncWordPressCategories(workspaceId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao sincronizar categorias do WordPress";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

