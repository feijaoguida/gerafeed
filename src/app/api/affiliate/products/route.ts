import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { ProductCatalogService, ProductStatus } from "@/lib/affiliate";

export async function GET(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || undefined;
    const status = (searchParams.get("status") as ProductStatus) || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const brand = searchParams.get("brand") || undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20;

    const result = await ProductCatalogService.listProducts(workspaceId, {
      search,
      status,
      categoryId,
      brand,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar produtos.";
    const status = message.includes("não está habilitado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const body = await request.json();

    const product = await ProductCatalogService.createProduct(workspaceId, body);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar produto.";
    const status =
      message.includes("não está habilitado") || message.includes("limite de produtos")
        ? 403
        : message.includes("obrigatór") || message.includes("não existe")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
