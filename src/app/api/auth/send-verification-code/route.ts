import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOtpCode } from "@/lib/security/otp";
import { renderVerificationCodeEmail } from "@/lib/mail/templates/verification-code";
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

    // 1. Verificar se o e-mail já possui conta ativa
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado. Por favor, faça login." },
        { status: 409 }
      );
    }

    // 2. Proteção Anti-flood: verificar se existe envio recente para este e-mail
    const existingToken = await prisma.verificationToken.findFirst({
      where: { identifier: cleanEmail },
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

    // 3. Limpar tokens anteriores para esse e-mail
    await prisma.verificationToken.deleteMany({
      where: { identifier: cleanEmail },
    });

    // 4. Gerar novo código OTP de 6 dígitos
    const code = generateOtpCode();
    const expires = new Date(Date.now() + TOKEN_LIFETIME_MS);

    await prisma.verificationToken.create({
      data: {
        identifier: cleanEmail,
        token: code,
        expires,
      },
    });

    // 5. Renderizar template e enviar e-mail
    const { html, text } = renderVerificationCodeEmail({ code, expiresInMinutes: 15 });

    const mailResult = await sendEmail({
      to: cleanEmail,
      subject: `${code} é o seu código de confirmação - GeraFeed`,
      html,
      text,
    });

    if (!mailResult.success) {
      console.error("[send-verification-code] Erro ao enviar e-mail:", mailResult.error);
      return NextResponse.json(
        { error: "Não foi possível enviar o e-mail no momento. Tente novamente mais tarde." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Código de confirmação enviado para seu e-mail com sucesso.",
    });
  } catch (error) {
    console.error("POST /api/auth/send-verification-code error:", error);
    const message = error instanceof Error ? error.message : "Erro ao enviar código de confirmação.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
