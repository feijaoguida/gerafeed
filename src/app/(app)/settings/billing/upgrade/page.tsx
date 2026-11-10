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
  Tag,
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

  // Cupom de Desconto para Cliente Base
  const [couponInput, setCouponInput] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    name: string;
    discountType: string;
    discountValue: number;
    durationMonths: number;
    durationLabel: string;
    applicablePlanIds?: string[];
  } | null>(null);

  const handleValidateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = couponInput.trim().toUpperCase();
    if (!clean || isValidatingCoupon) return;

    setIsValidatingCoupon(true);
    setCouponError(null);

    try {
      const res = await fetch("/api/billing/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: clean,
          customerTypeContext: "BASE",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        setCouponError(data.error || "Cupom inválido ou expirado.");
        setAppliedCoupon(null);
        return;
      }

      setAppliedCoupon({
        code: data.coupon.code,
        name: data.coupon.name,
        discountType: data.coupon.discountType,
        discountValue: Number(data.coupon.discountValue),
        durationMonths: data.coupon.durationMonths,
        durationLabel: data.coupon.durationLabel,
        applicablePlanIds: data.coupon.plans?.map((p: { planId: string }) => p.planId) || [],
      });
    } catch {
      setCouponError("Erro ao validar cupom. Tente novamente.");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  };

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
          cycle,
          couponCode: appliedCoupon?.code || undefined,
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
      const redirectUrl = data.checkoutUrl || data.invoiceUrl;
      if (redirectUrl) {
        window.location.assign(redirectUrl);
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

      {/* Barra de Cupom de Desconto para Cliente Base */}
      <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs">
        {appliedCoupon ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-foreground">
                  Cupom {appliedCoupon.code} aplicado: {appliedCoupon.durationLabel}
                </span>
                <p className="text-muted-foreground text-[11px]">
                  Os planos elegíveis abaixo já estão exibindo os valores promocionais calculados.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveCoupon}
              className="text-xs text-rose-500 hover:underline font-semibold cursor-pointer text-left sm:text-right"
            >
              Remover cupom
            </button>
          </div>
        ) : (
          <form onSubmit={handleValidateCoupon} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-semibold text-foreground">
                Possui um cupom de desconto?
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value.toUpperCase());
                  if (couponError) setCouponError(null);
                }}
                placeholder="Código do cupom (Ex: PROMO3MESES)"
                className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-mono uppercase w-full sm:w-64"
              />
              <Button
                type="submit"
                size="sm"
                variant="outline"
                disabled={!couponInput.trim() || isValidatingCoupon}
                isLoading={isValidatingCoupon}
              >
                Aplicar
              </Button>
            </div>
          </form>
        )}
        {couponError && (
          <p className="text-xs text-rose-500 mt-2">{couponError}</p>
        )}
      </div>

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

            const isCouponApplicable =
              appliedCoupon &&
              (!appliedCoupon.applicablePlanIds ||
                appliedCoupon.applicablePlanIds.length === 0 ||
                appliedCoupon.applicablePlanIds.includes(plan.id));

            let promotionalPrice: number | null = null;
            if (isCouponApplicable && displayPrice > 0) {
              if (appliedCoupon.discountType === "PERCENTAGE") {
                promotionalPrice = Math.max(
                  0,
                  Math.round(displayPrice * (1 - appliedCoupon.discountValue / 100) * 100) / 100
                );
              } else if (appliedCoupon.discountType === "FIXED_DISCOUNT") {
                promotionalPrice = Math.max(
                  0,
                  Math.round((displayPrice - appliedCoupon.discountValue) * 100) / 100
                );
              } else if (appliedCoupon.discountType === "FIXED_PRICE") {
                promotionalPrice = appliedCoupon.discountValue;
              }
            }

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
                    {promotionalPrice !== null ? (
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-heading text-3xl font-extrabold text-foreground tracking-tight">
                            {formatCurrency(promotionalPrice)}
                          </span>
                          <span className="text-sm text-muted-foreground line-through">
                            {formatCurrency(displayPrice)}
                          </span>
                          <span className="text-sm text-muted-foreground font-normal">
                            {periodLabel}
                          </span>
                        </div>
                        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          <Tag className="w-3 h-3 shrink-0" />
                          Cupom {appliedCoupon?.code} ({appliedCoupon?.durationLabel})
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="font-heading text-3xl font-extrabold text-foreground tracking-tight">
                          {formatCurrency(displayPrice)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {periodLabel}
                        </span>
                      </div>
                    )}

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
