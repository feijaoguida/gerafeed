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

export interface GenerateComparisonInput {
  workspaceId: string;
  productIds: string[];
  offerIds?: Record<string, string>;
  focusKeyword?: string;
  customInstructions?: string;
  aiProvider?: AIProvider;
  wordpressSiteId?: string;
  categoryId?: string;
}

export interface GenerateComparisonResult {
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

export class ProductComparisonGenerator {
  /**
   * Generates a comparative commercial article comparing 2 or more products with AI,
   * building structured canonical comparison blocks and SEO metadata.
   */
  static async generate(input: GenerateComparisonInput): Promise<GenerateComparisonResult> {
    const { workspaceId, productIds, offerIds, focusKeyword, customInstructions, aiProvider } = input;

    // 1. Validate Minimum Cardinality (>= 2 products)
    if (!Array.isArray(productIds) || productIds.length < 2) {
      throw new Error("Um artigo comparativo exige a seleção de no mínimo 2 produtos.");
    }

    // 2. Assert Plan Entitlement
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    // 3. Fetch Products with Tenancy check
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

    // 4. Format Products Context for Comparison
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
- Preço: ${formattedPrice} (${selectedOffer?.seller || "Loja Oficial"})
- Especificações: ${formattedSpecs}
- Pontos Fortes: ${product.pros.join(", ") || "Nenhum informado"}
- Pontos Fracos: ${product.cons.join(", ") || "Nenhum informado"}
- Avaliação: ${product.rating !== null ? product.rating : "4.5"}`;
    }).join("\n\n");

    const promptContext: Record<string, unknown> = {
      productsList: productsContextList,
      productsCount: String(products.length),
      customInstructions: [
        focusKeyword ? `Palavra-chave principal de SEO: "${focusKeyword.trim()}".` : "",
        customInstructions?.trim() || "",
      ]
        .filter(Boolean)
        .join("\n"),
    };

    // 5. Retrieve Effective Prompt Template & Render
    const template = await AffiliatePromptTemplateService.getEffectiveTemplate(
      workspaceId,
      "COMPARISON"
    );

    const renderedUserPrompt = AffiliatePromptTemplateService.renderPrompt(
      template.userPromptTemplate,
      promptContext
    );

    // 6. Call AI Provider
    const provider = aiProvider || (await getActiveAIProvider(undefined, workspaceId));
    const aiResponse = await provider.generateArticle({
      originalTitle: `Comparativo: ${products.map((p) => p.name).join(" vs ")}`,
      originalDescription: renderedUserPrompt,
      categories: [],
    });

    // 7. Assemble Canonical Blocks
    const canonicalBlocks: CanonicalBlock[] = [
      {
        type: "AFFILIATE_DISCLOSURE",
        data: {
          text: "Transparência: Podemos receber uma comissão de afiliado sem custo adicional para você ao comprar através de nossos links.",
          position: "top",
        },
      },
      {
        type: "HEADING",
        data: {
          level: 2,
          text: aiResponse.title || `Comparativo: ${products.map((p) => p.name).join(" vs ")}`,
          id: "comparison-intro",
        },
      },
      {
        type: "RICH_TEXT",
        data: {
          html: aiResponse.content || `<p>Confira a comparação detalhada entre os modelos selecionados.</p>`,
        },
      },
      {
        type: "PRODUCT_COMPARISON",
        data: {
          productIds: products.map((p) => p.id),
          highlightBestId: products[0].id,
          criteria: ["Preço", "Desempenho", "Custo-Benefício", "Construção"],
          showPriceRow: true,
        },
      },
    ];

    // Add individual product cards and pros/cons
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
          highlightBadge: i === 0 ? "Melhor Escolha" : i === 1 ? "Melhor Custo-Benefício" : null,
          showSpecs: true,
          showProsCons: true,
          ctaText: `Ver Menor Preço de ${prod.name}`,
        },
      });

      if (prod.pros.length > 0 || prod.cons.length > 0) {
        canonicalBlocks.push({
          type: "PROS_CONS",
          data: {
            productId: prod.id,
            pros: prod.pros.length > 0 ? prod.pros : ["Bom desempenho"],
            cons: prod.cons.length > 0 ? prod.cons : ["Preço variável"],
          },
        });
      }
    }

    // Add final CTA block
    canonicalBlocks.push({
      type: "CTA",
      data: {
        productId: products[0].id,
        offerId: offerIds?.[products[0].id] || products[0].offers[0]?.id || null,
        text: `Comprar ${products[0].name} com o Melhor Preço`,
        subtext: "Estoque e ofertas sujeitos a alterações",
        buttonStyle: "deal",
      },
    });

    const canonicalDoc = CanonicalDocumentService.createDocument(canonicalBlocks, {
      wordCount: (aiResponse.content || "").split(/\s+/).length,
      readingTimeMinutes: Math.max(1, Math.ceil(((aiResponse.content || "").split(/\s+/).length) / 200)),
    });

    // 8. Persist Article in DB
    const createdArticle = await prisma.article.create({
      data: {
        workspaceId,
        title: aiResponse.title || `Comparativo: ${products.map((p) => p.name).join(" vs ")}`,
        summary: aiResponse.summary || `Comparativo aprofundado entre ${products.map((p) => p.name).join(" e ")}.`,
        content: aiResponse.content || `<p>Comparativo entre ${products.map((p) => p.name).join(" e ")}.</p>`,
        commercialType: "COMPARISON",
        canonicalContent: canonicalDoc as object,
        seoFocusKeyword: aiResponse.seoFocusKeyword || focusKeyword?.trim() || `${products[0].name} vs ${products[1]?.name || ""}`,
        seoTitle: aiResponse.seoTitle || aiResponse.title || `Comparativo: ${products.map((p) => p.name).join(" vs ")}`,
        seoDescription: aiResponse.seoDescription || aiResponse.summary,
        tags: aiResponse.tags && aiResponse.tags.length > 0
          ? aiResponse.tags
          : ["Comparativo", ...products.map((p) => p.brand || p.name).slice(0, 4)],
        status: "PENDING",
        wordpressSiteId: input.wordpressSiteId || null,
        categoryId: input.categoryId || null,
        suggestedCategoryId: input.categoryId || null,
        promptTemplateId: template.id || null,
        promptTemplateVersion: template.version,
      },
    });

    // 9. Attach Product Relations with ordering and badges
    const attachItems = products.map((prod, index) => ({
      productId: prod.id,
      offerId: offerIds?.[prod.id] || prod.offers[0]?.id || null,
      position: index,
      badge: index === 0 ? "Melhor Escolha" : index === 1 ? "Melhor Custo-Benefício" : null,
      score: prod.rating || 4.5,
      recommendation: index === 0 ? "Vencedor do comparativo" : "Excelente alternativa",
    }));

    await ArticleProductService.attachProducts(workspaceId, createdArticle.id, attachItems);

    return {
      article: createdArticle,
      canonicalDocument: canonicalDoc,
    };
  }
}
