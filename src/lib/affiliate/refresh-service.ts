import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import { AffiliateProviderFactory } from "./factory";
import { NormalizedProductImport } from "./types";

export interface RefreshDiff {
  field: string;
  previous: unknown;
  current: unknown;
}

export interface RefreshOfferResult {
  offer: unknown;
  metadata: NormalizedProductImport;
  priceChanged: boolean;
  previousPrice: number | null;
  newPrice: number | null;
  diffs: RefreshDiff[];
}

export class ProductRefreshService {
  /**
   * Refreshes metadata and snapshot pricing for a single offer using its affiliate provider.
   * Follows the merge policy to preserve editorial overrides while refreshing commercial snapshots and source metadata.
   */
  static async refreshOffer(
    workspaceId: string,
    offerId: string
  ): Promise<RefreshOfferResult> {
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    const offer = await prisma.productOffer.findFirst({
      where: { id: offerId, workspaceId },
      include: { affiliateProgram: true, product: true },
    });

    if (!offer) {
      throw new Error("Oferta não encontrada no workspace.");
    }

    const provider = AffiliateProviderFactory.getProvider(offer.affiliateProgram.code);
    const metadata = await provider.fetchProductMetadata({
      affiliateUrl: offer.affiliateUrl,
      externalProductId: offer.externalProductId || undefined,
    });

    if (metadata.status === "FAILED") {
      throw new Error(
        `Falha ao atualizar dados da oferta: ${metadata.warnings.join(" | ") || "Erro desconhecido"}`
      );
    }

    const previousPrice = offer.price;
    const newPrice = metadata.price !== undefined ? metadata.price : previousPrice;
    const priceChanged = previousPrice !== newPrice;

    const diffs: RefreshDiff[] = [];
    if (priceChanged) {
      diffs.push({ field: "price", previous: previousPrice, current: newPrice });
    }
    if (metadata.seller && metadata.seller !== offer.seller) {
      diffs.push({ field: "seller", previous: offer.seller, current: metadata.seller });
    }

    const updatedOffer = await prisma.productOffer.update({
      where: { id: offerId },
      data: {
        resolvedUrl: metadata.resolvedUrl || offer.resolvedUrl,
        externalProductId: metadata.externalProductId || offer.externalProductId,
        seller: metadata.seller || offer.seller,
        price: newPrice,
        oldPrice:
          metadata.oldPrice !== undefined
            ? metadata.oldPrice
            : priceChanged && previousPrice !== null
            ? previousPrice
            : offer.oldPrice,
        currency: metadata.currency || offer.currency,
        metadataSource: "REFRESH_MANUAL",
        metadataLastFetchedAt: new Date(),
      },
      include: {
        product: true,
        affiliateProgram: true,
      },
    });

    // Merge policy: update source metadata on the product while strictly preserving editorial fields
    const productUpdateData: Record<string, unknown> = {};
    if (metadata.sourceDescription && metadata.sourceDescription !== offer.product.sourceDescription) {
      diffs.push({ field: "sourceDescription", previous: offer.product.sourceDescription, current: metadata.sourceDescription });
      productUpdateData.sourceDescription = metadata.sourceDescription;
    }
    if (metadata.sourceSpecs) {
      productUpdateData.sourceSpecs = metadata.sourceSpecs;
    }
    if (metadata.marketplaceCategoryId && metadata.marketplaceCategoryId !== offer.product.marketplaceCategoryId) {
      diffs.push({ field: "marketplaceCategoryId", previous: offer.product.marketplaceCategoryId, current: metadata.marketplaceCategoryId });
      productUpdateData.marketplaceCategoryId = metadata.marketplaceCategoryId;
    }
    if (metadata.marketplaceCategoryName && metadata.marketplaceCategoryName !== offer.product.marketplaceCategoryName) {
      diffs.push({ field: "marketplaceCategoryName", previous: offer.product.marketplaceCategoryName, current: metadata.marketplaceCategoryName });
      productUpdateData.marketplaceCategoryName = metadata.marketplaceCategoryName;
    }
    if (metadata.sourceRating !== undefined && metadata.sourceRating !== offer.product.sourceRating) {
      diffs.push({ field: "sourceRating", previous: offer.product.sourceRating, current: metadata.sourceRating });
      productUpdateData.sourceRating = metadata.sourceRating;
    }
    if (metadata.sourceReviewCount !== undefined && metadata.sourceReviewCount !== offer.product.sourceReviewCount) {
      diffs.push({ field: "sourceReviewCount", previous: offer.product.sourceReviewCount, current: metadata.sourceReviewCount });
      productUpdateData.sourceReviewCount = metadata.sourceReviewCount;
    }

    if (Object.keys(productUpdateData).length > 0) {
      await prisma.product.update({
        where: { id: offer.productId },
        data: productUpdateData,
      });
    }

    // Sync review samples if present in refreshed metadata
    if (metadata.reviewSamples && metadata.reviewSamples.length > 0) {
      try {
        const { ProductReviewService } = await import("./review-service");
        await ProductReviewService.syncProductReviewSamples(
          workspaceId,
          offer.productId,
          metadata.reviewSamples,
          offer.affiliateProgram.code
        );
        diffs.push({ field: "reviewSamples", previous: null, current: metadata.reviewSamples.length });
      } catch (err) {
        console.warn("Falha ao sincronizar reviews no refresh:", err);
      }
    }

    return {
      offer: updatedOffer,
      metadata,
      priceChanged,
      previousPrice,
      newPrice,
      diffs,
    };
  }

  /**
   * Refreshes all offers linked to a product, updating source data while preserving editorial fields.
   */
  static async refreshProduct(
    workspaceId: string,
    productId: string,
    options?: { updateMissingImages?: boolean }
  ) {
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    const product = await prisma.product.findFirst({
      where: { id: productId, workspaceId },
      include: { offers: true },
    });

    if (!product) {
      throw new Error("Produto não encontrado no workspace.");
    }

    const refreshResults: RefreshOfferResult[] = [];
    const allDiffs: Record<string, RefreshDiff[]> = {};

    for (const offer of product.offers) {
      try {
        const res = await this.refreshOffer(workspaceId, offer.id);
        refreshResults.push(res);
        if (res.diffs.length > 0) {
          allDiffs[offer.id] = res.diffs;
        }
      } catch (err) {
        console.warn(`[ProductRefreshService] Erro ao atualizar oferta ${offer.id}: ${(err as Error).message}`);
      }
    }

    // Merge policy: only fill missing product image if requested and missing
    if (options?.updateMissingImages && !product.imageUrl) {
      const firstWithImage = refreshResults.find((r) => r.metadata.imageUrl);
      if (firstWithImage?.metadata.imageUrl) {
        await prisma.product.update({
          where: { id: productId },
          data: { imageUrl: firstWithImage.metadata.imageUrl },
        });
      }
    }

    const refreshedProduct = await prisma.product.findUniqueOrThrow({
      where: { id: productId },
      include: {
        category: true,
        offers: {
          include: { affiliateProgram: true },
        },
      },
    });

    return {
      product: refreshedProduct,
      refreshedCount: refreshResults.length,
      results: refreshResults,
      diffs: allDiffs,
    };
  }
}
