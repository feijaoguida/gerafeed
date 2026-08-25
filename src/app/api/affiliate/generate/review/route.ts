import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import { ProductReviewGenerator } from "@/lib/affiliate/generators/review-generator";

export async function POST(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    const body = await request.json();
    if (!body.productId?.trim()) {
      return NextResponse.json(
        { error: "productId é obrigatório para gerar o review." },
        { status: 400 }
      );
    }

    const result = await ProductReviewGenerator.generate({
      workspaceId,
      productId: body.productId.trim(),
      offerId: body.offerId?.trim(),
      focusKeyword: body.focusKeyword?.trim(),
      customInstructions: body.customInstructions?.trim(),
      wordpressSiteId: body.wordpressSiteId?.trim() || undefined,
      categoryId: body.categoryId?.trim() || undefined,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao gerar review do produto";
    const status = msg.includes("não está habilitado")
      ? 403
      : msg.includes("não encontrado")
      ? 404
      : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
