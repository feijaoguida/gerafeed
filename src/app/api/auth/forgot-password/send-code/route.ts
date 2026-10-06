import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOtpCode } from "@/lib/security/otp";
import { renderPasswordResetEmail } from "@/lib/mail/templates/password-reset";
import { sendEmail } from "@/lib/mail";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_LIFETIME_MS = 15 * 60 * 1000; // 15 minutos
const COOLDOWN_MS = 60 * 1000; // 60 segundos entre reenvios

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { error: "Informe um endereço de e-mail válido." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const tokenIdentifier = `password-reset:${cleanEmail}`;

    // 1. Proteção Anti-flood: verificar se existe envio recente para este e-mail
    const existingToken = await prisma.verificationToken.findFirst({
      where: { identifier: tokenIdentifier },
      orderBy: { expires: "desc" },
    });

    if (existingToken) {
      const timeRemainingMs = existingToken.expires.getTime() - Date.now();
      const elapsedMs = TOKEN_LIFETIME_MS - timeRemainingMs;

      if (elapsedMs < COOLDOWN_MS) {
        const waitSeconds = Math.ceil((COOLDOWN_MS - elapsedMs) / 1000);
        return NextResponse.json(
          { error: `Por favor, aguarde ${waitSeconds}s antes de solicitar um novo código.` },
          { status: 429 }
        );
      }
    }

    // 2. Proteção Anti-User-Enumeration: verifica existência sem vazar resposta
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      // 3. Limpar tokens de recuperação anteriores deste e-mail
      await prisma.verificationToken.deleteMany({
        where: { identifier: tokenIdentifier },
      });

      // 4. Gerar novo código OTP de 6 dígitos
      const code = generateOtpCode();
      const expires = new Date(Date.now() + TOKEN_LIFETIME_MS);

      await prisma.verificationToken.create({
        data: {
          identifier: tokenIdentifier,
          token: code,
          expires,
        },
      });

      // 5. Renderizar template e enviar e-mail
      const { html, text } = renderPasswordResetEmail({ code, expiresInMinutes: 15 });

      const mailResult = await sendEmail({
        to: cleanEmail,
        subject: `${code} é o seu código para redefinir a senha - GeraFeed`,
        html,
        text,
      });

      if (!mailResult.success) {
        console.error("[forgot-password/send-code] Erro ao enviar e-mail:", mailResult.error);
        return NextResponse.json(
          { error: "Não foi possível enviar o e-mail no momento. Tente novamente mais tarde." },
          { status: 500 }
        );
      }
    }

    // Resposta uniforme para mitigar User Enumeration
    return NextResponse.json({
      success: true,
      message: "Se este e-mail estiver cadastrado, você receberá um código de confirmação em instantes.",
    });
  } catch (error) {
    console.error("POST /api/auth/forgot-password/send-code error:", error);
    const message = error instanceof Error ? error.message : "Erro ao processar solicitação de recuperação de senha.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
