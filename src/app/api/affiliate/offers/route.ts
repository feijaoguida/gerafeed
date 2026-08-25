import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { ProductOfferService, OfferStatus } from "@/lib/affiliate";

export async function GET(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const { searchParams } = new URL(request.url);

    const productId = searchParams.get("productId") || undefined;
    const programCode = searchParams.get("programCode") || undefined;
    const status = (searchParams.get("status") as OfferStatus) || undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20;

    const result = await ProductOfferService.listOffers(workspaceId, {
      productId,
      programCode,
      status,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar ofertas.";
    const status = message.includes("não está habilitado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const body = await request.json();

    const offer = await ProductOfferService.createOffer(workspaceId, body);

    return NextResponse.json(offer, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar oferta.";
    const status =
      message.includes("não está habilitado")
        ? 403
        : message.includes("obrigatór") || message.includes("não encontrad")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
