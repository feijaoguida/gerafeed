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
  CheckCircle2,
  AlertCircle,
  TrendingDown,
} from "lucide-react";
import {
  calculateAnnualPlanPrice,
  calculateAnnualSavings,
  formatCurrency,
  validatePlanPricing,
} from "@/lib/pricing";

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
    
    // Check if AI is limited
    const aiKeys = ["ai_unlimited_niches", "ai_unlimited_styles", "ai_advanced_providers"];
    const limited = features.some((f) => aiKeys.includes(f.key) && !map[f.id]?.enabled);
    
    setSelectedFeatures(map);
    setIsAiLimited(limited);
    setMessage(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const numMonthlyPrice = Number(monthlyPrice) || 0;
    const numDiscount = Number(annualDiscountPercent) || 0;

    const validation = validatePlanPricing(numMonthlyPrice, numDiscount);
    if (!validation.valid) {
      setMessage({ type: "error", text: validation.error || "Preço ou desconto inválido." });
      setIsLoading(false);
      return;
    }

    const featurePayload = Object.entries(selectedFeatures)
      .filter(([, val]) => val.enabled)
      .map(([featureId, val]) => ({
        featureId,
        enabled: val.enabled,
        limit: val.limit,
      }));

    try {
      const url = editingPlan ? `/api/backoffice/plans/${editingPlan.id}` : `/api/backoffice/plans`;
      const method = editingPlan ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          description,
          monthlyPrice: numMonthlyPrice,
          annualDiscountPercent: numDiscount,
          price: numMonthlyPrice,
          periodicity,
          active,
          highlight,
          maxArticles: Number(maxArticles),
          maxDailyArticles: Number(maxDailyArticles),
          maxSources: Number(maxSources),
          maxWordPressSites: Number(maxWordPressSites),
          features: featurePayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar plano.");

      if (editingPlan) {
        setPlans((prev) => prev.map((p) => (p.id === data.id ? data : p)));
      } else {
        setPlans((prev) => [...prev, data]);
      }

      setIsModalOpen(false);
      setMessage({ type: "success", text: `Plano ${data.name} salvo com sucesso!` });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erro ao salvar." });
    } finally {
      setIsLoading(false);
    }
  };

  const previewAnnualPrice = calculateAnnualPlanPrice(monthlyPrice || 0, annualDiscountPercent || 0);
  const previewAnnualSavings = calculateAnnualSavings(monthlyPrice || 0, annualDiscountPercent || 0);

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-400" />
            Planos & Features Globais
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Cadastre planos comerciais com preços mensais e descontos anuais, configure limites de artigos, fontes e vincule features.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition shadow-md shadow-amber-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Plano</span>
        </button>
      </div>

      {/* Global Alerts */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 border ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/20 text-rose-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const planMonthly = plan.monthlyPrice !== undefined ? Number(plan.monthlyPrice) : plan.price;
          const planDiscount = plan.annualDiscountPercent !== undefined ? Number(plan.annualDiscountPercent) : 0;
          const annualCalculated = calculateAnnualPlanPrice(planMonthly, planDiscount);
          const annualSavings = calculateAnnualSavings(planMonthly, planDiscount);

          return (
            <div
              key={plan.id}
              className={`p-6 rounded-xl bg-zinc-950 border flex flex-col justify-between space-y-6 shadow-sm transition ${
                plan.highlight ? "border-amber-500/50 ring-1 ring-amber-500/20" : "border-zinc-800"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
                    {plan.slug}
                  </span>
                  <div className="flex items-center gap-2">
                    {plan.highlight && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        DESTAQUE
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                        plan.active
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-zinc-800 text-zinc-500 border-zinc-700"
                      }`}
                    >
                      {plan.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                  {plan.description && (
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{plan.description}</p>
                  )}
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">
                      {formatCurrency(planMonthly)}
                    </span>
                    <span className="text-xs text-zinc-500">/mês</span>
                  </div>

                  {planMonthly > 0 && (
                    <div className="mt-2 p-2 rounded bg-zinc-900/60 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span>Anual: <strong className="text-white">{formatCurrency(annualCalculated)}</strong> /ano</span>
                        {planDiscount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                            -{planDiscount}% OFF
                          </span>
                        )}
                      </div>
                      {planDiscount > 0 && (
                        <div className="text-[10px] text-emerald-400/90 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" />
                          <span>Economia de {formatCurrency(annualSavings)}/ano</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-zinc-800/80 space-y-2.5 text-xs text-zinc-300">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Limite de Artigos / Dia:</span>
                    <span className="font-semibold text-white">
                      {plan.maxDailyArticles === -1 ? "Ilimitado" : plan.maxDailyArticles}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Limite de Artigos / Mês:</span>
                    <span className="font-semibold text-white">
                      {plan.maxArticles === -1 ? "Ilimitado" : plan.maxArticles}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Limite Sites WordPress:</span>
                    <span className="font-semibold text-white">
                      {plan.maxWordPressSites === -1 ? "Ilimitado" : plan.maxWordPressSites}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Limite de Fontes RSS:</span>
                    <span className="font-semibold text-white">
                      {plan.maxSources === -1 ? "Ilimitado" : plan.maxSources}
                    </span>
                  </div>
                </div>

                {/* Linked Features */}
                {plan.planFeatures && plan.planFeatures.length > 0 && (
                  <div className="pt-3 border-t border-zinc-800/60 space-y-1.5">
                    <p className="text-[10px] font-mono uppercase text-zinc-500">Features Inclusas:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {plan.planFeatures
                        .filter((pf) => pf.enabled)
                        .map((pf) => (
                          <span
                            key={pf.id}
                            className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-1"
                          >
                            <Zap className="w-2.5 h-2.5 text-amber-400" />
                            {pf.feature?.name || pf.featureId}
                            {pf.limit ? ` (${pf.limit})` : ""}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => openEditModal(plan)}
                className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar Plano</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                {editingPlan ? "Editar Plano" : "Novo Plano Comercial"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Nome do Plano</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Plano Pro"
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Slug Único</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="Ex: pro"
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Descrição</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição comercial dos benefícios..."
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Preço Mensal (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={monthlyPrice}
                    onChange={(e) => setMonthlyPrice(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Desconto Anual (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={annualDiscountPercent}
                    onChange={(e) => setAnnualDiscountPercent(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Automatic Live Preview Box */}
              <div className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-1.5 text-xs">
                <span className="font-semibold text-amber-400 text-[11px] uppercase tracking-wider block">
                  Preview de Precificação Comercial
                </span>
                <div className="grid grid-cols-2 gap-2 text-zinc-300">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Preço mensal:</span>
                    <strong className="text-white">{formatCurrency(monthlyPrice || 0)}</strong> /mês
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Preço anual calculado:</span>
                    <strong className="text-amber-300">{formatCurrency(previewAnnualPrice)}</strong> /ano
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Desconto configurado:</span>
                    <span className="text-emerald-400 font-semibold">{Number(annualDiscountPercent || 0)}%</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Economia anual:</span>
                    <span className="text-emerald-400 font-semibold">{formatCurrency(previewAnnualSavings)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Limite Artigos/Mês (-1 p/ ilimitado)
                  </label>
                  <input
                    type="number"
                    required
                    value={maxArticles}
                    onChange={(e) => setMaxArticles(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Limite Artigos/Dia (-1 p/ ilimitado)
                  </label>
                  <input
                    type="number"
                    required
                    value={maxDailyArticles}
                    onChange={(e) => setMaxDailyArticles(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Limite Fontes RSS (-1 p/ ilimitado)
                  </label>
                  <input
                    type="number"
                    required
                    value={maxSources}
                    onChange={(e) => setMaxSources(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Limite Sites WordPress (-1 p/ ilimitado)
                  </label>
                  <input
                    type="number"
                    required
                    value={maxWordPressSites}
                    onChange={(e) => setMaxWordPressSites(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="accent-amber-500 rounded"
                  />
                  <span>Plano Ativo</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={highlight}
                    onChange={(e) => setHighlight(e.target.checked)}
                    className="accent-amber-500 rounded"
                  />
                  <span>Destacar Plano (Recomendado)</span>
                </label>
              </div>

              {/* Features Toggle Section */}
              {features.length > 0 && (
                <div className="pt-3 border-t border-zinc-800 space-y-2">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Vincular Features do Sistema
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={isAiLimited}
                          onChange={(e) => {
                            const limited = e.target.checked;
                            setIsAiLimited(limited);
                            setSelectedFeatures((prev) => {
                              const next = { ...prev };
                              features.forEach((f) => {
                                if (["ai_unlimited_niches", "ai_unlimited_styles", "ai_advanced_providers"].includes(f.key)) {
                                  next[f.id] = { ...(next[f.id] || { limit: null }), enabled: !limited };
                                }
                              });
                              return next;
                            });
                          }}
                          className="accent-amber-500 rounded"
                        />
                        <div className="flex flex-col">
                          <span className="text-zinc-200 font-semibold text-amber-500">Restringir IA</span>
                          <span className="text-[10px] text-zinc-500">Limita nichos, estilos e remove provedores avançados (Gemini/Anthropic).</span>
                        </div>
                      </label>
                    </div>

                    {features.filter(f => !["ai_unlimited_niches", "ai_unlimited_styles", "ai_advanced_providers"].includes(f.key)).map((f) => {
                      const state = selectedFeatures[f.id] || { enabled: false, limit: null };
                      return (
                        <div
                          key={f.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs"
                        >
                          <label className="flex items-center gap-2 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={state.enabled}
                              onChange={(e) =>
                                setSelectedFeatures((prev) => ({
                                  ...prev,
                                  [f.id]: { ...state, enabled: e.target.checked },
                                }))
                              }
                              className="accent-amber-500 rounded"
                            />
                            <span className="text-zinc-200">{f.name}</span>
                          </label>

                          {f.valueType === "QUANTITY" && state.enabled && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-zinc-500">Limite:</span>
                              <input
                                type="number"
                                value={state.limit ?? 0}
                                onChange={(e) =>
                                  setSelectedFeatures((prev) => ({
                                    ...prev,
                                    [f.id]: {
                                      ...state,
                                      limit: parseInt(e.target.value, 10) || 0,
                                    },
                                  }))
                                }
                                className="w-16 px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-700 text-xs text-white"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isLoading ? "Salvando..." : "Salvar Plano"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
