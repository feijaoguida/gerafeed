import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export type ErrorModule =
  | "AI"
  | "RSS"
  | "BILLING"
  | "WORDPRESS"
  | "AFFILIATES"
  | "AUTH"
  | "BACKOFFICE"
  | "GENERAL";

export interface LogSystemErrorInput {
  workspaceId?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  screen?: string | null;
  path: string;
  method?: string | null;
  query?: unknown;
  module?: ErrorModule | string;
  error?: unknown;
  errorMessage?: string;
  errorStack?: string | null;
  statusCode?: number;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface ApiErrorContext {
  module?: ErrorModule | string;
  screen?: string;
  workspaceId?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  query?: unknown;
  statusCode?: number;
  userFacingMessage?: string;
}

/**
 * Detecta se o erro decorre de infraestrutura interna, banco de dados (Prisma/PostgreSQL),
 * problemas de conexão de rede ou vazamentos de código fonte.
 */
export function isInternalInfrastructureError(error: unknown): boolean {
  if (!error) return false;

  const errorObj = typeof error === "object" ? (error as Record<string, unknown>) : null;
  const errorName = String(errorObj?.name || "");

  if (errorName.startsWith("PrismaClient")) {
    return true;
  }

  const message = extractErrorMessage(error);
  const lowerMsg = message.toLowerCase();

  const infrastructurePatterns = [
    "prisma",
    "unique constraint",
    "foreign key constraint",
    "relation does not exist",
    "table does not exist",
    "column does not exist",
    "econnrefused",
    "etimedout",
    "enotfound",
    "select ",
    "insert into ",
    "update ",
    "delete from ",
    "node_modules",
    "/home/",
    "stack trace",
  ];

  if (
    lowerMsg.includes("does not exist") &&
    (lowerMsg.includes("relation") || lowerMsg.includes("table") || lowerMsg.includes("column"))
  ) {
    return true;
  }

  for (const pattern of infrastructurePatterns) {
    if (lowerMsg.includes(pattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Retorna uma mensagem de erro segura para o cliente frontend,
 * garantindo que detalhes internos de banco de dados ou stack traces nunca vazem.
 */
export function getSafeClientErrorMessage(
  error: unknown,
  fallbackMessage: string = "Ocorreu um erro interno ao processar sua solicitação. Tente novamente mais tarde."
): string {
  if (!error) return fallbackMessage;

  if (isInternalInfrastructureError(error)) {
    return fallbackMessage;
  }

  if (error instanceof Error && error.message) {
    const trimmed = error.message.trim();
    if (trimmed.length > 0 && trimmed.length <= 300) {
      return trimmed;
    }
  }

  return fallbackMessage;
}

/**
 * Palavras-chave de campos sensíveis para higienização em logs.
 */
const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "newpassword",
  "oldpassword",
  "secret",
  "apikey",
  "token",
  "authorization",
  "creditcard",
  "cardnumber",
  "cvv",
  "ccv",
  "accesstoken",
  "refreshtoken",
  "privatekey",
  "apppassword",
  "applicationpassword",
]);

/**
 * Remove recursivamente senhas, segredos e tokens sensíveis de objetos/arrays.
 */
export function sanitizeData(data: unknown, depth = 0): unknown {
  if (depth > 6) return "[MAX_DEPTH]";
  if (data === null || data === undefined) return data;

  if (typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, depth + 1));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes("password") || lowerKey.includes("secret")) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeData(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Extrai a mensagem bruta de erro de qualquer tipo de exceção.
 */
export function extractErrorMessage(err: unknown): string {
  if (!err) return "Erro não especificado";
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string") {
    return (err as { message: string }).message;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/**
 * Extrai o stack trace se disponível.
 */
export function extractErrorStack(err: unknown): string | null {
  if (err instanceof Error && err.stack) {
    return err.stack;
  }
  return null;
}

/**
 * Grava o log de erro no banco de dados de maneira não-bloqueante.
 * Em caso de falha de conexão ou erro ao persistir o log, nunca lança exceção.
 */
export async function logSystemError(input: LogSystemErrorInput): Promise<string | null> {
  try {
    const rawMessage = input.errorMessage || extractErrorMessage(input.error);
    const stack = input.errorStack !== undefined ? input.errorStack : extractErrorStack(input.error);
    const sanitizedQuery = input.query !== undefined && input.query !== null ? sanitizeData(input.query) : null;

    const record = await prisma.systemErrorLog.create({
      data: {
        workspaceId: input.workspaceId || null,
        userId: input.userId || null,
        userEmail: input.userEmail || null,
        userName: input.userName || null,
        screen: input.screen || null,
        path: input.path || "unknown",
        method: input.method ? input.method.toUpperCase() : "GET",
        query: sanitizedQuery as Prisma.InputJsonValue,
        module: input.module || "GENERAL",
        errorMessage: rawMessage || "Erro desconhecido",
        errorStack: stack,
        statusCode: input.statusCode || 500,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
      },
    });

    return record.id;
  } catch (loggingErr) {
    // Se falhou (ex.: chave estrangeira inválida em workspaceId), tenta salvar sem workspaceId para não perder o log
    if (input.workspaceId) {
      try {
        const rawMessage = input.errorMessage || extractErrorMessage(input.error);
        const stack = input.errorStack !== undefined ? input.errorStack : extractErrorStack(input.error);
        const sanitizedQuery = input.query !== undefined && input.query !== null ? sanitizeData(input.query) : null;
        const fallback = await prisma.systemErrorLog.create({
          data: {
            workspaceId: null,
            userId: input.userId || null,
            userEmail: input.userEmail || null,
            userName: input.userName || null,
            screen: input.screen || null,
            path: input.path || "unknown",
            method: input.method ? input.method.toUpperCase() : "GET",
            query: sanitizedQuery as Prisma.InputJsonValue,
            module: input.module || "GENERAL",
            errorMessage: `[workspaceId original: ${input.workspaceId}] ${rawMessage || "Erro desconhecido"}`,
            errorStack: stack,
            statusCode: input.statusCode || 500,
            ipAddress: input.ipAddress || null,
            userAgent: input.userAgent || null,
          },
        });
        return fallback.id;
      } catch {
        // Fallback silencioso
      }
    }
    // Log não-bloqueante: preserva a integridade da aplicação
    console.error("[logSystemError] Falha ao persistir erro no banco de dados:", loggingErr);
    return null;
  }
}

/**
 * Handler centralizado para tratamento e captura de erros em rotas de API.
 * Mascara o erro para o cliente com uma mensagem amigável, enquanto salva os dados
 * brutos e stack trace no banco para o suporte/desenvolvedor inspecionar no Backoffice.
 */
export async function handleApiError(
  error: unknown,
  req?: Request,
  context?: ApiErrorContext
): Promise<NextResponse> {
  let path = "unknown";
  let method = "GET";
  let userAgent: string | null = null;
  let ipAddress: string | null = null;
  let queryParams: unknown = context?.query;

  if (req) {
    try {
      const url = new URL(req.url);
      path = url.pathname;
      method = req.method;

      if (!queryParams && url.search) {
        const paramsObj: Record<string, string> = {};
        url.searchParams.forEach((val, key) => {
          paramsObj[key] = val;
        });
        queryParams = paramsObj;
      }

      userAgent = req.headers.get("user-agent");
      ipAddress =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip");
    } catch {
      // Ignora erro de parsing de URL
    }
  }

  // Tenta resolver usuário autenticado se não fornecido explicitamente
  let userId = context?.userId || null;
  let userEmail = context?.userEmail || null;
  let userName = context?.userName || null;
  let workspaceId = context?.workspaceId || null;

  if (!userId && !userEmail) {
    try {
      const session = await auth();
      if (session?.user) {
        userId = session.user.id || null;
        userEmail = session.user.email || null;
        userName = session.user.name || null;
        if (!workspaceId && "workspaceId" in session.user) {
          workspaceId = (session.user as unknown as { workspaceId?: string }).workspaceId || null;
        }
      }
    } catch {
      // Falha ao obter sessão não deve interromper o fluxo
    }
  }

  const isUnauthorized =
    error instanceof Error &&
    (error.name === "UnauthorizedWorkspaceError" ||
      (error as { status?: number }).status === 401 ||
      error.message === "UNAUTHORIZED_WORKSPACE_ACCESS" ||
      error.message.includes("Não autenticado") ||
      error.message.includes("Não autorizado"));

  const statusCode = isUnauthorized ? 401 : (context?.statusCode || (error as { status?: number })?.status || 500);
  const rawMessage = extractErrorMessage(error);
  const stack = extractErrorStack(error);

  // Registra no banco
  const errorLogId = await logSystemError({
    workspaceId,
    userId,
    userEmail,
    userName,
    screen: context?.screen,
    path,
    method,
    query: queryParams,
    module: context?.module || (isUnauthorized ? "AUTH" : "GENERAL"),
    error,
    errorMessage: rawMessage,
    errorStack: stack,
    statusCode,
    ipAddress,
    userAgent,
  });

  // Mensagem amigável mascarada para o cliente
  const userFacingMessage =
    context?.userFacingMessage ||
    (isUnauthorized
      ? "Não autorizado. Faça login para continuar."
      : "Ocorreu um erro interno ao processar sua solicitação. Tente novamente mais tarde.");

  return NextResponse.json(
    {
      error: userFacingMessage,
      errorId: errorLogId || undefined,
    },
    { status: statusCode }
  );
}
