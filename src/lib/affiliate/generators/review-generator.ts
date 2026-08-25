import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import { getActiveAIProvider } from "@/lib/ai";
import { AffiliatePromptTemplateService } from "@/lib/affiliate/prompt-template-service";
import { ArticleProductService } from "@/lib/affiliate/article-product-service";
import {
  CanonicalDocumentService,
  CanonicalDocument,
  CanonicalBlock,
} from "@/lib/affiliate/canonical-document";

import { AIProvider } from "@/lib/ai/types";

export interface GenerateReviewInput {
  workspaceId: string;
  productId: string;
  offerId?: string;
  focusKeyword?: string;
  customInstructions?: string;
  aiProvider?: AIProvider;
  wordpressSiteId?: string;
  categoryId?: string;
}

export interface GenerateReviewResult {
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

export class ProductReviewGenerator {
  /**
   * Generates a complete commercial product review article using AI,
   * building both HTML content and a structured Canonical Content Document.
   */
  static async generate(input: GenerateReviewInput): Promise<GenerateReviewResult> {
    const { workspaceId, productId, offerId, focusKeyword, customInstructions } = input;

    // 1. Assert Plan Entitlement
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    // 2. Fetch Product with Tenancy check, including reviews and reference sources
    const product = await prisma.product.findFirst({
      where: { id: productId, workspaceId },
      include: {
        category: true,
        offers: {
          where: { status: "ACTIVE" },
          orderBy: { price: "asc" },
        },
        reviewSamples: {
          take: 5,
        },
        referenceSources: {
          where: { status: "READY" },
          take: 5,
        },
      },
    });

    if (!product) {
      throw new Error("Produto não encontrado no catálogo do workspace.");
    }

    // Resolve selected offer or lowest price active offer
    const selectedOffer = offerId
      ? product.offers.find((o) => o.id === offerId) || product.offers[0]
      : product.offers[0];

    // 3. Format Factual Product Context (Guardrails against hallucination)
    const formattedPrice = selectedOffer?.price
      ? `${selectedOffer.currency || "R$"} ${selectedOffer.price.toFixed(2)}`
      : "Preço sob consulta";

    let formattedSpecs = "Nenhuma especificação técnica cadastrada.";
    if (product.specs && typeof product.specs === "object") {
      formattedSpecs = Object.entries(product.specs)
        .map(([k, v]) => `- ${k}: ${String(v)}`)
        .join("\n");
    }

    const formattedPros = product.pros.length > 0
      ? product.pros.map((p) => `- ${p}`).join("\n")
      : "Nenhum ponto forte destacado.";

    const formattedCons = product.cons.length > 0
      ? product.cons.map((c) => `- ${c}`).join("\n")
      : "Nenhum ponto fraco destacado.";

    const formattedReviews = product.reviewSamples.length > 0
      ? product.reviewSamples.map((r) => `- [Nota: ${r.rating || "N/A"}] "${r.text}"`).join("\n")
      : "Nenhuma avaliação qualitativa cadastrada.";

    const formattedReferences = product.referenceSources.length > 0
      ? product.referenceSources.map((s) => `- ${s.title || "Referência Externa"}: ${s.summary || s.url}`).join("\n")
      : "Nenhum resumo externo cadastrado.";

    const promptContext: Record<string, unknown> = {
      product: {
        name: product.name,
        brand: product.brand || "Marca não especificada",
        description: product.description || "",
        price: formattedPrice,
        specs: formattedSpecs,
        pros: formattedPros,
        cons: formattedCons,
        rating: product.rating !== null ? `${product.rating}` : "4.5",
        seller: selectedOffer?.seller || "Loja Oficial",
        reviews: formattedReviews,
        referenceSources: formattedReferences,
      },
      category: {
        name: product.category?.name || "Geral",
      },
      customInstructions: [
        focusKeyword ? `Palavra-chave principal de SEO: "${focusKeyword.trim()}".` : "",
        customInstructions?.trim() || "",
      ]
        .filter(Boolean)
        .join("\n"),
    };

    // 4. Retrieve Effective Prompt Template & Render
    const template = await AffiliatePromptTemplateService.getEffectiveTemplate(
      workspaceId,
      "PRODUCT_REVIEW"
    );

    const renderedUserPrompt = AffiliatePromptTemplateService.renderPrompt(
      template.userPromptTemplate,
      promptContext
    );

    // 5. Call AI Provider
    const provider = input.aiProvider || (await getActiveAIProvider(undefined, workspaceId));
    const aiResponse = await provider.generateArticle({
      originalTitle: `Review: ${product.name}`,
      originalDescription: renderedUserPrompt,
      categories: [],
    });

    const productImages = (product as { images?: string[]; imageUrl?: string | null }).images;
    const galleryImgs = Array.isArray(productImages) && productImages.length > 0 ? productImages : product.imageUrl ? [product.imageUrl] : [];

    // 6. Assemble Canonical Blocks
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
          text: aiResponse.title || `Review Completo: ${product.name}`,
          id: "review-intro",
        },
      },
      {
        type: "PRODUCT_CARD",
        data: {
          productId: product.id,
          offerId: selectedOffer?.id || null,
          highlightBadge: "Análise do Especialista",
          showSpecs: true,
          showProsCons: true,
          ctaText: "Ver Menor Preço e Disponibilidade",
        },
      },
    ];

    if (galleryImgs.length > 1) {
      canonicalBlocks.push({
        type: "IMAGE",
        data: {
          url: galleryImgs[1],
          alt: `Galeria: ${product.name}`,
          caption: `Detalhe e acabamento do ${product.name}`,
        },
      });
    }

    canonicalBlocks.push(
      {
        type: "RICH_TEXT",
        data: {
          html: aiResponse.content || `<p>Confira a análise aprofundada do ${product.name}.</p>`,
        },
      },
      {
        type: "PROS_CONS",
        data: {
          productId: product.id,
          pros: product.pros.length > 0 ? product.pros : ["Excelente acabamento", "Ótimo custo-benefício"],
          cons: product.cons.length > 0 ? product.cons : ["Disponibilidade pode variar"],
        },
      }
    );

    if (galleryImgs.length > 2) {
      canonicalBlocks.push({
        type: "IMAGE",
        data: {
          url: galleryImgs[2],
          alt: `Visão geral: ${product.name}`,
          caption: `Imagem do produto ${product.name}`,
        },
      });
    }

    canonicalBlocks.push({
      type: "CTA",
      data: {
        productId: product.id,
        offerId: selectedOffer?.id || null,
        text: "Conferir Oferta com Desconto",
        subtext: "Estoque e preço sujeitos a alteração sem aviso prévio",
        buttonStyle: "deal",
      },
    });

    const canonicalDoc = CanonicalDocumentService.createDocument(canonicalBlocks, {
      wordCount: (aiResponse.content || "").split(/\s+/).length,
      readingTimeMinutes: Math.max(1, Math.ceil(((aiResponse.content || "").split(/\s+/).length) / 200)),
    });

    // 7. Persist Article and Canonical Document
    const mainImg = galleryImgs[0] || null;

    const createdArticle = await prisma.article.create({
      data: {
        workspaceId,
        title: aiResponse.title || `Review: ${product.name}`,
        summary: aiResponse.summary || `Análise completa e veredito sobre ${product.name}.`,
        content: aiResponse.content || `<p>Review de ${product.name}</p>`,
        commercialType: "PRODUCT_REVIEW",
        originalImageUrl: mainImg,
        modifiedImageUrl: mainImg,
        canonicalContent: canonicalDoc as object,
        seoFocusKeyword: aiResponse.seoFocusKeyword || focusKeyword?.trim() || product.name,
        seoTitle: aiResponse.seoTitle || aiResponse.title || `Review: ${product.name}`,
        seoDescription: aiResponse.seoDescription || aiResponse.summary,
        tags: aiResponse.tags && aiResponse.tags.length > 0 ? aiResponse.tags : [product.brand || "Produto", "Review"],
        status: "PENDING",
        wordpressSiteId: input.wordpressSiteId || null,
        categoryId: input.categoryId || null,
        suggestedCategoryId: input.categoryId || null,
        promptTemplateId: template.id || null,
        promptTemplateVersion: template.version,
      },
    });

    // 8. Attach Product Relation (enforces exactly 1 product for Review)
    await ArticleProductService.attachProducts(workspaceId, createdArticle.id, [
      {
        productId: product.id,
        offerId: selectedOffer?.id || null,
        position: 0,
        badge: "Escolha do Editor",
        score: product.rating || 4.5,
        recommendation: "Recomendado",
      },
    ]);

    return {
      article: createdArticle,
      canonicalDocument: canonicalDoc,
    };
  }
}
