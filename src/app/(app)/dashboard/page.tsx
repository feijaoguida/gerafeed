"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Newspaper,
  Rss,
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  Tag,
  MousePointerClick,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Zap,
  Lock,
} from "lucide-react";

interface PlanUsageItem {
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
}

interface DashboardStatsData {
  pendingCount: number;
  publishedCount: number;
  rejectedCount: number;
  activeSourcesCount: number;
  productsCount: number;
  offersCount: number;
  affiliateClicksCount: number;
  wordpressSitesCount: number;
  planUsage: {
    planName: string;
    planSlug: string;
    subscriptionStatus: string;
    articlesDaily: PlanUsageItem;
    articlesMonthly: PlanUsageItem;
    wordpressSites: PlanUsageItem;
    sources: PlanUsageItem;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function loadStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) {
          throw new Error("Falha ao carregar métricas do painel.");
        }
        const data = await res.json();
        if (!ignore) {
          setStats(data);
        }
      } catch (err) {
        if (!ignore) {
          setErrorMessage((err as Error).message);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadStats();
    return () => {
      ignore = true;
    };
  }, []);

  if (isLoading && !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const planUsage = stats?.planUsage;
  const hasAffiliateModule = planUsage?.planSlug !== "free";

  return (
    <div className="space-y-8">
      {/* Header & Quick Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Visão Geral & Indicadores
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Acompanhe o desempenho editorial, catálogo comercial de afiliados e consumo do plano em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={hasAffiliateModule ? "/affiliates/products" : "/settings/billing/upgrade"}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg shadow-sm transition-colors ${
              hasAffiliateModule 
                ? "text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700" 
                : "text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50"
            }`}
          >
            {hasAffiliateModule ? (
              <Tag className="w-3.5 h-3.5 text-blue-600" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-amber-500" />
            )}
            Catálogo Afiliados
          </Link>
          <Link
            href="/settings/sources"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg shadow-sm transition-colors"
          >
            <Rss className="w-3.5 h-3.5 text-amber-500" />
            Gerenciar Feeds
          </Link>
          <Link
            href="/settings/billing"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            Planos & Limites
          </Link>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Articles */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Artigos Pendentes
            </span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.pendingCount ?? 0}
            </span>
            <span className="text-xs text-slate-400">aguardando revisão</span>
          </div>
          {stats && stats.pendingCount > 0 ? (
            <Link
              href="/articles"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
            >
              Revisar artigos agora <ArrowRight className="w-3 h-3" />
            </Link>
          ) : (
            <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Fila de revisão em dia
            </p>
          )}
        </div>

        {/* Published Articles */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Publicados no Portal
            </span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.publishedCount ?? 0}
            </span>
            <span className="text-xs text-slate-400">artigos publicados</span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            Conteúdo monetizado ativo
          </div>
        </div>

        {/* Affiliate Catalog */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Catálogo Afiliados
              </span>
              {!hasAffiliateModule && (
                <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded border border-amber-500/20 font-bold flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> PRO
                </span>
              )}
            </div>
            <div className={`p-2 rounded-lg ${hasAffiliateModule ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
              <Tag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.productsCount ?? 0}
            </span>
            <span className="text-xs text-slate-400">
              produtos ({stats?.offersCount ?? 0} ofertas)
            </span>
          </div>
          <Link
            href={hasAffiliateModule ? "/affiliates/products" : "/settings/billing/upgrade"}
            className={`mt-3 inline-flex items-center gap-1 text-xs font-medium hover:underline ${hasAffiliateModule ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"}`}
          >
            {hasAffiliateModule ? (
              <>Acessar catálogo <ArrowRight className="w-3 h-3" /></>
            ) : (
              <>Fazer upgrade <ArrowRight className="w-3 h-3" /></>
            )}
          </Link>
        </div>

        {/* Affiliate Clicks */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Cliques Afiliados
              </span>
              {!hasAffiliateModule && (
                <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded border border-amber-500/20 font-bold flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> PRO
                </span>
              )}
            </div>
            <div className={`p-2 rounded-lg ${hasAffiliateModule ? "bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
              <MousePointerClick className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.affiliateClicksCount ?? 0}
            </span>
            <span className="text-xs text-slate-400">cliques rastreados</span>
          </div>
          <Link
            href={hasAffiliateModule ? "/affiliates/dashboard" : "/settings/billing/upgrade"}
            className={`mt-3 inline-flex items-center gap-1 text-xs font-medium hover:underline ${hasAffiliateModule ? "text-purple-600 dark:text-purple-400" : "text-amber-600 dark:text-amber-400"}`}
          >
            {hasAffiliateModule ? (
              <>Ver analytics detalhado <ArrowRight className="w-3 h-3" /></>
            ) : (
              <>Fazer upgrade <ArrowRight className="w-3 h-3" /></>
            )}
          </Link>
        </div>
      </div>

      {/* Plan Usage & Limits Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Limits Card (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Consumo e Limites do Plano
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Plano Atual: <strong className="text-slate-900 dark:text-white">{planUsage?.planName || "Gratuito"}</strong>{" "}
                • Status:{" "}
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {planUsage?.subscriptionStatus === "ACTIVE" ? "Ativo" : planUsage?.subscriptionStatus}
                </span>
              </p>
            </div>
            <Link
              href="/settings/billing/upgrade"
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Fazer Upgrade
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Daily Articles */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Artigos por Dia (Hoje)
                </span>
                <span className="text-slate-500 font-mono">
                  {planUsage?.articlesDaily.used} / {planUsage?.articlesDaily.limit}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    (planUsage?.articlesDaily.percentage || 0) >= 90
                      ? "bg-rose-500"
                      : (planUsage?.articlesDaily.percentage || 0) >= 70
                      ? "bg-amber-500"
                      : "bg-blue-600"
                  }`}
                  style={{ width: `${planUsage?.articlesDaily.percentage || 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{planUsage?.articlesDaily.remaining} restantes hoje</span>
                <span>{planUsage?.articlesDaily.percentage}%</span>
              </div>
            </div>

            {/* Monthly Articles */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Artigos no Mês
                </span>
                <span className="text-slate-500 font-mono">
                  {planUsage?.articlesMonthly.used} / {planUsage?.articlesMonthly.limit}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    (planUsage?.articlesMonthly.percentage || 0) >= 90
                      ? "bg-rose-500"
                      : (planUsage?.articlesMonthly.percentage || 0) >= 70
                      ? "bg-amber-500"
                      : "bg-emerald-600"
                  }`}
                  style={{ width: `${planUsage?.articlesMonthly.percentage || 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{planUsage?.articlesMonthly.remaining} restantes no ciclo</span>
                <span>{planUsage?.articlesMonthly.percentage}%</span>
              </div>
            </div>

            {/* WordPress Sites */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Sites WordPress Conectados
                </span>
                <span className="text-slate-500 font-mono">
                  {planUsage?.wordpressSites.used} / {planUsage?.wordpressSites.limit}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-purple-600 transition-all duration-300"
                  style={{ width: `${planUsage?.wordpressSites.percentage || 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{planUsage?.wordpressSites.remaining} slots livres</span>
                <span>{planUsage?.wordpressSites.percentage}%</span>
              </div>
            </div>

            {/* RSS Sources */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Fontes RSS Ativas
                </span>
                <span className="text-slate-500 font-mono">
                  {planUsage?.sources.used} / {planUsage?.sources.limit}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${planUsage?.sources.percentage || 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{planUsage?.sources.remaining} fontes disponíveis</span>
                <span>{planUsage?.sources.percentage}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Operations & Destination Hub (1 Col) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            Destinos & Integrações
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Conecte novos portais WordPress e gerencie o motor de publicação multicanal.
          </p>

          <div className="space-y-3 pt-2">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-slate-500" />
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">WordPress</h4>
                  <p className="text-[11px] text-slate-400">
                    {stats?.wordpressSitesCount ?? 0} site(s) conectado(s)
                  </p>
                </div>
              </div>
              <Link
                href="/settings/wordpress"
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                title="Configurar WordPress"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Rss className="w-4 h-4 text-slate-500" />
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">Feeds RSS</h4>
                  <p className="text-[11px] text-slate-400">
                    {stats?.activeSourcesCount ?? 0} fonte(s) ativa(s)
                  </p>
                </div>
              </div>
              <Link
                href="/settings/sources"
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                title="Gerenciar Feeds"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80">
            <Link
              href="/articles"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Newspaper className="w-4 h-4" />
              Ver Fila de Publicação
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Modules Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Affiliate Content Card */}
        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 rounded-xl border border-blue-100 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            Motor de Conteúdo Afiliado (Fase 12)
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Gere reviews completos, tabelas comparativas e guias de compra estruturados com grounding inteligente no catálogo de produtos importados.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Link
              href="/affiliates/products"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Explorar Catálogo <ArrowRight className="w-3 h-3" />
            </Link>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <Link
              href="/affiliates/import"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Importar Mercado Livre <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Publishing Center Preparation Card */}
        <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-800/80 rounded-xl border border-purple-100 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-semibold text-sm">
            <Layers className="w-4 h-4" />
            Central de Publicação (Fase 18)
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Área unificada para publicação de notícias RSS e conteúdo comercial de afiliados, com inserção automática de produtos e categorização inteligente.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Link
              href="/articles"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
            >
              Acessar Fila de Artigos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
