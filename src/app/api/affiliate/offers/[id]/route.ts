import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { ProductOfferService } from "@/lib/affiliate";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const workspaceId = await getSessionWorkspaceId();

    const offer = await ProductOfferService.getOffer(workspaceId, id);
    return NextResponse.json(offer);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao buscar oferta.";
    const status =
      message.includes("não está habilitado")
        ? 403
        : message.includes("não encontrada")
        ? 404
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const workspaceId = await getSessionWorkspaceId();
    const body = await request.json();

    const offer = await ProductOfferService.updateOffer(workspaceId, id, body);
    return NextResponse.json(offer);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar oferta.";
    const status =
      message.includes("não está habilitado")
        ? 403
        : message.includes("não encontrada")
        ? 404
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const workspaceId = await getSessionWorkspaceId();

    const result = await ProductOfferService.deleteOffer(workspaceId, id);
    return NextResponse.json({ success: true, deleted: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao excluir oferta.";
    const status =
      message.includes("não está habilitado")
        ? 403
        : message.includes("não encontrada")
        ? 404
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
