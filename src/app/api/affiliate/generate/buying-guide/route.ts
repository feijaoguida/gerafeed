import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import { BuyingGuideGenerator } from "@/lib/affiliate/generators/roundup-generator";

export async function POST(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    const body = await request.json();
    if (!body.categoryName?.trim()) {
      return NextResponse.json(
        { error: "categoryName é obrigatório para gerar o guia de compra." },
        { status: 400 }
      );
    }

    const result = await BuyingGuideGenerator.generate({
      workspaceId,
      productIds: body.productIds,
      offerIds: body.offerIds,
      categoryName: body.categoryName.trim(),
      focusKeyword: body.focusKeyword?.trim(),
      customInstructions: body.customInstructions?.trim(),
      wordpressSiteId: body.wordpressSiteId?.trim() || undefined,
      categoryId: body.categoryId?.trim() || undefined,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao gerar guia de compra";
    const status = msg.includes("não está habilitado")
      ? 403
      : msg.includes("não foram encontrados") || msg.includes("não encontrado")
      ? 404
      : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
