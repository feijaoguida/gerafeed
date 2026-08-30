"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/brand/logo";
import { trackEvent } from "@/lib/analytics";

export interface NavLinkItem {
  label: string;
  href: string;
}

interface PublicHeaderProps {
  navLinks?: NavLinkItem[];
  ctaLocation?: string;
}

const DEFAULT_NAV_LINKS: NavLinkItem[] = [
  { label: "Como Funciona", href: "/como-funciona" },
  { label: "WordPress", href: "/automacao-wordpress" },
  { label: "RSS Feeds", href: "/rss-para-wordpress" },
  { label: "Curadoria IA", href: "/curadoria-de-conteudo-com-ia" },
  { label: "Para Agências", href: "/para-agencias" },
  { label: "Portais", href: "/para-portais-de-noticias" },
  { label: "Blog", href: "/blog" },
];

export function PublicHeader({
  navLinks = DEFAULT_NAV_LINKS,
  ctaLocation = "header",
}: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-surface/80 border-b border-border/80 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Logo href="/" size="md" priority />

        {/* Nav Links Desktop */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-foreground transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg hover:bg-surface-muted transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            onClick={() =>
              trackEvent("cta_click", {
                cta_location: ctaLocation,
              })
            }
            className="relative group overflow-hidden px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:opacity-95 transition-all duration-300 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              Comece Grátis
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
