import { prisma } from "@/lib/prisma";
import { getConfig } from "@/lib/config";
import { decrypt } from "@/lib/crypto";

export interface WpCategory {
  id: number;
  name: string;
  slug: string;
}

export interface WordPressConnectionConfigStored {
  url: string;
  username: string;
  applicationPassword?: string;
}

/**
 * Returns active WordPress configuration.
 * Checks DB configuration first (decrypting application password server-side).
 * Falls back to environment variables if no DB configuration exists.
 */
export async function getWordPressConfig() {
  // 1. Try DB configuration first
  const dbConfig = await getConfig<WordPressConnectionConfigStored>("wordpressConnection");

  if (dbConfig && dbConfig.url && dbConfig.username) {
    let plainPassword = "";
    if (dbConfig.applicationPassword) {
      try {
        plainPassword = decrypt(dbConfig.applicationPassword);
      } catch (err) {
        console.error("Erro ao descriptografar Application Password do WordPress:", err);
      }
    }

    if (plainPassword) {
      return {
        url: dbConfig.url.replace(/\/+$/, ""),
        username: dbConfig.username,
        applicationPassword: plainPassword,
      };
    }
  }

  // 2. Fallback to Environment Variables
  const url = process.env.WORDPRESS_URL;
  const username = process.env.WORDPRESS_USERNAME;
  const applicationPassword = process.env.WORDPRESS_APPLICATION_PASSWORD;

  if (!url || !username || !applicationPassword) {
    throw new Error(
      "Configuração do WordPress não encontrada no banco de dados nem nas variáveis de ambiente."
    );
  }

  return {
    url: url.replace(/\/+$/, ""),
    username,
    applicationPassword,
  };
}

function getAuthHeaders(config: Awaited<ReturnType<typeof getWordPressConfig>>): Record<string, string> {
  const credentials = `${config.username}:${config.applicationPassword}`;
  const base64Auth = Buffer.from(credentials).toString("base64");

  return {
    Authorization: `Basic ${base64Auth}`,
    "Content-Type": "application/json",
  };
}

/**
 * Resolves or creates tags in WordPress REST API, returning an array of tag IDs.
 */
export async function getOrCreateWordPressTagIds(
  config: Awaited<ReturnType<typeof getWordPressConfig>>,
  headers: Record<string, string>,
  tagNames: string[]
): Promise<number[]> {
  if (!tagNames || tagNames.length === 0) return [];

  const tagIds: number[] = [];

  for (const name of tagNames) {
    const cleanName = name.trim();
    if (!cleanName) continue;

    try {
      // Search for existing tag
      const searchRes = await fetch(
        `${config.url}/wp-json/wp/v2/tags?search=${encodeURIComponent(cleanName)}`,
        { method: "GET", headers, cache: "no-store" }
      );

      if (searchRes.ok) {
        const found = (await searchRes.json()) as Array<{ id: number; name: string }>;
        const exactMatch = found.find(
          (t) => t.name.toLowerCase() === cleanName.toLowerCase()
        );
        if (exactMatch) {
          tagIds.push(exactMatch.id);
          continue;
        }
      }

      // Create tag if not found
      const createRes = await fetch(`${config.url}/wp-json/wp/v2/tags`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name: cleanName }),
      });

      if (createRes.ok) {
        const newTag = await createRes.json();
        if (newTag?.id) {
          tagIds.push(newTag.id);
        }
      }
    } catch (err) {
      console.warn(`Aviso: Erro ao resolver tag "${cleanName}" no WordPress:`, err);
    }
  }

  return tagIds;
}

/**
 * Tests connection to WordPress REST API using active configuration.
 */
export async function testWordPressConnection() {
  const config = await getWordPressConfig();
  const headers = getAuthHeaders(config);

  const res = await fetch(`${config.url}/wp-json/wp/v2/users/me`, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(
      `Falha na conexão com o WordPress (${res.status} ${res.statusText}): ${errorText.substring(0, 200)}`
    );
  }

  const user = await res.json();
  return {
    connected: true,
    wordpressUrl: config.url,
    user: {
      id: user.id,
      name: user.name,
      slug: user.slug,
    },
  };
}

/**
 * Fetches all categories from WordPress REST API.
 */
export async function fetchWordPressCategories(): Promise<WpCategory[]> {
  const config = await getWordPressConfig();
  const headers = getAuthHeaders(config);

  const allCategories: WpCategory[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const res = await fetch(`${config.url}/wp-json/wp/v2/categories?per_page=100&page=${page}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`Erro ao buscar categorias do WordPress: ${errorText.substring(0, 200)}`);
    }

    const totalPagesHeader = res.headers.get("x-wp-totalpages");
    if (totalPagesHeader) {
      totalPages = parseInt(totalPagesHeader, 10) || 1;
    }

    const categories = (await res.json()) as Array<{ id: number; name: string; slug: string }>;
    for (const cat of categories) {
      allCategories.push({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
      });
    }

    page++;
  } while (page <= totalPages);

  return allCategories;
}

/**
 * Syncs WordPress categories into Prisma DB.
 */
export async function syncWordPressCategories() {
  const categories = await fetchWordPressCategories();

  const synced = [];
  for (const cat of categories) {
    const upserted = await prisma.wordPressCategory.upsert({
      where: { wordpressId: cat.id },
      update: {
        name: cat.name,
        slug: cat.slug,
      },
      create: {
        wordpressId: cat.id,
        name: cat.name,
        slug: cat.slug,
      },
    });
    synced.push(upserted);
  }

  return {
    success: true,
    syncedCount: synced.length,
    categories: synced,
  };
}

/**
 * Validates required fields, publishes article post to WordPress with Yoast SEO meta fields,
 * and updates DB status to PUBLISHED with wordpressPostId.
 */
export async function publishArticleToWordPress(articleId: string) {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      category: true,
      suggestedCategory: true,
    },
  });

  if (!article) {
    throw new Error(`Artigo com ID ${articleId} não encontrado.`);
  }

  if (!article.title || !article.title.trim()) {
    throw new Error("O título editorial é obrigatório para aprovação e publicação.");
  }

  if (!article.content || !article.content.trim()) {
    throw new Error("O conteúdo do artigo é obrigatório para aprovação e publicação.");
  }

  const categoryToUse = article.category || article.suggestedCategory;
  if (!categoryToUse) {
    throw new Error("Selecione uma categoria válida do WordPress antes de aprovar.");
  }

  const config = await getWordPressConfig();
  const headers = getAuthHeaders(config);

  // Resolve tags
  const wpTagIds = await getOrCreateWordPressTagIds(config, headers, article.tags || []);

  // Map Yoast SEO post meta fields
  const meta: Record<string, string> = {};
  if (article.seoTitle && article.seoTitle.trim()) {
    meta._yoast_wpseo_title = article.seoTitle.trim();
  }
  if (article.seoDescription && article.seoDescription.trim()) {
    meta._yoast_wpseo_metadesc = article.seoDescription.trim();
  }
  if (article.seoFocusKeyword && article.seoFocusKeyword.trim()) {
    meta._yoast_wpseo_focuskw = article.seoFocusKeyword.trim();
  }

  const wpPostData: Record<string, unknown> = {
    title: article.title,
    content: article.content,
    excerpt: article.summary || "",
    status: "publish",
    categories: [categoryToUse.wordpressId],
  };

  if (wpTagIds.length > 0) {
    wpPostData.tags = wpTagIds;
  }

  if (Object.keys(meta).length > 0) {
    wpPostData.meta = meta;
  }

  const res = await fetch(`${config.url}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers,
    body: JSON.stringify(wpPostData),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Erro na API do WordPress ao publicar post (${res.status}): ${errorText.substring(0, 200)}`);
  }

  const createdPost = await res.json();
  const wordpressPostId = createdPost.id;

  const updatedArticle = await prisma.article.update({
    where: { id: articleId },
    data: {
      status: "PUBLISHED",
      wordpressPostId: wordpressPostId,
      categoryId: categoryToUse.id,
    },
  });

  return {
    success: true,
    wordpressPostId,
    article: updatedArticle,
  };
}
