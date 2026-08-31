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
} from "lucide-react";

import { PageHeader } from "@/components/design-system/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { trackEvent } from "@/lib/analytics";

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
    const isHighTier = plan.slug === "pro" || Number(plan.monthlyPrice) >= 90;
    if (isHighTier) {
      if (!items.some((i) => i.includes("Suporte"))) items.push("Suporte prioritário");
    } else {
      if (!items.some((i) => i.includes("Suporte"))) items.push("Suporte via e-mail");
    }
  }

  return items;
}

export default function UpgradePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedCycle = searchParams.get("cycle");

  const [plans, setPlans] = useState<PlanData[]>([]);
  const [currentPlanSlug, setCurrentPlanSlug] = useState<string>("free");
  const [cycle, setCycle] = useState<"MONTHLY" | "YEARLY">(
    requestedCycle === "YEARLY" ? "YEARLY" : "MONTHLY"
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [plansRes, subRes] = await Promise.all([
          fetch("/api/billing/plans"),
          fetch("/api/billing/subscription"),
        ]);

        if (!active) return;

        if (plansRes.ok) {
          const pData = await plansRes.json();
          const plansList = Array.isArray(pData)
            ? pData
            : Array.isArray(pData?.plans)
            ? pData.plans
            : [];
          setPlans(plansList.filter((p: PlanData) => p.active !== false));
        } else {
          setErrorMessage("Erro ao carregar os planos disponíveis.");
        }

        if (subRes.ok) {
          const sData: SubscriptionData = await subRes.json();
          if (sData.subscription?.plan?.slug) {
            setCurrentPlanSlug(sData.subscription.plan.slug);
          }
        }
      } catch (err) {
        if (!active) return;
        console.error(err);
        setErrorMessage("Erro ao carregar os planos disponíveis.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const handleSelectPlan = async (plan: PlanData) => {
    if (plan.slug === currentPlanSlug) return;
    setIsCheckingOut(plan.id);
    setErrorMessage(null);

    try {
      // 1. Check if profile is filled
      const profileRes = await fetch("/api/billing/profile");
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        const profile = profileData.profile;
        const isComplete =
          profile &&
          profile.name &&
          profile.cpfCnpj &&
          profile.email &&
          profile.postalCode &&
          profile.addressNumber;

        if (!isComplete && plan.slug !== "free") {
          router.push(
            `/settings/billing?redirect=upgrade&planId=${plan.id}&planName=${encodeURIComponent(
              plan.name
            )}&cycle=${cycle}`
          );
          return;
        }
      }

      // 2. Call checkout API
      trackEvent("begin_checkout", {
        plan_code_public: plan.slug,
        cycle,
      });

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          billingCycle: cycle,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.needsProfile) {
          router.push(
            `/settings/billing?redirect=upgrade&planId=${plan.id}&planName=${encodeURIComponent(
              plan.name
            )}&cycle=${cycle}`
          );
          return;
        }
        throw new Error(data.error || "Erro ao iniciar contratação do plano.");
      }

      // 3. Redirect to invoice/payment URL
      if (data.invoiceUrl) {
        window.location.assign(data.invoiceUrl);
      } else {
        router.push("/settings/billing?checkout=success");
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Erro ao processar assinatura."
      );
      setIsCheckingOut(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-48 mx-auto rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header com PageHeader */}
      <PageHeader
        title="Planos & Upgrades"
        description="Aumente sua capacidade de geração, desbloqueie múltiplos WordPress e impulsione suas conversões."
        icon={<Sparkles className="w-5 h-5 text-primary" />}
        badge={
          <Link href="/settings/billing" className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar para Plano & Cobrança
          </Link>
        }
      />

      {/* Cycle Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 p-1 bg-surface-muted rounded-xl border border-border">
          <Button
            size="sm"
            variant={cycle === "MONTHLY" ? "secondary" : "ghost"}
            onClick={() => setCycle("MONTHLY")}
            className={cycle === "MONTHLY" ? "bg-surface shadow-xs font-bold text-foreground" : "text-muted-foreground"}
          >
            Mensal
          </Button>
          <Button
            size="sm"
            variant={cycle === "YEARLY" ? "secondary" : "ghost"}
            onClick={() => setCycle("YEARLY")}
            className={cycle === "YEARLY" ? "bg-surface shadow-xs font-bold text-foreground flex items-center gap-1.5" : "text-muted-foreground flex items-center gap-1.5"}
          >
            Anual
            <Badge variant="success" size="sm">
              Economia
            </Badge>
          </Button>
        </div>
      </div>

      {/* Error */}
      {errorMessage && (
        <Alert variant="destructive" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground border border-dashed border-border rounded-xl">
          Nenhum plano disponível no momento.
        </div>
      ) : (
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
              <Card
                key={plan.id}
                className={`relative flex flex-col justify-between p-6 space-y-6 transition-all ${
                  isHighlight
                    ? "border-2 border-primary shadow-lg ring-1 ring-primary/20"
                    : "shadow-xs hover:border-primary/40"
                }`}
              >
                {isHighlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="purple" size="sm" className="shadow-md uppercase tracking-wider font-bold">
                      Mais Escolhido
                    </Badge>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Plan Header */}
                  <CardHeader className="p-0 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-2 rounded-xl ${
                          isPro
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : isHighlight
                            ? "bg-primary/10 text-primary"
                            : "bg-surface-muted text-muted-foreground"
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
                      <CardTitle className="text-base font-bold">
                        {plan.name}
                      </CardTitle>
                    </div>
                    {isCurrent && (
                      <Badge variant="success" size="sm">
                        Plano Atual
                      </Badge>
                    )}
                  </CardHeader>

                  {/* Price */}
                  <CardContent className="p-0 space-y-4">
                    <div className="flex items-baseline gap-1">
                      <span className="font-heading text-3xl font-extrabold text-foreground tracking-tight">
                        {formatCurrency(displayPrice)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {periodLabel}
                      </span>
                    </div>

                    {cycle === "YEARLY" && monthlyPrice > 0 && discountPercent > 0 && (
                      <p className="text-[11px] text-[#00C2A8] font-semibold">
                        Economia de {discountPercent}% no faturamento anual
                      </p>
                    )}

                    {/* Features */}
                    <ul className="space-y-2.5 pt-3 border-t border-border">
                      {features.map((feat, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-foreground/90 font-medium"
                        >
                          <Check className="w-3.5 h-3.5 text-[#00C2A8] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Limits Summary */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border">
                      <div className="text-center p-2.5 bg-surface-muted/50 rounded-xl border border-border">
                        <div className="font-heading text-base font-bold text-foreground">
                          {plan.maxArticles === -1 ? "∞" : plan.maxArticles}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          artigos/mês
                        </div>
                      </div>
                      <div className="text-center p-2.5 bg-surface-muted/50 rounded-xl border border-border">
                        <div className="font-heading text-base font-bold text-foreground">
                          {plan.maxSources === -1 ? "∞" : plan.maxSources}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          fontes RSS
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </div>

                {/* CTA Button */}
                <CardFooter className="p-0 pt-4">
                  <Button
                    variant={isCurrent ? "secondary" : isHighlight ? "gradient" : isPro ? "default" : "outline"}
                    size="lg"
                    className="w-full"
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrent || isCheckingOut !== null}
                    isLoading={isCheckingOut === plan.id}
                    leadingIcon={!isCurrent && plan.slug !== "free" ? <Lock className="w-3.5 h-3.5" /> : undefined}
                  >
                    {isCurrent
                      ? "Plano Atual"
                      : plan.slug === "free"
                      ? "Downgrade para Gratuito"
                      : `Assinar ${plan.name}`}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Footer note */}
      <div className="text-center text-[11px] text-muted-foreground pt-4">
        Todos os planos incluem criptografia AES-256, integração WordPress e
        suporte a múltiplos provedores de IA. Cancele a qualquer momento.
      </div>
    </div>
  );
}
