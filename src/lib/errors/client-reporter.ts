import { emitGlobalToast } from "@/components/ui/toast";

export interface ReportClientErrorOptions {
  screen?: string;
  module?: string;
  query?: unknown;
  userFacingMessage?: string;
  showToast?: boolean;
}

/**
 * Reporta um erro ocorrido no frontend (client-side) para a API /api/error-logs,
 * registrando no banco de dados todas as informações brutas (usuário, tela, rota, mensagem e stack)
 * enquanto exibe um popup discreto e elegante com a mensagem mascarada no canto da tela.
 */
export async function reportClientError(
  error: unknown,
  options?: ReportClientErrorOptions
): Promise<string | null> {
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "Erro desconhecido no cliente";

  const rawStack = error instanceof Error ? error.stack || null : null;
  const screen = options?.screen || (typeof window !== "undefined" ? window.location.pathname : "Client");
  const currentPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/client";

  const userFacing =
    options?.userFacingMessage ||
    "Ocorreu um erro ao processar sua ação. O suporte foi notificado.";

  // Exibe popup discreto no canto se showToast não for false
  if (options?.showToast !== false) {
    emitGlobalToast(userFacing, {
      variant: "error",
      title: "Atenção",
    });
  }

  // Envia em background para o servidor de logs
  try {
    if (typeof window !== "undefined") {
      const res = await fetch("/api/error-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          screen,
          path: currentPath,
          query: options?.query,
          module: options?.module || "GENERAL",
          errorMessage: rawMessage,
          errorStack: rawStack,
          statusCode: 400,
        }),
        keepalive: true,
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        return data.errorId || null;
      }
    }
  } catch (err) {
    console.warn("[reportClientError] Falha ao despachar erro para /api/error-logs:", err);
  }

  return null;
}
