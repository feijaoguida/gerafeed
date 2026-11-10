import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/superadmin";
import { SiteAntifraudService } from "@/lib/site-antifraud";
import { logSystemError } from "@/lib/errors/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdmin();
    const { id: workspaceId } = await params;
    const body = await request.json();
    const { domain } = body;

    if (!domain || typeof domain !== "string" || !domain.trim()) {
      return NextResponse.json(
        { error: "Domínio é obrigatório para liberação." },
        { status: 400 }
      );
    }

    const normalizedDomain = SiteAntifraudService.normalizeSiteDomain(domain);
    const result = await SiteAntifraudService.clearDomainForWorkspace(
      normalizedDomain,
      workspaceId,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      message: `Domínio "${normalizedDomain}" liberado com sucesso para a empresa (${result.count} registros atualizados).`,
      clearedCount: result.count,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao liberar domínio pelo suporte.";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;

    await logSystemError({
      path: "/api/backoffice/companies/[id]/wordpress/clear-domain-lock",
      module: "BACKOFFICE",
      statusCode: status,
      errorMessage: `Falha na liberação de domínio por suporte: ${message}`,
      error,
    });

    return NextResponse.json({ error: message }, { status });
  }
}
