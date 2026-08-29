"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Calendar, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface SubscriptionInfo {
  subscription?: {
    id: string;
    status: string;
    plan?: {
      name: string;
      slug?: string;
      maxArticlesPerMonth?: number;
      maxSources?: number;
    };
    validUntil?: string | null;
    currentPeriodEnd?: string | null;
  };
  usage?: {
    articles: {
      current: number;
      limit: number;
      allowed: boolean;
    };
    sources: {
      current: number;
      limit: number;
      allowed: boolean;
    };
  };
}

export function PlanUsageCard() {
  const [data, setData] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSubscription() {
      try {
        const res = await fetch("/api/billing/subscription");
        if (res.ok) {
          const json = await res.json();
          if (active) setData(json);
        }
      } catch (err) {
        console.error("Erro ao carregar status do plano:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadSubscription();

    return () => {
      active = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="p-3.5 rounded-xl bg-surface border border-border space-y-2.5">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    );
  }

  const planName = data?.subscription?.plan?.name || "Plano Gratuito";
  const usedArticles = data?.usage?.articles?.current || 0;
  const limitArticles = data?.usage?.articles?.limit || 10;
  const percentUsed = Math.min(
    100,
    Math.round((usedArticles / (limitArticles || 1)) * 100)
  );

  const rawExpiry =
    data?.subscription?.validUntil || data?.subscription?.currentPeriodEnd;
  const formattedExpiry = rawExpiry
    ? new Date(rawExpiry).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      })
    : "Vitalício";

  const isNearLimit = percentUsed >= 80;

  return (
    <div className="p-3.5 rounded-xl bg-surface border border-border shadow-xs space-y-3">
      {/* Plan Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-primary/10 text-primary">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <span className="font-heading text-xs font-bold text-foreground tracking-tight">
            {planName}
          </span>
        </div>

        <Badge variant="success" size="sm">
          Ativo
        </Badge>
      </div>

      {/* Progress Bar & Counter */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground font-medium">Posts gerados</span>
          <span className="font-semibold text-foreground">
            {usedArticles} <span className="text-muted-foreground font-normal">/ {limitArticles}</span>
          </span>
        </div>

        <Progress
          value={percentUsed}
          size="sm"
          color={isNearLimit ? "amber" : "gradient"}
        />
      </div>

      {/* Expiration and Upgrade Action */}
      <div className="pt-2 border-t border-border flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Calendar className="w-3 h-3 text-muted-foreground" />
          <span>Vence: <strong className="text-foreground">{formattedExpiry}</strong></span>
        </div>

        <Link
          href="/#precos"
          className="inline-flex items-center gap-0.5 font-semibold text-primary hover:underline transition-colors"
        >
          Upgrade <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
