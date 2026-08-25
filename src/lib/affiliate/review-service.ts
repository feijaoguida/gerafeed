import { prisma } from "@/lib/prisma";
import { ReviewSample } from "./types";

export class ProductReviewService {
  /**
   * Sanitizes author name (removes emails, phone numbers, and truncates to first name/initial).
   */
  private static sanitizeAuthorName(raw?: string | null): string | undefined {
    if (!raw) return undefined;
    const cleaned = raw.replace(/[\w.-]+@[\w.-]+\.\w+/g, "").replace(/\+?\d[\d -]{7,}\d/g, "").trim();
    const parts = cleaned.split(/\s+/);
    if (parts.length === 0 || !parts[0]) return undefined;
    const firstName = parts[0];
    const initial = parts.length > 1 && parts[1] ? ` ${parts[1][0].toUpperCase()}.` : "";
    return (firstName + initial).slice(0, 30);
  }

  /**
   * Syncs up to 5 public review samples for a product in a workspace.
   */
  static async syncProductReviewSamples(
    workspaceId: string,
    productId: string,
    reviewSamples: ReviewSample[],
    provider: string = "MERCADO_LIVRE"
  ) {
    if (!reviewSamples || reviewSamples.length === 0) return [];

    // Enforce multi-tenant ownership of the product
    const product = await prisma.product.findFirst({
      where: { id: productId, workspaceId },
      select: { id: true },
    });

    if (!product) {
      throw new Error("Produto não encontrado no workspace.");
    }

    // Limit strictly to max 5 samples
    const top5 = reviewSamples.slice(0, 5);

    // Replace previous samples for this product and provider to keep fresh snapshot
    await prisma.productReviewSample.deleteMany({
      where: {
        workspaceId,
        productId,
        provider,
      },
    });

    const created = await Promise.all(
      top5.map((r) =>
        prisma.productReviewSample.create({
          data: {
            workspaceId,
            productId,
            provider,
            rating: r.rating !== undefined ? Number(r.rating) : null,
            title: r.title ? r.title.slice(0, 200) : null,
            text: r.text.trim(),
            authorName: this.sanitizeAuthorName(r.authorName),
            sourceUrl: r.sourceUrl || null,
            capturedAt: r.capturedAt || new Date(),
          },
        })
      )
    );

    return created;
  }

  /**
   * Fetches review samples for a product.
   */
  static async getProductReviewSamples(workspaceId: string, productId: string) {
    return prisma.productReviewSample.findMany({
      where: { workspaceId, productId },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      take: 5,
    });
  }

  /**
   * Formats review samples for AI prompt grounding.
   * Explicitly disclaims that these are qualitative user samples (not statistical metrics).
   */
  static formatReviewsForAiGrounding(
    reviews: Array<{
      rating?: number | null;
      title?: string | null;
      text: string;
      authorName?: string | null;
    }>
  ): string {
    if (!reviews || reviews.length === 0) {
      return "";
    }

    const items = reviews.slice(0, 5).map((r, idx) => {
      const ratingStr = r.rating ? `[Avaliação: ${r.rating.toFixed(1)}/5]` : "[Avaliação sem nota]";
      const titleStr = r.title ? ` "${r.title}"` : "";
      const authorStr = r.authorName ? ` (Consumidor: ${r.authorName})` : "";
      return `${idx + 1}. ${ratingStr}${titleStr}: "${r.text.trim()}"${authorStr}`;
    });

    return [
      "### Amostras Qualitativas de Opiniões de Consumidores (Até 5 Amostras Públicas)",
      "Nota: As opiniões a seguir representam uma amostra qualitativa e pontual de percepções reais de uso e satisfação dos consumidores no marketplace. NÃO devem ser tratadas como estatística exaustiva, mas sim como relatos de experiência e percepção de pontos fortes e fracos no dia a dia.",
      "",
      ...items,
    ].join("\n");
  }
}
