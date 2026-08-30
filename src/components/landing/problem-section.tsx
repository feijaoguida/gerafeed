import React from "react";
import { XCircle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export interface ChallengeItem {
  title: string;
  description: string;
}

export interface SolutionItem {
  title: string;
  description: string;
}

export interface ProblemSectionProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  challenges: ChallengeItem[];
  solutions: SolutionItem[];
}

export function ProblemSection({
  eyebrow = "O Desafio Editorial",
  title,
  subtitle,
  challenges,
  solutions,
}: ProblemSectionProps) {
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Desafios Manuais */}
        <Card className="p-8 border-destructive/20 bg-destructive/5 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
              <XCircle className="w-6 h-6" />
            </div>
            <h4 className="font-heading text-xl font-bold text-foreground">
              O modelo manual e fragmentado
            </h4>
          </div>

          <div className="space-y-4">
            {challenges.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm">
                <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block">{item.title}</strong>
                  <span className="text-muted-foreground">{item.description}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Solução com GeraFeed */}
        <Card className="p-8 border-primary/30 bg-primary/5 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <CheckCircle2 className="w-6 h-6 text-[#00C2A8]" />
            </div>
            <h4 className="font-heading text-xl font-bold text-foreground">
              A curadoria inteligente com GeraFeed
            </h4>
          </div>

          <div className="space-y-4">
            {solutions.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="w-4 h-4 text-[#00C2A8] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block">{item.title}</strong>
                  <span className="text-muted-foreground">{item.description}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
