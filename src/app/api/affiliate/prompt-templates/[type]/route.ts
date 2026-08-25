import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import { AffiliatePromptTemplateService, CommercialArticleType } from "@/lib/affiliate";

const VALID_TYPES: CommercialArticleType[] = [
  "PRODUCT_REVIEW",
  "COMPARISON",
  "BEST_PRODUCTS",
  "BUYING_GUIDE",
  "PROBLEM_SOLUTION",
  "DEALS",
  "SEASONAL",
];

export async function GET(
  request: Request,
  props: { params: Promise<{ type: string }> }
) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    const { type } = await props.params;
    const upperType = type.toUpperCase() as CommercialArticleType;

    if (!VALID_TYPES.includes(upperType)) {
      return NextResponse.json(
        { error: `Tipo de artigo comercial inválido: ${type}` },
        { status: 400 }
      );
    }

    const template = await AffiliatePromptTemplateService.getEffectiveTemplate(
      workspaceId,
      upperType
    );

    return NextResponse.json(template);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao buscar template de prompt";
    const status = msg.includes("não está habilitado") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function PUT() {
  return NextResponse.json(
    {
      error:
        "A governança de prompts de afiliados é global e gerenciada exclusivamente pelo SuperAdmin no Backoffice (/backoffice/affiliate-prompts). A edição por workspace foi desativada.",
    },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      error:
        "A governança de prompts de afiliados é global e gerenciada exclusivamente pelo SuperAdmin no Backoffice (/backoffice/affiliate-prompts). A exclusão/restauração por workspace foi desativada.",
    },
    { status: 403 }
  );
}
