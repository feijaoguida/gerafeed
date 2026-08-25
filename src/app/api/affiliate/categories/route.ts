import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { ProductCategoryService } from "@/lib/affiliate";

export async function GET(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";
    const includeChildren = searchParams.get("includeChildren") === "true";

    const categories = await ProductCategoryService.listCategories(workspaceId, {
      activeOnly,
      includeChildren,
    });

    return NextResponse.json(categories);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar categorias.";
    const status = message.includes("não está habilitado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const body = await request.json();

    const category = await ProductCategoryService.createCategory(workspaceId, body);

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar categoria.";
    const status =
      message.includes("não está habilitado")
        ? 403
        : message.includes("obrigatór") || message.includes("não existe")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
