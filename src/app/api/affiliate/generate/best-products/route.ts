import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import { BestProductsGenerator } from "@/lib/affiliate/generators/roundup-generator";

export async function POST(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    const body = await request.json();
    if (!Array.isArray(body.productIds) || body.productIds.length < 1) {
      return NextResponse.json(
        { error: "productIds deve conter pelo menos 1 produto." },
        { status: 400 }
      );
    }

    const result = await BestProductsGenerator.generate({
      workspaceId,
      productIds: body.productIds,
      offerIds: body.offerIds,
      categoryName: body.categoryName?.trim(),
      focusKeyword: body.focusKeyword?.trim(),
      customInstructions: body.customInstructions?.trim(),
      wordpressSiteId: body.wordpressSiteId?.trim() || undefined,
      categoryId: body.categoryId?.trim() || undefined,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao gerar lista de melhores produtos";
    const status = msg.includes("não está habilitado")
      ? 403
      : msg.includes("não foram encontrados") || msg.includes("não encontrado")
      ? 404
      : msg.includes("exige") || msg.includes("pelo menos")
      ? 400
      : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
