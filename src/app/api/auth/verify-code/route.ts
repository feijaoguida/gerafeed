import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || typeof email !== "string" || !code || typeof code !== "string") {
      return NextResponse.json(
        { error: "E-mail e código de verificação são obrigatórios." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    // 1. Localizar o token no banco
    const record = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: cleanEmail,
          token: cleanCode,
        },
      },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Código de confirmação incorreto ou não encontrado." },
        { status: 400 }
      );
    }

    // 2. Verificar expiração
    if (record.expires < new Date()) {
      return NextResponse.json(
        { error: "Este código expirou. Por favor, solicite um novo código." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
      message: "E-mail verificado com sucesso.",
    });
  } catch (error) {
    console.error("POST /api/auth/verify-code error:", error);
    const message = error instanceof Error ? error.message : "Erro ao validar código de confirmação.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
