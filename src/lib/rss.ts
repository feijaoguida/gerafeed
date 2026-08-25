import Parser from "rss-parser";
import { prisma } from "@/lib/prisma";
import { scrapeArticleContent } from "@/lib/scraper";


export interface ExtractedRssItem {
  originalUrl: string;
  originalTitle: string;
  originalDescription: string | null;
  originalImageUrl: string | null;
  originalPublishedAt: Date | null;
  sourceId: string;
}

type CustomItem = {
  "media:content"?: Array<{ $: { url?: string } }> | { $: { url?: string } };
  "media:thumbnail"?: { $: { url?: string } };
  "itunes:image"?: { $: { href?: string } };
  enclosure?: { url?: string; type?: string };
  contentSnippet?: string;
  content?: string;
  description?: string;
};

const parser = new Parser<Record<string, unknown>, CustomItem>({
  timeout: 10000,
  customFields: {
    item: [
      ["media:content", "media:content", { keepArray: true }],
      ["media:thumbnail", "media:thumbnail"],
      ["itunes:image", "itunes:image"],
    ],
  },
});

function extractImageUrl(item: Parser.Item & CustomItem): string | null {
  // 1. Enclosure check
  if (item.enclosure?.url) {
    const url = item.enclosure.url;
    const type = item.enclosure.type || "";
    if (type.startsWith("image/") || url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)) {
      return url;
    }
  }

  // 2. Media content check
  if (item["media:content"]) {
    const media = item["media:content"];
    if (Array.isArray(media) && media.length > 0 && media[0]?.$?.url) {
      return media[0].$.url;
    } else if (!Array.isArray(media) && media.$?.url) {
      return media.$.url;
    }
  }

  // 3. Media thumbnail check
  if (item["media:thumbnail"]?.$?.url) {
    return item["media:thumbnail"].$.url;
  }

  // 4. iTunes image check
  if (item["itunes:image"]?.$?.href) {
    return item["itunes:image"].$.href;
  }

  // 5. Extract from HTML content/description
  const htmlContent = item.content || item.description || "";
  const imgMatch = htmlContent.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1];
  }

  return null;
}

/**
 * Reads and parses an RSS feed URL, returning normalized items.
 */
export async function parseFeedUrl(url: string, sourceId: string): Promise<ExtractedRssItem[]> {
  try {
    const feed = await parser.parseURL(url);
    const items: ExtractedRssItem[] = [];

    for (const item of feed.items) {
      const link = item.link || item.guid;
      const title = item.title;

      if (!link || !title) continue;

      const rawDescription = item.contentSnippet || item.summary || item.content || item.description || "";
      // Strip HTML tags for clean description if needed
      const cleanDescription = rawDescription.replace(/<[^>]*>/g, "").trim() || null;

      let publishedAt: Date | null = null;
      if (item.isoDate) {
        publishedAt = new Date(item.isoDate);
      } else if (item.pubDate) {
        publishedAt = new Date(item.pubDate);
      }

      const imageUrl = extractImageUrl(item);

      items.push({
        originalUrl: link.trim(),
        originalTitle: title.trim(),
        originalDescription: cleanDescription,
        originalImageUrl: imageUrl,
        originalPublishedAt: publishedAt && !isNaN(publishedAt.getTime()) ? publishedAt : null,
        sourceId,
      });
    }

    return items;
  } catch (error) {
    console.error(`Error parsing RSS feed at ${url}:`, error);
    // Return empty array so an error in one feed doesn't break all other feeds
    return [];
  }
}

/**
 * Fetches active RSS sources, and for each source individually selects up to
 * `limitPerFeed` new items (default 5), deduplicating by originalUrl against the DB.
 * This ensures each feed contributes up to `limitPerFeed` articles.
 */
export async function processRssSources(
  limitPerFeed: number = 5,
  workspaceId: string = "default-workspace"
) {
  // 1. Find all active sources for this workspace
  const activeSources = await prisma.source.findMany({
    where: {
      workspaceId,
      active: true,
    },
  });

  if (activeSources.length === 0) {
    return {
      success: true,
      processedCount: 0,
      articles: [],
      message: "Nenhuma fonte RSS ativa encontrada neste workspace.",
    };
  }

  // 2. Process each source independently, applying limit per feed
  const createdArticles = [];

  for (const source of activeSources) {
    const items = await parseFeedUrl(source.rssUrl, source.id);

    if (items.length === 0) continue;

    // Deduplicate within the feed itself
    const uniqueMap = new Map<string, ExtractedRssItem>();
    for (const item of items) {
      if (!uniqueMap.has(item.originalUrl)) {
        uniqueMap.set(item.originalUrl, item);
      }
    }
    const uniqueItems = Array.from(uniqueMap.values());

    // Check which URLs already exist in DB
    const candidateUrls = uniqueItems.map((c) => c.originalUrl);
    const existingArticles = await prisma.article.findMany({
      where: {
        originalUrl: { in: candidateUrls },
      },
      select: { originalUrl: true },
    });

    const existingUrlsSet = new Set(existingArticles.map((a) => a.originalUrl));
    const newItems = uniqueItems.filter((c) => !existingUrlsSet.has(c.originalUrl));

    // Apply limit per feed
    const selectedItems = newItems.slice(0, limitPerFeed);

    // Check if source has an associated WordPress site
    const siteAssignment = await prisma.wordPressSiteSource.findFirst({
      where: { sourceId: source.id, workspaceId },
      select: { wordpressSiteId: true },
    });
    const defaultWpSiteId = siteAssignment?.wordpressSiteId || null;

    // Persist selected articles with status PENDING and extract full content
    for (const item of selectedItems) {
      let scrapedContent: string | null = null;
      try {
        scrapedContent = await scrapeArticleContent(item.originalUrl);
      } catch (scrapeErr) {
        console.warn(`[RSS] Erro ao extrair conteúdo da URL ${item.originalUrl}:`, scrapeErr);
      }

      const article = await prisma.article.create({
        data: {
          workspaceId,
          sourceId: item.sourceId,
          wordpressSiteId: defaultWpSiteId,
          originalUrl: item.originalUrl,
          originalTitle: item.originalTitle,
          originalDescription: item.originalDescription,
          originalContent: scrapedContent,
          originalImageUrl: item.originalImageUrl,
          originalPublishedAt: item.originalPublishedAt,
          status: "PENDING",
        },
      });
      createdArticles.push(article);
    }
  }

  if (createdArticles.length === 0) {
    return {
      success: true,
      processedCount: 0,
      articles: [],
      message: "Todas as notícias coletadas já foram salvas anteriormente (deduplicadas).",
    };
  }

  return {
    success: true,
    processedCount: createdArticles.length,
    articles: createdArticles,
    message: `${createdArticles.length} notícia(s) processada(s) e salva(s) com sucesso.`,
  };
}


