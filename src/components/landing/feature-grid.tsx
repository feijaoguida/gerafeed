import React from "react";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

export interface FeatureItem {
  title: string;
  description: string;
  tag?: string;
}

export interface FeatureGridProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  features: FeatureItem[];
}

export function FeatureGrid({
  eyebrow = "Recursos & Diferenciais",
  title,
  subtitle,
  features,
}: FeatureGridProps) {
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, idx) => (
          <Card
            key={idx}
            className="p-6 flex flex-col justify-between hover:border-primary/40 transition-colors duration-200"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="w-5 h-5 text-[#00C2A8]" />
                </div>
                {feature.tag && (
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-muted text-muted-foreground border border-border">
                    {feature.tag}
                  </span>
                )}
              </div>
              <h4 className="font-heading text-lg font-bold text-foreground mb-2">
                {feature.title}
              </h4>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
