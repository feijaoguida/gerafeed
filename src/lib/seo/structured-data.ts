import { siteConfig } from "@/lib/site-config";

/**
 * Gera os schemas JSON-LD factuais da entidade e do produto na página inicial:
 * - Organization: Entidade GeraFeed com logo oficial e URL canônica.
 * - WebSite: Site oficial institucional.
 * - SoftwareApplication: SaaS de automação editorial e curadoria com IA para WordPress.
 *
 * Não inventa ratings, reviews, contagens fictícias de usuários ou preços não auditados.
 */
export function getHomeJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: `${siteConfig.url}/brand/logo.png`,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
      description: siteConfig.defaultDescription,
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: siteConfig.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "All",
      url: siteConfig.url,
      description: siteConfig.home.description,
    },
  ];
}

export interface ArticleJsonLdInput {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  image?: string;
}

/**
 * Gera schema BlogPosting factual para artigos do blog.
 */
export function buildArticleJsonLd(post: ArticleJsonLdInput, canonicalUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: post.image ? [post.image] : undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}/brand/logo.png`,
      },
    },
  };
}
