"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Newspaper,
  Rss,
  Clock,
  ExternalLink,
  Globe,
  Tag,
  MousePointerClick,
  Layers,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Zap,
  Lock,
  LayoutDashboard,
} from "lucide-react";

import { PageHeader } from "@/components/design-system/page-header";
import { StatCard } from "@/components/design-system/stat-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

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
      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const planUsage = stats?.planUsage;
  const hasAffiliateModule = planUsage?.planSlug !== "free";

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header & Quick Navigation com PageHeader */}
      <PageHeader
        title="Visão Geral & Indicadores"
        description="Acompanhe o desempenho editorial, catálogo comercial de afiliados e consumo do plano em tempo real."
        icon={<LayoutDashboard className="w-5 h-5" />}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link href={hasAffiliateModule ? "/affiliates/products" : "/settings/billing/upgrade"}>
              <Button
                variant="outline"
                size="sm"
                leadingIcon={
                  hasAffiliateModule ? (
                    <Tag className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                  )
                }
              >
                Catálogo Afiliados
              </Button>
            </Link>

            <Link href="/settings/sources">
              <Button
                variant="outline"
                size="sm"
                leadingIcon={<Rss className="w-3.5 h-3.5 text-amber-500" />}
              >
                Gerenciar Feeds
              </Button>
            </Link>

            <Link href="/settings/billing">
              <Button
                variant="gradient"
                size="sm"
                leadingIcon={<Zap className="w-3.5 h-3.5" />}
              >
                Planos & Limites
              </Button>
            </Link>
          </div>
        }
      />

      {errorMessage && (
        <Alert variant="destructive" title="Erro de Carregamento">
          {errorMessage}
        </Alert>
      )}

      {/* Primary Metrics Grid com StatCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Articles */}
        <StatCard
          title="Artigos Pendentes"
          value={stats?.pendingCount ?? 0}
          icon={<Clock className="w-5 h-5 text-amber-500" />}
          badge={
            stats && stats.pendingCount > 0 ? (
              <Badge variant="warning" size="sm">
                Aguardando
              </Badge>
            ) : (
              <Badge variant="success" size="sm">
                Em dia
              </Badge>
            )
          }
          description="artigos na fila de revisão editorial"
          trend={stats && stats.pendingCount > 0 ? "Requer atenção" : undefined}
          trendDirection={stats && stats.pendingCount > 0 ? "neutral" : "up"}
          action={
            stats && stats.pendingCount > 0 ? (
              <Link
                href="/articles"
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
              >
                Revisar fila <ArrowRight className="w-3 h-3" />
              </Link>
            ) : undefined
          }
        />

        {/* Published Articles */}
        <StatCard
          title="Publicados no Portal"
          value={stats?.publishedCount ?? 0}
          icon={<TrendingUp className="w-5 h-5 text-[#00C2A8]" />}
          badge={<Badge variant="success" size="sm">Publicados</Badge>}
          description="conteúdo monetizado e ativo"
          trend="No ar via REST API"
          trendDirection="up"
        />

        {/* Affiliate Catalog */}
        <StatCard
          title="Catálogo Afiliados"
          value={stats?.productsCount ?? 0}
          icon={<Tag className="w-5 h-5 text-primary" />}
          badge={
            hasAffiliateModule ? (
              <Badge variant="purple" size="sm">{stats?.offersCount ?? 0} Ofertas</Badge>
            ) : (
              <Badge variant="warning" size="sm">PRO</Badge>
            )
          }
          description={`produtos no catálogo (${stats?.offersCount ?? 0} ofertas)`}
          action={
            <Link
              href={hasAffiliateModule ? "/affiliates/products" : "/settings/billing/upgrade"}
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              {hasAffiliateModule ? "Acessar catálogo" : "Fazer upgrade"} <ArrowRight className="w-3 h-3" />
            </Link>
          }
        />

        {/* Affiliate Clicks */}
        <StatCard
          title="Cliques Afiliados"
          value={stats?.affiliateClicksCount ?? 0}
          icon={<MousePointerClick className="w-5 h-5 text-[#7C3AED]" />}
          badge={
            hasAffiliateModule ? (
              <Badge variant="success" size="sm">Rastreado</Badge>
            ) : (
              <Badge variant="warning" size="sm">PRO</Badge>
            )
          }
          description="cliques rastreados nos links de compra"
          action={
            <Link
              href={hasAffiliateModule ? "/affiliates/dashboard" : "/settings/billing/upgrade"}
              className="text-xs font-semibold text-[#7C3AED] dark:text-purple-400 hover:underline inline-flex items-center gap-1"
            >
              {hasAffiliateModule ? "Ver analytics" : "Fazer upgrade"} <ArrowRight className="w-3 h-3" />
            </Link>
          }
        />
      </div>

      {/* Plan Usage & Limits Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Limits Card (2 Cols) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="w-4 h-4 text-amber-500" />
                Consumo e Limites do Plano
              </CardTitle>
              <CardDescription className="mt-0.5">
                Plano: <strong className="text-foreground">{planUsage?.planName || "Gratuito"}</strong>{" "}
                • Status:{" "}
                <span className="text-[#00C2A8] font-semibold">
                  {planUsage?.subscriptionStatus === "ACTIVE" ? "Ativo" : planUsage?.subscriptionStatus}
                </span>
              </CardDescription>
            </div>
            <Link
              href="/settings/billing/upgrade"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Fazer Upgrade
            </Link>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Daily Articles */}
              <div className="p-4 bg-surface-muted/50 rounded-xl border border-border space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-foreground">
                    Artigos por Dia (Hoje)
                  </span>
                  <span className="text-muted-foreground font-mono">
                    {planUsage?.articlesDaily.used} / {planUsage?.articlesDaily.limit}
                  </span>
                </div>
                <Progress
                  value={planUsage?.articlesDaily.percentage || 0}
                  size="sm"
                  color={
                    (planUsage?.articlesDaily.percentage || 0) >= 90
                      ? "rose"
                      : (planUsage?.articlesDaily.percentage || 0) >= 70
                      ? "amber"
                      : "primary"
                  }
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{planUsage?.articlesDaily.remaining} restantes hoje</span>
                  <span>{planUsage?.articlesDaily.percentage}%</span>
                </div>
              </div>

              {/* Monthly Articles */}
              <div className="p-4 bg-surface-muted/50 rounded-xl border border-border space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-foreground">
                    Artigos no Mês
                  </span>
                  <span className="text-muted-foreground font-mono">
                    {planUsage?.articlesMonthly.used} / {planUsage?.articlesMonthly.limit}
                  </span>
                </div>
                <Progress
                  value={planUsage?.articlesMonthly.percentage || 0}
                  size="sm"
                  color={
                    (planUsage?.articlesMonthly.percentage || 0) >= 90
                      ? "rose"
                      : (planUsage?.articlesMonthly.percentage || 0) >= 70
                      ? "amber"
                      : "teal"
                  }
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{planUsage?.articlesMonthly.remaining} restantes no ciclo</span>
                  <span>{planUsage?.articlesMonthly.percentage}%</span>
                </div>
              </div>

              {/* WordPress Sites */}
              <div className="p-4 bg-surface-muted/50 rounded-xl border border-border space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-foreground">
                    Sites WordPress Conectados
                  </span>
                  <span className="text-muted-foreground font-mono">
                    {planUsage?.wordpressSites.used} / {planUsage?.wordpressSites.limit}
                  </span>
                </div>
                <Progress
                  value={planUsage?.wordpressSites.percentage || 0}
                  size="sm"
                  color="purple"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{planUsage?.wordpressSites.remaining} slots livres</span>
                  <span>{planUsage?.wordpressSites.percentage}%</span>
                </div>
              </div>

              {/* RSS Sources */}
              <div className="p-4 bg-surface-muted/50 rounded-xl border border-border space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-foreground">
                    Fontes RSS Ativas
                  </span>
                  <span className="text-muted-foreground font-mono">
                    {planUsage?.sources.used} / {planUsage?.sources.limit}
                  </span>
                </div>
                <Progress
                  value={planUsage?.sources.percentage || 0}
                  size="sm"
                  color="amber"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{planUsage?.sources.remaining} fontes disponíveis</span>
                  <span>{planUsage?.sources.percentage}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Operations & Destination Hub (1 Col) */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="w-4 h-4 text-primary" />
              Destinos & Integrações
            </CardTitle>
            <CardDescription className="text-xs">
              Conecte novos portais WordPress e feeds RSS no motor multicanal.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 space-y-3 flex-1">
            <div className="p-3.5 bg-surface-muted/50 rounded-xl border border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">WordPress</h4>
                  <p className="text-[11px] text-muted-foreground">
                    {stats?.wordpressSitesCount ?? 0} site(s) conectado(s)
                  </p>
                </div>
              </div>
              <Link
                href="/settings/wordpress"
                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-surface rounded-lg transition-colors"
                title="Configurar WordPress"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>

            <div className="p-3.5 bg-surface-muted/50 rounded-xl border border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <Rss className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Feeds RSS</h4>
                  <p className="text-[11px] text-muted-foreground">
                    {stats?.activeSourcesCount ?? 0} fonte(s) ativa(s)
                  </p>
                </div>
              </div>
              <Link
                href="/settings/sources"
                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-surface rounded-lg transition-colors"
                title="Gerenciar Feeds"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </CardContent>

          <div className="p-6 pt-0 border-t border-border mt-4">
            <Link href="/articles" className="block w-full pt-4">
              <Button
                variant="gradient"
                className="w-full"
                leadingIcon={<Newspaper className="w-4 h-4" />}
              >
                Ver Fila de Publicação
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Feature Modules Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Affiliate Content Card */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 via-surface to-purple-500/5 border-border space-y-3">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            Motor de Conteúdo Afiliado
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Gere reviews completos, tabelas comparativas e guias de compra estruturados com grounding inteligente no catálogo de produtos importados.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Link
              href="/affiliates/products"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              Explorar Catálogo <ArrowRight className="w-3 h-3" />
            </Link>
            <span className="text-border">•</span>
            <Link
              href="/affiliates/import"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              Importar Mercado Livre <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>

        {/* Publishing Center Preparation Card */}
        <Card className="p-6 bg-gradient-to-br from-purple-500/5 via-surface to-teal-500/5 border-border space-y-3">
          <div className="flex items-center gap-2 text-[#7C3AED] dark:text-purple-400 font-semibold text-sm">
            <Layers className="w-4 h-4" />
            Central de Publicação
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Área unificada para publicação de notícias RSS e conteúdo comercial de afiliados, com inserção automática de produtos e categorização inteligente.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Link
              href="/articles"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED] dark:text-purple-400 hover:underline"
            >
              Acessar Fila de Artigos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
