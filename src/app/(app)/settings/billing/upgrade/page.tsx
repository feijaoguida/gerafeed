"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Zap,
  Check,
  Lock,
  Sparkles,
  Crown,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface FeatureItem {
  id: string;
  key: string;
  name: string;
  description?: string;
  valueType?: string;
}

interface PlanFeatureItem {
  id: string;
  featureId: string;
  enabled: boolean;
  limit?: number | null;
  feature: FeatureItem;
}

interface PlanData {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  monthlyPrice: number | string;
  annualDiscountPercent: number | string;
  maxArticles: number;
  maxDailyArticles: number;
  maxSources: number;
  maxWordPressSites: number;
  highlight: boolean;
  active: boolean;
  planFeatures?: PlanFeatureItem[];
}

interface SubscriptionData {
  subscription?: {
    plan?: {
      slug?: string;
      name?: string;
    };
    status?: string;
  };
}

function formatCurrency(amount: number): string {
  return `R$ ${amount.toFixed(2).replace(".", ",")}`;
}

function calculateAnnualPrice(monthly: number, discountPercent: number): number {
  if (monthly <= 0) return 0;
  const annualBase = monthly * 12;
  return Math.round((annualBase * (1 - discountPercent / 100)) * 100) / 100;
}

function getPlanFeatureList(plan: PlanData): string[] {
  const items: string[] = [];

  // Articles per month
  if (plan.maxArticles === -1) {
    items.push("Artigos IA/mês ilimitados");
  } else {
    items.push(`Até ${plan.maxArticles.toLocaleString("pt-BR")} artigos IA/mês`);
  }

  // Daily limit
  if (plan.maxDailyArticles === -1) {
    items.push("Sem limite diário de artigos");
  } else {
    items.push(`${plan.maxDailyArticles} artigos/dia`);
  }

  // RSS Sources
  if (plan.maxSources === -1) {
    items.push("Fontes RSS ilimitadas");
  } else {
    items.push(`${plan.maxSources} fontes RSS ativas`);
  }

  // WordPress Sites
  if (plan.maxWordPressSites === -1) {
    items.push("Sites WordPress ilimitados");
  } else {
    items.push(`${plan.maxWordPressSites} site${plan.maxWordPressSites > 1 ? "s" : ""} WordPress`);
  }

  // Linked system features from database
  if (Array.isArray(plan.planFeatures)) {
    for (const pf of plan.planFeatures) {
      if (pf.enabled && pf.feature) {
        if (pf.feature.key === "affiliate_module") {
          items.push("Módulo de Afiliados completo");
        } else if (pf.feature.key === "affiliate_analytics") {
          items.push("Analytics de Afiliados");
        } else if (pf.feature.key === "ai_advanced_providers") {
          items.push("Provedores IA avançados (Gemini, Claude)");
        } else if (pf.feature.key === "ai_unlimited_niches") {
          items.push("Nichos de Portal Ilimitados");
        } else if (pf.feature.key === "ai_unlimited_styles") {
          items.push("Estilos de Escrita Ilimitados");
        } else if (pf.feature.key === "affiliate_max_products" && pf.limit) {
          items.push(`Catálogo de até ${pf.limit} produtos afiliados`);
        } else if (pf.feature.key === "affiliate_max_programs" && pf.limit) {
          items.push(`Até ${pf.limit} programas de afiliados`);
        } else {
          items.push(pf.feature.name);
        }
      }
    }
  }

  // Specific helpers
  if (plan.slug === "free" || Number(plan.monthlyPrice) === 0) {
    if (!items.some((i) => i.includes("BYOK"))) items.push("BYOK (Traga sua API Key)");
    if (!items.some((i) => i.includes("Atribuição"))) items.push("Atribuição automática de fonte");
  } else {
    // Paid support tier
    const isHighTier = plan.slug === "pro" || Number(plan.monthlyPrice) >= 90;
    if (isHighTier) {
      if (!items.some((i) => i.includes("Suporte"))) items.push("Suporte prioritário");
    } else {
      if (!items.some((i) => i.includes("Suporte"))) items.push("Suporte via e-mail");
    }
  }

  return items;
}

export default function UpgradePlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [currentPlanSlug, setCurrentPlanSlug] = useState<string>("free");
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cycle, setCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const [plansRes, subRes] = await Promise.all([
          fetch("/api/billing/plans"),
          fetch("/api/billing/subscription"),
        ]);

        if (plansRes.ok && !ignore) {
          const plansData = await plansRes.json();
          setPlans(
            Array.isArray(plansData)
              ? plansData.filter((p: PlanData) => p.active)
              : []
          );
        }

        if (subRes.ok && !ignore) {
          const subData: SubscriptionData = await subRes.json();
          if (subData?.subscription?.plan?.slug) {
            setCurrentPlanSlug(subData.subscription.plan.slug);
          }
        }
      } catch {
        // ignore
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  const handleSelectPlan = async (plan: PlanData, overrideCycle?: "MONTHLY" | "YEARLY") => {
    if (plan.slug === currentPlanSlug) return;

    setIsCheckingOut(plan.id);
    setErrorMessage(null);

    const activeCycle = overrideCycle || cycle;

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          cycle: activeCycle,
          successUrl: "/settings/billing?checkout=success",
          cancelUrl: "/settings/billing/upgrade?checkout=canceled",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "BILLING_PROFILE_REQUIRED") {
          setErrorMessage(
            "Preencha seus dados de cobrança antes de contratar um plano pago."
          );
          setTimeout(() => {
             router.push(`/settings/billing?redirect=upgrade&planId=${plan.id}&cycle=${activeCycle}&planName=${encodeURIComponent(plan.name)}`);
          }, 1500);
          return;
        }
        throw new Error(data.error || "Erro ao iniciar checkout.");
      }

      if (data.isFree) {
        router.push("/dashboard");
        return;
      }

      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
      } else {
        throw new Error("A URL de pagamento não foi retornada pelo gateway de pagamento.");
      }
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsCheckingOut(null);
    }
  };

  // Auto-checkout effect
  useEffect(() => {
    if (plans.length > 0 && searchParams.get("autoCheckout") === "1") {
      const pId = searchParams.get("planId");
      const pCycle = searchParams.get("cycle") as "MONTHLY" | "YEARLY" | null;
      if (pId) {
        const targetPlan = plans.find((p) => p.id === pId);
        if (targetPlan) {
          if (pCycle) {
            setTimeout(() => setCycle(pCycle), 0);
          }
          // Limpa query params e auto dispara checkout
          router.replace("/settings/billing/upgrade");
          setTimeout(() => handleSelectPlan(targetPlan, pCycle || "MONTHLY"), 0);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans, searchParams, router]);

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-96 bg-slate-200 dark:bg-zinc-800 rounded-2xl"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/settings/billing"
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-500" />
              Escolha o Plano Ideal
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Selecione o plano que melhor se adapta às suas necessidades de
              publicação e monetização.
            </p>
          </div>
        </div>
      </div>

      {/* Cycle Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700">
          <button
            onClick={() => setCycle("MONTHLY")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              cycle === "MONTHLY"
                ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200"
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setCycle("YEARLY")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              cycle === "YEARLY"
                ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200"
            }`}
          >
            Anual
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-full">
              Economia
            </span>
          </button>
        </div>
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {plans.map((plan) => {
          const monthlyPrice =
            plan.monthlyPrice !== undefined
              ? Number(plan.monthlyPrice)
              : plan.price;
          const discountPercent =
            plan.annualDiscountPercent !== undefined
              ? Number(plan.annualDiscountPercent)
              : 0;
          const annualPrice = calculateAnnualPrice(
            monthlyPrice,
            discountPercent
          );
          const displayPrice =
            cycle === "YEARLY" && monthlyPrice > 0
              ? annualPrice
              : monthlyPrice;
          const periodLabel =
            cycle === "YEARLY" && monthlyPrice > 0 ? "/ano" : "/mês";

          const isCurrent = plan.slug === currentPlanSlug;
          const isHighlight = Boolean(plan.highlight);
          const isPro = plan.slug === "pro";
          const features = getPlanFeatureList(plan);

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-2xl p-6 space-y-6 transition-shadow ${
                isHighlight
                  ? "border-2 border-indigo-500 shadow-xl shadow-indigo-500/10 bg-white dark:bg-zinc-900"
                  : "border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm"
              }`}
            >
              {isHighlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-[10px] uppercase tracking-widest rounded-full shadow-lg">
                  Mais Escolhido
                </div>
              )}

              <div className="space-y-4">
                {/* Plan Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-lg ${
                        isPro
                          ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
                          : isHighlight
                          ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
                          : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                      }`}
                    >
                      {isPro ? (
                        <Crown className="w-4 h-4" />
                      ) : isHighlight ? (
                        <Sparkles className="w-4 h-4" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {plan.name}
                    </span>
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800">
                      Plano Atual
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    {formatCurrency(displayPrice)}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-zinc-400">
                    {periodLabel}
                  </span>
                </div>

                {cycle === "YEARLY" &&
                  monthlyPrice > 0 &&
                  discountPercent > 0 && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      Economia de {discountPercent}% no plano anual
                    </p>
                  )}

                {/* Features */}
                <ul className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  {features.map((feat, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-slate-600 dark:text-zinc-300"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* Limits Summary */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <div className="text-center p-2 bg-slate-50 dark:bg-zinc-800/60 rounded-lg">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {plan.maxArticles}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                      artigos/mês
                    </div>
                  </div>
                  <div className="text-center p-2 bg-slate-50 dark:bg-zinc-800/60 rounded-lg">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {plan.maxSources}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                      fontes RSS
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={isCurrent || isCheckingOut !== null}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  isCurrent
                    ? "bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-default"
                    : isHighlight
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    : isPro
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm"
                    : "bg-slate-900 hover:bg-slate-800 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white"
                }`}
              >
                {isCheckingOut === plan.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : isCurrent ? (
                  "Plano Atual"
                ) : (
                  <>
                    {plan.slug === "free" ? (
                      "Downgrade para Gratuito"
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        Assinar {plan.name}
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="text-center text-[11px] text-slate-400 dark:text-zinc-500 pt-4">
        Todos os planos incluem criptografia AES-256, integração WordPress e
        suporte a múltiplos provedores de IA. Cancele a qualquer momento.
      </div>
    </div>
  );
}
