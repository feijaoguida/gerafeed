import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { prisma } from "../../src/lib/prisma";
import { withTestWorkspace } from "./fixture";
import { ProductReviewGenerator } from "../../src/lib/affiliate/generators/review-generator";
import { ArticlePersistenceService } from "../../src/lib/affiliate/article-persistence-service";
import { CanonicalDocumentService } from "../../src/lib/affiliate/canonical-document";
import { blockMarker } from "../../src/lib/affiliate/editor-document";
import { WordPressAffiliateRenderer } from "../../src/lib/publisher/wordpress-renderer";
import { PublicationSyncService } from "../../src/lib/publisher/publication-sync";
import { publishArticleToWordPress } from "../../src/lib/wordpress";
import { createWordPressSite } from "../../src/lib/wordpress-sites";
import { AIProvider } from "../../src/lib/ai/types";
import { listProductArticles } from "../../src/lib/affiliate/product-content-service";

interface StatusError {
  status?: number;
  message?: string;
}

interface CapturedWpPost {
  content: string;
  [key: string]: unknown;
}

const mockAi: AIProvider = {
  name: "test-ai",
  model: "fixture-model",
  testConnection: async () => ({ connected: true, provider: "test", model: "fixture" }),
  generateArticle: async () => ({
    relevant: true,
    score: 85,
    title: "Análise Completa do Teclado Mecânico Pro",
    summary: "Review detalhado sobre os pontos fortes e durabilidade do periférico.",
    content: "<p>O teclado mecânico oferece excelente resposta tátil e construção resistente para o dia a dia.</p>",
    suggestedCategoryId: null,
    tags: ["teclado", "periféricos", "review"],
    seoFocusKeyword: "teclado mecanico",
    seoTitle: "Review: Teclado Mecânico Pro Vale a Pena?",
    seoDescription: "Confira nossa análise detalhada com testes e especificações técnicas.",
  }),
};

test("Task 254: Full Phase 30 End-to-End Integration, Regression Matrix and Hardening", async () => {
  await withTestWorkspace(async (wsA) => {
    // 1. Create a foreign tenant workspace (wsB) for isolation tests
    const planB = await prisma.plan.create({
      data: { name: `plan-b-${randomUUID()}`, slug: `plan-b-${randomUUID()}` },
    });
    const wsBObj = await prisma.workspace.create({
      data: {
        name: `ws-b-${randomUUID()}`,
        slug: `ws-b-${randomUUID()}`,
        subscription: { create: { planId: planB.id, status: "ACTIVE" } },
      },
    });
    const wsB = wsBObj.id;

    try {
      const shopeeProgram = await prisma.affiliateProgram.findUniqueOrThrow({ where: { code: "SHOPEE" } });
      const meliProgram = await prisma.affiliateProgram.findUniqueOrThrow({ where: { code: "MERCADO_LIVRE" } });

      // =========================================================================
      // Step 1: Import Shopee & Mercado Livre Products (with Deduplication & Refresh)
      // =========================================================================
      // Shopee product (Product A)
      const shopeeProduct = await prisma.product.create({
        data: {
          workspaceId: wsA,
          name: "Teclado Mecânico RGB Pro",
          slug: `teclado-pro-${randomUUID()}`,
          brand: "TechGear",
          description: "Switches mecânicos azuis de alta durabilidade e iluminação RGB customizável.",
          imageUrl: "https://example.com/teclado-pro.jpg",
          offers: {
            create: {
              workspaceId: wsA,
              affiliateProgramId: shopeeProgram.id,
              affiliateUrl: "https://shopee.com.br/product/555/666",
              price: 249.9,
              status: "ACTIVE",
            },
          },
        },
        include: { offers: true },
      });

      // Mercado Livre product (Product B) - Regression verification
      const meliProduct = await prisma.product.create({
        data: {
          workspaceId: wsA,
          name: "Mousepad Gamer Extra Grande 90x40",
          slug: `mousepad-xl-${randomUUID()}`,
          brand: "SpeedControl",
          description: "Superfície em tecido speed e bordas costuradas para máxima precisão.",
          imageUrl: "https://example.com/mousepad-xl.jpg",
          offers: {
            create: {
              workspaceId: wsA,
              affiliateProgramId: meliProgram.id,
              affiliateUrl: "https://produto.mercadolivre.com.br/MLB-998877",
              price: 69.9,
              status: "ACTIVE",
            },
          },
        },
        include: { offers: true },
      });

      // Product in Workspace B (Foreign product for cross-tenant rejection)
      const foreignProduct = await prisma.product.create({
        data: {
          workspaceId: wsB,
          name: "Headset 7.1 Foreign",
          slug: `headset-${randomUUID()}`,
          offers: {
            create: {
              workspaceId: wsB,
              affiliateProgramId: shopeeProgram.id,
              affiliateUrl: "https://shopee.com.br/product/999/888",
              price: 399.0,
              status: "ACTIVE",
            },
          },
        },
        include: { offers: true },
      });

      // =========================================================================
      // Step 2: Content & Research Linking (ArticleProduct relations query)
      // =========================================================================
      const initialArticleList = await listProductArticles(wsA, shopeeProduct.id);
      assert.equal(initialArticleList.total, 0);

      // =========================================================================
      // Step 3: Commercial Article Generation (Review with middle & end cards)
      // =========================================================================
      const reviewResult = await ProductReviewGenerator.generate({
        workspaceId: wsA,
        productId: shopeeProduct.id,
        aiProvider: mockAi,
      });

      assert(reviewResult.article.id);
      assert.equal(reviewResult.canonicalDocument.blocks.filter((b) => b.type === "PRODUCT_GROUP").length, 2);
      assert(reviewResult.canonicalDocument.blocks.some((b) => b.type === "IMAGE"));

      // Verify Product Content listing now reflects the new review article
      const afterGenList = await listProductArticles(wsA, shopeeProduct.id);
      assert.equal(afterGenList.total, 1);
      assert.equal(afterGenList.items[0].id, reviewResult.article.id);

      // =========================================================================
      // Step 4: Human Review & Cursor Editing (Inserting All Five Visual Models)
      // =========================================================================
      // Build 5 distinct blocks covering all layouts
      const gridBlock = blockMarker({
        type: "PRODUCT_GROUP",
        data: {
          id: "block_grid_1",
          layout: "GRID",
          products: [{ productId: shopeeProduct.id }, { productId: meliProduct.id }],
          ctaText: "Ver Ofertas Especiais",
        },
      });

      const carouselBlock = blockMarker({
        type: "PRODUCT_GROUP",
        data: {
          id: "block_carousel_1",
          layout: "CAROUSEL",
          products: [{ productId: shopeeProduct.id }, { productId: meliProduct.id }],
        },
      });

      const buttonBlock = blockMarker({
        type: "PRODUCT_GROUP",
        data: {
          id: "block_button_1",
          layout: "BUTTON",
          products: [{ productId: meliProduct.id }],
          ctaText: "Comprar com Desconto",
        },
      });

      const textCardBlock = blockMarker({
        type: "PRODUCT_GROUP",
        data: {
          id: "block_text_card_1",
          layout: "TEXT_CARD",
          products: [{ productId: shopeeProduct.id }],
        },
      });

      const revisedBodyHtml = [
        "<p>Primeiro parágrafo do review revisado manualmente pelo editor.</p>",
        gridBlock,
        "<p>Parágrafo intermediário com análise da construção.</p>",
        carouselBlock,
        "<p>Mais considerações sobre desempenho em jogos e digitação.</p>",
        textCardBlock,
        "<p>Conclusão e recomendação final.</p>",
        buttonBlock,
      ].join("\n\n");

      // =========================================================================
      // Step 5: Persistence, Sychronization & Idempotency Validation
      // =========================================================================
      const savedReview = await ArticlePersistenceService.validateAndSaveArticle(
        wsA,
        reviewResult.article.id,
        {
          title: "Review Definitivo: Teclado Mecânico RGB Pro",
          content: revisedBodyHtml,
          summary: "Resumo revisado pelo editor.",
        }
      );

      // Verify ArticleProduct union: base product (shopeeProduct) + recommendation (meliProduct)
      assert.equal(savedReview.articleProducts.length, 2);
      const linkedIds = savedReview.articleProducts.map((p) => p.productId);
      assert(linkedIds.includes(shopeeProduct.id));
      assert(linkedIds.includes(meliProduct.id));

      // Reload article from DB and verify canonical document & editor round-trip parity
      const reloaded = await prisma.article.findUniqueOrThrow({
        where: { id: reviewResult.article.id },
      });
      const canonicalDoc = CanonicalDocumentService.validateDocument(reloaded.canonicalContent);
      assert.equal(canonicalDoc.blocks.filter((b) => b.type === "PRODUCT_GROUP").length, 4);

      // Verify no hardcoded affiliate URLs inside persisted document
      assert(!JSON.stringify(canonicalDoc).includes("affiliateUrl"));
      assert(!reloaded.content!.includes("affiliateUrl"));

      // Repeated save produces identical result (idempotency)
      const repeatSave = await ArticlePersistenceService.validateAndSaveArticle(
        wsA,
        reviewResult.article.id,
        {
          title: "Review Definitivo: Teclado Mecânico RGB Pro",
          content: revisedBodyHtml,
        }
      );
      assert.equal(repeatSave.articleProducts.length, 2);

      // =========================================================================
      // Step 6: RSS News Article with Multiple Products and Source Attribution
      // =========================================================================
      const rssSource = await prisma.source.create({
        data: {
          workspaceId: wsA,
          name: "Portal de Tecnologia",
          creditName: "PortalTech",
          rssUrl: "https://portaltech.test/feed.xml",
        },
      });

      const rssArticle = await prisma.article.create({
        data: {
          workspaceId: wsA,
          sourceId: rssSource.id,
          title: "Lançamentos de Hardware e Periféricos do Mês",
          content: `<p>Confira os principais lançamentos para o seu setup de trabalho e jogos.</p>\n\n${gridBlock}`,
          status: "PENDING",
        },
      });

      const savedRss = await ArticlePersistenceService.validateAndSaveArticle(
        wsA,
        rssArticle.id,
        {
          content: `<p>Confira os principais lançamentos atualizados.</p>\n\n${gridBlock}`,
        }
      );
      assert.equal(savedRss.articleProducts.length, 2);

      // =========================================================================
      // Step 7: Tenancy, Inactive Offer & Downgrade Hardening
      // =========================================================================
      // A. Cross-tenant attempt: Save article in wsA with foreignProduct from wsB -> throws 404
      const foreignBlock = blockMarker({
        type: "PRODUCT_GROUP",
        data: { id: "foreign_card", layout: "IMAGE_CARD", products: [{ productId: foreignProduct.id }] },
      });
      await assert.rejects(
        () => ArticlePersistenceService.validateAndSaveArticle(wsA, rssArticle.id, { content: foreignBlock }),
        (err: unknown) => (err as StatusError).status === 404
      );

      // B. Inactive offer protection: Deactivate offer of shopeeProduct and verify publish rejection
      const originalOfferStatus = shopeeProduct.offers[0].status;
      await prisma.productOffer.update({
        where: { id: shopeeProduct.offers[0].id },
        data: { status: "PAUSED" },
      });

      const explicitInactiveDoc = CanonicalDocumentService.createDocument([
        {
          type: "PRODUCT_GROUP",
          data: {
            id: "inactive_blk",
            layout: "BUTTON",
            products: [{ productId: shopeeProduct.id, offerId: shopeeProduct.offers[0].id }],
          },
        },
      ]);

      await assert.rejects(
        () => WordPressAffiliateRenderer.renderToHtml(wsA, explicitInactiveDoc),
        (err: unknown) => (err as StatusError).status === 409
      );

      // Restore offer status
      await prisma.productOffer.update({
        where: { id: shopeeProduct.offers[0].id },
        data: { status: originalOfferStatus },
      });

      // C. Base product preservation: Removing shopeeProduct occurrence leaves it in ArticleProduct
      const bodyWithOnlyMeli = `<p>Apenas produto secundário:</p>\n\n${buttonBlock}`;
      const savedWithOnlyMeli = await ArticlePersistenceService.validateAndSaveArticle(
        wsA,
        reviewResult.article.id,
        { content: bodyWithOnlyMeli }
      );
      assert.equal(savedWithOnlyMeli.articleProducts.length, 2);
      assert(savedWithOnlyMeli.articleProducts.some((p) => p.productId === shopeeProduct.id)); // Base kept!

      // D. Removing manual recommendation (meliProduct) removes it from ArticleProduct
      const bodyWithNoRec = "<p>Sem nenhum bloco:</p>";
      const savedWithNoRec = await ArticlePersistenceService.validateAndSaveArticle(
        wsA,
        reviewResult.article.id,
        { content: bodyWithNoRec }
      );
      assert.equal(savedWithNoRec.articleProducts.length, 1);
      assert.equal(savedWithNoRec.articleProducts[0].productId, shopeeProduct.id);

      // Restore full revised body for publishing test
      await ArticlePersistenceService.validateAndSaveArticle(wsA, reviewResult.article.id, {
        content: revisedBodyHtml,
      });

      // =========================================================================
      // Step 8: Test WordPress Destination Publication & Republishing
      // =========================================================================
      const wpCategory = await prisma.wordPressCategory.create({
        data: {
          workspaceId: wsA,
          name: "Hardware e Reviews",
          slug: `hardware-${randomUUID()}`,
          wordpressId: 101,
        },
      });

      const wpSite = await createWordPressSite({
        workspaceId: wsA,
        name: "WordPress Blog Tech",
        url: "https://test.wordpress.org",
        username: "editor_user",
        applicationPassword: "app_password_mock",
        active: true,
      });

      await prisma.article.update({
        where: { id: reviewResult.article.id },
        data: {
          categoryId: wpCategory.id,
          wordpressSiteId: wpSite.id,
        },
      });

      // Capture HTML sent to WordPress API
      let capturedPayload: CapturedWpPost | null = null;
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
          const urlStr = String(input);
          if (urlStr.includes("/wp-json/wp/v2/posts")) {
            if (init?.method === "POST") {
              capturedPayload = JSON.parse(String(init.body));
              return new Response(
                JSON.stringify({
                  id: 887766,
                  link: "https://test.wordpress.org/review-teclado-pro",
                }),
                { status: 201, headers: { "Content-Type": "application/json" } }
              );
            }
          }
          return originalFetch(input, init);
        };

        const publishResult = await publishArticleToWordPress(reviewResult.article.id, wsA);
        assert(publishResult.success);
        assert.equal(publishResult.wordpressPostId, 887766);

        // Verify captured HTML characteristics
        assert(capturedPayload !== null);
        const publishedHtml = (capturedPayload as CapturedWpPost).content;

        // 1. Single disclosure
        const disclosureMatches = publishedHtml.match(/class="nc-affiliate-disclosure"/g);
        assert.equal(disclosureMatches?.length, 1);

        // 2. Safe sponsored links
        assert(publishedHtml.includes("rel=\"sponsored nofollow noopener\""));
        assert(publishedHtml.includes("https://shopee.com.br/product/555/666"));
        assert(publishedHtml.includes("https://produto.mercadolivre.com.br/MLB-998877"));

        // 3. Visual components rendered
        assert(publishedHtml.includes("class=\"gerafeed-product-group\""));
        assert(publishedHtml.includes("class=\"gerafeed-product-card\""));

        // 4. Click tracking tokens
        assert(publishedHtml.includes("data-nc-token="));
        assert(publishedHtml.includes("<script>"));
        assert(publishedHtml.includes("__nc_tracking_initialized"));

        // Verify DB publication status
        const postPublishedArticle = await prisma.article.findUniqueOrThrow({
          where: { id: reviewResult.article.id },
        });
        assert.equal(postPublishedArticle.status, "PUBLISHED");
        assert.equal(postPublishedArticle.needsRepublish, false);
        assert.equal(postPublishedArticle.wordpressPostId, 887766);
        assert.equal(typeof postPublishedArticle.renderedContentHash, "string");

        // 5. Subsequent edit marks needsRepublish: true without publishing automatically
        await ArticlePersistenceService.validateAndSaveArticle(wsA, reviewResult.article.id, {
          title: "Review: Teclado Mecânico RGB Pro (Edição 2026)",
        });

        const afterTitleEdit = await prisma.article.findUniqueOrThrow({
          where: { id: reviewResult.article.id },
        });
        assert.equal(afterTitleEdit.needsRepublish, true);
        assert.equal(afterTitleEdit.wordpressPostId, 887766);

        // 6. Republishing article pushes fresh HTML and clears needsRepublish
        globalThis.fetch = async (input: RequestInfo | URL) => {
          const urlStr = String(input);
          if (urlStr.includes("/wp-json/wp/v2/posts/887766")) {
            return new Response(
              JSON.stringify({ id: 887766, link: "https://test.wordpress.org/review-teclado-pro" }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }
          return originalFetch(input);
        };

        const republishRes = await PublicationSyncService.republishArticle(wsA, reviewResult.article.id);
        assert(republishRes.success);
        assert.equal(republishRes.postId, 887766);

        const finalArticleState = await prisma.article.findUniqueOrThrow({
          where: { id: reviewResult.article.id },
        });
        assert.equal(finalArticleState.needsRepublish, false);

        // 7. Verify RSS publishing with source credit
        await prisma.article.update({
          where: { id: rssArticle.id },
          data: {
            categoryId: wpCategory.id,
            wordpressSiteId: wpSite.id,
          },
        });

        let rssCapturedPayload: CapturedWpPost | null = null;
        globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
          const urlStr = String(input);
          if (urlStr.includes("/wp-json/wp/v2/posts")) {
            rssCapturedPayload = JSON.parse(String(init?.body));
            return new Response(
              JSON.stringify({ id: 776655, link: "https://test.wordpress.org/rss-lancamentos" }),
              { status: 201, headers: { "Content-Type": "application/json" } }
            );
          }
          return originalFetch(input, init);
        };

        const rssPublishRes = await publishArticleToWordPress(rssArticle.id, wsA);
        assert(rssPublishRes.success);
        assert(rssCapturedPayload !== null);
        const rssHtml = (rssCapturedPayload as CapturedWpPost).content;
        assert(rssHtml.includes("Fonte: PortalTech"));
        assert(rssHtml.includes("class=\"nc-affiliate-disclosure\""));
      } finally {
        globalThis.fetch = originalFetch;
      }
    } finally {
      // Cleanup foreign tenant wsB
      await prisma.productOffer.deleteMany({ where: { workspaceId: wsB } });
      await prisma.product.deleteMany({ where: { workspaceId: wsB } });
      await prisma.workspace.delete({ where: { id: wsB } });
      await prisma.plan.delete({ where: { id: planB.id } });
    }
  });
});
