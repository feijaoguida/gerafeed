export type CanonicalBlockType =
  | "RICH_TEXT"
  | "HEADING"
  | "PRODUCT_CARD"
  | "PRODUCT_COMPARISON"
  | "PROS_CONS"
  | "CTA"
  | "AFFILIATE_DISCLOSURE"
  | "IMAGE";

export interface RichTextBlock {
  type: "RICH_TEXT";
  data: {
    html?: string;
    markdown?: string;
  };
}

export interface HeadingBlock {
  type: "HEADING";
  data: {
    level: 1 | 2 | 3 | 4 | 5 | 6;
    text: string;
    id?: string;
  };
}

export interface ProductCardBlock {
  type: "PRODUCT_CARD";
  data: {
    productId: string;
    offerId?: string | null;
    highlightBadge?: string | null;
    showSpecs?: boolean;
    showProsCons?: boolean;
    ctaText?: string | null;
  };
}

export interface ProductComparisonBlock {
  type: "PRODUCT_COMPARISON";
  data: {
    productIds: string[];
    highlightBestId?: string | null;
    criteria?: string[];
    showPriceRow?: boolean;
  };
}

export interface ProsConsBlock {
  type: "PROS_CONS";
  data: {
    productId?: string | null;
    pros: string[];
    cons: string[];
  };
}

export interface CtaBlock {
  type: "CTA";
  data: {
    productId?: string | null;
    offerId?: string | null;
    text: string;
    subtext?: string | null;
    buttonStyle?: "primary" | "secondary" | "deal";
  };
}

export interface AffiliateDisclosureBlock {
  type: "AFFILIATE_DISCLOSURE";
  data: {
    text?: string | null;
    position?: "top" | "bottom" | "inline";
  };
}

export interface ImageBlock {
  type: "IMAGE";
  data: {
    url: string;
    alt?: string | null;
    caption?: string | null;
  };
}

export type CanonicalBlock =
  | RichTextBlock
  | HeadingBlock
  | ProductCardBlock
  | ProductComparisonBlock
  | ProsConsBlock
  | CtaBlock
  | AffiliateDisclosureBlock
  | ImageBlock;

export interface CanonicalDocument {
  version: number;
  meta?: {
    generatedAt?: string;
    wordCount?: number;
    readingTimeMinutes?: number;
  };
  blocks: CanonicalBlock[];
}

export class CanonicalDocumentService {
  /**
   * Constructs and returns a validated CanonicalDocument object.
   */
  static createDocument(
    blocks: CanonicalBlock[],
    meta?: CanonicalDocument["meta"]
  ): CanonicalDocument {
    const doc: CanonicalDocument = {
      version: 1,
      meta: {
        generatedAt: meta?.generatedAt || new Date().toISOString(),
        wordCount: meta?.wordCount,
        readingTimeMinutes: meta?.readingTimeMinutes,
      },
      blocks,
    };

    return this.validateDocument(doc);
  }

  /**
   * Validates structure, block types, and references in a canonical document.
   */
  static validateDocument(input: unknown): CanonicalDocument {
    if (!input || typeof input !== "object") {
      throw new Error("Documento canônico inválido: deve ser um objeto JSON.");
    }

    const doc = input as Partial<CanonicalDocument>;

    if (typeof doc.version !== "number" || doc.version < 1) {
      throw new Error("Versão do documento canônico inválida ou ausente.");
    }

    if (!Array.isArray(doc.blocks)) {
      throw new Error("O campo 'blocks' do documento canônico deve ser um array.");
    }

    const validatedBlocks: CanonicalBlock[] = [];

    for (let i = 0; i < doc.blocks.length; i++) {
      const block = doc.blocks[i];
      if (!block || typeof block !== "object" || !("type" in block) || !("data" in block)) {
        throw new Error(`Bloco canônico na posição ${i} inválido.`);
      }

      switch (block.type) {
        case "RICH_TEXT": {
          const data = block.data as RichTextBlock["data"];
          if (typeof data.html !== "string" && typeof data.markdown !== "string") {
            throw new Error(`Bloco RICH_TEXT na posição ${i} deve conter 'html' ou 'markdown'.`);
          }
          validatedBlocks.push({
            type: "RICH_TEXT",
            data: {
              html: data.html,
              markdown: data.markdown,
            },
          });
          break;
        }

        case "HEADING": {
          const data = block.data as HeadingBlock["data"];
          if (typeof data.text !== "string" || !data.text.trim()) {
            throw new Error(`Bloco HEADING na posição ${i} deve conter texto válido.`);
          }
          const level = [1, 2, 3, 4, 5, 6].includes(data.level) ? data.level : 2;
          validatedBlocks.push({
            type: "HEADING",
            data: {
              level,
              text: data.text.trim(),
              id: data.id?.trim(),
            },
          });
          break;
        }

        case "PRODUCT_CARD": {
          const data = block.data as ProductCardBlock["data"];
          if (typeof data.productId !== "string" || !data.productId.trim()) {
            throw new Error(`Bloco PRODUCT_CARD na posição ${i} deve referenciar um 'productId'.`);
          }
          validatedBlocks.push({
            type: "PRODUCT_CARD",
            data: {
              productId: data.productId.trim(),
              offerId: data.offerId?.trim() || null,
              highlightBadge: data.highlightBadge?.trim() || null,
              showSpecs: data.showSpecs !== false,
              showProsCons: data.showProsCons !== false,
              ctaText: data.ctaText?.trim() || null,
            },
          });
          break;
        }

        case "PRODUCT_COMPARISON": {
          const data = block.data as ProductComparisonBlock["data"];
          if (!Array.isArray(data.productIds) || data.productIds.length < 2) {
            throw new Error(`Bloco PRODUCT_COMPARISON na posição ${i} exige pelo menos 2 'productIds'.`);
          }
          validatedBlocks.push({
            type: "PRODUCT_COMPARISON",
            data: {
              productIds: data.productIds.map((id) => String(id).trim()),
              highlightBestId: data.highlightBestId?.trim() || null,
              criteria: Array.isArray(data.criteria) ? data.criteria.map((c) => String(c).trim()) : [],
              showPriceRow: data.showPriceRow !== false,
            },
          });
          break;
        }

        case "PROS_CONS": {
          const data = block.data as ProsConsBlock["data"];
          if (!Array.isArray(data.pros) || !Array.isArray(data.cons)) {
            throw new Error(`Bloco PROS_CONS na posição ${i} exige arrays 'pros' e 'cons'.`);
          }
          validatedBlocks.push({
            type: "PROS_CONS",
            data: {
              productId: data.productId?.trim() || null,
              pros: data.pros.map((p) => String(p).trim()),
              cons: data.cons.map((c) => String(c).trim()),
            },
          });
          break;
        }

        case "CTA": {
          const data = block.data as CtaBlock["data"];
          if (typeof data.text !== "string" || !data.text.trim()) {
            throw new Error(`Bloco CTA na posição ${i} exige texto de chamada.`);
          }
          validatedBlocks.push({
            type: "CTA",
            data: {
              productId: data.productId?.trim() || null,
              offerId: data.offerId?.trim() || null,
              text: data.text.trim(),
              subtext: data.subtext?.trim() || null,
              buttonStyle: data.buttonStyle || "primary",
            },
          });
          break;
        }

        case "AFFILIATE_DISCLOSURE": {
          const data = (block.data || {}) as AffiliateDisclosureBlock["data"];
          validatedBlocks.push({
            type: "AFFILIATE_DISCLOSURE",
            data: {
              text: data.text?.trim() || null,
              position: data.position || "top",
            },
          });
          break;
        }

        case "IMAGE": {
          const data = block.data as ImageBlock["data"];
          if (typeof data.url !== "string" || !data.url.trim()) {
            throw new Error(`Bloco IMAGE na posição ${i} exige 'url'.`);
          }
          validatedBlocks.push({
            type: "IMAGE",
            data: {
              url: data.url.trim(),
              alt: data.alt?.trim() || null,
              caption: data.caption?.trim() || null,
            },
          });
          break;
        }

        default:
          throw new Error(`Tipo de bloco desconhecido na posição ${i}: ${(block as { type: string }).type}`);
      }
    }

    return {
      version: doc.version,
      meta: doc.meta,
      blocks: validatedBlocks,
    };
  }

  /**
   * Serializes a CanonicalDocument to JSON string.
   */
  static serialize(doc: CanonicalDocument): string {
    const validated = this.validateDocument(doc);
    return JSON.stringify(validated);
  }

  /**
   * Parses JSON string or object to validated CanonicalDocument.
   */
  static parse(input: unknown): CanonicalDocument {
    if (typeof input === "string") {
      try {
        const parsed = JSON.parse(input);
        return this.validateDocument(parsed);
      } catch (err) {
        throw new Error(`Erro ao fazer parse do documento canônico: ${(err as Error).message}`);
      }
    }

    return this.validateDocument(input);
  }

  /**
   * Extracts all unique productIds referenced across blocks in a canonical document.
   */
  static extractReferencedProductIds(doc: CanonicalDocument): string[] {
    const ids = new Set<string>();

    for (const block of doc.blocks) {
      if (block.type === "PRODUCT_CARD" && block.data.productId) {
        ids.add(block.data.productId);
      } else if (block.type === "PRODUCT_COMPARISON" && Array.isArray(block.data.productIds)) {
        block.data.productIds.forEach((id) => ids.add(id));
      } else if (block.type === "PROS_CONS" && block.data.productId) {
        ids.add(block.data.productId);
      } else if (block.type === "CTA" && block.data.productId) {
        ids.add(block.data.productId);
      }
    }

    return Array.from(ids);
  }

  /**
   * Extracts all unique offerIds referenced across blocks in a canonical document.
   */
  static extractReferencedOfferIds(doc: CanonicalDocument): string[] {
    const ids = new Set<string>();

    for (const block of doc.blocks) {
      if (block.type === "PRODUCT_CARD" && block.data.offerId) {
        ids.add(block.data.offerId);
      } else if (block.type === "CTA" && block.data.offerId) {
        ids.add(block.data.offerId);
      }
    }

    return Array.from(ids);
  }

  /**
   * Converts legacy HTML content into a backward-compatible CanonicalDocument with a single RICH_TEXT block.
   */
  static convertLegacyHtmlToCanonical(html: string): CanonicalDocument {
    return this.createDocument([
      {
        type: "RICH_TEXT",
        data: { html },
      },
    ]);
  }

  /**
   * Renders a CanonicalDocument to production-ready HTML for preview and WordPress publishing,
   * injecting safe sponsored links strictly from provided database offers.
   */
  static renderToHtml(
    doc: CanonicalDocument,
    products: Array<{
      id: string;
      name: string;
      brand?: string | null;
      imageUrl?: string | null;
      offers: Array<{
        id: string;
        affiliateUrl: string;
        price?: number | null;
        seller?: string | null;
        status?: string;
      }>;
    }>
  ): string {
    const productMap = new Map(products.map((p) => [p.id, p]));
    const htmlParts: string[] = [];

    for (const block of doc.blocks) {
      switch (block.type) {
        case "AFFILIATE_DISCLOSURE": {
          const text =
            block.data.text ||
            "Transparência: Podemos receber uma comissão de afiliado sem custo adicional para você ao comprar através de nossos links.";
          htmlParts.push(
            `<div class="gerafeed-affiliate-disclosure" style="background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 12px 16px; margin: 16px 0; font-size: 12px; color: #64748b; font-style: italic;"><p style="margin: 0;">${text}</p></div>`
          );
          break;
        }

        case "HEADING": {
          const level = block.data.level || 2;
          const idAttr = block.data.id ? ` id="${block.data.id}"` : "";
          htmlParts.push(`<h${level}${idAttr}>${block.data.text}</h${level}>`);
          break;
        }

        case "RICH_TEXT": {
          if (block.data.html) {
            htmlParts.push(block.data.html);
          }
          break;
        }

        case "PRODUCT_CARD": {
          const p = productMap.get(block.data.productId);
          if (p) {
            const activeOffer =
              p.offers.find((o) => o.id === block.data.offerId) || p.offers[0];
            const url = activeOffer?.affiliateUrl || "#";
            const price = activeOffer?.price
              ? `R$ ${Number(activeOffer.price).toFixed(2).replace(".", ",")}`
              : "";
            const seller = activeOffer?.seller ? `Vendido por: ${activeOffer.seller}` : "";
            const badge = block.data.highlightBadge
              ? `<span style="font-size: 11px; font-weight: bold; background-color: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; display: inline-block; margin-bottom: 8px;">${block.data.highlightBadge}</span>`
              : "";

            htmlParts.push(`
<div class="gerafeed-product-card" style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; background-color: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
  ${badge}
  <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #0f172a;">${p.name}</h3>
  <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-top: 12px;">
    <div>
      ${price ? `<span style="font-size: 22px; font-weight: 800; color: #16a34a;">${price}</span>` : ""}
      ${seller ? `<span style="font-size: 12px; color: #64748b; display: block;">${seller}</span>` : ""}
    </div>
    <a href="${url}" target="_blank" rel="sponsored nofollow" style="background-color: #2563eb; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">${block.data.ctaText || "Ver Melhor Preço"}</a>
  </div>
</div>`);
          }
          break;
        }

        case "PROS_CONS": {
          const prosList = block.data.pros
            .map((p) => `<li style="color: #166534; margin-bottom: 4px;">✓ ${p}</li>`)
            .join("");
          const consList = block.data.cons
            .map((c) => `<li style="color: #991b1b; margin-bottom: 4px;">✗ ${c}</li>`)
            .join("");

          htmlParts.push(`
<div class="gerafeed-pros-cons" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin: 20px 0;">
  <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px;">
    <h4 style="margin: 0 0 8px 0; color: #166534; font-size: 14px;">Pontos Fortes</h4>
    <ul style="list-style: none; padding: 0; margin: 0; font-size: 13px;">${prosList}</ul>
  </div>
  <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px;">
    <h4 style="margin: 0 0 8px 0; color: #991b1b; font-size: 14px;">Pontos a Considerar</h4>
    <ul style="list-style: none; padding: 0; margin: 0; font-size: 13px;">${consList}</ul>
  </div>
</div>`);
          break;
        }

        case "CTA": {
          const p = block.data.productId ? productMap.get(block.data.productId) : null;
          const activeOffer = p
            ? p.offers.find((o) => o.id === block.data.offerId) || p.offers[0]
            : null;
          const url = activeOffer?.affiliateUrl || "#";

          htmlParts.push(`
<div class="gerafeed-cta-box" style="text-align: center; margin: 28px 0; padding: 24px; background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); border-radius: 12px; color: #ffffff;">
  <a href="${url}" target="_blank" rel="sponsored nofollow" style="display: inline-block; background-color: #ffffff; color: #4338ca; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">${block.data.text}</a>
  ${block.data.subtext ? `<p style="font-size: 12px; color: #e0e7ff; margin: 8px 0 0 0;">${block.data.subtext}</p>` : ""}
</div>`);
          break;
        }

        case "IMAGE": {
          htmlParts.push(`
<figure style="margin: 20px 0; text-align: center;">
  <img src="${block.data.url}" alt="${block.data.alt || ""}" style="max-width: 100%; height: auto; border-radius: 8px;" />
  ${block.data.caption ? `<figcaption style="font-size: 12px; color: #64748b; margin-top: 6px;">${block.data.caption}</figcaption>` : ""}
</figure>`);
          break;
        }
      }
    }

    return htmlParts.join("\n\n");
  }
}
