import { NextRequest, NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { ProductReferenceSourceService } from "@/lib/affiliate/reference-source-service";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await context.params;
    const workspaceId = await getSessionWorkspaceId();

    const sources = await ProductReferenceSourceService.getReferenceSources(
      workspaceId,
      productId
    );

    return NextResponse.json({ sources });
  } catch (err) {
    const message = (err as Error).message || "Erro ao buscar fontes de referência.";
    const status = message.includes("Não autorizado") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await context.params;
    const workspaceId = await getSessionWorkspaceId();
    const body = await req.json();

    if (!body.url || typeof body.url !== "string") {
      return NextResponse.json(
        { error: "A URL da fonte de referência é obrigatória." },
        { status: 400 }
      );
    }

    const source = await ProductReferenceSourceService.createReferenceSource(
      workspaceId,
      {
        productId,
        url: body.url.trim(),
      }
    );

    // Trigger asynchronous processing
    ProductReferenceSourceService.processReferenceSource(workspaceId, source.id).catch((err) => {
      console.error("Erro no processamento da fonte de referência:", err);
    });

    return NextResponse.json({ source }, { status: 201 });
  } catch (err) {
    const message = (err as Error).message || "Erro ao cadastrar fonte de referência.";
    const status = message.includes("Não autorizado") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
