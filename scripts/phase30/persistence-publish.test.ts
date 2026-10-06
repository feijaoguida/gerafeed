import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { prisma } from "../../src/lib/prisma";
import { Prisma } from "@prisma/client";
import { withTestWorkspace } from "./fixture";
import { ArticlePersistenceService } from "../../src/lib/affiliate/article-persistence-service";
import { CanonicalDocument, CanonicalDocumentService } from "../../src/lib/affiliate/canonical-document";
import { blockMarker } from "../../src/lib/affiliate/editor-document";
import { WordPressAffiliateRenderer } from "../../src/lib/publisher/wordpress-renderer";
import { PublicationSyncService } from "../../src/lib/publisher/publication-sync";
import { publishArticleToWordPress } from "../../src/lib/wordpress";
import { createWordPressSite } from "../../src/lib/wordpress-sites";

interface StatusError {
  status?: number;
  message?: string;
}

test("Task 253: Integrated persistence, authorization, entitlements and publication", async () => {
  await withTestWorkspace(async (wsA) => {
    // 1. Create a second workspace (wsB) to test tenant isolation
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
      const program = await prisma.affiliateProgram.findFirstOrThrow();

      // Products in Workspace A
      const prodA1 = await prisma.product.create({
        data: {
          workspaceId: wsA,
          name: "Mouse Sem Fio Silencioso",
          slug: `mouse-${randomUUID()}`,
          imageUrl: "https://example.com/mouse.jpg",
          offers: {
            create: [
              {
                workspaceId: wsA,
                affiliateProgramId: program.id,
                affiliateUrl: "https://shopee.com.br/mouse-cheap",
                price: 59.9,
                status: "ACTIVE",
              },
              {
                workspaceId: wsA,
                affiliateProgramId: program.id,
                affiliateUrl: "https://shopee.com.br/mouse-expensive",
                price: 99.9,
                status: "ACTIVE",
              },
            ],
          },
        },
        include: { offers: true },
      });

      const prodA2 = await prisma.product.create({
        data: {
          workspaceId: wsA,
          name: "Mousepad Ergonômico",
          slug: `pad-${randomUUID()}`,
          imageUrl: "https://example.com/pad.jpg",
          offers: {
            create: {
              workspaceId: wsA,
              affiliateProgramId: program.id,
              affiliateUrl: "https://shopee.com.br/pad-deal",
              price: 29.9,
              status: "ACTIVE",
            },
          },
        },
        include: { offers: true },
      });

      // Product in Workspace B (Foreign)
      const prodB = await prisma.product.create({
        data: {
          workspaceId: wsB,
          name: "Webcam 4K Foreign",
          slug: `webcam-${randomUUID()}`,
          offers: {
            create: {
              workspaceId: wsB,
              affiliateProgramId: program.id,
              affiliateUrl: "https://shopee.com.br/webcam",
              price: 299.0,
              status: "ACTIVE",
            },
          },
        },
        include: { offers: true },
      });

      // Article in Workspace A
      const articleA = await prisma.article.create({
        data: {
          workspaceId: wsA,
          title: "Guia de Periféricos de Escritório",
          summary: "Resumo do guia",
          content: "<p>Introdução ao setup de escritório.</p>",
          status: "PENDING",
          commercialType: "PRODUCT_REVIEW",
          articleProducts: {
            create: {
              productId: prodA1.id,
              position: 0,
            },
          },
        },
        include: { articleProducts: true },
      });

      // =========================================================================
      // Test Scenario 1: Tenant Isolation & Authentication Checks
      // =========================================================================
      // A. Missing workspaceId throws 401
      await assert.rejects(
        () => ArticlePersistenceService.validateAndSaveArticle("", articleA.id, { title: "Novo" }),
        (err: unknown) => (err as StatusError).status === 401
      );

      // B. Cross-tenant article access: wsB trying to update wsA's article throws 404
      await assert.rejects(
        () => ArticlePersistenceService.validateAndSaveArticle(wsB, articleA.id, { title: "Hacked" }),
        (err: unknown) => (err as StatusError).status === 404
      );

      // C. Cross-tenant product reference: saving article in wsA with prodB throws 404
      const foreignBlock = blockMarker({
        type: "PRODUCT_GROUP",
        data: {
          id: "block_foreign",
          layout: "IMAGE_CARD",
          products: [{ productId: prodB.id }],
        },
      });
      await assert.rejects(
        () =>
          ArticlePersistenceService.validateAndSaveArticle(wsA, articleA.id, {
            content: `<p>Intro</p>\n\n${foreignBlock}`,
          }),
        (err: unknown) =>
          (err as StatusError).status === 404 &&
          ((err as StatusError).message?.includes("outro workspace") ?? false)
      );

      // D. Cross-product / invalid offer reference: block referencing prodA1 with offer of prodA2 throws 409
      const mismatchedOfferBlock = blockMarker({
        type: "PRODUCT_GROUP",
        data: {
          id: "block_mismatch",
          layout: "BUTTON",
          products: [{ productId: prodA1.id, offerId: prodA2.offers[0].id }],
        },
      });
      await assert.rejects(
        () =>
          ArticlePersistenceService.validateAndSaveArticle(wsA, articleA.id, {
            content: `<p>Intro</p>\n\n${mismatchedOfferBlock}`,
          }),
        (err: unknown) =>
          (err as StatusError).status === 409 &&
          ((err as StatusError).message?.includes("não pertence ao produto") ?? false)
      );

      // =========================================================================
      // Test Scenario 2: Atomic Transaction & Idempotency
      // =========================================================================
      // Ensure failure leaves DB untouched (rollback)
      const afterFailed = await prisma.article.findUniqueOrThrow({
        where: { id: articleA.id },
        include: { articleProducts: true },
      });
      assert.equal(afterFailed.title, "Guia de Periféricos de Escritório");
      assert.equal(afterFailed.content, "<p>Introdução ao setup de escritório.</p>");
      assert.equal(afterFailed.articleProducts.length, 1);
      assert.equal(afterFailed.articleProducts[0].productId, prodA1.id);

      // Successful save with base product + recommendation
      const recBlock = blockMarker({
        type: "PRODUCT_GROUP",
        data: {
          id: "block_rec_pad",
          layout: "GRID",
          products: [{ productId: prodA2.id }],
          ctaText: "Aproveitar Desconto",
        },
      });
      const validContent = `<p>Introdução</p>\n\n${recBlock}\n\n<p>Conclusão</p>`;

      const saved1 = await ArticlePersistenceService.validateAndSaveArticle(wsA, articleA.id, {
        content: validContent,
      });

      assert.equal(saved1.articleProducts.length, 2);
      const linkedProductIds1 = saved1.articleProducts.map((p) => p.productId);
      assert(linkedProductIds1.includes(prodA1.id)); // Base product preserved
      assert(linkedProductIds1.includes(prodA2.id)); // Recommendation linked

      // Idempotency: Repeating the exact same save doesn't duplicate records or corrupt data
      const savedRepeat = await ArticlePersistenceService.validateAndSaveArticle(wsA, articleA.id, {
        content: validContent,
      });
      assert.equal(savedRepeat.articleProducts.length, 2);
      assert.deepEqual(
        savedRepeat.articleProducts.map((p) => p.productId).sort(),
        [prodA1.id, prodA2.id].sort()
      );

      // Verify no hardcoded affiliate URLs in persisted document
      const dbDoc = savedRepeat.canonicalContent as unknown as CanonicalDocument & { meta: { baseProductIds: string[] } };
      assert(!JSON.stringify(dbDoc).includes("affiliateUrl"));
      assert.deepEqual(dbDoc.meta.baseProductIds, [prodA1.id]);

      // =========================================================================
      // Test Scenario 3: Base Products vs. Manual Recommendations
      // =========================================================================
      // A. Remove manual recommendation block (prodA2) -> prodA2 is removed from ArticleProduct
      const contentWithoutRec = "<p>Introdução sem recomendação</p>\n\n<p>Conclusão</p>";
      const savedWithoutRec = await ArticlePersistenceService.validateAndSaveArticle(wsA, articleA.id, {
        content: contentWithoutRec,
      });
      assert.equal(savedWithoutRec.articleProducts.length, 1);
      assert.equal(savedWithoutRec.articleProducts[0].productId, prodA1.id);

      // B. Re-add prodA2 recommendation block, but omit prodA1 from body
      // ProdA1 is the base product, so it MUST remain linked in ArticleProduct even if omitted from body
      const contentOnlyRec = `<p>Apenas recomendação:</p>\n\n${recBlock}`;
      const savedOnlyRec = await ArticlePersistenceService.validateAndSaveArticle(wsA, articleA.id, {
        content: contentOnlyRec,
      });
      assert.equal(savedOnlyRec.articleProducts.length, 2);
      const linkedIds = savedOnlyRec.articleProducts.map((p) => p.productId);
      assert(linkedIds.includes(prodA1.id), "Base product must be preserved even if not in body blocks");
      assert(linkedIds.includes(prodA2.id), "Recommendation block product must be linked");

      // =========================================================================
      // Test Scenario 4: Offer Resolution & Inactive Offer Protection
      // =========================================================================
      // Deterministic selection: prodA1 has two offers (59.9 and 99.9). Lowest (59.9) is chosen implicitly.
      const testDoc = CanonicalDocumentService.createDocument([
        {
          type: "PRODUCT_GROUP",
          data: {
            id: "block_det",
            layout: "IMAGE_CARD",
            products: [{ productId: prodA1.id }],
          },
        },
      ]);
      const renderedHtml = await WordPressAffiliateRenderer.renderToHtml(wsA, testDoc);
      assert(renderedHtml.includes("https://shopee.com.br/mouse-cheap"));
      assert(!renderedHtml.includes("https://shopee.com.br/mouse-expensive"));
      // Single disclosure present
      const disclosureMatches = renderedHtml.match(/class="nc-affiliate-disclosure"/g);
      assert.equal(disclosureMatches?.length, 1);

      // Deactivate the offer and verify protection:
      // When an explicit offer is chosen and becomes INACTIVE, rendering MUST throw 409
      const explicitOfferId = prodA1.offers[0].id;
      const explicitDoc = CanonicalDocumentService.createDocument([
        {
          type: "PRODUCT_GROUP",
          data: {
            id: "block_explicit",
            layout: "BUTTON",
            products: [{ productId: prodA1.id, offerId: explicitOfferId }],
          },
        },
      ]);

      // Deactivate offer in DB
      await prisma.productOffer.update({
        where: { id: explicitOfferId },
        data: { status: "PAUSED" },
      });

      await assert.rejects(
        () => WordPressAffiliateRenderer.renderToHtml(wsA, explicitDoc),
        (err: unknown) =>
          (err as StatusError).status === 409 &&
          ((err as StatusError).message?.includes("sem a oferta ativa selecionada") ?? false)
      );

      // Restore offer status
      await prisma.productOffer.update({
        where: { id: explicitOfferId },
        data: { status: "ACTIVE" },
      });

      // =========================================================================
      // Test Scenario 5: Entitlements & Downgrade Behavior
      // =========================================================================
      // Create a downgraded workspace without AFFILIATE_MODULE
      const downgradedPlan = await prisma.plan.create({
        data: { name: `down-${randomUUID()}`, slug: `down-${randomUUID()}` },
      });
      const downgradedWsObj = await prisma.workspace.create({
        data: {
          name: `down-ws-${randomUUID()}`,
          slug: `down-ws-${randomUUID()}`,
          subscription: { create: { planId: downgradedPlan.id, status: "ACTIVE" } },
        },
      });
      const downWs = downgradedWsObj.id;

      try {
        const downCategory = await prisma.wordPressCategory.create({
          data: {
            workspaceId: downWs,
            name: "Geral",
            slug: `geral-${randomUUID()}`,
            wordpressId: 1,
          },
        });

        const downSite = await createWordPressSite({
          workspaceId: downWs,
          name: "Site Teste",
          url: "https://example.com/wp",
          username: "admin",
          applicationPassword: "app-password-test",
          active: true,
        });

        const downArticle = await prisma.article.create({
          data: {
            workspaceId: downWs,
            title: "Artigo no Plano Free",
            content: "<p>Conteúdo editorial normal</p>",
            categoryId: downCategory.id,
            wordpressSiteId: downSite.id,
            status: "PENDING",
          },
        });

        // A. Trying to save affiliate blocks in downgraded workspace throws 403
        await assert.rejects(
          () =>
            ArticlePersistenceService.validateAndSaveArticle(downWs, downArticle.id, {
              content: `<p>Tentativa</p>\n\n${recBlock}`,
            }),
          (err: unknown) =>
            (err as StatusError).status === 403 &&
            ((err as StatusError).message?.includes("não está habilitado") ?? false)
        );

        // B. Reading the article is allowed (data preserved)
        const readArticle = await prisma.article.findFirst({
          where: { id: downArticle.id, workspaceId: downWs },
        });
        assert(readArticle !== null);

        // C. Saving plain content without affiliate blocks is ALLOWED
        const savedClean = await ArticlePersistenceService.validateAndSaveArticle(downWs, downArticle.id, {
          title: "Artigo Free Atualizado",
          content: "<p>Conteúdo limpo sem blocos comerciais</p>",
        });
        assert.equal(savedClean.title, "Artigo Free Atualizado");

        // D. Publishing with affiliate blocks in downgraded workspace is BLOCKED (throws 403)
        // Manually place a canonical document with affiliate block to simulate pre-downgrade article
        await prisma.article.update({
          where: { id: downArticle.id },
          data: {
            canonicalContent: testDoc as unknown as Prisma.InputJsonValue,
          },
        });

        await assert.rejects(
          () =>
            publishArticleToWordPress(downArticle.id, downWs),
          (err: unknown) =>
            ((err as StatusError).message?.includes("não está habilitado") ?? false) ||
            (err as StatusError).status === 403
        );
      } finally {
        await prisma.article.deleteMany({ where: { workspaceId: downWs } });
        await prisma.workspace.delete({ where: { id: downWs } });
        await prisma.plan.delete({ where: { id: downgradedPlan.id } });
      }

      // =========================================================================
      // Test Scenario 6: Publication & Republishing Workflow
      // =========================================================================
      // Save articleA with active blocks
      await ArticlePersistenceService.validateAndSaveArticle(wsA, articleA.id, {
        content: validContent,
      });

      // Mock WordPress publication record
      await PublicationSyncService.recordPublication({
        articleId: articleA.id,
        workspaceId: wsA,
        renderedHtml: "<p>HTML Publicado</p>",
        wordpressPostId: 12345,
      });

      const publishedArticle = await prisma.article.findUniqueOrThrow({
        where: { id: articleA.id },
      });
      assert.equal(publishedArticle.status, "PUBLISHED");
      assert.equal(publishedArticle.needsRepublish, false);
      assert.equal(publishedArticle.wordpressPostId, 12345);

      // =========================================================================
      // Test Scenario 7: Preview Endpoint & Detach Cardinality Enforcement
      // =========================================================================
      const { POST: previewPost, GET: previewGet } = await import(
        "../../src/app/api/articles/[id]/preview/route"
      );

      // A. Detach Product Cardinality: Single product in review cannot be detached
      const { ArticleProductService } = await import(
        "../../src/lib/affiliate/article-product-service"
      );
      // Detaching recommendation prodA2 succeeds
      await ArticleProductService.detachProduct(wsA, articleA.id, prodA2.id);

      // Now article has only 1 product left; attempting to detach the sole product in review throws
      await assert.rejects(
        () => ArticleProductService.detachProduct(wsA, articleA.id, prodA1.id),
        (err: unknown) =>
          ((err as StatusError).message?.includes("Não é possível remover o único produto") ?? false)
      );

      // B. Preview route test:
      const prevTestWs = process.env.TEST_WORKSPACE_ID;
      process.env.TEST_WORKSPACE_ID = wsA;

      try {
        const previewReq = new Request(`http://localhost/api/articles/${articleA.id}/preview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: validContent,
          }),
        });

        const previewRes = await previewPost(previewReq, {
          params: Promise.resolve({ id: articleA.id }),
        });
        const previewJson = await previewRes.json();
        assert.equal(previewRes.status, 200);
        assert(previewJson.success);
        assert(previewJson.html.includes("class=\"nc-affiliate-disclosure\""));
        assert(previewJson.html.includes("class=\"nc-affiliate-link\""));

        // GET preview for saved article
        const getReq = new Request(`http://localhost/api/articles/${articleA.id}/preview`, {
          method: "GET",
        });
        const getRes = await previewGet(getReq, {
          params: Promise.resolve({ id: articleA.id }),
        });
        const getJson = await getRes.json();
        assert.equal(getRes.status, 200);
        assert(getJson.success);
      } finally {
        process.env.TEST_WORKSPACE_ID = prevTestWs;
      }

      // =========================================================================
      // Test Scenario 8: WordPress Republish Integration & Adapter Mock
      // =========================================================================
      // Create WP site for wsA
      const siteA = await createWordPressSite({
        workspaceId: wsA,
        name: "WP Site A",
        url: "https://example.com/wp",
        username: "admin",
        applicationPassword: "app-password-test",
        active: true,
      });

      await prisma.article.update({
        where: { id: articleA.id },
        data: { wordpressSiteId: siteA.id },
      });

      // Mock global fetch for WordPress API during republish
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
          const urlStr = String(input);
          if (urlStr.includes("/wp-json/wp/v2/posts/12345")) {
            return new Response(
              JSON.stringify({
                id: 12345,
                link: "https://example.com/wp/perifericos",
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }
          return originalFetch(input, init);
        };

        const republishRes = await PublicationSyncService.republishArticle(wsA, articleA.id);
        assert.equal(republishRes.success, true);
        assert.equal(republishRes.postId, 12345);

        const finalArticle = await prisma.article.findUniqueOrThrow({
          where: { id: articleA.id },
        });
        assert.equal(finalArticle.needsRepublish, false);
        assert.equal(typeof finalArticle.renderedContentHash, "string");
      } finally {
        globalThis.fetch = originalFetch;
      }
    } finally {
      // Cleanup wsB
      await prisma.productOffer.deleteMany({ where: { workspaceId: wsB } });
      await prisma.product.deleteMany({ where: { workspaceId: wsB } });
      await prisma.workspace.delete({ where: { id: wsB } });
      await prisma.plan.delete({ where: { id: planB.id } });
    }
  });
});

