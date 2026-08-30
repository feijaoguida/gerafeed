import React from "react";
import { Card } from "@/components/ui/card";

export interface WorkflowStep {
  step: string;
  title: string;
  description: string;
  badge?: string;
}

export interface WorkflowStepsProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  steps: WorkflowStep[];
}

export function WorkflowSteps({
  eyebrow = "Passo a Passo",
  title,
  subtitle,
  steps,
}: WorkflowStepsProps) {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-surface/40 rounded-3xl border border-border/60 my-8">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((item, idx) => (
          <Card
            key={idx}
            className="p-6 relative flex flex-col justify-between hover:border-primary/40 transition-colors duration-200"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-heading text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#7C3AED]">
                  {item.step}
                </span>
                {item.badge && (
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                    {item.badge}
                  </span>
                )}
              </div>
              <h4 className="font-heading text-lg font-bold text-foreground mb-2">
                {item.title}
              </h4>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
