import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionWorkspaceId } from "@/lib/workspace";
import {
  CanonicalDocument,
  CanonicalDocumentService,
} from "@/lib/affiliate/canonical-document";
import { editorHtmlToDocument } from "@/lib/affiliate/editor-document";
import { WordPressAffiliateRenderer } from "@/lib/publisher/wordpress-renderer";
import { AffiliateContentError } from "@/lib/affiliate/block-contract";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const { id } = await params;

    const existing = await prisma.article.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Notícia não encontrada no workspace" }, { status: 404 });
    }

    let body: { content?: string; canonicalContent?: unknown } = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
    }

    let canonicalDoc: CanonicalDocument | null = null;

    if (body.canonicalContent && typeof body.canonicalContent === "object") {
      canonicalDoc = CanonicalDocumentService.validateDocument(body.canonicalContent);
    } else if (typeof body.content === "string") {
      if (body.content.includes("<!-- gerafeed-block:")) {
        canonicalDoc = editorHtmlToDocument(body.content);
      } else {
        canonicalDoc = CanonicalDocumentService.convertLegacyHtmlToCanonical(body.content);
      }
    } else if (existing.canonicalContent) {
      canonicalDoc = CanonicalDocumentService.validateDocument(existing.canonicalContent);
    } else if (existing.content) {
      if (existing.content.includes("<!-- gerafeed-block:")) {
        canonicalDoc = editorHtmlToDocument(existing.content);
      } else {
        canonicalDoc = CanonicalDocumentService.convertLegacyHtmlToCanonical(existing.content);
      }
    }

    if (!canonicalDoc) {
      return NextResponse.json({ success: true, html: existing.content || "" });
    }

    const html = await WordPressAffiliateRenderer.renderToHtml(
      workspaceId,
      canonicalDoc,
      { articleId: existing.id }
    );

    return NextResponse.json({ success: true, html });
  } catch (error) {
    console.error("POST /api/articles/[id]/preview error:", error);
    if (error instanceof AffiliateContentError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error && typeof error === "object" && "status" in error && typeof (error as { status: unknown }).status === "number") {
      const errObj = error as { status: number; message?: string };
      return NextResponse.json({ error: errObj.message || "Erro no preview" }, { status: errObj.status });
    }
    const message = error instanceof Error ? error.message : "Erro ao gerar preview do artigo";
    const status = message.includes("não está habilitado")
      ? 403
      : message.includes("não encontrada") || message.includes("não encontrado")
      ? 404
      : message.includes("sem a oferta ativa") || message.includes("oferta") || message.includes("Oferta")
      ? 409
      : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const { id } = await params;

    const existing = await prisma.article.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Notícia não encontrada no workspace" }, { status: 404 });
    }

    let canonicalDoc: CanonicalDocument | null = null;
    if (existing.canonicalContent) {
      canonicalDoc = CanonicalDocumentService.validateDocument(existing.canonicalContent);
    } else if (existing.content && existing.content.includes("<!-- gerafeed-block:")) {
      canonicalDoc = editorHtmlToDocument(existing.content);
    } else if (existing.content) {
      canonicalDoc = CanonicalDocumentService.convertLegacyHtmlToCanonical(existing.content);
    }

    if (!canonicalDoc) {
      return NextResponse.json({ success: true, html: existing.content || "" });
    }

    const html = await WordPressAffiliateRenderer.renderToHtml(
      workspaceId,
      canonicalDoc,
      { articleId: existing.id }
    );

    return NextResponse.json({ success: true, html });
  } catch (error) {
    console.error("GET /api/articles/[id]/preview error:", error);
    if (error instanceof AffiliateContentError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Erro ao gerar preview do artigo";
    const status = message.includes("não está habilitado")
      ? 403
      : message.includes("não encontrada") || message.includes("não encontrado")
      ? 404
      : message.includes("sem a oferta ativa") || message.includes("oferta") || message.includes("Oferta")
      ? 409
      : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
