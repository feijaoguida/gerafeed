import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";


export interface CreateProductInput {
  name: string;
  slug?: string;
  brand?: string | null;
  description?: string | null;
  sourceDescription?: string | null;
  imageUrl?: string | null;
  images?: string[];
  specs?: Record<string, string> | null;
  sourceSpecs?: Record<string, string> | null;
  marketplaceCategoryId?: string | null;
  marketplaceCategoryName?: string | null;
  pros?: string[];
  cons?: string[];
  rating?: number | null;
  sourceRating?: number | null;
  sourceReviewCount?: number | null;
  categoryId?: string | null;
  status?: ProductStatus;
}

export interface UpdateProductInput {
  name?: string;
  slug?: string;
  brand?: string | null;
  description?: string | null;
  sourceDescription?: string | null;
  imageUrl?: string | null;
  images?: string[];
  specs?: Record<string, string> | null;
  sourceSpecs?: Record<string, string> | null;
  marketplaceCategoryId?: string | null;
  marketplaceCategoryName?: string | null;
  pros?: string[];
  cons?: string[];
  rating?: number | null;
  sourceRating?: number | null;
  sourceReviewCount?: number | null;
  categoryId?: string | null;
  status?: ProductStatus;
}

export interface ListProductsQuery {
  search?: string;
  status?: ProductStatus;
  categoryId?: string;
  brand?: string;
  page?: number;
  limit?: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export class ProductCatalogService {
  /**
   * Lists products with tenant isolation, search, filtering and pagination.
   */
  static async listProducts(workspaceId: string, query: ListProductsQuery = {}) {
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

    if (query.status) {
      where.status = query.status;
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.brand) {
      where.brand = { contains: query.brand.trim(), mode: "insensitive" };
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { name: { contains: s, mode: "insensitive" } },
        { brand: { contains: s, mode: "insensitive" } },
        { description: { contains: s, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          offers: {
            include: {
              affiliateProgram: {
                select: { id: true, name: true, code: true },
              },
            },
            orderBy: [{ price: "asc" }, { createdAt: "desc" }],
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
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
   * Retrieves a single product with category and offers.
   */
  static async getProduct(workspaceId: string, productId: string) {
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    const product = await prisma.product.findFirst({
      where: { id: productId, workspaceId },
      include: {
        category: true,
        reviewSamples: {
          orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
        },
        offers: {
          include: {
            affiliateProgram: true,
          },
        },
      },
    });

    if (!product) {
      throw new Error("Produto não encontrado no workspace.");
    }

    return product;
  }

  /**
   * Creates a new product enforcing tenant limits and generating unique slug.
   */
  static async createProduct(workspaceId: string, input: CreateProductInput) {
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    if (!input.name || !input.name.trim()) {
      throw new Error("O nome do produto é obrigatório.");
    }

    // Check plan product limits
    const currentProductsCount = await prisma.product.count({
      where: { workspaceId },
    });
    await BillingService.assertFeatureLimit(
      workspaceId,
      AFFILIATE_FEATURES.MAX_PRODUCTS,
      currentProductsCount,
      `Você atingiu o limite de produtos de afiliados para o seu plano (${currentProductsCount} produtos). Faça upgrade para adicionar mais.`
    );

    // Verify category belongs to workspace
    if (input.categoryId) {
      const cat = await prisma.productCategory.findFirst({
        where: { id: input.categoryId, workspaceId },
      });
      if (!cat) {
        throw new Error("Categoria informada não existe neste workspace.");
      }
    }

    const trimmedName = input.name.trim();
    let baseSlug = input.slug ? slugify(input.slug) : slugify(trimmedName);
    if (!baseSlug) baseSlug = `produto-${Date.now()}`;

    // Ensure unique slug per workspace
    let slugCandidate = baseSlug;
    let suffix = 1;
    while (true) {
      const existing = await prisma.product.findFirst({
        where: { workspaceId, slug: slugCandidate },
      });
      if (!existing) break;
      slugCandidate = `${baseSlug}-${suffix++}`;
    }

    return prisma.product.create({
      data: {
        workspaceId,
        name: trimmedName,
        slug: slugCandidate,
        brand: input.brand?.trim() || null,
        description: input.description?.trim() || null,
        sourceDescription: input.sourceDescription?.trim() || null,
        imageUrl: input.imageUrl?.trim() || null,
        images: input.images || [],
        specs: input.specs || undefined,
        sourceSpecs: input.sourceSpecs || undefined,
        marketplaceCategoryId: input.marketplaceCategoryId?.trim() || null,
        marketplaceCategoryName: input.marketplaceCategoryName?.trim() || null,
        pros: input.pros || [],
        cons: input.cons || [],
        rating: input.rating !== undefined && input.rating !== null ? Number(input.rating) : null,
        sourceRating: input.sourceRating !== undefined && input.sourceRating !== null ? Number(input.sourceRating) : null,
        sourceReviewCount: input.sourceReviewCount !== undefined && input.sourceReviewCount !== null ? Number(input.sourceReviewCount) : null,
        categoryId: input.categoryId || null,
        status: input.status || "ACTIVE",
      },
      include: {
        category: true,
        offers: true,
      },
    });
  }

  /**
   * Updates an existing product with slug validation.
   */
  static async updateProduct(
    workspaceId: string,
    productId: string,
    input: UpdateProductInput
  ) {
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    const existing = await prisma.product.findFirst({
      where: { id: productId, workspaceId },
    });
    if (!existing) {
      throw new Error("Produto não encontrado no workspace.");
    }

    // Verify category belongs to workspace if provided
    if (input.categoryId !== undefined && input.categoryId !== null) {
      const cat = await prisma.productCategory.findFirst({
        where: { id: input.categoryId, workspaceId },
      });
      if (!cat) {
        throw new Error("Categoria informada não existe neste workspace.");
      }
    }

    let finalSlug = existing.slug;
    if (input.slug || (input.name && input.name.trim() !== existing.name)) {
      const baseSlug = slugify(input.slug || input.name || existing.name);
      if (baseSlug && baseSlug !== existing.slug) {
        let slugCandidate = baseSlug;
        let suffix = 1;
        while (true) {
          const collision = await prisma.product.findFirst({
            where: {
              workspaceId,
              slug: slugCandidate,
              NOT: { id: productId },
            },
          });
          if (!collision) break;
          slugCandidate = `${baseSlug}-${suffix++}`;
        }
        finalSlug = slugCandidate;
      }
    }

    return prisma.product.update({
      where: { id: productId },
      data: {
        name: input.name !== undefined ? input.name.trim() : undefined,
        slug: finalSlug,
        brand: input.brand !== undefined ? input.brand?.trim() || null : undefined,
        description: input.description !== undefined ? input.description?.trim() || null : undefined,
        sourceDescription: input.sourceDescription !== undefined ? input.sourceDescription?.trim() || null : undefined,
        imageUrl: input.imageUrl !== undefined ? input.imageUrl?.trim() || null : undefined,
        images: input.images !== undefined ? input.images : undefined,
        specs: input.specs !== undefined ? input.specs || undefined : undefined,
        sourceSpecs: input.sourceSpecs !== undefined ? input.sourceSpecs || undefined : undefined,
        marketplaceCategoryId: input.marketplaceCategoryId !== undefined ? input.marketplaceCategoryId?.trim() || null : undefined,
        marketplaceCategoryName: input.marketplaceCategoryName !== undefined ? input.marketplaceCategoryName?.trim() || null : undefined,
        pros: input.pros !== undefined ? input.pros : undefined,
        cons: input.cons !== undefined ? input.cons : undefined,
        rating: input.rating !== undefined ? (input.rating !== null ? Number(input.rating) : null) : undefined,
        sourceRating: input.sourceRating !== undefined ? (input.sourceRating !== null ? Number(input.sourceRating) : null) : undefined,
        sourceReviewCount: input.sourceReviewCount !== undefined ? (input.sourceReviewCount !== null ? Number(input.sourceReviewCount) : null) : undefined,
        categoryId: input.categoryId !== undefined ? input.categoryId : undefined,
        status: input.status !== undefined ? input.status : undefined,
      },
      include: {
        category: true,
        offers: true,
      },
    });
  }

  /**
   * Deletes a product with cascade deletion of offers.
   */
  static async deleteProduct(workspaceId: string, productId: string) {
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    const existing = await prisma.product.findFirst({
      where: { id: productId, workspaceId },
    });
    if (!existing) {
      throw new Error("Produto não encontrado no workspace.");
    }

    return prisma.product.delete({
      where: { id: productId },
    });
  }
}
