import { NextResponse } from "next/server";
import { requireAffiliateWorkspace } from "@/lib/affiliate/request-auth";
import { AffiliateContentError } from "@/lib/affiliate/block-contract";
import { WooCommercePublisherService } from "@/lib/affiliate/woocommerce-publisher";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const workspaceId = await requireAffiliateWorkspace();
    const body = await request.json().catch(() => ({}));

    const result = await WooCommercePublisherService.publishProductToWooCommerce(
      workspaceId,
      id,
      {
        wordpressSiteId: body.wordpressSiteId,
        offerId: body.offerId,
        productType: body.productType,
        status: body.status,
        buttonText: body.buttonText,
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao publicar produto no WooCommerce.";
    const status =
      error instanceof AffiliateContentError
        ? error.status
        : message.includes("não está habilitado")
        ? 403
        : message.includes("não encontrado")
        ? 404
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

