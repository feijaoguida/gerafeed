import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

export interface RelatedLinkItem {
  title: string;
  description: string;
  href: string;
}

export interface RelatedLinksProps {
  title?: string;
  links: RelatedLinkItem[];
}

export function RelatedLinks({
  title = "Conteúdos & Guias Relacionados",
  links,
}: RelatedLinksProps) {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-border/60">
      <div className="max-w-2xl mb-8">
        <h3 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
          {title}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {links.map((link, idx) => (
          <Link key={idx} href={link.href} className="group block">
            <Card className="p-6 h-full flex flex-col justify-between group-hover:border-primary transition-all duration-200">
              <div>
                <h4 className="font-heading text-base font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                  {link.title}
                </h4>
                <p className="font-sans text-sm text-muted-foreground line-clamp-2">
                  {link.description}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mt-4 group-hover:translate-x-1 transition-transform">
                <span>Ver detalhes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
