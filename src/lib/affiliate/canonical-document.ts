import { renderCanonicalHtml } from "./render-document";
import { AffiliateGroupData, validateAffiliateGroup } from "./block-contract";

export type CanonicalBlockType =
  | "PRODUCT_GROUP"
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

export interface ProductGroupBlock { type: "PRODUCT_GROUP"; data: AffiliateGroupData; }

export type CanonicalBlock =
  | ProductGroupBlock
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
    baseProductIds?: string[];
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
        baseProductIds: meta?.baseProductIds,
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

    if (doc.blocks.length > 500 || JSON.stringify(input).length > 2_000_000) throw new Error("Documento muito grande.");
    const occurrenceIds = new Set<string>();
    const validatedBlocks: CanonicalBlock[] = [];

    for (let i = 0; i < doc.blocks.length; i++) {
      const block = doc.blocks[i];
      if (!block || typeof block !== "object" || !("type" in block) || !("data" in block)) {
        throw new Error(`Bloco canônico na posição ${i} inválido.`);
      }

      if (!block.data || typeof block.data !== "object") throw new Error("Dados de bloco inválidos.");
      switch (block.type) {
        case "PRODUCT_GROUP": {
          const data = validateAffiliateGroup(block.data);
          if (occurrenceIds.has(data.id)) throw new Error("Identificador de ocorrência duplicado.");
          occurrenceIds.add(data.id);
          validatedBlocks.push({ type: "PRODUCT_GROUP", data });
          break;
        }
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
      if (block.type === "PRODUCT_GROUP") {
        block.data.products.forEach(p => ids.add(p.productId));
      } else if (block.type === "PRODUCT_CARD" && block.data.productId) {
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
      if (block.type === "PRODUCT_GROUP") {
        block.data.products.forEach(p => { if (p.offerId) ids.add(p.offerId); });
      } else if (block.type === "PRODUCT_CARD" && block.data.offerId) {
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
    return renderCanonicalHtml(doc, products.map(p => ({ ...p, offers: p.offers.map(o => ({ ...o, status: o.status || "ACTIVE" })) })));
  }
}
