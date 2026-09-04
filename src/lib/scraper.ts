/**
 * Safe article content scraper.
 * Fetches HTML from article URLs and extracts clean, readable text content.
 */

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const SCRAPE_TIMEOUT_MS = 10000;
const MAX_CONTENT_LENGTH = 15000;

/**
 * Strips non-content HTML tags (scripts, styles, nav, footer, headers, ads, comments).
 */
function cleanRawHtml(html: string): string {
  let cleaned = html;

  // Remove comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, "");

  // Remove non-content tags and their contents
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ");
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ");
  cleaned = cleaned.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ");
  cleaned = cleaned.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ");
  cleaned = cleaned.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, " ");
  cleaned = cleaned.replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ");
  cleaned = cleaned.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ");
  cleaned = cleaned.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ");
  cleaned = cleaned.replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, " ");

  return cleaned;
}

/**
 * Recursively inspects a JSON-LD object/graph to find articleBody string.
 */
function findArticleBodyInJson(obj: unknown): string | null {
  if (!obj || typeof obj !== "object") return null;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findArticleBodyInJson(item);
      if (found) return found;
    }
    return null;
  }

  const record = obj as Record<string, unknown>;
  if (typeof record.articleBody === "string" && record.articleBody.trim().length > 100) {
    return record.articleBody.trim();
  }

  if (Array.isArray(record["@graph"])) {
    for (const item of record["@graph"]) {
      const found = findArticleBodyInJson(item);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Extracts articleBody from JSON-LD (Schema.org) scripts before stripping HTML tags.
 * Modern news portals (Next.js, paywalls, Gazeta do Povo, G1, UOL, etc.) often include
 * the complete text in structured data graph.
 */
function extractJsonLdArticleBody(html: string): string | null {
  const scriptRegex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const body = findArticleBodyInJson(parsed);
      if (body && body.length > 100) {
        return body;
      }
    } catch {
      // Ignore JSON parse errors in malformed script tags
    }
  }
  return null;
}

/**
 * Tries to locate main content container (<article>, <main>, or body).
 */
function extractMainContainer(html: string): string {
  // 1. Try <article> tag
  const articleMatch = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch && articleMatch[1] && articleMatch[1].trim().length > 200) {
    return articleMatch[1];
  }

  // 2. Try <main> tag
  const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch && mainMatch[1] && mainMatch[1].trim().length > 200) {
    return mainMatch[1];
  }

  // 3. Try common article body class patterns
  const classMatches = [
    /<div\b[^>]*class=["'][^"']*(?:article[-_]body|entry[-_]content|post[-_]content|story[-_]body|article[-_]content|materia[-_]conteudo)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const regex of classMatches) {
    const match = html.match(regex);
    if (match && match[1] && match[1].trim().length > 200) {
      return match[1];
    }
  }

  // 4. Fallback to full cleaned HTML
  return html;
}

/**
 * Converts HTML snippet into clean structured plaintext.
 */
function htmlToPlainText(html: string): string {
  let text = html;

  // Replace block elements with newlines
  text = text.replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|tr|blockquote)>/gi, "\n\n");
  text = text.replace(/<br\s*[\/]?>/gi, "\n");
  text = text.replace(/<li\b[^>]*>/gi, "• ");

  // Strip all remaining HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&bull;/gi, "•")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&#8217;/gi, "'")
    .replace(/&#8216;/gi, "'")
    .replace(/&#8220;/gi, '"')
    .replace(/&#8221;/gi, '"');

  // Normalize whitespace and blank lines
  const lines = text
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line) => line.length > 0);

  return lines.join("\n\n").trim();
}

/**
 * Fetches and extracts the full readable text of an article from its URL.
 * Returns null if the page cannot be reached, times out, or contains insufficient text.
 */
export async function scrapeArticleContent(url: string): Promise<string | null> {
  if (!url || !url.startsWith("http")) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[Scraper] HTTP ${response.status} ao acessar ${url}`);
      return null;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return null;
    }

    const rawHtml = await response.text();
    if (!rawHtml || rawHtml.length < 200) {
      return null;
    }

    // 1. Try extracting structured article body from JSON-LD Schema.org metadata first
    // (Used by modern portals such as Gazeta do Povo, G1, paywalled Next.js news sites, etc.)
    const jsonLdBody = extractJsonLdArticleBody(rawHtml);
    if (jsonLdBody && jsonLdBody.length >= 150) {
      const normalized = jsonLdBody
        .split("\n")
        .map((line) => line.replace(/[ \t]+/g, " ").trim())
        .filter((line) => line.length > 0)
        .join("\n\n")
        .trim();

      return normalized.length > MAX_CONTENT_LENGTH
        ? normalized.substring(0, MAX_CONTENT_LENGTH) + "..."
        : normalized;
    }

    // 2. Fallback to extracting from HTML DOM containers
    const cleanedHtml = cleanRawHtml(rawHtml);
    const mainSection = extractMainContainer(cleanedHtml);
    const plainText = htmlToPlainText(mainSection);

    // If extracted text is too short, might be a shell or blocked page
    if (!plainText || plainText.length < 150) {
      return null;
    }

    // Limit maximum length to avoid token explosion
    const truncated = plainText.length > MAX_CONTENT_LENGTH
      ? plainText.substring(0, MAX_CONTENT_LENGTH) + "..."
      : plainText;

    return truncated;
  } catch (error) {
    // Graceful fallback: log and return null so the flow never breaks
    console.warn(`[Scraper] Erro ao extrair conteúdo de ${url}:`, error instanceof Error ? error.message : error);
    return null;
  }
}
