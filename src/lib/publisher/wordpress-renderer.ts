import { prisma } from "@/lib/prisma";
import { CanonicalDocument, CanonicalBlock } from "@/lib/affiliate/canonical-document";
import { ClickTrackingService } from "@/lib/affiliate/click-tracking";
import { AffiliateComplianceService } from "./compliance";

export interface ResolvedProductOfferData {
  product: {
    id: string;
    name: string;
    brand: string | null;
    rating: number | null;
    pros: string[];
    cons: string[];
    specs: Record<string, unknown> | null;
    imageUrl: string | null;
  };
  offer: {
    id: string;
    affiliateUrl: string;
    price: number | null;
    currency: string;
    seller: string | null;
  } | null;
}

export interface RenderOptions {
  articleId?: string;
  publicationId?: string;
  includeTrackingScript?: boolean;
}

interface RenderContext {
  workspaceId: string;
  articleId?: string;
  publicationId?: string;
}

export class WordPressAffiliateRenderer {
  /**
   * Renders a CanonicalDocument into fully-formed, clean, responsive HTML for WordPress post content.
   * Resolves product details and active affiliate offers from DB.
   * Embeds direct affiliate hrefs, tamper-proof tracking event tokens, and non-blocking beacon script.
   */
  static async renderToHtml(
    workspaceId: string,
    canonicalDoc: CanonicalDocument,
    options?: RenderOptions
  ): Promise<string> {
    if (!canonicalDoc || !Array.isArray(canonicalDoc.blocks)) {
      return "";
    }

    const context: RenderContext = {
      workspaceId,
      articleId: options?.articleId,
      publicationId: options?.publicationId,
    };

    // 1. Collect all product and offer IDs referenced in the document
    const productIds = new Set<string>();
    for (const block of canonicalDoc.blocks) {
      if (block.type === "PRODUCT_CARD" || block.type === "CTA" || block.type === "PROS_CONS") {
        if (block.data.productId) productIds.add(block.data.productId);
      } else if (block.type === "PRODUCT_COMPARISON") {
        for (const pid of block.data.productIds) {
          if (pid) productIds.add(pid);
        }
      }
    }

    // 2. Query products and their active lowest offers
    const resolvedCatalog = new Map<string, ResolvedProductOfferData>();
    if (productIds.size > 0) {
      const products = await prisma.product.findMany({
        where: {
          id: { in: Array.from(productIds) },
          workspaceId,
        },
        include: {
          offers: {
            where: { status: "ACTIVE" },
            orderBy: { price: "asc" },
          },
        },
      });

      for (const prod of products) {
        resolvedCatalog.set(prod.id, {
          product: {
            id: prod.id,
            name: prod.name,
            brand: prod.brand,
            rating: prod.rating,
            pros: prod.pros,
            cons: prod.cons,
            specs: prod.specs && typeof prod.specs === "object" ? (prod.specs as Record<string, unknown>) : null,
            imageUrl: prod.imageUrl,
          },
          offer: prod.offers[0]
            ? {
                id: prod.offers[0].id,
                affiliateUrl: prod.offers[0].affiliateUrl,
                price: prod.offers[0].price,
                currency: prod.offers[0].currency || "R$",
                seller: prod.offers[0].seller,
              }
            : null,
        });
      }
    }

    // 3. Resolve Workspace Default Disclosure
    const defaultDisclosure = await AffiliateComplianceService.getWorkspaceDisclosure(workspaceId);

    // 4. Render each block into HTML
    const renderedParts: string[] = [];
    for (const block of canonicalDoc.blocks) {
      const blockHtml = this.renderBlock(block, resolvedCatalog, context, defaultDisclosure);
      if (blockHtml) {
        renderedParts.push(blockHtml);
      }
    }

    // 5. Append non-blocking tracking script if tracking is enabled
    const includeScript = options?.includeTrackingScript !== false;
    if (includeScript) {
      renderedParts.push(ClickTrackingService.getTrackingScript());
    }

    return renderedParts.join("\n\n");
  }

  private static renderBlock(
    block: CanonicalBlock,
    catalog: Map<string, ResolvedProductOfferData>,
    context: RenderContext,
    defaultDisclosure?: string
  ): string {
    switch (block.type) {
      case "AFFILIATE_DISCLOSURE":
        return this.renderDisclosure(block.data.text, defaultDisclosure);

      case "HEADING":
        return this.renderHeading(block.data.level, block.data.text, block.data.id);

      case "RICH_TEXT":
        return block.data.html || block.data.markdown || "";

      case "PRODUCT_CARD":
        return this.renderProductCard(block.data, catalog, context);

      case "PRODUCT_COMPARISON":
        return this.renderComparisonTable(block.data, catalog, context);

      case "PROS_CONS":
        return this.renderProsCons(block.data.pros, block.data.cons);

      case "CTA":
        return this.renderCta(block.data, catalog, context);

      case "IMAGE":
        return this.renderImage(block.data.url, block.data.alt, block.data.caption);

      default:
        return "";
    }
  }

  private static renderDisclosure(text?: string | null, defaultText?: string): string {
    const disclosureText = text || defaultText || "Transparência editorial: Comprando através dos nossos links, podemos receber uma comissão sem qualquer custo adicional para você.";
    return `<div class="nc-affiliate-disclosure" style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #475569; font-style: italic; border-radius: 0 6px 6px 0;">
  📢 <strong>Aviso de Transparência:</strong> ${this.escapeHtml(disclosureText)}
</div>`;
  }

  private static renderHeading(level?: number | null, text?: string | null, id?: string | null): string {
    const validLevel = Math.min(Math.max(level || 2, 2), 6);
    const idAttr = id ? ` id="${this.escapeHtml(id)}"` : "";
    return `<h${validLevel}${idAttr}>${this.escapeHtml(text || "")}</h${validLevel}>`;
  }

  private static renderProductCard(
    data: {
      productId: string;
      offerId?: string | null;
      highlightBadge?: string | null;
      showSpecs?: boolean;
      showProsCons?: boolean;
      ctaText?: string | null;
    },
    catalog: Map<string, ResolvedProductOfferData>,
    context: RenderContext
  ): string {
    const item = catalog.get(data.productId);
    const prod = item?.product;
    const offer = item?.offer;

    const name = prod?.name || "Produto Selecionado";
    const brand = prod?.brand ? `<span style="font-size: 12px; color: #64748b; text-transform: uppercase;">${this.escapeHtml(prod.brand)}</span>` : "";
    const badge = data.highlightBadge
      ? `<span style="display: inline-block; background: #2563eb; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; margin-bottom: 8px;">${this.escapeHtml(data.highlightBadge)}</span>`
      : "";

    const price = offer?.price
      ? `<div style="font-size: 20px; font-weight: 800; color: #059669; margin: 12px 0;">${this.escapeHtml(offer.currency)} ${offer.price.toFixed(2)}</div>`
      : `<div style="font-size: 14px; font-weight: 600; color: #64748b; margin: 12px 0;">Preço sob consulta</div>`;

    const affiliateLink = offer?.affiliateUrl || "#";
    const ctaLabel = data.ctaText || `Ver Preço Atualizado`;

    // Generate signed tracking event token
    let tokenAttr = "";
    if (context.workspaceId && offer?.affiliateUrl) {
      try {
        const token = ClickTrackingService.generateEventToken({
          workspaceId: context.workspaceId,
          articleId: context.articleId,
          publicationId: context.publicationId,
          productId: prod?.id || data.productId,
          offerId: offer?.id || data.offerId || null,
          component: "PRODUCT_CARD",
        });
        tokenAttr = ` data-nc-token="${this.escapeHtml(token)}"`;
      } catch {
        // Fallback gracefully without breaking render
      }
    }

    const ctaButton = `<a href="${this.escapeHtml(affiliateLink)}" target="_blank" rel="sponsored nofollow noopener"${tokenAttr} class="nc-affiliate-link" style="display: inline-block; background: #2563eb; color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; padding: 10px 22px; border-radius: 6px; text-align: center;">${this.escapeHtml(ctaLabel)} &rarr;</a>`;

    let specsHtml = "";
    if (data.showSpecs && prod?.specs) {
      const entries = Object.entries(prod.specs);
      if (entries.length > 0) {
        specsHtml = `<div style="margin: 12px 0; font-size: 13px; color: #334155; line-height: 1.6;">
          <strong>Principais Recursos:</strong>
          <ul style="margin: 6px 0 0 0; padding-left: 20px;">
            ${entries.map(([k, v]) => `<li><strong>${this.escapeHtml(k)}:</strong> ${this.escapeHtml(String(v))}</li>`).join("")}
          </ul>
        </div>`;
      }
    }

    let prosConsHtml = "";
    if (data.showProsCons && (prod?.pros?.length || prod?.cons?.length)) {
      prosConsHtml = this.renderProsCons(prod.pros || [], prod.cons || []);
    }

    return `<div class="nc-product-card" style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 24px 0; background: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
  ${badge}
  <div>${brand}</div>
  <h3 style="margin: 4px 0 10px 0; font-size: 18px; font-weight: 700; color: #0f172a;">${this.escapeHtml(name)}</h3>
  ${specsHtml}
  ${prosConsHtml}
  <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-top: 16px; padding-top: 14px; border-top: 1px solid #f1f5f9;">
    ${price}
    ${ctaButton}
  </div>
</div>`;
  }

  private static renderComparisonTable(
    data: {
      productIds: string[];
      criteria?: string[];
      highlightBestId?: string | null;
      highlightWinnerId?: string | null;
    },
    catalog: Map<string, ResolvedProductOfferData>,
    context: RenderContext
  ): string {
    const products = data.productIds.map((id) => catalog.get(id)).filter(Boolean) as ResolvedProductOfferData[];
    if (products.length === 0) return "";

    const winnerId = data.highlightBestId || data.highlightWinnerId;

    const headers = products.map((item) => {
      const isWinner = winnerId === item.product.id;
      const winnerBadge = isWinner
        ? `<div style="background: #10b981; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 3px; margin-bottom: 4px; font-weight: 700;">CAMPEÃO</div>`
        : "";
      return `<th style="padding: 12px; border: 1px solid #cbd5e1; background: #f8fafc; text-align: center; vertical-align: bottom;">
        ${winnerBadge}
        <strong>${this.escapeHtml(item.product.name)}</strong>
      </th>`;
    }).join("");

    const priceRow = `<tr>
      <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: 700; background: #f8fafc;">Preço Estimado</td>
      ${products.map((item) => {
        const p = item.offer?.price ? `${item.offer.currency} ${item.offer.price.toFixed(2)}` : "Sob consulta";
        return `<td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: 700; color: #059669;">${this.escapeHtml(p)}</td>`;
      }).join("")}
    </tr>`;

    const ratingRow = `<tr>
      <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: 700; background: #f8fafc;">Avaliação</td>
      ${products.map((item) => `<td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center;">⭐ ${item.product.rating || "4.5"}/5</td>`).join("")}
    </tr>`;

    const ctaRow = `<tr>
      <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: 700; background: #f8fafc;">Onde Comprar</td>
      ${products.map((item, index) => {
        const url = item.offer?.affiliateUrl || "#";
        let tokenAttr = "";
        if (context.workspaceId && item.offer?.affiliateUrl) {
          try {
            const token = ClickTrackingService.generateEventToken({
              workspaceId: context.workspaceId,
              articleId: context.articleId,
              publicationId: context.publicationId,
              productId: item.product.id,
              offerId: item.offer?.id || null,
              component: "COMPARISON_TABLE",
              position: index,
            });
            tokenAttr = ` data-nc-token="${this.escapeHtml(token)}"`;
          } catch {
            // Fallback gracefully
          }
        }
        return `<td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center;">
          <a href="${this.escapeHtml(url)}" target="_blank" rel="sponsored nofollow noopener"${tokenAttr} class="nc-affiliate-link" style="display: inline-block; background: #2563eb; color: #fff; padding: 6px 12px; font-size: 12px; font-weight: 700; text-decoration: none; border-radius: 4px;">Ver Oferta</a>
        </td>`;
      }).join("")}
    </tr>`;

    return `<div class="nc-comparison-table-wrapper" style="overflow-x: auto; margin: 24px 0;">
  <table style="width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #cbd5e1;">
    <thead>
      <tr>
        <th style="padding: 12px; border: 1px solid #cbd5e1; background: #f1f5f9; text-align: left;">Modelo</th>
        ${headers}
      </tr>
    </thead>
    <tbody>
      ${priceRow}
      ${ratingRow}
      ${ctaRow}
    </tbody>
  </table>
</div>`;
  }

  private static renderProsCons(pros: string[], cons: string[]): string {
    const prosHtml = pros.length > 0
      ? `<div style="flex: 1; min-width: 240px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 12px;">
          <strong style="color: #065f46; font-size: 13px;">✓ Pontos Positivos</strong>
          <ul style="margin: 6px 0 0 0; padding-left: 18px; font-size: 12px; color: #047857; line-height: 1.5;">
            ${pros.map((p) => `<li>${this.escapeHtml(p)}</li>`).join("")}
          </ul>
        </div>`
      : "";

    const consHtml = cons.length > 0
      ? `<div style="flex: 1; min-width: 240px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px; padding: 12px;">
          <strong style="color: #9f1239; font-size: 13px;">✗ Pontos de Atenção</strong>
          <ul style="margin: 6px 0 0 0; padding-left: 18px; font-size: 12px; color: #be123c; line-height: 1.5;">
            ${cons.map((c) => `<li>${this.escapeHtml(c)}</li>`).join("")}
          </ul>
        </div>`
      : "";

    return `<div style="display: flex; gap: 12px; flex-wrap: wrap; margin: 12px 0;">
      ${prosHtml}
      ${consHtml}
    </div>`;
  }

  private static renderCta(
    data: {
      productId?: string | null;
      offerId?: string | null;
      text: string;
      subtext?: string | null;
      buttonStyle?: "primary" | "secondary" | "deal";
    },
    catalog: Map<string, ResolvedProductOfferData>,
    context: RenderContext
  ): string {
    let url = "#";
    let offerId: string | null = null;
    let prodId: string | null = null;

    if (data.productId) {
      prodId = data.productId;
      const item = catalog.get(data.productId);
      if (item?.offer?.affiliateUrl) {
        url = item.offer.affiliateUrl;
        offerId = item.offer.id;
      }
    }

    const bg = data.buttonStyle === "deal" ? "#ea580c" : "#2563eb";
    const subtext = data.subtext ? `<p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">${this.escapeHtml(data.subtext)}</p>` : "";

    let tokenAttr = "";
    if (context.workspaceId && url !== "#") {
      try {
        const token = ClickTrackingService.generateEventToken({
          workspaceId: context.workspaceId,
          articleId: context.articleId,
          publicationId: context.publicationId,
          productId: prodId,
          offerId: offerId || data.offerId || null,
          component: "CTA",
        });
        tokenAttr = ` data-nc-token="${this.escapeHtml(token)}"`;
      } catch {
        // Fallback gracefully
      }
    }

    return `<div style="text-align: center; margin: 28px 0; padding: 20px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px;">
  <a href="${this.escapeHtml(url)}" target="_blank" rel="sponsored nofollow noopener"${tokenAttr} class="nc-affiliate-link" style="display: inline-block; background: ${bg}; color: #ffffff; font-weight: 800; font-size: 16px; text-decoration: none; padding: 14px 28px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">${this.escapeHtml(data.text)}</a>
  ${subtext}
</div>`;
  }

  private static renderImage(url: string, alt?: string | null, caption?: string | null): string {
    const altText = alt ? ` alt="${this.escapeHtml(alt)}"` : "";
    const captionHtml = caption ? `<figcaption style="text-align: center; font-size: 12px; color: #64748b; margin-top: 6px;">${this.escapeHtml(caption)}</figcaption>` : "";
    return `<figure style="margin: 20px 0; text-align: center;">
  <img src="${this.escapeHtml(url)}"${altText} style="max-width: 100%; height: auto; border-radius: 6px;" />
  ${captionHtml}
</figure>`;
  }

  private static escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
