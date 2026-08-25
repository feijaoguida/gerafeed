import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import { ArticleProductService } from "@/lib/affiliate/article-product-service";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    const { id: articleId } = await props.params;
    const items = await ArticleProductService.getArticleProducts(workspaceId, articleId);

    return NextResponse.json(items);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao buscar produtos do artigo";
    const status = msg.includes("não está habilitado") ? 403 : msg.includes("não encontrado") ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    const { id: articleId } = await props.params;
    const body = await request.json();

    if (!Array.isArray(body.items)) {
      return NextResponse.json(
        { error: "items deve ser um array de produtos a vincular." },
        { status: 400 }
      );
    }

    const updated = await ArticleProductService.attachProducts(
      workspaceId,
      articleId,
      body.items
    );

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao vincular produtos ao artigo";
    const status = msg.includes("não está habilitado")
      ? 403
      : msg.includes("não encontrado")
      ? 404
      : msg.includes("devem conter") || msg.includes("exigem") || msg.includes("mesmo produto")
      ? 400
      : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
