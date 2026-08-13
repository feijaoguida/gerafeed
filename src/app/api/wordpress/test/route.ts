import { NextResponse } from "next/server";
import { testWordPressConnection } from "@/lib/wordpress";

export async function GET() {
  try {
    const result = await testWordPressConnection();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao conectar com WordPress";
    return NextResponse.json({ connected: false, error: message }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
