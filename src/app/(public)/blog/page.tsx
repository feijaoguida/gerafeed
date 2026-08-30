import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, Tag, ArrowRight, BookOpen } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { getPublishedBlogPosts } from "@/lib/blog";
import { LandingLayout, SeoCta } from "@/components/landing";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

const CANONICAL_URL = `${siteConfig.url}/blog`;

export const metadata: Metadata = {
  title: {
    absolute: "Blog & Artigos sobre Automação Editorial no WordPress | GeraFeed",
  },
  description:
    "Guias, estratégias e análises técnicas sobre curadoria de conteúdo com inteligência artificial, automação de feeds RSS e publicação no WordPress.",
  alternates: {
    canonical: CANONICAL_URL,
  },
  openGraph: {
    title: "Blog & Artigos sobre Automação Editorial no WordPress | GeraFeed",
    description:
      "Guias, estratégias e análises técnicas sobre curadoria de conteúdo com inteligência artificial, automação de feeds RSS e publicação no WordPress.",
    url: CANONICAL_URL,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog & Artigos sobre Automação Editorial no WordPress | GeraFeed",
    description:
      "Guias, estratégias e análises técnicas sobre curadoria de conteúdo com inteligência artificial, automação de feeds RSS e publicação no WordPress.",
  },
};

export default async function BlogIndexPage() {
  const posts = await getPublishedBlogPosts();

  return (
    <LandingLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Cabeçalho do Blog */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Central de Conhecimento</span>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl font-black text-foreground tracking-tight mb-4">
            Blog & Artigos Técnicos
          </h1>
          <p className="font-sans text-lg text-muted-foreground leading-relaxed">
            Boas práticas, conformidade com o Google, tutoriais de RSS e arquitetura editorial para publishers modernos.
          </p>
        </div>

        {/* Listagem de Posts ou EmptyState */}
        {posts.length === 0 ? (
          <div className="max-w-2xl mx-auto my-12">
            <EmptyState
              icon={<BookOpen className="w-10 h-10 text-muted-foreground" />}
              title="Novos Guias em Preparação"
              description="Nossa equipe editorial está estruturando artigos aprofundados sobre automação no WordPress e curadoria com IA. Volte em breve para conferir os primeiros lançamentos."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link
                key={post.frontmatter.slug}
                href={`/blog/${post.frontmatter.slug}`}
                className="group block"
              >
                <Card className="h-full p-6 flex flex-col justify-between hover:border-primary transition-all duration-200 shadow-sm hover:shadow-md">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 font-semibold text-primary uppercase tracking-wider">
                        <Tag className="w-3 h-3" />
                        {post.frontmatter.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.frontmatter.publishedAt).toLocaleDateString("pt-BR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <h2 className="font-heading text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-3 leading-snug">
                      {post.frontmatter.title}
                    </h2>

                    <p className="font-sans text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-6">
                      {post.frontmatter.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform border-t border-border/60 pt-4">
                    <span>Ler artigo completo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <SeoCta
        title="Automatize seu WordPress com Rigor Editorial"
        subtitle="Monitore pautas e publique com agilidade mantendo revisão humana constante."
        ctaText="Começar Gratuitamente"
        ctaHref="/register"
        ctaLocation="footer_blog_index"
      />
    </LandingLayout>
  );
}
