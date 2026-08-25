import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import { ProductComparisonGenerator } from "@/lib/affiliate/generators/comparison-generator";

export async function POST(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    const body = await request.json();
    if (!Array.isArray(body.productIds) || body.productIds.length < 2) {
      return NextResponse.json(
        { error: "productIds deve ser um array com no mínimo 2 produtos." },
        { status: 400 }
      );
    }

    const result = await ProductComparisonGenerator.generate({
      workspaceId,
      productIds: body.productIds,
      offerIds: body.offerIds,
      focusKeyword: body.focusKeyword?.trim(),
      customInstructions: body.customInstructions?.trim(),
      wordpressSiteId: body.wordpressSiteId?.trim() || undefined,
      categoryId: body.categoryId?.trim() || undefined,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao gerar comparativo de produtos";
    const status = msg.includes("não está habilitado")
      ? 403
      : msg.includes("não foram encontrados") || msg.includes("não encontrado")
      ? 404
      : msg.includes("exige") || msg.includes("mínimo")
      ? 400
      : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
