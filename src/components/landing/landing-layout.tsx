import React from "react";
import { PublicHeader } from "./public-header";
import { PublicFooter } from "./public-footer";

export interface LandingLayoutProps {
  children: React.ReactNode;
}

/**
 * Shell estrutural compartilhado para páginas públicas de aquisição orgânica e SEO.
 * Provê background ambient glow, PublicHeader com navegação e PublicFooter com preferências de privacidade.
 */
export function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white font-sans antialiased overflow-x-hidden transition-colors duration-300">
      {/* Ambient Brand Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 opacity-70 dark:opacity-40">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-[#2563EB]/20 via-[#7C3AED]/15 to-transparent blur-[130px] rounded-full" />
        <div className="absolute top-[45%] -left-40 w-[600px] h-[500px] bg-[#2563EB]/10 blur-[140px] rounded-full" />
        <div className="absolute top-[75%] -right-40 w-[600px] h-[500px] bg-[#7C3AED]/10 blur-[140px] rounded-full" />
      </div>

      <PublicHeader />
      <main>{children}</main>
      <PublicFooter />
    </div>
  );
}
