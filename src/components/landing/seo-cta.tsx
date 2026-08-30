"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandDecoration } from "@/components/design-system/brand-decoration";
import { trackEvent } from "@/lib/analytics";

export interface SeoCtaProps {
  title: string;
  subtitle: string;
  ctaText?: string;
  ctaHref?: string;
  ctaLocation?: string;
  guaranteeText?: string;
}

export function SeoCta({
  title,
  subtitle,
  ctaText = "Criar Minha Conta Gratuita",
  ctaHref = "/register",
  ctaLocation = "page_cta",
  guaranteeText = "Comece em 60 segundos • Sem necessidade de cartão de crédito",
}: SeoCtaProps) {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center relative">
      <div className="p-10 sm:p-16 rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#111F38] to-[#0A1224] text-white border border-primary/20 shadow-2xl relative overflow-hidden">
        <BrandDecoration variant="waves" />
        <BrandDecoration variant="glow" />

        <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4 max-w-2xl mx-auto leading-tight relative z-10">
          {title}
        </h2>
        <p className="font-sans text-slate-300 text-base sm:text-lg max-w-xl mx-auto mb-8 relative z-10 leading-relaxed">
          {subtitle}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto relative z-10">
          <Link
            href={ctaHref}
            onClick={() =>
              trackEvent("cta_click", {
                cta_location: ctaLocation,
              })
            }
            className="w-full sm:w-auto py-4 px-8 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:opacity-95 transition-all duration-300 shadow-xl shadow-primary/30 flex items-center justify-center gap-2 hover:scale-[1.02]"
          >
            <span>{ctaText}</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {guaranteeText && (
          <p className="text-xs text-slate-400 mt-4 relative z-10">
            {guaranteeText}
          </p>
        )}
      </div>
    </section>
  );
}
