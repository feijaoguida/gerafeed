import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/superadmin";

export async function GET() {
  try {
    const { user } = await requireSuperAdmin();
    return NextResponse.json({
      authorized: true,
      superAdminId: user.id,
      email: user.email,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acesso negado";
    const status = message.includes("Não autenticado") ? 401 : 403;
    return NextResponse.json({ error: message, authorized: false }, { status });
  }
}
