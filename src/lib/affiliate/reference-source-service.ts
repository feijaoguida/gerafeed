import { prisma } from "@/lib/prisma";
import { SafeUrlResolver } from "./resolver";
import { getActiveAIProvider } from "@/lib/ai/service";

export class ProductReferenceSourceService {
  /**
   * Cleans raw HTML text into readable body content.
   */
  private static extractReadableText(html: string): { title?: string; text: string } {
    // Extract title
    let title: string | undefined;
    const ogTitleMatch = /<meta\s+[^>]*(?:property|name)=["']og:title["'][^>]*content=["']([^"']*)["']/i.exec(html);
    if (ogTitleMatch) {
      title = ogTitleMatch[1].trim();
    } else {
      const titleTagMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
      if (titleTagMatch) {
        title = titleTagMatch[1].replace(/<[^>]+>/g, "").trim();
      }
    }

    // Strip scripts, styles, headers, footers, navs
    const cleanHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ")
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return {
      title: title || "Fonte de Referência",
      text: cleanHtml.slice(0, 8000), // Up to 8k chars for AI context
    };
  }

  /**
   * Registers a new product reference source URL in PENDING status.
   */
  static async createReferenceSource(
    workspaceId: string,
    input: { productId: string; url: string }
  ) {
    const trimmedUrl = input.url.trim();
    if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
      throw new Error("URL inválida. A URL deve iniciar com http:// ou https://");
    }

    const product = await prisma.product.findFirst({
      where: { id: input.productId, workspaceId },
      select: { id: true },
    });

    if (!product) {
      throw new Error("Produto não encontrado no workspace.");
    }

    const source = await prisma.productReferenceSource.create({
      data: {
        workspaceId,
        productId: input.productId,
        url: trimmedUrl,
        status: "PENDING",
      },
    });

    return source;
  }

  /**
   * Processes a reference source: safe fetch -> readable extraction -> AI summary.
   */
  static async processReferenceSource(workspaceId: string, referenceSourceId: string) {
    const source = await prisma.productReferenceSource.findFirst({
      where: { id: referenceSourceId, workspaceId },
      include: { product: true },
    });

    if (!source) {
      throw new Error("Fonte de referência não encontrada no workspace.");
    }

    await prisma.productReferenceSource.update({
      where: { id: referenceSourceId },
      data: { status: "PROCESSING", error: null },
    });

    try {
      // 1. SSRF-safe URL resolve and fetch
      const resolveResult = await SafeUrlResolver.resolve(source.url, {
        maxRedirects: 5,
        method: "GET",
      });

      if (!resolveResult.body) {
        throw new Error("Não foi possível obter conteúdo legível da URL informada.");
      }

      // 2. Extract readable content
      const { title, text } = this.extractReadableText(resolveResult.body);
      if (text.length < 50) {
        throw new Error("Conteúdo insuficiente para análise.");
      }

      // 3. AI Summarization
      let summary = "";
      try {
        const ai = await getActiveAIProvider(undefined, workspaceId);
        const aiResponse = await ai.generateArticle({
          originalTitle: `Resumo de Análise de Produto: ${title}`,
          originalDescription: `Analise o texto a seguir extraído da fonte de referência (${source.url}) sobre o produto "${source.product.name}" e forneça um resumo com impressões de uso, pontos fortes e fracos:\n\n${text.slice(0, 3000)}`,
          categories: [],
        });
        summary = aiResponse.summary?.trim() || aiResponse.content?.slice(0, 300) || "";
      } catch (aiErr) {
        console.warn("IA indisponível para resumo da fonte de referência, aplicando fallback extrativo:", aiErr);
        summary = text.slice(0, 300) + "...";
      }

      const updated = await prisma.productReferenceSource.update({
        where: { id: referenceSourceId },
        data: {
          title,
          summary: summary || text.slice(0, 300),
          status: "READY",
          capturedAt: new Date(),
          error: null,
        },
      });

      return updated;
    } catch (err) {
      const errorMsg = (err as Error).message || "Erro desconhecido ao processar fonte de referência.";
      const updated = await prisma.productReferenceSource.update({
        where: { id: referenceSourceId },
        data: {
          status: "FAILED",
          error: errorMsg,
        },
      });
      return updated;
    }
  }

  /**
   * Retrieves reference sources for a product.
   */
  static async getReferenceSources(workspaceId: string, productId: string) {
    return prisma.productReferenceSource.findMany({
      where: { workspaceId, productId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Deletes a reference source.
   */
  static async deleteReferenceSource(workspaceId: string, referenceSourceId: string) {
    const existing = await prisma.productReferenceSource.findFirst({
      where: { id: referenceSourceId, workspaceId },
      select: { id: true },
    });

    if (!existing) {
      throw new Error("Fonte de referência não encontrada no workspace.");
    }

    await prisma.productReferenceSource.delete({
      where: { id: referenceSourceId },
    });

    return { success: true };
  }

  /**
   * Formats reference sources into grounding text for AI prompts.
   */
  static formatReferenceSourcesForAiGrounding(
    sources: Array<{
      title?: string | null;
      url: string;
      summary?: string | null;
      status: string;
    }>
  ): string {
    const readySources = sources.filter((s) => s.status === "READY" && s.summary);
    if (readySources.length === 0) return "";

    const items = readySources.map((s, idx) => {
      const titleStr = s.title ? `"${s.title}"` : "Fonte Externa";
      return `${idx + 1}. [Fonte: ${titleStr}] (${s.url}):\n   ${s.summary?.trim()}`;
    });

    return [
      "### Pesquisa e Fontes Especializadas de Referência",
      "As seguintes análises e impressões de fontes externas complementam os dados do produto:",
      "",
      ...items,
    ].join("\n");
  }
}
