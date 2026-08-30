"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqSectionProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  items: FaqItem[];
}

export function FaqSection({
  eyebrow = "Dúvidas Frequentes",
  title = "Perguntas Frequentes",
  subtitle = "Tudo o que você precisa saber sobre curadoria, IA e integração WordPress.",
  items,
}: FaqSectionProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h2 className="font-heading text-xs font-bold uppercase tracking-widest text-primary mb-3">
          {eyebrow}
        </h2>
        <h3 className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="font-sans text-sm text-muted-foreground mt-3 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {items.map((item, index) => {
          const isOpen = openFaq === index;
          return (
            <div
              key={index}
              className="rounded-2xl bg-surface border border-border overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => toggleFaq(index)}
                aria-expanded={isOpen}
                className="w-full py-5 px-6 text-left flex items-center justify-between gap-4 font-heading font-bold text-foreground hover:text-primary transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`w-5 h-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-primary" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-6 pb-6 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
