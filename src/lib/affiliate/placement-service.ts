import { renderProductGroup } from "./render-document";
import { prisma } from "@/lib/prisma";
import { AffiliatePlacementType, Prisma } from "@prisma/client";

export interface CreatePlacementInput {
  articleId: string;
  productId: string;
  offerId?: string | null;
  placementType?: AffiliatePlacementType;
  paragraphIndex?: number | null;
  position?: number;
  label?: string | null;
}

export type ArticleAffiliatePlacementWithDetails = Prisma.ArticleAffiliatePlacementGetPayload<{
  include: {
    product: {
      include: {
        category: true;
      };
    };
    offer: true;
  };
}>;

export class ArticlePlacementService {
  /**
   * Creates a single affiliate placement on an article.
   * Enforces strict multi-tenant validation on article, product and offer.
   */
  static async createPlacement(
    workspaceId: string,
    input: CreatePlacementInput
  ): Promise<ArticleAffiliatePlacementWithDetails> {
    if (!workspaceId) throw new Error("workspaceId é obrigatório.");
    if (!input.articleId) throw new Error("articleId é obrigatório.");
    if (!input.productId) throw new Error("productId é obrigatório.");

    // Validate article belongs to workspace
    const article = await prisma.article.findFirst({
      where: { id: input.articleId, workspaceId },
    });
    if (!article) {
      throw new Error(`Artigo '${input.articleId}' não encontrado para o workspace.`);
    }

    // Validate product belongs to workspace
    const product = await prisma.product.findFirst({
      where: { id: input.productId, workspaceId },
      include: { offers: { where: { status: "ACTIVE" } } },
    });
    if (!product) {
      throw new Error(`Produto '${input.productId}' não encontrado para o workspace.`);
    }

    // Resolve offer
    let effectiveOfferId: string | null = input.offerId || null;
    if (effectiveOfferId) {
      const offerExists = product.offers.some((o) => o.id === effectiveOfferId);
      if (!offerExists) {
        throw new Error(`Oferta '${effectiveOfferId}' inválida para o produto.`);
      }
    } else if (product.offers.length > 0) {
      effectiveOfferId = product.offers[0].id;
    }

    const placement = await prisma.articleAffiliatePlacement.create({
      data: {
        workspaceId,
        articleId: input.articleId,
        productId: input.productId,
        offerId: effectiveOfferId,
        placementType: input.placementType || "PRODUCT_CARD",
        paragraphIndex: input.paragraphIndex ?? null,
        position: input.position ?? 0,
        label: input.label || null,
      },
      include: {
        product: {
          include: { category: true },
        },
        offer: true,
      },
    });

    return placement;
  }

  /**
   * Retrieves all affiliate placements for a given article.
   */
  static async getArticlePlacements(
    workspaceId: string,
    articleId: string
  ): Promise<ArticleAffiliatePlacementWithDetails[]> {
    return prisma.articleAffiliatePlacement.findMany({
      where: { workspaceId, articleId },
      include: {
        product: {
          include: { category: true },
        },
        offer: true,
      },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    });
  }

  /**
   * Deletes a placement by ID.
   */
  static async deletePlacement(
    workspaceId: string,
    placementId: string
  ): Promise<void> {
    const existing = await prisma.articleAffiliatePlacement.findFirst({
      where: { id: placementId, workspaceId },
    });
    if (!existing) {
      throw new Error(`Placement '${placementId}' não encontrado para o workspace.`);
    }

    await prisma.articleAffiliatePlacement.delete({
      where: { id: placementId },
    });
  }

  /**
   * Replaces all placements on an article with a new batch.
   */
  static async syncPlacements(
    workspaceId: string,
    articleId: string,
    placements: CreatePlacementInput[]
  ): Promise<ArticleAffiliatePlacementWithDetails[]> {
    // Delete existing
    await prisma.articleAffiliatePlacement.deleteMany({
      where: { workspaceId, articleId },
    });

    const results: ArticleAffiliatePlacementWithDetails[] = [];
    for (let i = 0; i < placements.length; i++) {
      const p = placements[i];
      const created = await this.createPlacement(workspaceId, {
        ...p,
        articleId,
        position: p.position ?? i,
      });
      results.push(created);
    }

    return results;
  }

  /**
   * Renders product placements into the article's HTML content before publishing to WordPress.
   * Injects sponsored product cards, top recommendations, after-paragraph cards, and inline CTAs.
   */
  static renderPlacementsInHtml(
    htmlContent: string,
    placements: ArticleAffiliatePlacementWithDetails[]
  ): string {
    const render = (p: ArticleAffiliatePlacementWithDetails) => renderProductGroup({
      id: p.id, layout: p.placementType === "INLINE_CTA" ? "BUTTON" : "IMAGE_CARD",
      products: [{ productId: p.productId, offerId: p.offerId }], ctaText: p.label || undefined,
    }, [{ ...p.product, offers: p.offer ? [p.offer] : [] }]);
    const top = placements.filter(p => p.placementType === "TOP_RECOMMENDATION").map(render).join("\n");
    const after = placements.filter(p => p.placementType === "AFTER_PARAGRAPH");
    let paragraph = 0;
    const inserted = new Set<string>();
    const body = htmlContent.replace(/<\/p>/gi, closing => {
      const matches = after.filter(p => (p.paragraphIndex ?? 0) === paragraph);
      paragraph++;
      matches.forEach(p => inserted.add(p.id));
      return closing + matches.map(render).join("\n");
    });
    const footer = placements.filter(p => p.placementType !== "TOP_RECOMMENDATION" && !inserted.has(p.id)).map(render).join("\n");
    return top + body + footer;
  }
}
