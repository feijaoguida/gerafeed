import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Tag, User } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { getBlogPostBySlug, getPublishedBlogPosts } from "@/lib/blog";
import { buildArticleJsonLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingLayout, SeoCta, RelatedLinks } from "@/components/landing";
import { MarkdownContent } from "@/components/blog/markdown-content";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const publishedPosts = await getPublishedBlogPosts();
  return publishedPosts.map((post) => ({
    slug: post.frontmatter.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post || post.frontmatter.draft) {
    return {
      title: "Artigo Não Encontrado",
      robots: { index: false, follow: false },
    };
  }

  const canonicalUrl = `${siteConfig.url}/blog/${post.frontmatter.slug}`;

  return {
    title: {
      absolute: `${post.frontmatter.title} | Blog GeraFeed`,
    },
    description: post.frontmatter.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      url: canonicalUrl,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: "article",
      publishedTime: post.frontmatter.publishedAt,
      modifiedTime: post.frontmatter.updatedAt || post.frontmatter.publishedAt,
      authors: [post.frontmatter.author],
      tags: post.frontmatter.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.frontmatter.title,
      description: post.frontmatter.description,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  // Drafts e slugs inexistentes geram 404 sem indexação
  if (!post || post.frontmatter.draft) {
    notFound();
  }

  const canonicalUrl = `${siteConfig.url}/blog/${post.frontmatter.slug}`;
  const articleJsonLd = buildArticleJsonLd(post.frontmatter, canonicalUrl);

  const formattedPublishDate = new Date(
    post.frontmatter.publishedAt
  ).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedUpdateDate = post.frontmatter.updatedAt
    ? new Date(post.frontmatter.updatedAt).toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <LandingLayout>
      <JsonLd data={articleJsonLd} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Breadcrumb Navegação */}
        <nav aria-label="Navegação do Artigo" className="mb-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Voltar para o Blog</span>
          </Link>
        </nav>

        {/* Cabeçalho do Artigo */}
        <header className="border-b border-border/80 pb-8 mb-10">
          <div className="flex flex-wrap items-center gap-3 mb-6 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold uppercase tracking-wider border border-primary/20">
              <Tag className="w-3 h-3" />
              {post.frontmatter.category}
            </span>

            <span className="flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5" />
              {post.frontmatter.author}
            </span>

            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              {formattedPublishDate}
            </span>

            {formattedUpdateDate && (
              <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                Atualizado em {formattedUpdateDate}
              </span>
            )}
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground tracking-tight leading-[1.15] mb-6">
            {post.frontmatter.title}
          </h1>

          <p className="font-sans text-lg sm:text-xl text-muted-foreground leading-relaxed">
            {post.frontmatter.description}
          </p>
        </header>

        {/* Corpo do Artigo com Markdown Seguro */}
        <div className="py-2">
          <MarkdownContent content={post.content} />
        </div>

        {/* Tags do Artigo */}
        {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
          <div className="border-t border-border/80 mt-12 pt-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-2">
              Tags:
            </span>
            {post.frontmatter.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-3 py-1 rounded-md bg-surface-muted border border-border text-foreground font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <RelatedLinks
        title="Explore mais sobre o ecossistema GeraFeed"
        links={[
          {
            title: "Como Funciona o GeraFeed",
            description: "Fluxo ponta a ponta: do monitoramento RSS à publicação no WordPress.",
            href: "/como-funciona",
          },
          {
            title: "Automação para WordPress com IA",
            description: "Escale sua frequência de postagens mantendo controle humano.",
            href: "/automacao-wordpress",
          },
          {
            title: "RSS para WordPress",
            description: "Por que simples feeds não bastam e como extrair matérias ricas.",
            href: "/rss-para-wordpress",
          },
        ]}
      />

      <SeoCta
        title="Pronto para otimizar sua produção de conteúdo?"
        subtitle="Automatize a captura e reescrita de notícias com controle editorial total."
        ctaText="Começar Gratuitamente"
        ctaHref="/register"
        ctaLocation="footer_blog_post"
      />
    </LandingLayout>
  );
}
