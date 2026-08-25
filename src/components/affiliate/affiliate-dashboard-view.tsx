"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Package,
  Tag,
  FileText,
  MousePointerClick,
  Calendar,
  Lock,
  ArrowUpRight,
  Sparkles,
  Layers,
  Globe,
  AlertCircle,
  RefreshCw,
  Award,
} from "lucide-react";
import type { AffiliateDashboardStats } from "@/lib/affiliate/analytics-service";

export function AffiliateDashboardView() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [stats, setStats] = useState<AffiliateDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaywalled, setIsPaywalled] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    async function loadStats() {
      try {
        setLoading(true);
        setError(null);
        setIsPaywalled(false);

        const res = await fetch(`/api/affiliate/analytics?period=${period}`);
        if (isCancelled) return;

        if (!res.ok) {
          if (res.status === 403) {
            setIsPaywalled(true);
            setLoading(false);
            return;
          }
          const data = await res.json();
          throw new Error(data.error || "Erro ao carregar métricas de afiliados.");
        }

        const data = (await res.json()) as AffiliateDashboardStats;
        if (!isCancelled) {
          setStats(data);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : "Erro desconhecido ao carregar analytics.");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadStats();

    return () => {
      isCancelled = true;
    };
  }, [period, refreshTrigger]);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Max clicks for timeline bar scaling
  const maxDailyClicks = stats?.timeSeries?.reduce((max, pt) => Math.max(max, pt.clicks), 0) || 1;

  if (isPaywalled) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm my-8">
        <div className="w-16 h-16 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-500/20 shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight mb-3">
          Analytics de Afiliados Exclusivo
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
          O rastreamento de cliques, rankings de produtos e componentes requer a funcionalidade{" "}
          <strong className="text-zinc-900 dark:text-zinc-200">Analytics de Afiliados</strong> ativa no seu plano.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/settings"
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition shadow-sm"
          >
            Fazer Upgrade de Plano
          </Link>
          <Link
            href="/affiliates/products"
            className="w-full sm:w-auto px-6 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-xl transition"
          >
            Voltar ao Catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Dashboard de Afiliados
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Rastreamento de cliques em tempo real, desempenho de produtos e engajamento comercial.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700/60 self-start sm:self-auto">
          {(
            [
              { label: "7 Dias", value: "7d" },
              { label: "30 Dias", value: "30d" },
              { label: "90 Dias", value: "90d" },
              { label: "Tudo", value: "all" },
            ] as const
          ).map((item) => (
            <button
              key={item.value}
              onClick={() => setPeriod(item.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                period === item.value
                  ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-zinc-200/60 dark:border-zinc-700/60"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition"
            title="Atualizar dados"
            aria-label="Atualizar métricas"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clicks in Period */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Cliques no Período
            </span>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {loading ? "..." : stats?.summary?.periodClicks?.toLocaleString("pt-BR") || "0"}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              / {loading ? "..." : stats?.summary?.totalAllTimeClicks?.toLocaleString("pt-BR") || "0"} total
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Rastreamento non-blocking verificado</span>
          </div>
        </div>

        {/* Products in Catalog */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Produtos no Catálogo
            </span>
            <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {loading ? "..." : stats?.summary?.totalProducts || "0"}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
            Fichas técnicas e curadoria
          </div>
        </div>

        {/* Active Offers */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Ofertas Ativas
            </span>
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {loading ? "..." : stats?.summary?.totalActiveOffers || "0"}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
            Links Mercado Livre monitorados
          </div>
        </div>

        {/* Affiliate Content Articles */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Artigos Comerciais
            </span>
            <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {loading ? "..." : stats?.summary?.totalAffiliateArticles || "0"}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
            Reviews, comparativos e roundups
          </div>
        </div>
      </div>

      {/* Visual Timeline Bar Chart */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              Evolução Temporal de Cliques
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Distribuição diária de cliques no período selecionado
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>{period === "7d" ? "Últimos 7 dias" : period === "30d" ? "Últimos 30 dias" : period === "90d" ? "Últimos 90 dias" : "Histórico completo"}</span>
          </div>
        </div>

        {loading ? (
          <div className="h-44 flex items-center justify-center text-xs text-zinc-400 animate-pulse">
            Carregando evolução de cliques...
          </div>
        ) : !stats?.timeSeries || stats.timeSeries.length === 0 ? (
          <div className="h-44 flex items-center justify-center text-xs text-zinc-400">
            Nenhum clique registrado no período selecionado.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="h-44 flex items-end gap-1.5 sm:gap-2 pt-4 px-2 overflow-x-auto">
              {stats.timeSeries.map((point) => {
                const heightPercent = maxDailyClicks > 0 ? Math.max((point.clicks / maxDailyClicks) * 100, 6) : 6;
                return (
                  <div
                    key={point.date}
                    className="flex-1 min-w-[20px] max-w-[40px] flex flex-col items-center gap-1.5 group relative"
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                      <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[11px] font-bold px-2 py-1 rounded-md shadow-lg whitespace-nowrap">
                        {point.clicks} clique{point.clicks === 1 ? "" : "s"} em {point.formattedDate}
                      </div>
                      <div className="w-2 h-2 bg-zinc-900 dark:bg-zinc-100 rotate-45 -mt-1" />
                    </div>

                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        point.clicks > 0
                          ? "bg-emerald-500 hover:bg-emerald-400 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                          : "bg-zinc-100 dark:bg-zinc-800"
                      }`}
                    />
                    <span className="text-[10px] text-zinc-400 rotate-45 sm:rotate-0 mt-1 whitespace-nowrap">
                      {point.formattedDate}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Rankings Grid (2x2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Top Produtos Mais Clicados
                </h3>
              </div>
              <span className="text-[11px] text-zinc-400 font-medium">Cliques</span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-zinc-400 animate-pulse">Carregando ranking...</div>
            ) : !stats?.topProducts || stats.topProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                Ainda não há cliques registrados para produtos.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.topProducts.map((prod, index) => (
                  <div key={prod.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            index === 0
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                              : index === 1
                              ? "bg-slate-200 text-slate-700 dark:bg-zinc-700 dark:text-zinc-300"
                              : index === 2
                              ? "bg-amber-700/10 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                          {prod.name}
                        </span>
                        {prod.subtitle && (
                          <span className="text-[10px] text-zinc-400 uppercase shrink-0">
                            ({prod.subtitle})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-zinc-900 dark:text-white">{prod.clicks}</span>
                        <span className="text-[10px] text-zinc-400">({prod.percentage}%)</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        style={{ width: `${prod.percentage}%` }}
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-right">
            <Link
              href="/affiliates/products"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              Ver Catálogo Completo <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Top Articles */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Top Artigos e Reviews
                </h3>
              </div>
              <span className="text-[11px] text-zinc-400 font-medium">Cliques</span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-zinc-400 animate-pulse">Carregando ranking...</div>
            ) : !stats?.topArticles || stats.topArticles.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                Ainda não há cliques registrados em artigos.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.topArticles.map((art, index) => (
                  <div key={art.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className="w-5 h-5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                          {art.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-zinc-900 dark:text-white">{art.clicks}</span>
                        <span className="text-[10px] text-zinc-400">({art.percentage}%)</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        style={{ width: `${art.percentage}%` }}
                        className="bg-purple-600 h-full rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-right">
            <Link
              href="/dashboard?status=PUBLISHED"
              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1"
            >
              Ver Artigos Publicados <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Top Components */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              Cliques por Componente Visual
            </h3>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-zinc-400 animate-pulse">Carregando dados...</div>
          ) : !stats?.topComponents || stats.topComponents.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">Nenhum componente registrado.</div>
          ) : (
            <div className="space-y-4">
              {stats.topComponents.map((comp) => (
                <div key={comp.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{comp.name}</span>
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {comp.clicks} cliques ({comp.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      style={{ width: `${comp.percentage}%` }}
                      className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top WordPress Sites */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-lg">
              <Globe className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              Desempenho por Destino WordPress
            </h3>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-zinc-400 animate-pulse">Carregando dados...</div>
          ) : !stats?.topSites || stats.topSites.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">Nenhum site registrado.</div>
          ) : (
            <div className="space-y-4">
              {stats.topSites.map((site) => (
                <div key={site.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{site.name}</span>
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {site.clicks} cliques ({site.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      style={{ width: `${site.percentage}%` }}
                      className="bg-sky-600 h-full rounded-full transition-all duration-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transparency & Disclosure Notice */}
      <div className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 flex items-start gap-3.5">
        <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 dark:text-zinc-400 space-y-1">
          <p className="font-semibold text-slate-900 dark:text-zinc-200">
            Transparência de Rastreamento & Métricas Confiáveis
          </p>
          <p className="leading-relaxed">
            As métricas deste painel refletem os cliques auditados e autenticados originados nos seus canais e sites.
            Para preservar a integridade dos relatórios, dados de vendas, conversões e comissões só são consolidados
            mediante sincronização e relatórios oficiais dos programas de afiliados.
          </p>
        </div>
      </div>
    </div>
  );
}
