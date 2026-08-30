import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
import { getPublishedBlogPosts } from "@/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const landingPages = [
    "",
    "/como-funciona",
    "/automacao-wordpress",
    "/rss-para-wordpress",
    "/curadoria-de-conteudo-com-ia",
    "/para-agencias",
    "/para-portais-de-noticias",
    "/blog",
  ];

  const staticEntries: MetadataRoute.Sitemap = landingPages.map((path) => ({
    url: `${siteConfig.url}${path}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1.0 : 0.8,
  }));

  const publishedPosts = await getPublishedBlogPosts();
  const blogEntries: MetadataRoute.Sitemap = publishedPosts.map((post) => ({
    url: `${siteConfig.url}/blog/${post.frontmatter.slug}`,
    lastModified: new Date(post.frontmatter.updatedAt || post.frontmatter.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticEntries, ...blogEntries];
}
