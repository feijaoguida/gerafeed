"use client";

import { useState } from "react";
import {
  Layers,
  Plus,
  Edit2,
  Check,
  X,
  Sparkles,
  Zap,
  TrendingDown,
} from "lucide-react";
import {
  calculateAnnualPlanPrice,
  calculateAnnualSavings,
  formatCurrency,
  validatePlanPricing,
} from "@/lib/pricing";

import { PageHeader } from "@/components/design-system/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/design-system/form-field";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

interface Feature {
  id: string;
  key: string;
  name: string;
  description: string | null;
  valueType: "BOOLEAN" | "QUANTITY";
  active: boolean;
}

interface PlanFeature {
  id: string;
  planId: string;
  featureId: string;
  enabled: boolean;
  limit: number | null;
  feature: Feature;
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  monthlyPrice?: number | string;
  annualDiscountPercent?: number | string;
  periodicity: string;
  active: boolean;
  highlight: boolean;
  maxArticles: number;
  maxDailyArticles: number;
  maxSources: number;
  maxWordPressSites: number;
  planFeatures: PlanFeature[];
  _count?: { subscriptions: number };
}

interface PlanManagerProps {
  initialPlans: Plan[];
  initialFeatures: Feature[];
}

export function PlanManager({ initialPlans, initialFeatures }: PlanManagerProps) {
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [features] = useState<Feature[]>(initialFeatures);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isAiLimited, setIsAiLimited] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState<number | string>(0);
  const [annualDiscountPercent, setAnnualDiscountPercent] = useState<number | string>(0);
  const [periodicity, setPeriodicity] = useState("MONTHLY");
  const [active, setActive] = useState(true);
  const [highlight, setHighlight] = useState(false);
  const [maxArticles, setMaxArticles] = useState(50);
  const [maxDailyArticles, setMaxDailyArticles] = useState(5);
  const [maxSources, setMaxSources] = useState(3);
  const [maxWordPressSites, setMaxWordPressSites] = useState(1);

  // Selected features state: Record<featureId, { enabled: boolean; limit?: number }>
  const [selectedFeatures, setSelectedFeatures] = useState<
    Record<string, { enabled: boolean; limit?: number | null }>
  >({});

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const openCreateModal = () => {
    setEditingPlan(null);
    setName("");
    setSlug("");
    setDescription("");
    setMonthlyPrice(0);
    setAnnualDiscountPercent(0);
    setPeriodicity("MONTHLY");
    setActive(true);
    setHighlight(false);
    setMaxArticles(50);
    setMaxDailyArticles(5);
    setMaxSources(3);
    setMaxWordPressSites(1);

    const initialMap: Record<string, { enabled: boolean; limit?: number | null }> = {};
    for (const f of features) {
      initialMap[f.id] = { enabled: true, limit: f.valueType === "QUANTITY" ? 10 : null };
    }
    setSelectedFeatures(initialMap);
    setIsAiLimited(false);
    setMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setSlug(plan.slug);
    setDescription(plan.description || "");
    setMonthlyPrice(plan.monthlyPrice !== undefined ? Number(plan.monthlyPrice) : plan.price);
    setAnnualDiscountPercent(plan.annualDiscountPercent !== undefined ? Number(plan.annualDiscountPercent) : 0);
    setPeriodicity(plan.periodicity);
    setActive(plan.active);
    setHighlight(plan.highlight);
    setMaxArticles(plan.maxArticles);
    setMaxDailyArticles(plan.maxDailyArticles);
    setMaxSources(plan.maxSources);
    setMaxWordPressSites(plan.maxWordPressSites);

    const map: Record<string, { enabled: boolean; limit?: number | null }> = {};
    for (const f of features) {
      const existing = plan.planFeatures?.find((pf) => pf.featureId === f.id);
      map[f.id] = {
        enabled: existing ? existing.enabled : false,
        limit: existing?.limit !== undefined ? existing.limit : (f.valueType === "QUANTITY" ? 10 : null),
      };
    }
    setSelectedFeatures(map);

    const unlimitedNichesFeature = features.find((f) => f.key === "ai_unlimited_niches");
    const unlimitedStylesFeature = features.find((f) => f.key === "ai_unlimited_styles");
    const advancedProvidersFeature = features.find((f) => f.key === "ai_advanced_providers");

    const hasAnyRestricted =
      (unlimitedNichesFeature && !map[unlimitedNichesFeature.id]?.enabled) ||
      (unlimitedStylesFeature && !map[unlimitedStylesFeature.id]?.enabled) ||
      (advancedProvidersFeature && !map[advancedProvidersFeature.id]?.enabled);

    setIsAiLimited(Boolean(hasAnyRestricted));
    setMessage(null);
    setIsModalOpen(true);
  };

  const handleAiLimitedToggle = (limitActive: boolean) => {
    setIsAiLimited(limitActive);

    const unlimitedNiches = features.find((f) => f.key === "ai_unlimited_niches");
    const unlimitedStyles = features.find((f) => f.key === "ai_unlimited_styles");
    const advancedProviders = features.find((f) => f.key === "ai_advanced_providers");

    setSelectedFeatures((prev) => {
      const next = { ...prev };
      if (unlimitedNiches) next[unlimitedNiches.id] = { enabled: !limitActive, limit: null };
      if (unlimitedStyles) next[unlimitedStyles.id] = { enabled: !limitActive, limit: null };
      if (advancedProviders) next[advancedProviders.id] = { enabled: !limitActive, limit: null };
      return next;
    });
  };

  const handleFeatureToggle = (featureId: string, enabled: boolean) => {
    setSelectedFeatures((prev) => ({
      ...prev,
      [featureId]: {
        ...prev[featureId],
        enabled,
      },
    }));
  };

  const handleFeatureLimitChange = (featureId: string, limitVal: string) => {
    const parsed = parseInt(limitVal, 10);
    setSelectedFeatures((prev) => ({
      ...prev,
      [featureId]: {
        ...prev[featureId],
        limit: isNaN(parsed) ? null : parsed,
      },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const mPrice = typeof monthlyPrice === "string" ? parseFloat(monthlyPrice) : monthlyPrice;
    const aDiscount = typeof annualDiscountPercent === "string" ? parseFloat(annualDiscountPercent) : annualDiscountPercent;

    const validation = validatePlanPricing(mPrice, aDiscount);
    if (!validation.valid) {
      setMessage({ type: "error", text: validation.error || "Dados de precificação inválidos." });
      setIsLoading(false);
      return;
    }

    try {
      const featurePayload = Object.entries(selectedFeatures).map(([featureId, data]) => ({
        featureId,
        enabled: data.enabled,
        limit: data.limit ?? null,
      }));

      const payload = {
        name,
        slug,
        description: description || null,
        price: mPrice,
        monthlyPrice: mPrice,
        annualDiscountPercent: aDiscount,
        periodicity,
        active,
        highlight,
        maxArticles: Number(maxArticles),
        maxDailyArticles: Number(maxDailyArticles),
        maxSources: Number(maxSources),
        maxWordPressSites: Number(maxWordPressSites),
        features: featurePayload,
      };

      const url = editingPlan
        ? `/api/backoffice/plans/${editingPlan.id}`
        : "/api/backoffice/plans";
      const method = editingPlan ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar plano.");

      if (editingPlan) {
        setPlans((prev) => prev.map((p) => (p.id === data.id ? data : p)));
        setMessage({ type: "success", text: `Plano "${data.name}" atualizado com sucesso!` });
      } else {
        setPlans((prev) => [...prev, data]);
        setMessage({ type: "success", text: `Plano "${data.name}" criado com sucesso!` });
      }

      setIsModalOpen(false);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erro ao salvar." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com PageHeader */}
      <PageHeader
        title="Planos & Features"
        description="Configure os limites operacionais, tiers de preços, ciclo anual com desconto e features habilitadas por plano."
        icon={<Layers className="w-5 h-5 text-purple-500" />}
        actions={
          <Button
            variant="gradient"
            size="sm"
            onClick={openCreateModal}
            leadingIcon={<Plus className="w-4 h-4" />}
          >
            Novo Plano
          </Button>
        }
      />

      {/* Global Alerts */}
      {message && (
        <Alert
          variant={message.type === "success" ? "success" : "destructive"}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const planMonthly = plan.monthlyPrice !== undefined ? Number(plan.monthlyPrice) : plan.price;
          const planDiscount = plan.annualDiscountPercent !== undefined ? Number(plan.annualDiscountPercent) : 0;
          const annualCalculated = calculateAnnualPlanPrice(planMonthly, planDiscount);
          const annualSavings = calculateAnnualSavings(planMonthly, planDiscount);

          return (
            <Card
              key={plan.id}
              className={`p-6 flex flex-col justify-between space-y-6 shadow-xs transition-all ${
                plan.highlight ? "border-2 border-primary shadow-lg ring-1 ring-primary/20" : ""
              }`}
            >
              <div className="space-y-4">
                <CardHeader className="p-0 flex flex-row items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-primary font-bold">
                    {plan.slug}
                  </span>
                  <div className="flex items-center gap-2">
                    {plan.highlight && (
                      <Badge variant="purple" size="sm">
                        DESTAQUE
                      </Badge>
                    )}
                    <Badge variant={plan.active ? "success" : "secondary"} size="sm">
                      {plan.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-0 space-y-3">
                  <div>
                    <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                    {plan.description && (
                      <p className="font-sans text-xs text-muted-foreground mt-1 line-clamp-2">{plan.description}</p>
                    )}
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="font-heading text-3xl font-extrabold text-foreground">
                        {formatCurrency(planMonthly)}
                      </span>
                      <span className="text-xs text-muted-foreground">/mês</span>
                    </div>

                    {planMonthly > 0 && (
                      <div className="mt-2 p-2.5 rounded-xl bg-surface-muted/60 border border-border text-[11px] text-muted-foreground space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Anual: <strong className="text-foreground">{formatCurrency(annualCalculated)}</strong> /ano</span>
                          {planDiscount > 0 && (
                            <Badge variant="success" size="sm">
                              -{planDiscount}% OFF
                            </Badge>
                          )}
                        </div>
                        {planDiscount > 0 && (
                          <div className="text-[10px] text-[#00C2A8] flex items-center gap-1 font-medium">
                            <TrendingDown className="w-3 h-3" />
                            <span>Economia de {formatCurrency(annualSavings)}/ano</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-border space-y-2 text-xs text-foreground">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Limite Artigos / Dia:</span>
                      <span className="font-semibold text-foreground">
                        {plan.maxDailyArticles === -1 ? "Ilimitado" : plan.maxDailyArticles}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Limite Artigos / Mês:</span>
                      <span className="font-semibold text-foreground">
                        {plan.maxArticles === -1 ? "Ilimitado" : plan.maxArticles}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Limite Sites WordPress:</span>
                      <span className="font-semibold text-foreground">
                        {plan.maxWordPressSites === -1 ? "Ilimitado" : plan.maxWordPressSites}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Limite de Fontes RSS:</span>
                      <span className="font-semibold text-foreground">
                        {plan.maxSources === -1 ? "Ilimitado" : plan.maxSources}
                      </span>
                    </div>
                  </div>

                  {/* Linked Features */}
                  {plan.planFeatures && plan.planFeatures.length > 0 && (
                    <div className="pt-3 border-t border-border space-y-1.5">
                      <p className="text-[10px] font-mono uppercase text-muted-foreground">Features Inclusas:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {plan.planFeatures
                          .filter((pf) => pf.enabled)
                          .map((pf) => (
                            <span
                              key={pf.id}
                              className="px-2 py-0.5 rounded-md text-[10px] bg-surface-muted border border-border text-foreground flex items-center gap-1"
                            >
                              <Zap className="w-2.5 h-2.5 text-amber-500" />
                              {pf.feature?.name || pf.featureId}
                              {pf.limit ? ` (${pf.limit})` : ""}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </div>

              <CardFooter className="p-0 pt-3 border-t border-border">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openEditModal(plan)}
                  className="w-full"
                  leadingIcon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  Editar Plano
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Create / Edit Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <Card className="max-w-lg w-full p-6 space-y-5 shadow-2xl my-8 bg-surface border-border">
            <CardHeader className="p-0 flex flex-row items-center justify-between border-b border-border pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                {editingPlan ? "Editar Plano" : "Novo Plano Comercial"}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Nome do Plano" required>
                  <Input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Plano Pro"
                  />
                </FormField>

                <FormField label="Slug Único" required>
                  <Input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="Ex: pro"
                  />
                </FormField>
              </div>

              <FormField label="Descrição">
                <Input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição comercial dos benefícios..."
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Preço Mensal (R$)" required>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={monthlyPrice}
                    onChange={(e) => setMonthlyPrice(e.target.value)}
                  />
                </FormField>

                <FormField label="Desconto Anual (%)">
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={annualDiscountPercent}
                    onChange={(e) => setAnnualDiscountPercent(e.target.value)}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <FormField label="Artigos/Dia">
                  <Input
                    type="number"
                    value={maxDailyArticles}
                    onChange={(e) => setMaxDailyArticles(parseInt(e.target.value, 10) || 0)}
                  />
                </FormField>

                <FormField label="Artigos/Mês">
                  <Input
                    type="number"
                    value={maxArticles}
                    onChange={(e) => setMaxArticles(parseInt(e.target.value, 10) || 0)}
                  />
                </FormField>

                <FormField label="Sites WP">
                  <Input
                    type="number"
                    value={maxWordPressSites}
                    onChange={(e) => setMaxWordPressSites(parseInt(e.target.value, 10) || 0)}
                  />
                </FormField>

                <FormField label="Fontes RSS">
                  <Input
                    type="number"
                    value={maxSources}
                    onChange={(e) => setMaxSources(parseInt(e.target.value, 10) || 0)}
                  />
                </FormField>
              </div>

              {/* Switches */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="accent-primary h-4 w-4 rounded"
                  />
                  <span>Plano Ativo</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={highlight}
                    onChange={(e) => setHighlight(e.target.checked)}
                    className="accent-primary h-4 w-4 rounded"
                  />
                  <span>Destaque (Mais Escolhido)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <input
                    type="checkbox"
                    checked={isAiLimited}
                    onChange={(e) => handleAiLimitedToggle(e.target.checked)}
                    className="accent-amber-500 h-4 w-4 rounded"
                  />
                  <span>Restringir IA (Modo Econômico)</span>
                </label>
              </div>

              {/* Features Toggle List */}
              <div className="pt-3 border-t border-border space-y-2">
                <p className="text-xs font-bold text-foreground">Features do Sistema:</p>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {features.map((f) => {
                    const featData = selectedFeatures[f.id] || { enabled: false, limit: null };
                    return (
                      <div
                        key={f.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-surface-muted/50 border border-border text-xs"
                      >
                        <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={featData.enabled}
                            onChange={(e) => handleFeatureToggle(f.id, e.target.checked)}
                            className="accent-primary h-3.5 w-3.5 rounded"
                          />
                          <span className="font-medium text-foreground truncate">{f.name}</span>
                        </label>
                        {f.valueType === "QUANTITY" && featData.enabled && (
                          <Input
                            type="number"
                            value={featData.limit ?? ""}
                            onChange={(e) => handleFeatureLimitChange(f.id, e.target.value)}
                            placeholder="Limite"
                            className="w-20 h-7 text-xs"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <CardFooter className="p-0 flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  size="sm"
                  isLoading={isLoading}
                  leadingIcon={<Check className="w-4 h-4" />}
                >
                  {editingPlan ? "Salvar Alterações" : "Criar Plano"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
