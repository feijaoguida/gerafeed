import { NextResponse } from "next/server";
import { requireAffiliateWorkspace } from "@/lib/affiliate/request-auth";
import { AffiliateContentError } from "@/lib/affiliate/block-contract";
import { ProductSalesCopyService } from "@/lib/affiliate/sales-copy-service";

export async function POST(request: Request) {
  try {
    const workspaceId = await requireAffiliateWorkspace();
    const body = await request.json();

    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { error: "O nome do produto é obrigatório para gerar a descrição com IA." },
        { status: 400 }
      );
    }

    const salesCopy = await ProductSalesCopyService.generateSalesCopy(workspaceId, {
      name: body.name.trim(),
      brand: body.brand?.trim() || null,
      sourceDescription: body.sourceDescription?.trim() || body.description?.trim() || null,
      specs: body.specs || body.sourceSpecs || null,
      price: body.price !== undefined && body.price !== null ? Number(body.price) : null,
      oldPrice: body.oldPrice !== undefined && body.oldPrice !== null ? Number(body.oldPrice) : null,
      currency: body.currency || "BRL",
      seller: body.seller?.trim() || null,
      sourceRating: body.sourceRating !== undefined && body.sourceRating !== null ? Number(body.sourceRating) : null,
      sourceReviewCount: body.sourceReviewCount !== undefined && body.sourceReviewCount !== null ? Number(body.sourceReviewCount) : null,
      reviewSamples: body.reviewSamples || undefined,
    });

    return NextResponse.json(salesCopy);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao gerar descrição com foco em vendas.";
    const status = error instanceof AffiliateContentError ? error.status : message.includes("não está habilitado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

