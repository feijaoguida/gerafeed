import Parser from "rss-parser";
import { prisma } from "@/lib/prisma";
import { BillingService } from "@/lib/billing";


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
      const cleanDescription = rawDescription.replace(/<[^>]*>/g, "").trim().substring(0, 1000) || null;

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
 * Fetches active RSS sources, deduplicates items by originalUrl,
 * selects up to `limit` new items (default 5), and saves them as PENDING articles for the specified workspace.
 */
export async function processRssSources(
  limit: number = 5,
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

  // 2. Fetch items from each active source (handling errors individually)
  const candidateItems: ExtractedRssItem[] = [];
  for (const source of activeSources) {
    const items = await parseFeedUrl(source.rssUrl, source.id);
    candidateItems.push(...items);
  }

  if (candidateItems.length === 0) {
    return {
      success: true,
      processedCount: 0,
      articles: [],
      message: "Nenhum item encontrado nas fontes RSS ativas.",
    };
  }

  // 3. Deduplicate candidates among themselves by originalUrl
  const uniqueCandidatesMap = new Map<string, ExtractedRssItem>();
  for (const item of candidateItems) {
    if (!uniqueCandidatesMap.has(item.originalUrl)) {
      uniqueCandidatesMap.set(item.originalUrl, item);
    }
  }
  const uniqueCandidates = Array.from(uniqueCandidatesMap.values());

  // 4. Query existing articles in DB for deduplication within workspace
  const candidateUrls = uniqueCandidates.map((c) => c.originalUrl);
  const existingArticles = await prisma.article.findMany({
    where: {
      originalUrl: { in: candidateUrls },
    },
    select: { originalUrl: true },
  });

  const existingUrlsSet = new Set(existingArticles.map((a) => a.originalUrl));

  // Filter out URLs that already exist in DB
  const newCandidates = uniqueCandidates.filter((c) => !existingUrlsSet.has(c.originalUrl));

  // 5. Select at most `limit` (max 5) new items
  const selectedItems = newCandidates.slice(0, limit);

  if (selectedItems.length === 0) {
    return {
      success: true,
      processedCount: 0,
      articles: [],
      message: "Todas as notícias coletadas já foram salvas anteriormente (deduplicadas).",
    };
  }

  // 6. Persist selected articles with status PENDING up to remaining plan quota
  const createdArticles = [];
  for (const item of selectedItems) {
    const limitCheck = await BillingService.checkLimit(workspaceId, "ARTICLES");
    if (!limitCheck.allowed) {
      console.warn(`[RSS Process] ${limitCheck.message}`);
      break;
    }

    const article = await prisma.article.create({
      data: {
        workspaceId,
        sourceId: item.sourceId,
        originalUrl: item.originalUrl,
        originalTitle: item.originalTitle,
        originalDescription: item.originalDescription,
        originalImageUrl: item.originalImageUrl,
        originalPublishedAt: item.originalPublishedAt,
        status: "PENDING",
      },
    });
    createdArticles.push(article);
  }

  if (createdArticles.length === 0 && selectedItems.length > 0) {
    const limitCheck = await BillingService.checkLimit(workspaceId, "ARTICLES");
    return {
      success: false,
      processedCount: 0,
      articles: [],
      message: limitCheck.message || "Limite de artigos atingido para o seu plano.",
    };
  }

  return {
    success: true,
    processedCount: createdArticles.length,
    articles: createdArticles,
    message: `${createdArticles.length} notícia(s) processada(s) e salva(s) com sucesso.`,
  };
}


