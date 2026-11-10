import { prisma } from "@/lib/prisma";
import { logSystemError } from "@/lib/errors/service";

export interface ValidateSiteRegistrationParams {
  rawUrl: string;
  workspaceId?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  wordpressSiteId?: string | null;
  sourceContext: "REGISTER" | "WORDPRESS_SITE";
  reqPath?: string;
}

export interface SiteAntifraudValidationResult {
  allowed: boolean;
  normalizedDomain: string;
  attemptNumber: number;
  distinctWorkspacesCount: number;
  blockedMessage?: string;
  historyRecordId?: string;
}

export class SiteAntifraudService {
  /**
   * Normaliza uma URL de site WordPress para extrair apenas o domínio raiz/hostname canônico em minúsculas.
   * Remove protocolos, www., portas, parâmetros de consulta, hash e sufixos de login/admin WP.
   */
  static normalizeSiteDomain(rawUrl: string): string {
    if (!rawUrl || typeof rawUrl !== "string") {
      return "";
    }

    let cleaned = rawUrl.trim().toLowerCase();

    // Remove protocolo
    cleaned = cleaned.replace(/^https?:\/\//i, "");

    // Remove autenticação embutida (user:pass@)
    cleaned = cleaned.replace(/^[^/@]+@/, "");

    // Remove sufixos WordPress conhecidos e caminhos
    cleaned = cleaned.replace(/\/wp-admin(\/.*)?$/i, "");
    cleaned = cleaned.replace(/\/wp-login\.php(\/.*)?$/i, "");
    cleaned = cleaned.replace(/\/wp-json(\/.*)?$/i, "");
    cleaned = cleaned.replace(/\/xmlrpc\.php(\/.*)?$/i, "");
    cleaned = cleaned.replace(/\/index\.php(\/.*)?$/i, "");

    // Remove query params e hash
    cleaned = cleaned.split("?")[0].split("#")[0];

    // Remove barras iniciais e finais
    cleaned = cleaned.replace(/^\/+|\/+$/g, "");

    // Extrai o host (remove paths residuais para obter o domínio principal)
    const hostPart = cleaned.split("/")[0];

    // Remove porta se houver (ex.: localhost:3000 ou meusite.com:8080)
    const domainWithoutPort = hostPart.split(":")[0];

    // Remove prefixo www.
    const normalized = domainWithoutPort.replace(/^www\./i, "");

    return normalized.trim();
  }

  /**
   * Valida se um domínio de site pode ser cadastrado com base no histórico perpétuo de contas distintas:
   * - 1ª conta distinta: OK (ALLOWED, attemptNumber = 1)
   * - 2ª conta distinta: OK (ALLOWED, attemptNumber = 2)
   * - 3ª conta distinta em diante: BLOQUEADO (BLOCKED, attemptNumber >= 3), emite alerta para suporte e grava SystemErrorLog.
   * 
   * Se a mesma conta (mesmo workspaceId) estiver revalidando/atualizando seu próprio site, é permitido e não conta como nova conta fraudadora.
   */
  static async validateAndRecordSiteRegistration(
    params: ValidateSiteRegistrationParams
  ): Promise<SiteAntifraudValidationResult> {
    const rawUrl = params.rawUrl || "";
    const normalizedDomain = this.normalizeSiteDomain(rawUrl);
    const reqPath = params.reqPath || (params.sourceContext === "REGISTER" ? "/api/auth/register" : "/api/wordpress/sites");
    const errorModule = params.sourceContext === "REGISTER" ? "AUTH" : "WORDPRESS";

    if (!normalizedDomain) {
      return {
        allowed: false,
        normalizedDomain: "",
        attemptNumber: 0,
        distinctWorkspacesCount: 0,
        blockedMessage: "A URL do site informada é inválida.",
      };
    }

    try {
      // Busca todos os registros históricos deste domínio
      const existingRecords = await prisma.siteRegistrationHistory.findMany({
        where: {
          normalizedDomain,
        },
        orderBy: { createdAt: "asc" },
      });

      // Filtra registros permitidos que não foram cancelados pelo suporte
      const allowedRecords = existingRecords.filter((r) => r.status === "ALLOWED");

      // Coleta os identificadores de contas/workspaces distintos que já vincularam o domínio
      const distinctWorkspaces = new Set<string>();
      const distinctEmails = new Set<string>();

      for (const rec of allowedRecords) {
        if (rec.workspaceId) {
          distinctWorkspaces.add(rec.workspaceId);
        } else if (rec.userEmail) {
          distinctEmails.add(rec.userEmail.toLowerCase());
        }
      }

      // Verifica se a requisição atual pertence a uma conta que já registrou o site anteriormente
      const isSameWorkspace =
        params.workspaceId && distinctWorkspaces.has(params.workspaceId);
      const isSameEmail =
        params.userEmail && distinctEmails.has(params.userEmail.toLowerCase());

      if (isSameWorkspace || isSameEmail) {
        // É a mesma conta atualizando ou revalidando seu próprio site: permitido sem penalizar
        return {
          allowed: true,
          normalizedDomain,
          attemptNumber: distinctWorkspaces.size || 1,
          distinctWorkspacesCount: distinctWorkspaces.size,
        };
      }

      // Conta quantas contas/workspaces distintos anteriores já registraram este domínio
      const previousDistinctAccountsCount = Math.max(
        distinctWorkspaces.size,
        distinctEmails.size
      );

      const attemptNumber = previousDistinctAccountsCount + 1;

      // REGRA DE NEGÓCIO:
      // 1ª conta = OK
      // 2ª conta = OK
      // 3ª conta em diante = BLOQUEADA
      if (attemptNumber >= 3) {
        const blockedMessage =
          "Alerta de Segurança: Este site já foi vinculado anteriormente ao limite máximo de contas permitidas. O cadastro deste site foi bloqueado. Por favor, entre em contato com o nosso Suporte para liberação.";

        // Grava o registro de bloqueio no histórico perpétuo
        const blockedRecord = await prisma.siteRegistrationHistory.create({
          data: {
            normalizedDomain,
            rawUrl,
            workspaceId: params.workspaceId || null,
            userId: params.userId || null,
            userEmail: params.userEmail || null,
            wordpressSiteId: params.wordpressSiteId || null,
            sourceContext: params.sourceContext,
            attemptNumber,
            status: "BLOCKED",
          },
        });

        // Grava obrigatoriamente em SystemErrorLog para auditoria de fraude
        const previousOwners = allowedRecords
          .map((r) => `workspace:${r.workspaceId || "N/A"} (email:${r.userEmail || "N/A"})`)
          .join(", ");

        await logSystemError({
          path: reqPath,
          module: errorModule,
          statusCode: 403,
          workspaceId: params.workspaceId,
          userId: params.userId,
          userEmail: params.userEmail,
          errorMessage: `[ANTI-FRAUDE] Cadastro do site "${normalizedDomain}" bloqueado na 3ª tentativa ou superior (tentativa #${attemptNumber}). Contas anteriores registradas: [${previousOwners}].`,
          query: {
            normalizedDomain,
            rawUrl,
            attemptNumber,
            sourceContext: params.sourceContext,
            previousDistinctCount: previousDistinctAccountsCount,
          },
        });

        return {
          allowed: false,
          normalizedDomain,
          attemptNumber,
          distinctWorkspacesCount: previousDistinctAccountsCount,
          blockedMessage,
          historyRecordId: blockedRecord.id,
        };
      }

      // 1ª ou 2ª tentativa: Permitido!
      const allowedRecord = await prisma.siteRegistrationHistory.create({
        data: {
          normalizedDomain,
          rawUrl,
          workspaceId: params.workspaceId || null,
          userId: params.userId || null,
          userEmail: params.userEmail || null,
          wordpressSiteId: params.wordpressSiteId || null,
          sourceContext: params.sourceContext,
          attemptNumber,
          status: "ALLOWED",
        },
      });

      return {
        allowed: true,
        normalizedDomain,
        attemptNumber,
        distinctWorkspacesCount: attemptNumber,
        historyRecordId: allowedRecord.id,
      };
    } catch (err) {
      await logSystemError({
        path: reqPath,
        module: errorModule,
        statusCode: 500,
        workspaceId: params.workspaceId,
        userId: params.userId,
        userEmail: params.userEmail,
        errorMessage: `Erro ao validar anti-fraude de site para "${normalizedDomain}": ${err instanceof Error ? err.message : String(err)}`,
        error: err,
      });

      // Em caso de falha de banco no check de anti-fraude, bloqueia preventivamente por segurança
      return {
        allowed: false,
        normalizedDomain,
        attemptNumber: 0,
        distinctWorkspacesCount: 0,
        blockedMessage: "Erro interno ao validar integridade do site. Por favor, tente novamente ou contate o suporte.",
      };
    }
  }

  /**
   * Liberação administrativa pelo Backoffice/Suporte para um domínio específico.
   * Marca registros antigos ou bloqueados como CLEARED_BY_SUPPORT para resetar ou liberar o cliente.
   */
  static async clearDomainForWorkspace(
    domainOrOptions:
      | string
      | {
          rawUrl?: string;
          normalizedDomain?: string;
          workspaceId: string;
          clearedByUserId?: string;
          reason?: string;
        },
    workspaceIdArg?: string,
    clearedByUserIdArg?: string
  ): Promise<{ success: boolean; count: number }> {
    let domain = "";
    let targetWorkspaceId = "";
    let userId = "";

    if (typeof domainOrOptions === "object") {
      domain =
        domainOrOptions.normalizedDomain ||
        (domainOrOptions.rawUrl ? this.normalizeSiteDomain(domainOrOptions.rawUrl) : "");
      targetWorkspaceId = domainOrOptions.workspaceId;
      userId = domainOrOptions.clearedByUserId || "";
    } else {
      domain = this.normalizeSiteDomain(domainOrOptions);
      targetWorkspaceId = workspaceIdArg || "";
      userId = clearedByUserIdArg || "";
    }

    const updated = await prisma.siteRegistrationHistory.updateMany({
      where: {
        normalizedDomain: domain,
        status: { in: ["BLOCKED", "ALLOWED"] },
      },
      data: {
        status: "CLEARED_BY_SUPPORT",
      },
    });

    await logSystemError({
      path: "/backoffice/sites/clear",
      module: "BACKOFFICE",
      statusCode: 200,
      workspaceId: targetWorkspaceId || undefined,
      userId: userId || undefined,
      errorMessage: `[SUPORTE] Domínio "${domain}" liberado manualmente pelo suporte técnico para o workspace "${targetWorkspaceId}".`,
      query: { normalizedDomain: domain, workspaceId: targetWorkspaceId, updatedCount: updated.count },
    });

    return { success: true, count: updated.count };
  }

  /**
   * Obtém todo o histórico de tentativas e cadastros para um domínio normalizado.
   */
  static async getDomainRegistrationHistory(normalizedDomain: string) {
    const records = await prisma.siteRegistrationHistory.findMany({
      where: { normalizedDomain },
      orderBy: { createdAt: "desc" },
    });

    const workspaceIds = Array.from(
      new Set(records.map((r) => r.workspaceId).filter((id): id is string => Boolean(id)))
    );

    const workspaces = workspaceIds.length > 0
      ? await prisma.workspace.findMany({
          where: { id: { in: workspaceIds } },
          select: { id: true, name: true, slug: true },
        })
      : [];

    const workspaceMap = new Map(workspaces.map((w) => [w.id, w]));

    return records.map((r) => ({
      ...r,
      workspace: r.workspaceId ? workspaceMap.get(r.workspaceId) || null : null,
    }));
  }
}
