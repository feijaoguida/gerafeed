import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import { getActiveAIProvider } from "@/lib/ai/service";
import { parseAIJsonResponse } from "@/lib/ai";

export type SuggestedPlacementType =
  | "PRODUCT_CARD"
  | "INLINE_CTA"
  | "AFTER_PARAGRAPH"
  | "TOP_RECOMMENDATION";

export interface RawAiSuggestion {
  productId: string;
  offerId?: string | null;
  confidence?: number;
  reason?: string;
  suggestedPlacement?: SuggestedPlacementType;
}

export interface ProductSuggestion {
  productId: string;
  productName: string;
  productBrand: string | null;
  productImageUrl: string | null;
  categoryName: string | null;
  offerId?: string | null;
  price?: number | null;
  seller?: string | null;
  affiliateUrl?: string | null;
  confidence: number;
  reason: string;
  suggestedPlacement: SuggestedPlacementType;
}

export class AffiliateSuggestionService {
  /**
   * Generates AI suggestions of relevant affiliate products for a given article.
   * Strictly verifies entitlement, provides grounded active catalog data,
   * and enforces server-side validation against hallucinated product IDs.
   */
  static async suggestAffiliateProductsForArticle(
    workspaceId: string,
    articleId: string
  ): Promise<ProductSuggestion[]> {
    if (!workspaceId) throw new Error("workspaceId é obrigatório.");
    if (!articleId) throw new Error("articleId é obrigatório.");

    // 1. Check Entitlement
    const hasModule = await BillingService.hasFeature(workspaceId, AFFILIATE_FEATURES.MODULE);
    if (!hasModule) {
      throw new Error("O plano atual do workspace não possui acesso ao Módulo de Afiliados.");
    }

    // 2. Fetch Article
    const article = await prisma.article.findFirst({
      where: { id: articleId, workspaceId },
      include: { category: true, suggestedCategory: true },
    });
    if (!article) {
      throw new Error(`Artigo '${articleId}' não encontrado para o workspace.`);
    }

    // 3. Fetch Active Catalog Products for this Workspace
    const activeProducts = await prisma.product.findMany({
      where: {
        workspaceId,
        status: "ACTIVE",
      },
      include: {
        category: true,
        offers: {
          where: { status: "ACTIVE" },
          orderBy: { price: "asc" },
        },
      },
    });

    if (activeProducts.length === 0) {
      return [];
    }

    // Build lookup maps for strict server-side validation
    const productMap = new Map(activeProducts.map((p) => [p.id, p]));

interface ProductSourceFields {
  marketplaceCategoryName?: string | null;
  sourceDescription?: string | null;
}

    // Catalog summary payload provided to AI
    const catalogPayload = activeProducts.map((p) => {
      const bestOffer = p.offers[0] || null;
      const pWithSource = p as unknown as ProductSourceFields;
      return {
        id: p.id,
        name: p.name,
        brand: p.brand || undefined,
        category: p.category?.name || pWithSource.marketplaceCategoryName || undefined,
        description: p.description || pWithSource.sourceDescription || undefined,
        activeOfferId: bestOffer?.id || undefined,
        price: bestOffer?.price ? Number(bestOffer.price) : undefined,
        seller: bestOffer?.seller || undefined,
      };
    });

    const articleContext = {
      title: article.title || article.originalTitle,
      summary: article.summary || article.originalDescription,
      category: article.category?.name || article.suggestedCategory?.name,
      contentSnippet: article.content ? article.content.slice(0, 1500) : undefined,
    };

    let rawSuggestions: RawAiSuggestion[] = [];

    // 4. Query AI Provider
    try {
      const aiProvider = await getActiveAIProvider(undefined, workspaceId);

      const systemPrompt = `Você é um especialista em monetização editorial e marketing de afiliados.
Sua missão é analisar o artigo fornecido e selecionar de 0 a 3 produtos do catálogo comercial que tenham forte relevância contextual para o leitor.
Regras Estritas:
1. Você DEVE escolher APENAS produtos que estejam explicitamente presentes na lista do catálogo fornecido.
2. NUNCA invente novos produtos, nomes, marcas ou IDs.
3. Responda ESTRITAMENTE em formato JSON com a seguinte estrutura:
{
  "suggestions": [
    {
      "productId": "ID_EXATO_DO_PRODUTO",
      "offerId": "ID_DA_OFERTA_OU_NULL",
      "confidence": 0.95,
      "reason": "Explicação sucinta em português de como este produto se relaciona com o tema do artigo",
      "suggestedPlacement": "PRODUCT_CARD" | "INLINE_CTA" | "AFTER_PARAGRAPH" | "TOP_RECOMMENDATION"
    }
  ]
}`;

      const userPrompt = `Artigo a ser monetizado:
Título: ${articleContext.title}
Resumo: ${articleContext.summary || "N/A"}
Categoria: ${articleContext.category || "Geral"}
Trecho: ${articleContext.contentSnippet || "N/A"}

Catálogo de Produtos Disponíveis:
${JSON.stringify(catalogPayload, null, 2)}

Selecione os produtos mais pertinentes e retorne o JSON com as sugestões:`;

      const aiResponse = await aiProvider.generateArticle({
        originalTitle: articleContext.title || "Artigo sem título",
        originalDescription: `${systemPrompt}\n\n${userPrompt}`,
        categories: [],
      });

      const parsed = parseAIJsonResponse<{ suggestions?: RawAiSuggestion[] }>(aiResponse.content);
      if (Array.isArray(parsed.suggestions)) {
        rawSuggestions = parsed.suggestions;
      }
    } catch (aiErr) {
      console.warn("IA indisponível para sugestão de produtos, aplicando matching contextual heurístico:", (aiErr as Error).message);

      // Fallback matching: simple keyword matching between article title/summary and product names/categories
      const articleText = `${articleContext.title} ${articleContext.summary || ""} ${articleContext.category || ""}`.toLowerCase();

      for (const prod of activeProducts) {
        const prodNameLower = prod.name.toLowerCase();
        const prodWords = prodNameLower.split(" ").filter((w) => w.length > 3);
        const match = prodWords.some((w) => articleText.includes(w));

        if (match || activeProducts.length <= 2) {
          const bestOffer = prod.offers[0] || null;
          rawSuggestions.push({
            productId: prod.id,
            offerId: bestOffer?.id || null,
            confidence: match ? 0.85 : 0.6,
            reason: match
              ? `Relevância contextual identificada pelo termo '${prod.name}'.`
              : `Produto popular do catálogo disponível para recomendação.`,
            suggestedPlacement: "PRODUCT_CARD",
          });
          if (rawSuggestions.length >= 3) break;
        }
      }
    }

    // 5. Strict Server-Side Validation: Filter out any non-existing / hallucinated product IDs
    const validatedSuggestions: ProductSuggestion[] = [];

    for (const raw of rawSuggestions) {
      if (!raw || !raw.productId) continue;

      const product = productMap.get(raw.productId);
      if (!product) {
        console.warn(`[AffiliateSuggestion] ID de produto inválido ou não pertencente ao tenant ignorado: ${raw.productId}`);
        continue;
      }

      // Check offer if present
      let selectedOffer = product.offers[0] || null;
      if (raw.offerId) {
        const matchingOffer = product.offers.find((o) => o.id === raw.offerId);
        if (matchingOffer) selectedOffer = matchingOffer;
      }

      const placement: SuggestedPlacementType = [
        "PRODUCT_CARD",
        "INLINE_CTA",
        "AFTER_PARAGRAPH",
        "TOP_RECOMMENDATION",
      ].includes(raw.suggestedPlacement as SuggestedPlacementType)
        ? (raw.suggestedPlacement as SuggestedPlacementType)
        : "PRODUCT_CARD";

      validatedSuggestions.push({
        productId: product.id,
        productName: product.name,
        productBrand: product.brand,
        productImageUrl: product.imageUrl,
        categoryName:
          product.category?.name ||
          (product as unknown as ProductSourceFields).marketplaceCategoryName ||
          null,
        offerId: selectedOffer?.id || null,
        price: selectedOffer?.price ? Number(selectedOffer.price) : null,
        seller: selectedOffer?.seller || null,
        affiliateUrl: selectedOffer?.affiliateUrl || null,
        confidence: typeof raw.confidence === "number" ? Math.min(1, Math.max(0, raw.confidence)) : 0.8,
        reason: raw.reason || "Produto recomendado contextualmente para os leitores desta matéria.",
        suggestedPlacement: placement,
      });
    }

    return validatedSuggestions;
  }
}
