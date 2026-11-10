import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BillingService } from "@/lib/billing";
import { PlanHistoryService } from "@/lib/plan-history";
import { hashPassword } from "@/lib/security/password";
import { SiteAntifraudService, type SiteAntifraudValidationResult } from "@/lib/site-antifraud";
import { logSystemError, getSafeClientErrorMessage } from "@/lib/errors/service";
import {
  getLockStatus,
  recordFailedAttempt,
  clearFailedAttempts,
} from "@/lib/security/rate-limit";

const MAX_OTP_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, companyName, website, phone, email, password, code } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "E-mail válido é obrigatório." }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "A senha deve conter no mínimo 6 caracteres." }, { status: 400 });
    }

    if (!code || typeof code !== "string" || code.trim().length !== 6) {
      return NextResponse.json({ error: "Código de confirmação de 6 dígitos é obrigatório." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = typeof name === "string" && name.trim() ? name.trim() : "Usuário";
    const cleanCompanyName = typeof companyName === "string" && companyName.trim() ? companyName.trim() : "";
    let cleanWebsite = typeof website === "string" && website.trim() ? website.trim() : "";
    if (cleanWebsite && !cleanWebsite.startsWith("http://") && !cleanWebsite.startsWith("https://")) {
      cleanWebsite = `https://${cleanWebsite}`;
    }
    const cleanPhone = typeof phone === "string" && phone.trim() ? phone.trim() : "";
    const cleanCode = code.trim();
    const rateLimitKey = `otp-verify:${cleanEmail}`;

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
          identifier: cleanEmail,
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
        await prisma.verificationToken.deleteMany({
          where: { identifier: cleanEmail },
        });

        await logSystemError({
          path: "/api/auth/register",
          module: "AUTH",
          statusCode: 429,
          errorMessage: `[Security] Força bruta detectada no cadastro para o email ${cleanEmail}. Código invalidado e bloqueado por 15m.`,
        });

        return NextResponse.json(
          {
            error:
              "Limite de 5 tentativas excedido. O código de confirmação foi cancelado por segurança. Solicite um novo código.",
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: `Código de confirmação inválido ou expirado. Você tem mais ${attempt.remainingAttempts} tentativa(s).`,
        },
        { status: 400 }
      );
    }

    // Código válido: limpar contador de tentativas
    clearFailedAttempts(rateLimitKey);

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Este e-mail já está cadastrado. Faça login." }, { status: 409 });
    }

    // Trava Anti-Fraude de Cadastro de Sites em Múltiplas Contas (1ª e 2ª vez OK, 3ª vez Bloqueia com Suporte)
    let antifraudCheck: SiteAntifraudValidationResult | null = null;
    if (cleanWebsite) {
      antifraudCheck = await SiteAntifraudService.validateAndRecordSiteRegistration({
        rawUrl: cleanWebsite,
        userEmail: cleanEmail,
        sourceContext: "REGISTER",
        reqPath: "/api/auth/register",
      });

      if (!antifraudCheck.allowed) {
        return NextResponse.json(
          {
            error: antifraudCheck.blockedMessage || "Cadastro deste site bloqueado por segurança.",
            siteBlockedByAntifraud: true,
            attemptNumber: antifraudCheck.attemptNumber,
            supportRequired: true,
          },
          { status: 403 }
        );
      }
    }

    // 3. Hash Password with SALT rounds
    const passwordHash = await hashPassword(password);

    // 4. Create User com e-mail verificado
    const user = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        passwordHash,
        emailVerified: new Date(),
        phone: cleanPhone || null,
      },
    });

    // 5. Consumir/limpar token de verificação utilizado
    await prisma.verificationToken.deleteMany({
      where: { identifier: cleanEmail },
    });

    // 6. Create dedicated Workspace
    const workspaceName = cleanCompanyName || `Workspace de ${cleanName}`;
    const slugBase = (cleanCompanyName || cleanName)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 24) || "workspace";

    const workspace = await prisma.workspace.create({
      data: {
        name: workspaceName,
        slug: `${slugBase}-${Date.now().toString().slice(-4)}`,
        website: cleanWebsite || null,
        phone: cleanPhone || null,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
    });

    // 3. Ensure Default Plans & Free Subscription
    await BillingService.ensureDefaultPlans();
    await BillingService.getWorkspaceSubscription(workspace.id);

    const freePlan = await prisma.plan.findUnique({ where: { slug: "free" } });
    if (freePlan) {
      await PlanHistoryService.recordEvent({
        workspaceId: workspace.id,
        userId: user.id,
        userEmail: cleanEmail,
        newPlanId: freePlan.id,
        newPlanName: freePlan.name,
        eventType: "ACCOUNT_CREATED",
        billingCycle: "MONTHLY",
        originalAmount: 0,
        chargedAmount: 0,
        notes: `Conta e Workspace criados por ${cleanEmail}`,
      });
    }

    // Vincula o workspace ao registro de antifraude caso um site tenha sido cadastrado
    if (antifraudCheck?.historyRecordId) {
      try {
        await prisma.siteRegistrationHistory.update({
          where: { id: antifraudCheck.historyRecordId },
          data: {
            workspaceId: workspace.id,
            userId: user.id,
          },
        });
      } catch {
        // Vinculação não-bloqueante
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("POST /api/auth/register error:", error);
    const message = getSafeClientErrorMessage(error, "Erro ao criar conta de usuário.");

    await logSystemError({
      path: "/api/auth/register",
      module: "AUTH",
      statusCode: 500,
      errorMessage: `Falha ao registrar novo usuário: ${message}`,
      error,
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
