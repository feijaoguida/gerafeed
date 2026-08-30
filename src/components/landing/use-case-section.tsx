import React from "react";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";

export interface UseCaseItem {
  title: string;
  tag: string;
  description: string;
  benefits: string[];
}

export interface UseCaseSectionProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  useCases: UseCaseItem[];
}

export function UseCaseSection({
  eyebrow = "Para Quem é o GeraFeed",
  title,
  subtitle,
  useCases,
}: UseCaseSectionProps) {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="font-heading text-xs font-bold uppercase tracking-widest text-primary mb-3">
          {eyebrow}
        </h2>
        <h3 className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="font-sans text-muted-foreground mt-4 text-base sm:text-lg">
            {subtitle}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {useCases.map((uc, idx) => (
          <Card
            key={idx}
            className="p-8 flex flex-col justify-between hover:border-primary/40 transition-all duration-200"
          >
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4 border border-primary/20">
                {uc.tag}
              </span>
              <h4 className="font-heading text-xl font-bold text-foreground mb-3">
                {uc.title}
              </h4>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-6">
                {uc.description}
              </p>

              <ul className="space-y-3 text-sm text-foreground/90 border-t border-border pt-4">
                {uc.benefits.map((b, bIdx) => (
                  <li key={bIdx} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#00C2A8] shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
