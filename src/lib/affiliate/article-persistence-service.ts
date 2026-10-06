import { prisma } from "@/lib/prisma";
import { ArticleStatus, Prisma } from "@prisma/client";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import {
  CanonicalDocument,
  CanonicalDocumentService,
} from "./canonical-document";
import {
  editorHtmlToDocument,
  documentToEditorHtml,
} from "./editor-document";
import { AffiliateContentError } from "./block-contract";
import { AttachProductItemInput } from "./article-product-service";

export interface UpdateArticlePayload {
  title?: string;
  summary?: string;
  content?: string;
  canonicalContent?: unknown;
  commercialType?: string | null;
  wordpressSiteId?: string | null;
  categoryId?: string | null;
  suggestedCategoryId?: string | null;
  tags?: string[];
  seoFocusKeyword?: string;
  seoTitle?: string;
  seoDescription?: string;
  status?: ArticleStatus;
  selectedImage?: string;
  aiScore?: number;
  items?: AttachProductItemInput[];
  products?: AttachProductItemInput[];
}

export class ArticlePersistenceService {
  /**
   * Atomically validates and persists article edits, reconciling canonicalContent,
   * editor content with markers, and ArticleProduct relations with tenant isolation.
   */
  static async validateAndSaveArticle(
    workspaceId: string,
    articleId: string,
    payload: UpdateArticlePayload
  ) {
    if (!workspaceId) {
      throw new AffiliateContentError("Faça login para continuar.", 401);
    }

    // 1. Fetch existing article in tenant workspace
    const existing = await prisma.article.findFirst({
      where: { id: articleId, workspaceId },
      include: {
        articleProducts: {
          orderBy: { position: "asc" },
        },
      },
    });

    if (!existing) {
      throw new AffiliateContentError("Notícia não encontrada no workspace.", 404);
    }

    // 2. Parse and normalize CanonicalDocument & editor content
    let doc: CanonicalDocument | null = null;
    let effectiveContent = payload.content !== undefined ? payload.content : existing.content || "";

    if (payload.canonicalContent && typeof payload.canonicalContent === "object") {
      try {
        doc = CanonicalDocumentService.validateDocument(payload.canonicalContent);
      } catch (err) {
        throw new AffiliateContentError(
          err instanceof Error ? err.message : "Documento canônico inválido.",
          400
        );
      }
    } else if (typeof payload.content === "string" && payload.content.includes("<!-- gerafeed-block:")) {
      try {
        doc = editorHtmlToDocument(payload.content);
      } catch (err) {
        throw new AffiliateContentError(
          err instanceof Error ? err.message : "Conteúdo com blocos de afiliados inválido.",
          400
        );
      }
    } else if (existing.canonicalContent) {
      try {
        doc = CanonicalDocumentService.parse(existing.canonicalContent);
        // If content was updated without block markers, reflect the plain text in canonical
        if (typeof payload.content === "string") {
          doc = editorHtmlToDocument(payload.content);
        }
      } catch {
        doc = null;
      }
    }

    // Ensure content and canonicalContent remain synchronized
    if (doc && payload.content === undefined) {
      effectiveContent = documentToEditorHtml(doc);
    }

    // 3. Extract referenced products from the document
    const referencedProductIds = doc ? CanonicalDocumentService.extractReferencedProductIds(doc) : [];

    // 4. Validate AFFILIATE_MODULE entitlement
    const hasModule = await BillingService.hasFeature(workspaceId, AFFILIATE_FEATURES.MODULE);

    if (referencedProductIds.length > 0) {
      if (!hasModule) {
        throw new AffiliateContentError(
          "O módulo de afiliados não está habilitado no seu plano.",
          403
        );
      }
    }

    // 5. Validate that all referenced Products and Offers belong to THIS Workspace
    if (referencedProductIds.length > 0) {
      const productsInDb = await prisma.product.findMany({
        where: {
          id: { in: referencedProductIds },
          workspaceId,
        },
        include: {
          offers: {
            where: { workspaceId },
          },
        },
      });

      if (productsInDb.length !== referencedProductIds.length) {
        throw new AffiliateContentError(
          "Um ou mais produtos referenciados não foram encontrados ou pertencem a outro workspace.",
          404
        );
      }

      // Check explicit offers (if any)
      for (const block of doc!.blocks) {
        if (block.type === "PRODUCT_GROUP") {
          for (const p of block.data.products) {
            if (p.offerId) {
              const prod = productsInDb.find((item) => item.id === p.productId);
              const valid = prod?.offers.some((o) => o.id === p.offerId);
              if (!valid) {
                throw new AffiliateContentError(
                  `A oferta selecionada (${p.offerId}) não pertence ao produto informado ou ao workspace.`,
                  409
                );
              }
            }
          }
        } else if (block.type === "PRODUCT_CARD" || block.type === "CTA") {
          if (block.data.offerId && block.data.productId) {
            const prod = productsInDb.find((item) => item.id === block.data.productId);
            const valid = prod?.offers.some((o) => o.id === block.data.offerId);
            if (!valid) {
              throw new AffiliateContentError(
                `A oferta selecionada (${block.data.offerId}) não pertence ao produto informado ou ao workspace.`,
                409
              );
            }
          }
        }
      }
    }

    // 6. Preserve Base Products vs. Manual Recommendations
    let baseProductIds: string[] = [];
    const existingMeta = (existing.canonicalContent as { meta?: { baseProductIds?: string[] } } | null)?.meta;

    if (Array.isArray(existingMeta?.baseProductIds) && existingMeta.baseProductIds.length > 0) {
      baseProductIds = existingMeta.baseProductIds;
    } else if (existing.articleProducts.length > 0) {
      // First save or legacy: initial articleProducts are the base products
      baseProductIds = existing.articleProducts.map((p) => p.productId);
    }

    if (doc) {
      doc.meta = {
        ...doc.meta,
        baseProductIds,
      };
    }

    // Union of product relations: base products + active block occurrences
    const unionProductIds = Array.from(new Set([...baseProductIds, ...referencedProductIds]));

    // 7. Check if published article requires republishing
    let needsRepublish = existing.needsRepublish;
    if (existing.status === "PUBLISHED") {
      const contentChanged =
        (payload.content !== undefined && payload.content.trim() !== (existing.content || "").trim()) ||
        (payload.title !== undefined && payload.title.trim() !== (existing.title || "").trim()) ||
        (payload.summary !== undefined && payload.summary.trim() !== (existing.summary || "").trim());

      if (contentChanged) {
        needsRepublish = true;
      }
    }

    // 8. Build dataToUpdate
    const dataToUpdate: Record<string, unknown> = {
      content: effectiveContent,
      canonicalContent: doc ? (doc as unknown as Prisma.InputJsonValue) : (existing.canonicalContent as Prisma.InputJsonValue | undefined),
      needsRepublish,
    };

    if (typeof payload.title === "string") dataToUpdate.title = payload.title.trim();
    if (typeof payload.summary === "string") dataToUpdate.summary = payload.summary.trim();
    if (typeof payload.commercialType === "string") dataToUpdate.commercialType = payload.commercialType;
    if (payload.wordpressSiteId !== undefined) dataToUpdate.wordpressSiteId = payload.wordpressSiteId;
    if (payload.categoryId !== undefined) dataToUpdate.categoryId = payload.categoryId;
    if (payload.suggestedCategoryId !== undefined) dataToUpdate.suggestedCategoryId = payload.suggestedCategoryId;
    if (Array.isArray(payload.tags)) {
      dataToUpdate.tags = payload.tags.map((t) => String(t).trim()).filter(Boolean);
    }
    if (typeof payload.seoFocusKeyword === "string") dataToUpdate.seoFocusKeyword = payload.seoFocusKeyword.trim();
    if (typeof payload.seoTitle === "string") dataToUpdate.seoTitle = payload.seoTitle.trim();
    if (typeof payload.seoDescription === "string") dataToUpdate.seoDescription = payload.seoDescription.trim();
    if (typeof payload.status === "string" && ["PENDING", "PUBLISHED", "REJECTED"].includes(payload.status.toUpperCase())) {
      dataToUpdate.status = payload.status.toUpperCase() as ArticleStatus;
    }
    if (typeof payload.selectedImage === "string" && ["ORIGINAL", "MODIFIED", "AI_GENERATED"].includes(payload.selectedImage.toUpperCase())) {
      dataToUpdate.selectedImage = payload.selectedImage.toUpperCase();
    }
    if (typeof payload.aiScore === "number") dataToUpdate.aiScore = payload.aiScore;

    // Optional explicit items passed in payload
    const explicitItems = payload.items || payload.products;

    // 9. Execute persistence atomically inside transaction
    return await prisma.$transaction(async (tx) => {
      // Update article record
      const updatedArticle = await tx.article.update({
        where: { id: existing.id },
        data: dataToUpdate,
        include: {
          source: true,
          wordpressSite: true,
          suggestedCategory: true,
          category: true,
        },
      });

      // Synchronize ArticleProduct relations
      // A. Delete any relations whose product is neither in base products nor in current occurrences
      await tx.articleProduct.deleteMany({
        where: {
          articleId: existing.id,
          productId: { notIn: unionProductIds },
        },
      });

      // B. Create missing relations for newly added occurrences or base products
      const currentRelations = await tx.articleProduct.findMany({
        where: { articleId: existing.id },
      });
      const currentLinkedIds = new Set(currentRelations.map((r) => r.productId));

      let nextPosition = currentRelations.length;
      for (const prodId of unionProductIds) {
        if (!currentLinkedIds.has(prodId)) {
          const explicit = explicitItems?.find((it) => it.productId === prodId);
          await tx.articleProduct.create({
            data: {
              articleId: existing.id,
              productId: prodId,
              offerId: explicit?.offerId || null,
              position: typeof explicit?.position === "number" ? explicit.position : nextPosition++,
              badge: explicit?.badge?.trim() || null,
              score: typeof explicit?.score === "number" ? explicit.score : null,
              recommendation: explicit?.recommendation?.trim() || null,
            },
          });
        }
      }

      // C. Update explicit item metadata if provided
      if (explicitItems && explicitItems.length > 0) {
        for (const item of explicitItems) {
          if (unionProductIds.includes(item.productId)) {
            await tx.articleProduct.updateMany({
              where: {
                articleId: existing.id,
                productId: item.productId,
              },
              data: {
                offerId: item.offerId || null,
                position: typeof item.position === "number" ? item.position : undefined,
                badge: item.badge !== undefined ? (item.badge?.trim() || null) : undefined,
                score: typeof item.score === "number" ? item.score : undefined,
                recommendation: item.recommendation !== undefined ? (item.recommendation?.trim() || null) : undefined,
              },
            });
          }
        }
      }

      // Fetch fresh articleProducts
      const finalProducts = await tx.articleProduct.findMany({
        where: { articleId: existing.id },
        orderBy: { position: "asc" },
        include: {
          product: {
            include: {
              category: true,
              offers: {
                where: { status: "ACTIVE" },
                orderBy: { price: "asc" },
              },
            },
          },
          offer: true,
        },
      });

      return {
        ...updatedArticle,
        articleProducts: finalProducts,
      };
    });
  }
}
