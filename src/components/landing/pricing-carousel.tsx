"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import type { PublicPlan } from "@/lib/public-plans";

interface PricingCarouselProps {
  plans: PublicPlan[];
}

export function PricingCarousel({ plans }: PricingCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(plans.length > 3);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    const firstCard = el.firstElementChild as HTMLElement | null;
    if (firstCard) {
      const cardWidthWithGap = firstCard.offsetWidth + 32; // 32px é o gap-8
      const newIndex = Math.round(scrollLeft / cardWidthWithGap);
      setActiveIndex(Math.min(newIndex, plans.length - 1));
    }
  }, [plans.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;

    const firstCard = el.firstElementChild as HTMLElement | null;
    const scrollAmount = firstCard ? firstCard.offsetWidth + 32 : 360;

    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const scrollToIndex = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;

    const firstCard = el.firstElementChild as HTMLElement | null;
    const scrollAmount = firstCard ? firstCard.offsetWidth + 32 : 360;

    el.scrollTo({
      left: index * scrollAmount,
      behavior: "smooth",
    });
  };

  if (!plans || plans.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      {/* Botões de navegação superiores / laterais */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <span>{plans.length} planos disponíveis</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Deslize para ver todos</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label="Ver planos anteriores"
            className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-foreground hover:bg-surface-muted hover:border-primary/40 active:scale-95 transition-all shadow-xs disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label="Ver próximos planos"
            className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-foreground hover:bg-surface-muted hover:border-primary/40 active:scale-95 transition-all shadow-xs disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Contêiner do Carrossel */}
      <div className="relative overflow-hidden px-1">
        <div
          ref={scrollRef}
          className="flex gap-8 overflow-x-auto scroll-smooth snap-x snap-mandatory pt-6 pb-8 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {plans.map((plan) => {
            const isFree = plan.monthlyPrice === 0;
            const formattedPrice = isFree
              ? "R$ 0"
              : `R$ ${plan.monthlyPrice.toLocaleString("pt-BR", {
                  minimumFractionDigits: plan.monthlyPrice % 1 === 0 ? 0 : 2,
                  maximumFractionDigits: 2,
                })}`;

            return (
              <div
                key={plan.id}
                className={`w-full sm:w-[calc((100%-2rem)/2)] lg:w-[calc((100%-4rem)/3)] shrink-0 snap-start p-8 rounded-3xl bg-surface flex flex-col justify-between space-y-8 transition-all duration-200 ${
                  plan.highlight
                    ? "border-2 border-primary relative shadow-xl shadow-primary/10 ring-1 ring-primary/20"
                    : "border border-border shadow-xs hover:border-border/80"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white font-black text-[11px] uppercase tracking-widest rounded-full shadow-md">
                    Mais Escolhido
                  </div>
                )}

                <div>
                  <div
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border ${
                      plan.highlight
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-surface-muted text-foreground border-border"
                    }`}
                  >
                    {plan.slug.toUpperCase()}
                  </div>
                  <h3 className="font-heading text-2xl font-bold text-foreground">
                    {plan.name}
                  </h3>
                  <p className="font-sans text-sm text-muted-foreground mt-2 leading-relaxed min-h-[40px]">
                    {plan.description || "Plano ideal para automatizar sua produção de conteúdo."}
                  </p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="font-heading text-4xl font-black text-foreground">
                      {formattedPrice}
                    </span>
                    <span className="text-muted-foreground text-sm">/mês</span>
                  </div>

                  <ul className="mt-8 space-y-4 text-sm text-foreground/90">
                    <li className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-[#00C2A8] shrink-0" />
                      <span>
                        {plan.maxArticles >= 99999 ? (
                          <strong>Artigos ilimitados</strong>
                        ) : (
                          <>
                            Até <strong>{plan.maxArticles.toLocaleString("pt-BR")} artigos</strong> por mês
                          </>
                        )}
                      </span>
                    </li>

                    <li className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-[#00C2A8] shrink-0" />
                      <span>
                        {plan.maxWordPressSites >= 999 ? (
                          <strong>Portais ilimitados WordPress</strong>
                        ) : plan.maxWordPressSites === 1 ? (
                          <>
                            <strong>1 portal</strong> WordPress conectado
                          </>
                        ) : (
                          <>
                            Até <strong>{plan.maxWordPressSites} portais</strong> WordPress
                          </>
                        )}
                      </span>
                    </li>

                    <li className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-[#00C2A8] shrink-0" />
                      <span>
                        {plan.maxSources >= 999 ? (
                          <strong>Feeds RSS ilimitados</strong>
                        ) : (
                          <>
                            Até <strong>{plan.maxSources} fontes RSS</strong> ativas
                          </>
                        )}
                      </span>
                    </li>

                    {plan.features.slice(0, 3).map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-[#00C2A8] shrink-0" />
                        <span>{feat.name}</span>
                      </li>
                    ))}

                    {plan.features.length === 0 && isFree && (
                      <li className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-[#00C2A8] shrink-0" />
                        <span>Modelo BYOK (sua própria API Key)</span>
                      </li>
                    )}
                  </ul>
                </div>

                <Link
                  href="/register"
                  onClick={() =>
                    trackEvent("cta_click", {
                      cta_location: `pricing_${plan.slug}`,
                      page_path: "/",
                    })
                  }
                  className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm text-center transition-all duration-200 block ${
                    plan.highlight
                      ? "text-white bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:opacity-95 shadow-md shadow-primary/25 active:scale-98"
                      : "text-foreground bg-surface-muted hover:bg-muted border border-border active:scale-98"
                  }`}
                >
                  {isFree
                    ? "Começar Gratuitamente"
                    : plan.highlight
                    ? `Assinar ${plan.name}`
                    : `Contratar ${plan.name}`}
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Indicadores de Paginação (Dots) */}
      {plans.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {plans.map((_, dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={() => scrollToIndex(dotIdx)}
              aria-label={`Ir para plano ${dotIdx + 1}`}
              className={`h-2 transition-all duration-300 rounded-full cursor-pointer ${
                activeIndex === dotIdx
                  ? "w-8 bg-primary"
                  : "w-2 bg-border hover:bg-muted-foreground/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
