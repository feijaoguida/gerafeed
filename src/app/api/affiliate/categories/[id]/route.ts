import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { ProductCategoryService } from "@/lib/affiliate";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const workspaceId = await getSessionWorkspaceId();

    const category = await ProductCategoryService.getCategory(workspaceId, id);
    return NextResponse.json(category);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao buscar categoria.";
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

    const category = await ProductCategoryService.updateCategory(
      workspaceId,
      id,
      body
    );
    return NextResponse.json(category);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar categoria.";
    const status =
      message.includes("não está habilitado")
        ? 403
        : message.includes("não encontrada")
        ? 404
        : message.includes("circular") || message.includes("não pode ser pai")
        ? 400
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

    const result = await ProductCategoryService.deleteCategory(workspaceId, id);
    return NextResponse.json({ success: true, deleted: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao excluir categoria.";
    const status =
      message.includes("não está habilitado")
        ? 403
        : message.includes("não encontrada")
        ? 404
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
