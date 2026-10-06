import { NextResponse } from "next/server";
import { logSystemError } from "@/lib/errors/service";
import { auth } from "@/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      screen,
      path: reportedPath,
      query,
      module = "GENERAL",
      errorMessage,
      errorStack,
      statusCode = 500,
    } = body;

    if (!errorMessage || typeof errorMessage !== "string") {
      return NextResponse.json(
        { error: "errorMessage é obrigatório" },
        { status: 400 }
      );
    }

    // Identificar sessão se disponível
    let userId: string | null = null;
    let userEmail: string | null = null;
    let userName: string | null = null;
    let workspaceId: string | null = null;

    try {
      const session = await auth();
      if (session?.user) {
        userId = session.user.id || null;
        userEmail = session.user.email || null;
        userName = session.user.name || null;
        if ("workspaceId" in session.user) {
          workspaceId = (session.user as unknown as { workspaceId?: string }).workspaceId || null;
        }
      }
    } catch {
      // Ignora erro ao resolver sessão
    }

    const userAgent = request.headers.get("user-agent");
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip");

    const errorId = await logSystemError({
      workspaceId,
      userId,
      userEmail,
      userName,
      screen: screen || "Client Interface",
      path: reportedPath || "/client",
      method: "CLIENT",
      query,
      module,
      errorMessage,
      errorStack,
      statusCode: typeof statusCode === "number" ? statusCode : 500,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, errorId }, { status: 201 });
  } catch (err) {
    console.error("POST /api/error-logs error:", err);
    return NextResponse.json(
      { error: "Erro interno ao registrar log" },
      { status: 500 }
    );
  }
}
