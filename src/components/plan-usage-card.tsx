"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Calendar, ArrowUpRight } from "lucide-react";

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
      <div className="p-3.5 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 animate-pulse space-y-2.5">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700/50 rounded w-1/2" />
        <div className="h-2.5 bg-zinc-200 dark:bg-zinc-700/50 rounded w-full" />
        <div className="h-3 bg-zinc-200 dark:bg-zinc-700/50 rounded w-3/4" />
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
    <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/30 dark:from-zinc-800/70 dark:via-zinc-900/60 dark:to-zinc-950 border border-indigo-100 dark:border-zinc-800 shadow-sm dark:shadow-none space-y-3">
      {/* Plan Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-zinc-900 dark:text-white tracking-tight">
            {planName}
          </span>
        </div>

        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
          Ativo
        </span>
      </div>

      {/* Progress Bar & Counter */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-500 dark:text-zinc-400 font-medium">Posts gerados</span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
            {usedArticles} <span className="text-zinc-400 font-normal">/ {limitArticles}</span>
          </span>
        </div>

        <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isNearLimit
                ? "bg-amber-500"
                : "bg-gradient-to-r from-indigo-500 to-emerald-500"
            }`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
      </div>

      {/* Expiration and Upgrade Action */}
      <div className="pt-2 border-t border-indigo-100/60 dark:border-zinc-800/80 flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
          <Calendar className="w-3 h-3 text-zinc-400" />
          <span>Vence: <strong>{formattedExpiry}</strong></span>
        </div>

        <Link
          href="/#precos"
          className="inline-flex items-center gap-0.5 font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
        >
          Upgrade <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
