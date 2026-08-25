import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import { AffiliateProviderFactory } from "./factory";
import { ensureDefaultAffiliatePrograms } from "./seed";
import { PublicationSyncService } from "@/lib/publisher/publication-sync";

export type OfferStatus = "ACTIVE" | "PAUSED" | "OUT_OF_STOCK" | "ARCHIVED";

export interface CreateOfferInput {
  productId: string;
  affiliateUrl: string;
  providerCode?: string;
  seller?: string | null;
  price?: number | null;
  oldPrice?: number | null;
  currency?: string;
  trackingLabel?: string | null;
  status?: OfferStatus;
  autoFetchMetadata?: boolean;
}

export interface UpdateOfferInput {
  affiliateUrl?: string;
  seller?: string | null;
  price?: number | null;
  oldPrice?: number | null;
  currency?: string;
  trackingLabel?: string | null;
  status?: OfferStatus;
}

export interface ListOffersQuery {
  productId?: string;
  programCode?: string;
  status?: OfferStatus;
  page?: number;
  limit?: number;
}

export class ProductOfferService {
  /**
   * Lists product offers with filtering and pagination.
   */
  static async listOffers(workspaceId: string, query: ListOffersQuery = {}) {
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      workspaceId,
    };

    if (query.productId) {
      where.productId = query.productId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.programCode) {
      where.affiliateProgram = {
        code: query.programCode.toUpperCase(),
      };
    }

    const [items, total] = await Promise.all([
      prisma.productOffer.findMany({
        where,
        include: {
          product: {
            select: { id: true, name: true, slug: true, brand: true, imageUrl: true },
          },
          affiliateProgram: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: [{ price: "asc" }, { updatedAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.productOffer.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieves a single offer by ID with product and affiliate program details.
   */
  static async getOffer(workspaceId: string, offerId: string) {
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    const offer = await prisma.productOffer.findFirst({
      where: { id: offerId, workspaceId },
      include: {
        product: true,
        affiliateProgram: true,
      },
    });

    if (!offer) {
      throw new Error("Oferta de produto não encontrada no workspace.");
    }

    return offer;
  }

  /**
   * Creates a new offer for a product with provider link validation and optional metadata fetching.
   */
  static async createOffer(workspaceId: string, input: CreateOfferInput) {
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    if (!input.productId) {
      throw new Error("O ID do produto é obrigatório.");
    }
    if (!input.affiliateUrl || typeof input.affiliateUrl !== "string" || !input.affiliateUrl.trim()) {
      throw new Error("A URL de afiliado é obrigatória.");
    }

    // Verify product exists in workspace
    const product = await prisma.product.findFirst({
      where: { id: input.productId, workspaceId },
    });
    if (!product) {
      throw new Error("Produto não encontrado neste workspace.");
    }

    await ensureDefaultAffiliatePrograms();

    const providerCode = (input.providerCode || "MERCADO_LIVRE").toUpperCase();
    const program = await prisma.affiliateProgram.findUnique({
      where: { code: providerCode },
    });
    if (!program) {
      throw new Error(`Programa de afiliados '${providerCode}' não encontrado.`);
    }

    const provider = AffiliateProviderFactory.getProvider(providerCode);

    // Resolve & Validate URL
    let resolvedUrl: string | null = null;
    let externalProductId: string | null = null;
    let resolvedSeller = input.seller?.trim() || null;
    let resolvedPrice = input.price !== undefined && input.price !== null ? Number(input.price) : null;
    let resolvedOldPrice = input.oldPrice !== undefined && input.oldPrice !== null ? Number(input.oldPrice) : null;
    let metadataSource = "MANUAL_INPUT";
    let metadataLastFetchedAt: Date | null = null;

    if (input.autoFetchMetadata) {
      const meta = await provider.fetchProductMetadata({
        affiliateUrl: input.affiliateUrl.trim(),
      });
      resolvedUrl = meta.resolvedUrl || null;
      externalProductId = meta.externalProductId || null;
      if (!resolvedSeller && meta.seller) resolvedSeller = meta.seller;
      if (resolvedPrice === null && meta.price !== undefined) resolvedPrice = meta.price;
      if (resolvedOldPrice === null && meta.oldPrice !== undefined) resolvedOldPrice = meta.oldPrice;
      metadataSource = meta.metadataSource || "PROVIDER_FETCH";
      metadataLastFetchedAt = meta.fetchedAt;
    } else {
      const resolved = await provider.resolveAffiliateUrl(input.affiliateUrl.trim());
      resolvedUrl = resolved.resolvedUrl || null;
      externalProductId = resolved.externalProductId || null;
    }

    return prisma.productOffer.create({
      data: {
        workspaceId,
        productId: product.id,
        affiliateProgramId: program.id,
        externalProductId,
        originalUrl: resolvedUrl,
        resolvedUrl,
        affiliateUrl: input.affiliateUrl.trim(),
        seller: resolvedSeller,
        price: resolvedPrice,
        oldPrice: resolvedOldPrice,
        currency: input.currency?.trim().toUpperCase() || "BRL",
        trackingLabel: input.trackingLabel?.trim() || null,
        metadataSource,
        metadataLastFetchedAt: metadataLastFetchedAt || new Date(),
        status: input.status || "ACTIVE",
      },
      include: {
        product: true,
        affiliateProgram: true,
      },
    });
  }

  /**
   * Updates an existing offer.
   */
  static async updateOffer(
    workspaceId: string,
    offerId: string,
    input: UpdateOfferInput
  ) {
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    const existing = await prisma.productOffer.findFirst({
      where: { id: offerId, workspaceId },
      include: { affiliateProgram: true },
    });
    if (!existing) {
      throw new Error("Oferta não encontrada no workspace.");
    }

    let resolvedUrl = existing.resolvedUrl;
    let externalProductId = existing.externalProductId;

    if (input.affiliateUrl && input.affiliateUrl.trim() !== existing.affiliateUrl) {
      const provider = AffiliateProviderFactory.getProvider(existing.affiliateProgram.code);
      const resolved = await provider.resolveAffiliateUrl(input.affiliateUrl.trim());
      resolvedUrl = resolved.resolvedUrl || null;
      externalProductId = resolved.externalProductId || null;
    }

    const updated = await prisma.productOffer.update({
      where: { id: offerId },
      data: {
        affiliateUrl: input.affiliateUrl !== undefined ? input.affiliateUrl.trim() : undefined,
        resolvedUrl,
        externalProductId,
        seller: input.seller !== undefined ? input.seller?.trim() || null : undefined,
        price: input.price !== undefined ? (input.price !== null ? Number(input.price) : null) : undefined,
        oldPrice: input.oldPrice !== undefined ? (input.oldPrice !== null ? Number(input.oldPrice) : null) : undefined,
        currency: input.currency !== undefined ? input.currency.trim().toUpperCase() : undefined,
        trackingLabel: input.trackingLabel !== undefined ? input.trackingLabel?.trim() || null : undefined,
        status: input.status !== undefined ? input.status : undefined,
      },
      include: {
        product: true,
        affiliateProgram: true,
      },
    });

    // If critical fields changed (price, status, affiliateUrl), mark dependent published articles as outdated
    if (
      (input.price !== undefined && input.price !== existing.price) ||
      (input.status !== undefined && input.status !== existing.status) ||
      (input.affiliateUrl !== undefined && input.affiliateUrl !== existing.affiliateUrl)
    ) {
      await PublicationSyncService.markDependentArticlesForRepublish(workspaceId, existing.productId).catch((err: unknown) => {
        console.error("Erro ao marcar artigos dependentes para republicação:", err);
      });
    }

    return updated;
  }

  /**
   * Deletes an offer from the workspace.
   */
  static async deleteOffer(workspaceId: string, offerId: string) {
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    const existing = await prisma.productOffer.findFirst({
      where: { id: offerId, workspaceId },
    });
    if (!existing) {
      throw new Error("Oferta não encontrada no workspace.");
    }

    return prisma.productOffer.delete({
      where: { id: offerId },
    });
  }
}
