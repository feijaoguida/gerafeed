import { prisma } from "@/lib/prisma";

export interface AttachProductItemInput {
  productId: string;
  offerId?: string | null;
  position?: number;
  badge?: string | null;
  score?: number | null;
  recommendation?: string | null;
}

export class ArticleProductService {
  /**
   * Attaches or replaces products associated with an affiliate commercial article.
   * Enforces tenancy boundaries and commercial type cardinality constraints.
   */
  static async attachProducts(
    workspaceId: string,
    articleId: string,
    items: AttachProductItemInput[]
  ) {
    // 1. Verify Article belongs to Workspace
    const article = await prisma.article.findFirst({
      where: { id: articleId, workspaceId },
    });

    if (!article) {
      throw new Error("Artigo não encontrado no workspace informado.");
    }

    // 2. Validate Cardinality per Commercial Type
    if (article.commercialType === "PRODUCT_REVIEW") {
      if (items.length !== 1) {
        throw new Error("Artigos do tipo Review de Produto devem conter exatamente 1 produto vinculado.");
      }
    } else if (article.commercialType === "COMPARISON") {
      if (items.length < 2) {
        throw new Error("Artigos do tipo Comparativo exigem no mínimo 2 produtos vinculados.");
      }
    } else if (
      article.commercialType === "BEST_PRODUCTS" ||
      article.commercialType === "BUYING_GUIDE" ||
      article.commercialType === "SEASONAL"
    ) {
      if (items.length < 1) {
        throw new Error("Artigos comerciais deste formato exigem pelo menos 1 produto vinculado.");
      }
    }

    // Check for duplicate product IDs in the payload
    const productIds = items.map((i) => i.productId);
    const uniqueIds = new Set(productIds);
    if (uniqueIds.size !== productIds.length) {
      throw new Error("Não é permitido vincular o mesmo produto mais de uma vez ao mesmo artigo.");
    }

    // 3. Verify all Products belong to the same Workspace
    const productsInDb = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        workspaceId,
      },
      include: {
        offers: {
          where: { workspaceId },
        },
      },
    });

    if (productsInDb.length !== productIds.length) {
      throw new Error("Um ou mais produtos selecionados não foram encontrados ou pertencem a outro workspace.");
    }

    // 4. Verify Offers (if specified) belong to the corresponding Product and Workspace
    for (const item of items) {
      if (item.offerId) {
        const prod = productsInDb.find((p) => p.id === item.productId);
        const validOffer = prod?.offers.some((o) => o.id === item.offerId);
        if (!validOffer) {
          throw new Error(`A oferta selecionada (${item.offerId}) não pertence ao produto informado ou ao workspace.`);
        }
      }
    }

    // 5. Replace existing relations in a transaction
    return await prisma.$transaction(async (tx) => {
      await tx.articleProduct.deleteMany({
        where: { articleId },
      });

      const createData = items.map((item, index) => ({
        articleId,
        productId: item.productId,
        offerId: item.offerId || null,
        position: typeof item.position === "number" ? item.position : index,
        badge: item.badge?.trim() || null,
        score: typeof item.score === "number" ? item.score : null,
        recommendation: item.recommendation?.trim() || null,
      }));

      await tx.articleProduct.createMany({
        data: createData,
      });

      return await tx.articleProduct.findMany({
        where: { articleId },
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
    });
  }

  /**
   * Retrieves all products and offers attached to an article ordered by position.
   */
  static async getArticleProducts(workspaceId: string, articleId: string) {
    const article = await prisma.article.findFirst({
      where: { id: articleId, workspaceId },
    });

    if (!article) {
      throw new Error("Artigo não encontrado no workspace informado.");
    }

    return await prisma.articleProduct.findMany({
      where: { articleId },
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
  }

  /**
   * Detaches a single product from an article.
   */
  static async detachProduct(workspaceId: string, articleId: string, productId: string) {
    const article = await prisma.article.findFirst({
      where: { id: articleId, workspaceId },
      include: { articleProducts: true },
    });

    if (!article) {
      throw new Error("Artigo não encontrado no workspace informado.");
    }

    // Validate remaining count constraint
    const remainingCount = article.articleProducts.length - 1;
    if (article.commercialType === "PRODUCT_REVIEW" && remainingCount < 1) {
      throw new Error("Não é possível remover o único produto de um artigo de Review.");
    } else if (article.commercialType === "COMPARISON" && remainingCount < 2) {
      throw new Error("Um artigo Comparativo não pode ter menos de 2 produtos vinculados.");
    }

    await prisma.articleProduct.deleteMany({
      where: {
        articleId,
        productId,
      },
    });

    return { success: true };
  }
}
