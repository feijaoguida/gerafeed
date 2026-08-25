import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import { AffiliateProviderFactory } from "./factory";
import { NormalizedProductImport } from "./types";
import { ensureDefaultAffiliatePrograms } from "./seed";

export interface ConfirmImportInput {
  affiliateUrl: string;
  resolvedUrl?: string;
  canonicalUrl?: string;
  externalProductId?: string;
  providerCode?: string;
  name: string;
  slug?: string;
  brand?: string;
  description?: string;
  sourceDescription?: string;
  imageUrl?: string;
  images?: string[];
  specs?: Record<string, string>;
  sourceSpecs?: Record<string, string>;
  marketplaceCategoryId?: string;
  marketplaceCategoryName?: string;
  sourceRating?: number;
  sourceReviewCount?: number;
  reviewSamples?: import("./types").ReviewSample[];
  seller?: string;
  price?: number;
  oldPrice?: number;
  currency?: string;
  categoryId?: string | null;
  trackingLabel?: string;
  metadataSource?: string;
  overwriteExistingProductId?: string;
}

export interface PreviewImportResult {
  metadata: NormalizedProductImport;
  isDuplicate: boolean;
  existingProduct?: {
    id: string;
    name: string;
    slug: string;
    brand: string | null;
    imageUrl: string | null;
    description: string | null;
    sourceDescription: string | null;
    specs: unknown;
    sourceSpecs: unknown;
    rating: number | null;
    sourceRating: number | null;
  };
  suggestedCategory?: {
    id: string;
    name: string;
    slug: string;
  };
  existingOffer?: {
    id: string;
    affiliateUrl: string;
    externalProductId: string | null;
    price: number | null;
  };
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export class AffiliateService {
  /**
   * Generates a preview of product metadata from an affiliate URL and checks for deduplication.
   */
  static async previewImport(
    workspaceId: string,
    input: { affiliateUrl: string; providerCode?: string }
  ): Promise<PreviewImportResult> {
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano. Faça upgrade para importar produtos."
    );

    const providerCode = input.providerCode || "MERCADO_LIVRE";
    const provider = AffiliateProviderFactory.getProvider(providerCode);

    const metadata = await provider.fetchProductMetadata({
      affiliateUrl: input.affiliateUrl,
    });

    // Check deduplication
    let existingOffer = null;
    let existingProduct = null;

    if (metadata.externalProductId) {
      existingOffer = await prisma.productOffer.findFirst({
        where: {
          workspaceId,
          externalProductId: metadata.externalProductId,
        },
        include: { product: true },
      });
    }

    if (!existingOffer && metadata.resolvedUrl) {
      existingOffer = await prisma.productOffer.findFirst({
        where: {
          workspaceId,
          OR: [
            { affiliateUrl: input.affiliateUrl },
            { resolvedUrl: metadata.resolvedUrl },
          ],
        },
        include: { product: true },
      });
    }

    if (existingOffer) {
      existingProduct = {
        id: existingOffer.product.id,
        name: existingOffer.product.name,
        slug: existingOffer.product.slug,
        brand: existingOffer.product.brand,
        imageUrl: existingOffer.product.imageUrl,
        description: existingOffer.product.description,
        sourceDescription: existingOffer.product.sourceDescription,
        specs: existingOffer.product.specs,
        sourceSpecs: existingOffer.product.sourceSpecs,
        rating: existingOffer.product.rating,
        sourceRating: existingOffer.product.sourceRating,
      };
    }

    // Category Suggestion: look up matching category in workspace by marketplace category name
    let suggestedCategory: { id: string; name: string; slug: string } | undefined;
    if (metadata.marketplaceCategoryName) {
      const match = await prisma.productCategory.findFirst({
        where: {
          workspaceId,
          active: true,
          OR: [
            { name: { equals: metadata.marketplaceCategoryName.trim(), mode: "insensitive" } },
            { name: { contains: metadata.marketplaceCategoryName.trim(), mode: "insensitive" } },
          ],
        },
      });
      if (match) {
        suggestedCategory = { id: match.id, name: match.name, slug: match.slug };
      }
    }

    return {
      metadata,
      isDuplicate: Boolean(existingOffer),
      existingProduct: existingProduct || undefined,
      suggestedCategory,
      existingOffer: existingOffer
        ? {
            id: existingOffer.id,
            affiliateUrl: existingOffer.affiliateUrl,
            externalProductId: existingOffer.externalProductId,
            price: existingOffer.price,
          }
        : undefined,
    };
  }

  /**
   * Persists product and offer in an atomic transaction after user review/confirmation.
   */
  static async confirmImport(workspaceId: string, input: ConfirmImportInput) {
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    if (!input.affiliateUrl || typeof input.affiliateUrl !== "string") {
      throw new Error("A URL de afiliado é obrigatória.");
    }
    if (!input.name || typeof input.name !== "string" || !input.name.trim()) {
      throw new Error("O nome do produto é obrigatório.");
    }

    await ensureDefaultAffiliatePrograms();

    const providerCode = (input.providerCode || "MERCADO_LIVRE").toUpperCase();
    const program = await prisma.affiliateProgram.findUnique({
      where: { code: providerCode },
    });
    if (!program) {
      throw new Error(`Programa de afiliados '${providerCode}' não encontrado.`);
    }

    // Check quantity limit if creating a new product
    if (!input.overwriteExistingProductId) {
      const currentProductsCount = await prisma.product.count({
        where: { workspaceId },
      });
      await BillingService.assertFeatureLimit(
        workspaceId,
        AFFILIATE_FEATURES.MAX_PRODUCTS,
        currentProductsCount,
        `Você atingiu o limite de produtos de afiliados para o seu plano (${currentProductsCount} produtos). Faça upgrade para adicionar mais.`
      );
    }

    const trimmedName = input.name.trim();
    let baseSlug = input.slug ? generateSlug(input.slug) : generateSlug(trimmedName);
    if (!baseSlug) baseSlug = `produto-${Date.now()}`;

    const result = await prisma.$transaction(async (tx) => {
      let productId: string;
      let finalSlug = baseSlug;

      if (input.overwriteExistingProductId) {
        // Update existing product
        const existing = await tx.product.findFirst({
          where: { id: input.overwriteExistingProductId, workspaceId },
        });
        if (!existing) {
          throw new Error("Produto para atualização não encontrado no workspace.");
        }

        productId = existing.id;
        finalSlug = existing.slug;

        await tx.product.update({
          where: { id: productId },
          data: {
            name: trimmedName,
            brand: input.brand !== undefined ? input.brand?.trim() || null : existing.brand,
            description: input.description !== undefined ? input.description?.trim() || null : existing.description,
            sourceDescription: input.sourceDescription !== undefined ? input.sourceDescription?.trim() || null : existing.sourceDescription,
            imageUrl: input.imageUrl !== undefined ? input.imageUrl?.trim() || null : existing.imageUrl,
            images: input.images !== undefined ? input.images : (existing as { images?: string[] }).images || [],
            specs: input.specs !== undefined ? input.specs : (existing.specs || undefined),
            sourceSpecs: input.sourceSpecs !== undefined ? input.sourceSpecs : existing.sourceSpecs || undefined,
            marketplaceCategoryId: input.marketplaceCategoryId !== undefined ? input.marketplaceCategoryId?.trim() || null : existing.marketplaceCategoryId,
            marketplaceCategoryName: input.marketplaceCategoryName !== undefined ? input.marketplaceCategoryName?.trim() || null : existing.marketplaceCategoryName,
            sourceRating: input.sourceRating !== undefined ? (input.sourceRating !== null ? Number(input.sourceRating) : null) : existing.sourceRating,
            sourceReviewCount: input.sourceReviewCount !== undefined ? (input.sourceReviewCount !== null ? Number(input.sourceReviewCount) : null) : existing.sourceReviewCount,
            categoryId: input.categoryId !== undefined ? input.categoryId : existing.categoryId,
            status: "ACTIVE",
          },
        });
      } else {
        // Find unique slug for workspace
        let slugCandidate = baseSlug;
        let suffix = 1;
        while (true) {
          const count = await tx.product.count({
            where: { workspaceId, slug: slugCandidate },
          });
          if (count === 0) break;
          slugCandidate = `${baseSlug}-${suffix++}`;
        }
        finalSlug = slugCandidate;

        const newProduct = await tx.product.create({
          data: {
            workspaceId,
            name: trimmedName,
            slug: finalSlug,
            brand: input.brand?.trim() || null,
            description: input.description?.trim() || null,
            sourceDescription: input.sourceDescription?.trim() || null,
            imageUrl: input.imageUrl?.trim() || null,
            images: input.images || [],
            specs: input.specs || undefined,
            sourceSpecs: input.sourceSpecs || undefined,
            marketplaceCategoryId: input.marketplaceCategoryId?.trim() || null,
            marketplaceCategoryName: input.marketplaceCategoryName?.trim() || null,
            sourceRating: input.sourceRating !== undefined && input.sourceRating !== null ? Number(input.sourceRating) : null,
            sourceReviewCount: input.sourceReviewCount !== undefined && input.sourceReviewCount !== null ? Number(input.sourceReviewCount) : null,
            categoryId: input.categoryId || null,
            status: "ACTIVE",
          },
        });
        productId = newProduct.id;
      }

      // Upsert ProductOffer
      const existingOffer = await tx.productOffer.findFirst({
        where: {
          workspaceId,
          productId,
          affiliateProgramId: program.id,
        },
      });

      let offer;
      const offerData = {
        externalProductId: input.externalProductId?.trim() || null,
        originalUrl: input.canonicalUrl?.trim() || null,
        resolvedUrl: input.resolvedUrl?.trim() || null,
        affiliateUrl: input.affiliateUrl.trim(),
        seller: input.seller?.trim() || null,
        price: input.price !== undefined && input.price !== null ? Number(input.price) : null,
        oldPrice: input.oldPrice !== undefined && input.oldPrice !== null ? Number(input.oldPrice) : null,
        currency: input.currency?.trim().toUpperCase() || "BRL",
        trackingLabel: input.trackingLabel?.trim() || null,
        metadataSource: input.metadataSource || "CONFIRMED_IMPORT",
        metadataLastFetchedAt: new Date(),
        status: "ACTIVE" as const,
      };

      if (existingOffer) {
        offer = await tx.productOffer.update({
          where: { id: existingOffer.id },
          data: offerData,
        });
      } else {
        offer = await tx.productOffer.create({
          data: {
            workspaceId,
            productId,
            affiliateProgramId: program.id,
            ...offerData,
          },
        });
      }

      const product = await tx.product.findUniqueOrThrow({
        where: { id: productId },
        include: { category: true, offers: true, reviewSamples: true },
      });

      return { product, offer };
    });

    // Sync review samples if present
    if (input.reviewSamples && input.reviewSamples.length > 0) {
      try {
        const { ProductReviewService } = await import("./review-service");
        await ProductReviewService.syncProductReviewSamples(
          workspaceId,
          result.product.id,
          input.reviewSamples,
          program.code
        );
      } catch (err) {
        console.warn("Falha ao salvar amostras de reviews durante importação:", err);
      }
    }

    return result;
  }
}
