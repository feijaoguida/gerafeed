import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
    const { email, code } = body;

    if (!email || typeof email !== "string" || !code || typeof code !== "string") {
      return NextResponse.json(
        { error: "E-mail e código de verificação são obrigatórios." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();
    const rateLimitKey = `otp-verify:${cleanEmail}`;

    // 1. Verificar se a conta está bloqueada por excesso de tentativas
    const lock = getLockStatus(rateLimitKey);
    if (lock.locked) {
      return NextResponse.json(
        {
          error: `Muitas tentativas incorretas. Por segurança, tente novamente em ${lock.retryAfterSeconds} segundos ou solicite um novo código.`,
        },
        { status: 429 }
      );
    }

    // 2. Localizar o token no banco
    const record = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: cleanEmail,
          token: cleanCode,
        },
      },
    });

    if (!record || record.expires < new Date()) {
      const attempt = recordFailedAttempt(rateLimitKey, {
        maxAttempts: MAX_OTP_ATTEMPTS,
        windowMs: LOCK_DURATION_MS,
        lockDurationMs: LOCK_DURATION_MS,
      });

      if (attempt.locked) {
        // Invalida o token imediatamente para frustrar o ataque de força bruta
        await prisma.verificationToken.deleteMany({
          where: { identifier: cleanEmail },
        });

        await logSystemError({
          path: "/api/auth/verify-code",
          module: "AUTH",
          statusCode: 429,
          errorMessage: `[Security] Força bruta detectada no OTP do email ${cleanEmail}. Código invalidado e IP/email bloqueado por 15m.`,
        });

        return NextResponse.json(
          {
            error:
              "Limite de 5 tentativas excedido. O código de confirmação foi cancelado por segurança. Solicite um novo código.",
          },
          { status: 429 }
        );
      }

      const expiredMsg = record && record.expires < new Date()
        ? "Este código expirou. Por favor, solicite um novo código."
        : `Código de confirmação incorreto. Você tem mais ${attempt.remainingAttempts} tentativa(s).`;

      return NextResponse.json({ error: expiredMsg }, { status: 400 });
    }

    // Código validado com sucesso: limpar histórico de tentativas falhas
    clearFailedAttempts(rateLimitKey);

    return NextResponse.json({
      success: true,
      valid: true,
      message: "E-mail verificado com sucesso.",
    });
  } catch (error) {
    console.error("POST /api/auth/verify-code error:", error);
    const message = getSafeClientErrorMessage(error, "Erro ao validar código de confirmação.");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
