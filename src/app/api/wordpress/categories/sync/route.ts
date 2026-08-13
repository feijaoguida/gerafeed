import { NextResponse } from "next/server";
import { syncWordPressCategories } from "@/lib/wordpress";

export async function POST() {
  try {
    const result = await syncWordPressCategories();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao sincronizar categorias do WordPress";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
