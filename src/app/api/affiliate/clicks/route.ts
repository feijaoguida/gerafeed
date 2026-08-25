import { NextResponse } from "next/server";
import { ClickTrackingService } from "@/lib/affiliate/click-tracking";

// CORS headers to allow browser sendBeacon / fetch from WordPress frontend destinations
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  try {
    let token: string | undefined;

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      token = body?.token || body?.eventToken;
    } else {
      // Fallback for sendBeacon plain text body
      const rawText = await request.text();
      if (rawText) {
        try {
          const parsed = JSON.parse(rawText);
          token = parsed?.token || parsed?.eventToken;
        } catch {
          // If raw text is the token directly
          token = rawText.trim();
        }
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: "Token de clique obrigatório não fornecido." },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify cryptographic token and record click with tenant isolation
    const click = await ClickTrackingService.recordClick(token);

    return NextResponse.json(
      {
        success: true,
        id: click.id,
        recordedAt: click.createdAt,
      },
      {
        status: 201,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao processar clique afiliado.";
    const status =
      message.includes("Token") ||
      message.includes("assinatura") ||
      message.includes("Payload") ||
      message.includes("não encontrado")
        ? 400
        : 500;

    return NextResponse.json({ error: message }, { status, headers: corsHeaders });
  }
}
