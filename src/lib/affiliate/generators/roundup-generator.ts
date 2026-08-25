import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import { getActiveAIProvider } from "@/lib/ai";
import { AIProvider } from "@/lib/ai/types";
import { AffiliatePromptTemplateService } from "@/lib/affiliate/prompt-template-service";
import { ArticleProductService } from "@/lib/affiliate/article-product-service";
import {
  CanonicalDocumentService,
  CanonicalDocument,
  CanonicalBlock,
} from "@/lib/affiliate/canonical-document";

export interface GenerateBestProductsInput {
  workspaceId: string;
  productIds: string[];
  offerIds?: Record<string, string>;
  categoryName?: string;
  focusKeyword?: string;
  customInstructions?: string;
  aiProvider?: AIProvider;
  wordpressSiteId?: string;
  categoryId?: string;
}

export interface GenerateBuyingGuideInput {
  workspaceId: string;
  productIds?: string[];
  offerIds?: Record<string, string>;
  categoryName: string;
  focusKeyword?: string;
  customInstructions?: string;
  aiProvider?: AIProvider;
  wordpressSiteId?: string;
  categoryId?: string;
}

export interface GenerateCommercialArticleResult {
  article: {
    id: string;
    workspaceId: string;
    title: string | null;
    summary: string | null;
    content: string | null;
    commercialType: string | null;
    status: string;
    seoFocusKeyword: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    tags: string[];
    createdAt: Date;
  };
  canonicalDocument: CanonicalDocument;
}

export class BestProductsGenerator {
  /**
   * Generates a "Best Products / Top Picks" roundup article using ONLY selected products from catalog.
   * Strictly enforces anti-hallucination (no unselected external products injected).
   */
  static async generate(input: GenerateBestProductsInput): Promise<GenerateCommercialArticleResult> {
    const { workspaceId, productIds, offerIds, categoryName, focusKeyword, customInstructions, aiProvider } = input;

    if (!Array.isArray(productIds) || productIds.length < 1) {
      throw new Error("A lista de Melhores Produtos exige pelo menos 1 produto selecionado.");
    }

    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        workspaceId,
      },
      include: {
        category: true,
        offers: {
          where: { status: "ACTIVE" },
          orderBy: { price: "asc" },
        },
      },
    });

    if (products.length !== productIds.length) {
      throw new Error("Um ou mais produtos selecionados não foram encontrados ou pertencem a outro workspace.");
    }

    // Format products context
    const productsContextList = products.map((product, index) => {
      const selectedOfferId = offerIds?.[product.id];
      const selectedOffer = selectedOfferId
        ? product.offers.find((o) => o.id === selectedOfferId) || product.offers[0]
        : product.offers[0];

      const formattedPrice = selectedOffer?.price
        ? `${selectedOffer.currency || "R$"} ${selectedOffer.price.toFixed(2)}`
        : "Preço sob consulta";

      let formattedSpecs = "Nenhuma especificação técnica informada.";
      if (product.specs && typeof product.specs === "object") {
        formattedSpecs = Object.entries(product.specs)
          .map(([k, v]) => `${k}: ${String(v)}`)
          .join("; ");
      }

      return `Produto ${index + 1}: ${product.name} (Marca: ${product.brand || "N/A"})
- Preço: ${formattedPrice}
- Especificações: ${formattedSpecs}
- Pontos Fortes: ${product.pros.join(", ") || "Nenhum informado"}
- Pontos Fracos: ${product.cons.join(", ") || "Nenhum informado"}
- Avaliação: ${product.rating !== null ? product.rating : "4.5"}`;
    }).join("\n\n");

    const promptContext: Record<string, unknown> = {
      productsList: productsContextList,
      productsCount: String(products.length),
      category: {
        name: categoryName || products[0]?.category?.name || "Geral",
      },
      customInstructions: [
        focusKeyword ? `Palavra-chave principal de SEO: "${focusKeyword.trim()}".` : "",
        customInstructions?.trim() || "",
        "REGRA CRÍTICA: Não adicione nem mencione nenhum produto fora da lista fornecida acima.",
      ]
        .filter(Boolean)
        .join("\n"),
    };

    const template = await AffiliatePromptTemplateService.getEffectiveTemplate(
      workspaceId,
      "BEST_PRODUCTS"
    );

    const renderedUserPrompt = AffiliatePromptTemplateService.renderPrompt(
      template.userPromptTemplate,
      promptContext
    );

    const provider = aiProvider || (await getActiveAIProvider(undefined, workspaceId));
    const aiResponse = await provider.generateArticle({
      originalTitle: `Os Melhores Produtos em ${categoryName || "Destaque"} (Guia de Compra)`,
      originalDescription: renderedUserPrompt,
      categories: [],
    });

    // Assemble Canonical Blocks
    const canonicalBlocks: CanonicalBlock[] = [
      {
        type: "AFFILIATE_DISCLOSURE",
        data: {
          text: "Transparência: Ao comprar pelos nossos links, podemos receber comissões de afiliados sem custo extra.",
          position: "top",
        },
      },
      {
        type: "HEADING",
        data: {
          level: 2,
          text: aiResponse.title || `Os Melhores Produtos em ${categoryName || "Destaque"}`,
          id: "roundup-intro",
        },
      },
      {
        type: "RICH_TEXT",
        data: {
          html: aiResponse.content || `<p>Confira nossa seleção dos melhores produtos testados e recomendados.</p>`,
        },
      },
    ];

    const badges = ["Melhor Escolha Geral", "Melhor Custo-Benefício", "Escolha Premium", "Melhor Compacto", "Mais Vendido"];

    for (let i = 0; i < products.length; i++) {
      const prod = products[i];
      const selectedOfferId = offerIds?.[prod.id];
      const selectedOffer = selectedOfferId
        ? prod.offers.find((o) => o.id === selectedOfferId) || prod.offers[0]
        : prod.offers[0];

      canonicalBlocks.push({
        type: "PRODUCT_CARD",
        data: {
          productId: prod.id,
          offerId: selectedOffer?.id || null,
          highlightBadge: badges[i] || `Destaque #${i + 1}`,
          showSpecs: true,
          showProsCons: true,
          ctaText: `Ver Preço Atualizado de ${prod.name}`,
        },
      });

      if (prod.pros.length > 0 || prod.cons.length > 0) {
        canonicalBlocks.push({
          type: "PROS_CONS",
          data: {
            productId: prod.id,
            pros: prod.pros.length > 0 ? prod.pros : ["Excelente escolha"],
            cons: prod.cons.length > 0 ? prod.cons : ["Disponibilidade sujeita a estoque"],
          },
        });
      }
    }

    canonicalBlocks.push({
      type: "CTA",
      data: {
        productId: products[0].id,
        offerId: offerIds?.[products[0].id] || products[0].offers[0]?.id || null,
        text: `Ver Menor Preço do Campeão: ${products[0].name}`,
        subtext: "Frete e descontos especiais por tempo limitado",
        buttonStyle: "deal",
      },
    });

    const canonicalDoc = CanonicalDocumentService.createDocument(canonicalBlocks, {
      wordCount: (aiResponse.content || "").split(/\s+/).length,
      readingTimeMinutes: Math.max(1, Math.ceil(((aiResponse.content || "").split(/\s+/).length) / 200)),
    });

    const createdArticle = await prisma.article.create({
      data: {
        workspaceId,
        title: aiResponse.title || `Os Melhores Produtos em ${categoryName || "Destaque"}`,
        summary: aiResponse.summary || `Seleção cuidadosa dos melhores produtos para comprar.`,
        content: aiResponse.content || `<p>Guia dos melhores produtos.</p>`,
        commercialType: "BEST_PRODUCTS",
        canonicalContent: canonicalDoc as object,
        seoFocusKeyword: aiResponse.seoFocusKeyword || focusKeyword?.trim() || `melhores ${categoryName || "produtos"}`,
        seoTitle: aiResponse.seoTitle || aiResponse.title || `Melhores Produtos: Guia Completo`,
        seoDescription: aiResponse.seoDescription || aiResponse.summary,
        tags: aiResponse.tags && aiResponse.tags.length > 0
          ? aiResponse.tags
          : ["Melhores Produtos", categoryName || "Guia de Compra", "Top Escolhas"],
        status: "PENDING",
        wordpressSiteId: input.wordpressSiteId || null,
        categoryId: input.categoryId || null,
        suggestedCategoryId: input.categoryId || null,
        promptTemplateId: template.id || null,
        promptTemplateVersion: template.version,
      },
    });

    const attachItems = products.map((prod, index) => ({
      productId: prod.id,
      offerId: offerIds?.[prod.id] || prod.offers[0]?.id || null,
      position: index,
      badge: badges[index] || `Destaque #${index + 1}`,
      score: prod.rating || 4.5,
      recommendation: index === 0 ? "Top 1 Recomendado" : "Opção de Alto Nível",
    }));

    await ArticleProductService.attachProducts(workspaceId, createdArticle.id, attachItems);

    return {
      article: createdArticle,
      canonicalDocument: canonicalDoc,
    };
  }
}

export class BuyingGuideGenerator {
  /**
   * Generates an educational "Buying Guide" article explaining what to look for before buying,
   * incorporating factual products and canonical blocks.
   */
  static async generate(input: GenerateBuyingGuideInput): Promise<GenerateCommercialArticleResult> {
    const { workspaceId, productIds, offerIds, categoryName, focusKeyword, customInstructions, aiProvider } = input;

    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    let products: Array<{
      id: string;
      name: string;
      brand: string | null;
      pros: string[];
      cons: string[];
      rating: number | null;
      specs: unknown;
      offers: Array<{ id: string; price: number | null; currency: string; seller: string | null }>;
    }> = [];

    if (Array.isArray(productIds) && productIds.length > 0) {
      products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          workspaceId,
        },
        include: {
          offers: {
            where: { status: "ACTIVE" },
            orderBy: { price: "asc" },
          },
        },
      });
    }

    const productsContextList = products.map((product, index) => {
      const selectedOfferId = offerIds?.[product.id];
      const selectedOffer = selectedOfferId
        ? product.offers.find((o) => o.id === selectedOfferId) || product.offers[0]
        : product.offers[0];

      const formattedPrice = selectedOffer?.price
        ? `${selectedOffer.currency || "R$"} ${selectedOffer.price.toFixed(2)}`
        : "Preço sob consulta";

      return `Produto Recomendado ${index + 1}: ${product.name} (Marca: ${product.brand || "N/A"}, Preço: ${formattedPrice})`;
    }).join("\n");

    const promptContext: Record<string, unknown> = {
      category: {
        name: categoryName,
      },
      productsList: productsContextList || "Nenhum produto fixado (guia geral de critérios).",
      customInstructions: [
        focusKeyword ? `Palavra-chave principal de SEO: "${focusKeyword.trim()}".` : "",
        customInstructions?.trim() || "",
      ]
        .filter(Boolean)
        .join("\n"),
    };

    const template = await AffiliatePromptTemplateService.getEffectiveTemplate(
      workspaceId,
      "BUYING_GUIDE"
    );

    const renderedUserPrompt = AffiliatePromptTemplateService.renderPrompt(
      template.userPromptTemplate,
      promptContext
    );

    const provider = aiProvider || (await getActiveAIProvider(undefined, workspaceId));
    const aiResponse = await provider.generateArticle({
      originalTitle: `Guia de Compra: Como Escolher ${categoryName}`,
      originalDescription: renderedUserPrompt,
      categories: [],
    });

    // Assemble Canonical Blocks
    const canonicalBlocks: CanonicalBlock[] = [
      {
        type: "AFFILIATE_DISCLOSURE",
        data: {
          text: "Transparência: Nossos guias são elaborados de forma independente. Podemos receber comissão de afiliados ao comprar pelos links.",
          position: "top",
        },
      },
      {
        type: "HEADING",
        data: {
          level: 2,
          text: aiResponse.title || `Guia de Compra Definitivo: ${categoryName}`,
          id: "guide-intro",
        },
      },
      {
        type: "RICH_TEXT",
        data: {
          html: aiResponse.content || `<p>Aprenda o que avaliar antes de comprar para não errar na escolha.</p>`,
        },
      },
    ];

    for (let i = 0; i < products.length; i++) {
      const prod = products[i];
      const selectedOfferId = offerIds?.[prod.id];
      const selectedOffer = selectedOfferId
        ? prod.offers.find((o) => o.id === selectedOfferId) || prod.offers[0]
        : prod.offers[0];

      canonicalBlocks.push({
        type: "PRODUCT_CARD",
        data: {
          productId: prod.id,
          offerId: selectedOffer?.id || null,
          highlightBadge: `Recomendação de Especialista #${i + 1}`,
          showSpecs: true,
          showProsCons: true,
          ctaText: `Ver Ofertas de ${prod.name}`,
        },
      });
    }

    if (products.length > 0) {
      canonicalBlocks.push({
        type: "CTA",
        data: {
          productId: products[0].id,
          offerId: offerIds?.[products[0].id] || products[0].offers[0]?.id || null,
          text: `Acessar Melhores Ofertas em ${categoryName}`,
          subtext: "Economize comparando preços e modelos recomendados",
          buttonStyle: "primary",
        },
      });
    }

    const canonicalDoc = CanonicalDocumentService.createDocument(canonicalBlocks, {
      wordCount: (aiResponse.content || "").split(/\s+/).length,
      readingTimeMinutes: Math.max(1, Math.ceil(((aiResponse.content || "").split(/\s+/).length) / 200)),
    });

    const createdArticle = await prisma.article.create({
      data: {
        workspaceId,
        title: aiResponse.title || `Guia de Compra: Como Escolher ${categoryName}`,
        summary: aiResponse.summary || `Critérios essenciais para não errar na compra de ${categoryName}.`,
        content: aiResponse.content || `<p>Guia de compra de ${categoryName}.</p>`,
        commercialType: "BUYING_GUIDE",
        canonicalContent: canonicalDoc as object,
        seoFocusKeyword: aiResponse.seoFocusKeyword || focusKeyword?.trim() || `como escolher ${categoryName}`,
        seoTitle: aiResponse.seoTitle || aiResponse.title || `Guia de Compra: ${categoryName}`,
        seoDescription: aiResponse.seoDescription || aiResponse.summary,
        tags: aiResponse.tags && aiResponse.tags.length > 0
          ? aiResponse.tags
          : ["Guia de Compra", categoryName, "Dicas de Compra"],
        status: "PENDING",
        wordpressSiteId: input.wordpressSiteId || null,
        categoryId: input.categoryId || null,
        suggestedCategoryId: input.categoryId || null,
        promptTemplateId: template.id || null,
        promptTemplateVersion: template.version,
      },
    });

    if (products.length > 0) {
      const attachItems = products.map((prod, index) => ({
        productId: prod.id,
        offerId: offerIds?.[prod.id] || prod.offers[0]?.id || null,
        position: index,
        badge: `Recomendação #${index + 1}`,
        score: prod.rating || 4.5,
        recommendation: "Modelo recomendado no guia",
      }));

      await ArticleProductService.attachProducts(workspaceId, createdArticle.id, attachItems);
    }

    return {
      article: createdArticle,
      canonicalDocument: canonicalDoc,
    };
  }
}
