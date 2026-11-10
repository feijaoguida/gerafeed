import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/security/password";
import {
  getLockStatus,
  recordFailedAttempt,
  clearFailedAttempts,
} from "@/lib/security/rate-limit";
import { logSystemError, getSafeClientErrorMessage } from "@/lib/errors/service";

const MAX_OTP_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos

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
    const rateLimitKey = `otp-reset:${cleanEmail}`;

    // 1. Verificar bloqueio temporário anti-força bruta
    const lock = getLockStatus(rateLimitKey);
    if (lock.locked) {
      return NextResponse.json(
        {
          error: `Muitas tentativas incorretas. Por segurança, aguarde ${lock.retryAfterSeconds} segundos ou solicite um novo código.`,
        },
        { status: 429 }
      );
    }

    // 2. Validar Token de Verificação
    const tokenRecord = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: tokenIdentifier,
          token: cleanCode,
        },
      },
    });

    if (!tokenRecord || tokenRecord.expires < new Date()) {
      const attempt = recordFailedAttempt(rateLimitKey, {
        maxAttempts: MAX_OTP_ATTEMPTS,
        windowMs: LOCK_DURATION_MS,
        lockDurationMs: LOCK_DURATION_MS,
      });

      if (attempt.locked) {
        // Invalida o token imediatamente
        await prisma.verificationToken.deleteMany({
          where: { identifier: tokenIdentifier },
        });

        await logSystemError({
          path: "/api/auth/forgot-password/reset",
          module: "AUTH",
          statusCode: 429,
          errorMessage: `[Security] Força bruta detectada na redefinição de senha para o email ${cleanEmail}. Código invalidado e IP/email bloqueado por 15m.`,
        });

        return NextResponse.json(
          {
            error:
              "Limite de 5 tentativas excedido. O código de recuperação foi cancelado por segurança. Solicite um novo código.",
          },
          { status: 429 }
        );
      }

      const expiredMsg = tokenRecord && tokenRecord.expires < new Date()
        ? "Este código expirou. Por favor, solicite um novo código."
        : `Código de confirmação incorreto. Você tem mais ${attempt.remainingAttempts} tentativa(s).`;

      return NextResponse.json({ error: expiredMsg }, { status: 400 });
    }

    // 3. Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    // 4. Gerar novo hash de senha com bcryptjs (SALT rounds 10)
    const passwordHash = await hashPassword(password);

    // 5. Atualizar a senha do usuário
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // 6. Invalidação imediata do token e limpeza das tentativas
    await prisma.verificationToken.deleteMany({
      where: { identifier: tokenIdentifier },
    });
    clearFailedAttempts(rateLimitKey);

    return NextResponse.json({
      success: true,
      message: "Senha redefinida com sucesso. Faça login com a nova senha.",
    });
  } catch (error) {
    console.error("POST /api/auth/forgot-password/reset error:", error);
    const message = getSafeClientErrorMessage(error, "Erro ao redefinir a senha.");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
