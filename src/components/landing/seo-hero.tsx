"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { BrandDecoration } from "@/components/design-system/brand-decoration";
import { trackEvent } from "@/lib/analytics";

export interface SeoHeroProps {
  badge: string;
  title: string;
  highlightText?: string;
  description: string;
  bulletPoints?: string[];
  ctaText?: string;
  ctaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  ctaLocation?: string;
  guaranteeText?: string;
}

export function SeoHero({
  badge,
  title,
  highlightText,
  description,
  bulletPoints,
  ctaText = "Comece Grátis Agora",
  ctaHref = "/register",
  secondaryCtaText,
  secondaryCtaHref,
  ctaLocation = "hero",
  guaranteeText = "Não exige cartão de crédito no cadastro.",
}: SeoHeroProps) {
  return (
    <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
      <BrandDecoration variant="waves" />

      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-8 shadow-xs">
        <Zap className="w-3.5 h-3.5 text-[#00C2A8]" />
        <span>{badge}</span>
      </div>

      {/* H1 Semântico Único */}
      <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12] mb-6 max-w-5xl mx-auto">
        {title}{" "}
        {highlightText && (
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#00C2A8]">
            {highlightText}
          </span>
        )}
      </h1>

      {/* Descrição */}
      <p className="font-sans text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
        {description}
      </p>

      {/* Value Bullets */}
      {bulletPoints && bulletPoints.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-y-3 gap-x-6 text-sm text-foreground/90 mb-10 max-w-3xl mx-auto font-medium">
          {bulletPoints.map((bullet, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00C2A8] shrink-0" />
              <span>{bullet}</span>
            </div>
          ))}
        </div>
      )}

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-4">
        <Link
          href={ctaHref}
          onClick={() =>
            trackEvent("cta_click", {
              cta_location: ctaLocation,
            })
          }
          className="w-full sm:w-auto py-4 px-8 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:opacity-95 transition-all duration-300 shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] flex items-center justify-center gap-2"
        >
          <span>{ctaText}</span>
          <ArrowRight className="w-5 h-5" />
        </Link>

        {secondaryCtaText && secondaryCtaHref && (
          <Link
            href={secondaryCtaHref}
            className="w-full sm:w-auto py-4 px-6 rounded-2xl font-bold text-base text-foreground bg-surface border border-border hover:bg-surface-muted transition-all duration-200 flex items-center justify-center gap-2"
          >
            {secondaryCtaText}
          </Link>
        )}
      </div>

      {/* Guarantee Notice */}
      {guaranteeText && (
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-2 font-medium">
          <ShieldCheck className="w-4 h-4 text-[#00C2A8] inline" />
          <span>{guaranteeText}</span>
        </p>
      )}
    </section>
  );
}
