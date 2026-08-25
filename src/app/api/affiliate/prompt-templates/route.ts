import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import { AffiliatePromptTemplateService } from "@/lib/affiliate/prompt-template-service";

export async function GET() {
  try {
    const workspaceId = await getSessionWorkspaceId();
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    await AffiliatePromptTemplateService.ensureDefaultTemplates();
    const templates = await AffiliatePromptTemplateService.listTemplates(workspaceId);

    return NextResponse.json(templates);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao listar templates de prompt";
    const status = msg.includes("não está habilitado") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
