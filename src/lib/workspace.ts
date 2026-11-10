import { auth, DEFAULT_WORKSPACE_ID } from "@/auth";

export { DEFAULT_WORKSPACE_ID };

/**
 * Erro lançado quando uma operação de workspace é invocada sem sessão autenticada.
 */
export class UnauthorizedWorkspaceError extends Error {
  public readonly status = 401;

  constructor(message = "Não autorizado. Faça login para acessar este recurso.") {
    super(message);
    this.name = "UnauthorizedWorkspaceError";
  }
}

/**
 * Retorna o workspaceId do usuário ativo obtido da sessão autenticada.
 * Lança UnauthorizedWorkspaceError (HTTP 401) caso não haja sessão válida em produção.
 * Permite fallback para TEST_WORKSPACE_ID / DEFAULT_WORKSPACE_ID apenas fora de produção
 * mediante configuração explícita (ex: scripts CLI de teste).
 */
export async function getSessionWorkspaceId(): Promise<string> {
  try {
    const session = await auth();
    if (session?.user?.id) {
      const workspaceId = session.user.workspaceId || session.workspaceId;
      if (workspaceId) {
        return workspaceId;
      }
    }
  } catch {
    // Falha de leitura de sessão
  }

  // Fallback controlado EXCLUSIVAMENTE para desenvolvimento / scripts de teste
  const isProduction = process.env.NODE_ENV === "production";
  const allowFallback =
    !isProduction &&
    (process.env.ALLOW_TEST_WORKSPACE_FALLBACK === "true" ||
      Boolean(process.env.TEST_WORKSPACE_ID));

  if (allowFallback) {
    return process.env.TEST_WORKSPACE_ID || DEFAULT_WORKSPACE_ID;
  }

  throw new UnauthorizedWorkspaceError();
}

/**
 * Retorna a sessão autenticada e o workspaceId verificado.
 * Se o usuário não estiver autenticado, retorna null (nunca recorre a DEFAULT_WORKSPACE_ID silenciosamente).
 */
export async function getAuthenticatedWorkspace(): Promise<{
  workspaceId: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
} | null> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return null;
    }

    const workspaceId =
      session.user.workspaceId || session.workspaceId;

    if (!workspaceId) {
      return null;
    }

    return {
      workspaceId,
      userId: session.user.id,
      userEmail: session.user.email || undefined,
      userName: session.user.name || undefined,
    };
  } catch {
    return null;
  }
}
