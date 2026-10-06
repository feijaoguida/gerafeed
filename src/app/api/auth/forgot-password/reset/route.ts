import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/security/password";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, code, password } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "E-mail válido é obrigatório." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "A nova senha deve conter no mínimo 6 caracteres." },
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string" || code.trim().length !== 6) {
      return NextResponse.json(
        { error: "Código de confirmação de 6 dígitos é obrigatório." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();
    const tokenIdentifier = `password-reset:${cleanEmail}`;

    // 1. Validar Token de Verificação
    const tokenRecord = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: tokenIdentifier,
          token: cleanCode,
        },
      },
    });

    if (!tokenRecord || tokenRecord.expires < new Date()) {
      return NextResponse.json(
        { error: "Código de confirmação inválido ou expirado. Por favor, solicite um novo código." },
        { status: 400 }
      );
    }

    // 2. Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    // 3. Gerar novo hash de senha com bcryptjs (SALT rounds 10)
    const passwordHash = await hashPassword(password);

    // 4. Atualizar a senha do usuário
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // 5. Invalidação imediata do token (single-use / consumo único)
    await prisma.verificationToken.deleteMany({
      where: { identifier: tokenIdentifier },
    });

    return NextResponse.json({
      success: true,
      message: "Senha redefinida com sucesso. Faça login com a nova senha.",
    });
  } catch (error) {
    console.error("POST /api/auth/forgot-password/reset error:", error);
    const message = error instanceof Error ? error.message : "Erro ao redefinir a senha.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
