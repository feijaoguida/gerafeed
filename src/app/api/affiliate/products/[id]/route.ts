import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { ProductCatalogService } from "@/lib/affiliate";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const workspaceId = await getSessionWorkspaceId();

    const product = await ProductCatalogService.getProduct(workspaceId, id);
    return NextResponse.json(product);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao buscar produto.";
    const status =
      message.includes("não está habilitado")
        ? 403
        : message.includes("não encontrado")
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

    const product = await ProductCatalogService.updateProduct(
      workspaceId,
      id,
      body
    );
    return NextResponse.json(product);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar produto.";
    const status =
      message.includes("não está habilitado")
        ? 403
        : message.includes("não encontrado")
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

    const result = await ProductCatalogService.deleteProduct(workspaceId, id);
    return NextResponse.json({ success: true, deleted: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao excluir produto.";
    const status =
      message.includes("não está habilitado")
        ? 403
        : message.includes("não encontrado")
        ? 404
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
