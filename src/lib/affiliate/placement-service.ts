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
    if (!placements || placements.length === 0) {
      return htmlContent;
    }

    let rendered = htmlContent;

    // Group placements by type
    const topRecs = placements.filter((p) => p.placementType === "TOP_RECOMMENDATION");
    const afterParagraphs = placements.filter((p) => p.placementType === "AFTER_PARAGRAPH");
    const inlineCtas = placements.filter((p) => p.placementType === "INLINE_CTA");
    const productCards = placements.filter((p) => p.placementType === "PRODUCT_CARD");

    // 1. TOP RECOMMENDATION: Prepend to top
    if (topRecs.length > 0) {
      const topBlocks = topRecs
        .map((rec) => {
          const offer = rec.offer;
          const url = offer?.affiliateUrl || "#";
          const priceText = offer?.price ? `R$ ${Number(offer.price).toFixed(2).replace(".", ",")}` : "";
          const sellerText = offer?.seller ? `Vendido por: ${offer.seller}` : "";
          return `
<div class="gerafeed-top-recommendation" style="border: 2px solid #6366f1; background-color: #f5f3ff; padding: 16px; border-radius: 12px; margin-bottom: 24px;">
  <span style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #4f46e5; display: block; margin-bottom: 4px;">⭐ Destaque Recomendado</span>
  <h3 style="margin: 0 0 8px 0; color: #1e1b4b; font-size: 18px;">${rec.product.name}</h3>
  ${rec.label ? `<p style="font-size: 13px; color: #4338ca; margin: 0 0 12px 0;">${rec.label}</p>` : ""}
  <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
    ${priceText ? `<span style="font-size: 20px; font-weight: bold; color: #1e1b4b;">${priceText}</span>` : ""}
    ${sellerText ? `<span style="font-size: 12px; color: #6b7280;">${sellerText}</span>` : ""}
    <a href="${url}" target="_blank" rel="sponsored nofollow" style="background-color: #4f46e5; color: #ffffff; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px;">Ver Melhor Preço</a>
  </div>
</div>`;
        })
        .join("\n");

      rendered = `${topBlocks}\n${rendered}`;
    }

    // 2. AFTER PARAGRAPH: Insert after designated paragraph index
    if (afterParagraphs.length > 0) {
      const paragraphs = rendered.split(/<\/p>/i);
      for (const pPlacement of afterParagraphs) {
        const targetIdx = pPlacement.paragraphIndex ?? 0;
        const offer = pPlacement.offer;
        const url = offer?.affiliateUrl || "#";
        const priceText = offer?.price ? `R$ ${Number(offer.price).toFixed(2).replace(".", ",")}` : "";

        const cardHtml = `
<div class="gerafeed-paragraph-product" style="border: 1px solid #e5e7eb; background-color: #f9fafb; padding: 14px; border-radius: 8px; margin: 16px 0;">
  <p style="font-size: 14px; font-weight: bold; margin: 0 0 4px 0; color: #111827;">${pPlacement.product.name}</p>
  <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
    ${priceText ? `<span style="font-size: 16px; font-weight: 700; color: #16a34a;">${priceText}</span>` : ""}
    <a href="${url}" target="_blank" rel="sponsored nofollow" style="color: #2563eb; font-size: 13px; font-weight: 600; text-decoration: underline;">Conferir no Mercado Livre &rarr;</a>
  </div>
</div>`;

        if (targetIdx < paragraphs.length - 1) {
          paragraphs[targetIdx] = `${paragraphs[targetIdx]}</p>\n${cardHtml}`;
        } else {
          paragraphs[paragraphs.length - 1] = `${paragraphs[paragraphs.length - 1]}</p>\n${cardHtml}`;
        }
      }
      rendered = paragraphs.join("</p>");
    }

    // 3. INLINE CTA & PRODUCT CARDS: Append formatted cards at the end
    const remainingCards = [...inlineCtas, ...productCards];
    if (remainingCards.length > 0) {
      const footerCards = remainingCards
        .map((pPlacement) => {
          const offer = pPlacement.offer;
          const url = offer?.affiliateUrl || "#";
          const priceText = offer?.price ? `R$ ${Number(offer.price).toFixed(2).replace(".", ",")}` : "";
          const sellerText = offer?.seller ? `Vendedor: ${offer.seller}` : "";

          return `
<div class="gerafeed-affiliate-card" style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-top: 16px; background-color: #ffffff;">
  <h4 style="margin: 0 0 6px 0; font-size: 16px; color: #0f172a;">${pPlacement.product.name}</h4>
  ${pPlacement.label ? `<p style="font-size: 12px; color: #64748b; margin: 0 0 8px 0;">${pPlacement.label}</p>` : ""}
  <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
    <div>
      ${priceText ? `<span style="font-size: 18px; font-weight: bold; color: #0f172a;">${priceText}</span>` : ""}
      ${sellerText ? `<span style="font-size: 11px; color: #94a3b8; display: block;">${sellerText}</span>` : ""}
    </div>
    <a href="${url}" target="_blank" rel="sponsored nofollow" style="background-color: #2563eb; color: #ffffff; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600;">Ver no Mercado Livre</a>
  </div>
</div>`;
        })
        .join("\n");

      rendered = `${rendered}\n<div class="gerafeed-article-products-section" style="margin-top: 24px;">\n<h3 style="font-size: 18px; margin-bottom: 12px; color: #0f172a;">Produtos Relacionados</h3>\n${footerCards}\n</div>`;
    }

    return rendered;
  }
}
