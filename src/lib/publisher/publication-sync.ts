import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { CanonicalDocument } from "@/lib/affiliate/canonical-document";
import { WordPressAffiliateRenderer } from "./wordpress-renderer";
import { PublisherFactory } from "./factory";

export class PublicationSyncService {
  /**
   * Generates a deterministic SHA-256 hash of HTML content.
   */
  static computeContentHash(content: string): string {
    return crypto.createHash("sha256").update(content || "").digest("hex");
  }

  /**
   * Records that an article has been published or updated to external destination.
   */
  static async recordPublication(params: {
    articleId: string;
    workspaceId: string;
    renderedHtml: string;
    wordpressPostId?: number | null;
    wordpressSiteId?: string | null;
  }) {
    const hash = this.computeContentHash(params.renderedHtml);

    return prisma.article.update({
      where: { id: params.articleId },
      data: {
        status: "PUBLISHED",
        renderedContentHash: hash,
        needsRepublish: false,
        lastPublishedAt: new Date(),
        wordpressPostId: params.wordpressPostId !== undefined ? params.wordpressPostId : undefined,
        wordpressSiteId: params.wordpressSiteId !== undefined ? params.wordpressSiteId : undefined,
      },
    });
  }

  /**
   * Checks if an article's current rendered content diverges from the last published hash.
   */
  static async checkArticleOutdated(articleId: string, workspaceId: string): Promise<boolean> {
    const article = await prisma.article.findFirst({
      where: { id: articleId, workspaceId },
      select: {
        status: true,
        canonicalContent: true,
        renderedContentHash: true,
        needsRepublish: true,
      },
    });

    if (!article || article.status !== "PUBLISHED" || !article.canonicalContent) {
      return false;
    }

    if (article.needsRepublish) {
      return true;
    }

    const currentHtml = await WordPressAffiliateRenderer.renderToHtml(
      workspaceId,
      article.canonicalContent as unknown as CanonicalDocument
    );
    const currentHash = this.computeContentHash(currentHtml);

    return currentHash !== article.renderedContentHash;
  }

  /**
   * Identifies all published articles that depend on a product and marks them as needing republishing.
   * Triggered when a product's offer price, stock or URL changes.
   */
  static async markDependentArticlesForRepublish(
    workspaceId: string,
    productId: string
  ): Promise<number> {
    // 1. Find articles linked via ArticleProduct relation
    const linkedRelations = await prisma.articleProduct.findMany({
      where: {
        productId,
        article: {
          workspaceId,
          status: "PUBLISHED",
        },
      },
      select: { articleId: true },
    });

    const articleIds = new Set<string>(linkedRelations.map((r: { articleId: string }) => r.articleId));

    // 2. Also find published articles with canonicalContent referencing the productId
    const candidateArticles = await prisma.article.findMany({
      where: {
        workspaceId,
        status: "PUBLISHED",
        canonicalContent: { not: null as unknown as undefined },
      },
      select: { id: true, canonicalContent: true },
    });

    for (const art of candidateArticles) {
      if (art.canonicalContent) {
        const contentStr = JSON.stringify(art.canonicalContent);
        if (contentStr.includes(productId)) {
          articleIds.add(art.id);
        }
      }
    }

    if (articleIds.size === 0) {
      return 0;
    }

    // 3. Mark all identified articles as needing republish
    const updateResult = await prisma.article.updateMany({
      where: {
        id: { in: Array.from(articleIds) },
        workspaceId,
      },
      data: {
        needsRepublish: true,
      },
    });

    return updateResult.count;
  }

  /**
   * Republishes a previously published article with newly resolved offers and updated content.
   */
  static async republishArticle(
    workspaceId: string,
    articleId: string
  ): Promise<{ success: boolean; postId?: number | string; postUrl?: string; error?: string }> {
    const article = await prisma.article.findFirst({
      where: { id: articleId, workspaceId },
      include: { wordpressSite: true },
    });

    if (!article) {
      throw new Error("Artigo não encontrado no workspace.");
    }

    if (article.status !== "PUBLISHED" || !article.wordpressPostId) {
      throw new Error("O artigo precisa ter sido publicado previamente no WordPress para ser republicado.");
    }

    if (!article.canonicalContent) {
      throw new Error("Artigo comercial sem documento canônico estruturado.");
    }

    // 1. Re-render fresh HTML with latest catalog offers
    const freshHtml = await WordPressAffiliateRenderer.renderToHtml(
      workspaceId,
      article.canonicalContent as unknown as CanonicalDocument
    );

    // 2. Resolve WordPress adapter and push update
    const adapter = await PublisherFactory.forWorkspace(workspaceId, article.wordpressSiteId || undefined);
    const publishResult = await adapter.update(article.wordpressPostId, {
      title: article.title || undefined,
      content: freshHtml,
    });

    if (!publishResult.success) {
      return { success: false, error: publishResult.errorMessage || "Falha na republicação no WordPress." };
    }

    // 3. Update publication record & hash
    const newHash = this.computeContentHash(freshHtml);
    await prisma.article.update({
      where: { id: articleId },
      data: {
        renderedContentHash: newHash,
        needsRepublish: false,
        lastPublishedAt: new Date(),
      },
    });

    return {
      success: true,
      postId: publishResult.postId,
      postUrl: publishResult.postUrl,
    };
  }
}
