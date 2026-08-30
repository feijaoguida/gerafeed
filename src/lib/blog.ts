import fs from "node:fs";
import path from "node:path";

export interface BlogPostFrontmatter {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  category: string;
  tags: string[];
  image?: string;
  draft: boolean;
}

export interface BlogPost {
  frontmatter: BlogPostFrontmatter;
  content: string;
}

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

/**
 * Analisador minimalista e robusto de frontmatter YAML sem dependências externas.
 */
function parseFrontmatter(rawContent: string): { frontmatter: BlogPostFrontmatter; content: string } {
  const normalized = rawContent.replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!match) {
    throw new Error("Formato de frontmatter inválido. Certifique-se de cercar com '---'.");
  }

  const yamlBlock = match[1];
  const markdownBody = match[2].trim();

  const data: Record<string, string | boolean | string[]> = {};

  const lines = yamlBlock.split("\n");
  let currentKey = "";
  let inList = false;
  let listItems: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    if (trimmed.startsWith("- ") && inList) {
      listItems.push(trimmed.replace(/^- \s*/, "").replace(/^["']|["']$/g, "").trim());
      continue;
    }

    if (inList) {
      data[currentKey] = listItems;
      inList = false;
      listItems = [];
    }

    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    let val = trimmed.slice(colonIndex + 1).trim();

    if (val === "" || val === "[]") {
      if (val === "[]") {
        data[key] = [];
      } else {
        currentKey = key;
        inList = true;
        listItems = [];
      }
      continue;
    }

    if (val.startsWith("[") && val.endsWith("]")) {
      const items = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
      data[key] = items;
      continue;
    }

    if (val === "true" || val === "false") {
      data[key] = val === "true";
      continue;
    }

    // String simples
    val = val.replace(/^["']|["']$/g, "");
    data[key] = val;
  }

  if (inList) {
    data[currentKey] = listItems;
  }

  const frontmatter: BlogPostFrontmatter = {
    title: String(data.title || ""),
    description: String(data.description || ""),
    slug: String(data.slug || ""),
    publishedAt: String(data.publishedAt || ""),
    updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
    author: String(data.author || "Equipe GeraFeed"),
    category: String(data.category || "Geral"),
    tags: Array.isArray(data.tags) ? data.tags : [],
    image: data.image ? String(data.image) : undefined,
    draft: Boolean(data.draft),
  };

  return {
    frontmatter,
    content: markdownBody,
  };
}

/**
 * Retorna todos os posts do blog, com opção de incluir ou excluir rascunhos.
 */
export async function getAllBlogPosts(options?: { includeDrafts?: boolean }): Promise<BlogPost[]> {
  const includeDrafts = options?.includeDrafts ?? false;

  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));
  const posts: BlogPost[] = [];

  for (const file of files) {
    try {
      const filePath = path.join(CONTENT_DIR, file);
      const raw = fs.readFileSync(filePath, "utf-8");
      const { frontmatter, content } = parseFrontmatter(raw);

      if (!frontmatter.slug) {
        frontmatter.slug = file.replace(/\.mdx?$/, "");
      }

      if (!includeDrafts && frontmatter.draft) {
        continue;
      }

      posts.push({ frontmatter, content });
    } catch {
      // Ignora arquivos mal formatados silenciosamente para não quebrar a aplicação
    }
  }

  // Ordena por data de publicação decrescente
  posts.sort((a, b) => {
    const dateA = new Date(a.frontmatter.publishedAt).getTime() || 0;
    const dateB = new Date(b.frontmatter.publishedAt).getTime() || 0;
    return dateB - dateA;
  });

  return posts;
}

/**
 * Retorna apenas os posts publicados (excluindo drafts).
 */
export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  return getAllBlogPosts({ includeDrafts: false });
}

/**
 * Busca um post específico pelo slug.
 */
export async function getBlogPostBySlug(
  slug: string,
  options?: { includeDrafts?: boolean }
): Promise<BlogPost | null> {
  const posts = await getAllBlogPosts(options);
  return posts.find((p) => p.frontmatter.slug === slug) || null;
}
