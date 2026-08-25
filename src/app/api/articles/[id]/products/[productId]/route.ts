import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import { ArticleProductService } from "@/lib/affiliate/article-product-service";

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string; productId: string }> }
) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    const { id: articleId, productId } = await props.params;
    const result = await ArticleProductService.detachProduct(workspaceId, articleId, productId);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao desvincular produto do artigo";
    const status = msg.includes("não está habilitado")
      ? 403
      : msg.includes("não encontrado")
      ? 404
      : msg.includes("Não é possível") || msg.includes("não pode ter menos")
      ? 400
      : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
