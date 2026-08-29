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
  Globe,
  RefreshCw,
  Award,
  Layers,
} from "lucide-react";
import type { AffiliateDashboardStats } from "@/lib/affiliate/analytics-service";

import { PageHeader } from "@/components/design-system/page-header";
import { StatCard } from "@/components/design-system/stat-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

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

  const maxDailyClicks = stats?.timeSeries?.reduce((max, pt) => Math.max(max, pt.clicks), 0) || 1;

  if (isPaywalled) {
    return (
      <Card className="p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xs my-8 space-y-6">
        <div className="w-16 h-16 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-bold text-foreground tracking-tight">
            Analytics de Afiliados Exclusivo
          </h2>
          <p className="font-sans text-sm text-muted-foreground leading-relaxed">
            O rastreamento de cliques, rankings de produtos e componentes requer a funcionalidade{" "}
            <strong className="text-foreground">Analytics de Afiliados</strong> ativa no seu plano.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/settings/billing/upgrade" className="w-full sm:w-auto">
            <Button variant="gradient" className="w-full sm:w-auto">
              Fazer Upgrade de Plano
            </Button>
          </Link>
          <Link href="/affiliates/products" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              Voltar ao Catálogo
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header com PageHeader */}
      <PageHeader
        title="Dashboard de Afiliados"
        description="Rastreamento de cliques em tempo real, desempenho de produtos e engajamento comercial."
        icon={<TrendingUp className="w-5 h-5" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-surface-muted rounded-xl border border-border">
              {(
                [
                  { label: "7 Dias", value: "7d" },
                  { label: "30 Dias", value: "30d" },
                  { label: "90 Dias", value: "90d" },
                  { label: "Tudo", value: "all" },
                ] as const
              ).map((item) => (
                <Button
                  key={item.value}
                  size="sm"
                  variant={period === item.value ? "secondary" : "ghost"}
                  onClick={() => setPeriod(item.value)}
                  className={period === item.value ? "bg-surface shadow-xs font-semibold text-primary" : "text-muted-foreground"}
                >
                  {item.label}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              isLoading={loading}
              leadingIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Atualizar
            </Button>
          </div>
        }
      />

      {error && (
        <Alert variant="destructive" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary KPI Cards com StatCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clicks */}
        <StatCard
          title="Cliques no Período"
          value={loading ? "..." : stats?.summary?.periodClicks?.toLocaleString("pt-BR") || "0"}
          icon={<MousePointerClick className="w-4 h-4 text-primary" />}
          badge={<Badge variant="success" size="sm">Rastreado</Badge>}
          description={`${loading ? "..." : stats?.summary?.totalAllTimeClicks?.toLocaleString("pt-BR") || "0"} cliques no total histórico`}
          trend="Tempo real ativo"
          trendDirection="up"
        />

        {/* Products in Catalog */}
        <StatCard
          title="Produtos no Catálogo"
          value={loading ? "..." : stats?.summary?.totalProducts || "0"}
          icon={<Package className="w-4 h-4 text-[#7C3AED]" />}
          badge={<Badge variant="purple" size="sm">Catálogo</Badge>}
          description="fichas técnicas e curadoria"
          trend="Monitoramento ativo"
          trendDirection="neutral"
        />

        {/* Active Offers */}
        <StatCard
          title="Ofertas Ativas"
          value={loading ? "..." : stats?.summary?.totalActiveOffers || "0"}
          icon={<Tag className="w-4 h-4 text-amber-500" />}
          badge={<Badge variant="warning" size="sm">Mercado Livre</Badge>}
          description="links de afiliados monitorados"
          trend="Preços atualizados"
          trendDirection="up"
        />

        {/* Affiliate Content Articles */}
        <StatCard
          title="Artigos Comerciais"
          value={loading ? "..." : stats?.summary?.totalAffiliateArticles || "0"}
          icon={<FileText className="w-4 h-4 text-[#00C2A8]" />}
          badge={<Badge variant="success" size="sm">Publicados</Badge>}
          description="reviews, comparativos e guias"
          trend="Monetização ativa"
          trendDirection="up"
        />
      </div>

      {/* Visual Timeline Bar Chart */}
      <Card className="p-6">
        <CardHeader className="p-0 border-b border-border pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold">
              Evolução Temporal de Cliques
            </CardTitle>
            <CardDescription className="text-xs">
              Distribuição diária de cliques no período selecionado
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>{period === "7d" ? "Últimos 7 dias" : period === "30d" ? "Últimos 30 dias" : period === "90d" ? "Últimos 90 dias" : "Histórico completo"}</span>
          </div>
        </CardHeader>

        <CardContent className="p-0 pt-6">
          {loading ? (
            <div className="h-44 flex items-center justify-center text-xs text-muted-foreground">
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ) : !stats?.timeSeries || stats.timeSeries.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs text-muted-foreground">
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
                        <div className="bg-popover text-popover-foreground text-[11px] font-bold px-2 py-1 rounded-md shadow-lg whitespace-nowrap border border-border">
                          {point.clicks} clique{point.clicks === 1 ? "" : "s"} em {point.formattedDate}
                        </div>
                        <div className="w-2 h-2 bg-popover rotate-45 -mt-1 border-r border-b border-border" />
                      </div>

                      {/* Bar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          point.clicks > 0
                            ? "bg-gradient-to-t from-[#2563EB] to-[#7C3AED] hover:opacity-90"
                            : "bg-surface-muted"
                        }`}
                      />
                      <span className="text-[10px] text-muted-foreground rotate-45 sm:rotate-0 mt-1 whitespace-nowrap">
                        {point.formattedDate}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rankings Grid (2x2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card className="p-6 flex flex-col justify-between shadow-xs">
          <div>
            <CardHeader className="p-0 border-b border-border pb-4 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                  <Package className="w-4 h-4" />
                </div>
                <CardTitle className="text-sm font-bold">
                  Top Produtos Mais Clicados
                </CardTitle>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">Cliques</span>
            </CardHeader>

            <CardContent className="p-0 pt-4">
              {loading ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
              ) : !stats?.topProducts || stats.topProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Ainda não há cliques registrados para produtos.
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.topProducts.map((prod, index) => (
                    <div key={prod.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                            {index + 1}
                          </span>
                          <span className="font-semibold text-foreground truncate">
                            {prod.name}
                          </span>
                          {prod.subtitle && (
                            <span className="text-[10px] text-muted-foreground uppercase shrink-0">
                              ({prod.subtitle})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-foreground">{prod.clicks}</span>
                          <span className="text-[10px] text-muted-foreground">({prod.percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-surface-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          style={{ width: `${prod.percentage}%` }}
                          className="bg-primary h-full rounded-full transition-all duration-300"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </div>

          <div className="mt-4 pt-3 border-t border-border text-right">
            <Link
              href="/affiliates/products"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              Ver Catálogo Completo <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>

        {/* Top Articles */}
        <Card className="p-6 flex flex-col justify-between shadow-xs">
          <div>
            <CardHeader className="p-0 border-b border-border pb-4 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-500/10 text-[#7C3AED] dark:text-purple-400 rounded-lg">
                  <FileText className="w-4 h-4" />
                </div>
                <CardTitle className="text-sm font-bold">
                  Top Artigos e Reviews
                </CardTitle>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">Cliques</span>
            </CardHeader>

            <CardContent className="p-0 pt-4">
              {loading ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
              ) : !stats?.topArticles || stats.topArticles.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Ainda não há cliques registrados em artigos.
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.topArticles.map((art, index) => (
                    <div key={art.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span className="w-5 h-5 rounded-full bg-purple-500/10 text-[#7C3AED] dark:text-purple-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {index + 1}
                          </span>
                          <span className="font-semibold text-foreground truncate">
                            {art.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-foreground">{art.clicks}</span>
                          <span className="text-[10px] text-muted-foreground">({art.percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-surface-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          style={{ width: `${art.percentage}%` }}
                          className="bg-[#7C3AED] h-full rounded-full transition-all duration-300"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </div>

          <div className="mt-4 pt-3 border-t border-border text-right">
            <Link
              href="/dashboard?status=PUBLISHED"
              className="text-xs font-semibold text-[#7C3AED] dark:text-purple-400 hover:underline inline-flex items-center gap-1"
            >
              Ver Artigos Publicados <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>

        {/* Top Components */}
        <Card className="p-6 shadow-xs">
          <CardHeader className="p-0 border-b border-border pb-4 flex flex-row items-center gap-2">
            <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
            <CardTitle className="text-sm font-bold">
              Cliques por Componente Visual
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0 pt-4">
            {loading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ) : !stats?.topComponents || stats.topComponents.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Nenhum componente registrado.</div>
            ) : (
              <div className="space-y-4">
                {stats.topComponents.map((comp) => (
                  <div key={comp.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">{comp.name}</span>
                      <span className="font-bold text-foreground">
                        {comp.clicks} cliques ({comp.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-surface-muted rounded-full h-2 overflow-hidden">
                      <div
                        style={{ width: `${comp.percentage}%` }}
                        className="bg-primary h-full rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top WordPress Sites */}
        <Card className="p-6 shadow-xs">
          <CardHeader className="p-0 border-b border-border pb-4 flex flex-row items-center gap-2">
            <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
              <Globe className="w-4 h-4" />
            </div>
            <CardTitle className="text-sm font-bold">
              Desempenho por Destino WordPress
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0 pt-4">
            {loading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ) : !stats?.topSites || stats.topSites.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Nenhum site registrado.</div>
            ) : (
              <div className="space-y-4">
                {stats.topSites.map((site) => (
                  <div key={site.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">{site.name}</span>
                      <span className="font-bold text-foreground">
                        {site.clicks} cliques ({site.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-surface-muted rounded-full h-2 overflow-hidden">
                      <div
                        style={{ width: `${site.percentage}%` }}
                        className="bg-[#00C2A8] h-full rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transparency & Disclosure Notice */}
      <Card className="p-5 flex items-start gap-3.5 bg-surface-muted/30">
        <Award className="w-5 h-5 text-[#00C2A8] shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">
            Transparência de Rastreamento & Métricas Confiáveis
          </p>
          <p className="leading-relaxed">
            As métricas deste painel refletem os cliques auditados originados nos seus canais e sites.
            Para preservar a integridade dos relatórios, dados de vendas, conversões e comissões só são consolidados
            mediante relatórios oficiais dos programas de afiliados.
          </p>
        </div>
      </Card>
    </div>
  );
}
