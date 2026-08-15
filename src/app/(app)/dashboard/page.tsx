"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  RefreshCw,
  Newspaper,
  Rss,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Edit3,
  AlertCircle,
  FolderSync,
  ArrowRight,
} from "lucide-react";

interface DashboardStats {
  pendingCount: number;
  publishedCount: number;
  rejectedCount: number;
  activeSourcesCount: number;
}

interface Article {
  id: string;
  originalTitle: string;
  title: string | null;
  summary: string | null;
  originalUrl: string;
  originalPublishedAt: string | null;
  createdAt: string;
  status: "PENDING" | "PUBLISHED" | "REJECTED";
  aiScore: number | null;
  source?: { id: string; name: string } | null;
  suggestedCategory: { id: string; name: string } | null;
  category: { id: string; name: string } | null;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const rawStatus = searchParams.get("status");

  // Derived filter from URL search params (defaults to PENDING)
  const statusFilter = (rawStatus && ["PENDING", "PUBLISHED", "REJECTED", "ALL"].includes(rawStatus.toUpperCase()))
    ? rawStatus.toUpperCase()
    : "PENDING";

  const [stats, setStats] = useState<DashboardStats>({
    pendingCount: 0,
    publishedCount: 0,
    rejectedCount: 0,
    activeSourcesCount: 0,
  });

  const [articles, setArticles] = useState<Article[]>([]);

  const [isProcessingRss, setIsProcessingRss] = useState(false);
  const [isSyncingWp, setIsSyncingWp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (filter: string) => {
    const [statsRes, articlesRes] = await Promise.all([
      fetch("/api/dashboard/stats"),
      fetch(`/api/articles${filter !== "ALL" ? `?status=${filter}` : ""}`),
    ]);

    const newStats = statsRes.ok ? await statsRes.json() : null;
    const newArticles = articlesRes.ok ? await articlesRes.json() : null;

    return { newStats, newArticles };
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const { newStats, newArticles } = await fetchDashboardData(statusFilter);
      if (newStats) setStats(newStats);
      if (newArticles) setArticles(newArticles);
    } catch (err) {
      console.error("Error refreshing dashboard data:", err);
      setErrorMessage("Erro ao atualizar dados.");
    }
  }, [fetchDashboardData, statusFilter]);

  useEffect(() => {
    let ignore = false;

    fetchDashboardData(statusFilter)
      .then(({ newStats, newArticles }) => {
        if (ignore) return;
        if (newStats) setStats(newStats);
        if (newArticles) setArticles(newArticles);
      })
      .catch((err) => {
        if (ignore) return;
        console.error("Error loading dashboard data:", err);
        setErrorMessage("Erro ao carregar dados do dashboard.");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [fetchDashboardData, statusFilter]);

  // Action: Process 5 RSS items
  const handleProcessRss = async () => {
    if (isProcessingRss) return;
    setIsProcessingRss(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/rss/process", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao processar fontes RSS.");
      }

      setSuccessMessage(data.message || `${data.processedCount || 0} notícia(s) processadas.`);
      await refreshData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro no processamento RSS.";
      setErrorMessage(msg);
    } finally {
      setIsProcessingRss(false);
    }
  };

  // Action: Sync WordPress Categories
  const handleSyncWordPress = async () => {
    if (isSyncingWp) return;
    setIsSyncingWp(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/wordpress/categories/sync", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao sincronizar categorias com o WordPress.");
      }

      setSuccessMessage(`${data.syncedCount || 0} categoria(s) sincronizadas do WordPress.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro na sincronização do WordPress.";
      setErrorMessage(msg);
    } finally {
      setIsSyncingWp(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800/80">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Dashboard Editorial</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Fila de curadoria e processamento de inteligência artificial</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncWordPress}
            disabled={isSyncingWp}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none transition disabled:opacity-50"
          >
            <FolderSync className={`w-4 h-4 ${isSyncingWp ? "animate-spin text-indigo-500" : ""}`} />
            {isSyncingWp ? "Sincronizando..." : "Sincronizar Categorias WP"}
          </button>

          <button
            onClick={handleProcessRss}
            disabled={isProcessingRss}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isProcessingRss ? "animate-spin" : ""}`} />
            {isProcessingRss ? "Processando RSS..." : "Processar 5 notícias"}
          </button>
        </div>
      </div>

      {/* Feedback Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-xs text-rose-500 hover:underline">
            Fechar
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-xs text-emerald-600 hover:underline">
            Fechar
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link href="/dashboard?status=PENDING" className="block group">
          <div className="p-5 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-amber-500/50 shadow-sm dark:shadow-none transition space-y-1">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
              <span>Pendentes de Revisão</span>
              <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{stats.pendingCount}</p>
          </div>
        </Link>

        <Link href="/dashboard?status=PUBLISHED" className="block group">
          <div className="p-5 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-emerald-500/50 shadow-sm dark:shadow-none transition space-y-1">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
              <span>Publicadas no WordPress</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{stats.publishedCount}</p>
          </div>
        </Link>

        <Link href="/dashboard?status=REJECTED" className="block group">
          <div className="p-5 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-rose-500/50 shadow-sm dark:shadow-none transition space-y-1">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
              <span>Rejeitadas</span>
              <XCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{stats.rejectedCount}</p>
          </div>
        </Link>

        <Link href="/settings/sources" className="block group">
          <div className="p-5 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-indigo-500/50 shadow-sm dark:shadow-none transition space-y-1">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
              <span>Fontes RSS Ativas</span>
              <Rss className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{stats.activeSourcesCount}</p>
          </div>
        </Link>
      </section>

      {/* Main Articles List Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Fila de Notícias ({articles.length})
          </h2>

          {/* Status Filter Link Tabs */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
            {[
              { tab: "PENDING", label: "Pendentes" },
              { tab: "PUBLISHED", label: "Publicadas" },
              { tab: "REJECTED", label: "Rejeitadas" },
              { tab: "ALL", label: "Todas" },
            ].map(({ tab, label }) => (
              <Link
                key={tab}
                href={tab === "PENDING" ? "/dashboard" : `/dashboard?status=${tab}`}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  statusFilter === tab
                    ? "bg-indigo-600 text-white shadow-sm font-semibold"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Articles List / Empty State */}
        {isLoading ? (
          <div className="p-12 text-center text-zinc-400 dark:text-zinc-500 text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-600 dark:text-indigo-400" />
            <span>Carregando notícias...</span>
          </div>
        ) : articles.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm dark:shadow-none">
            <p className="text-zinc-500 dark:text-zinc-400 text-xs">Nenhuma notícia encontrada para este filtro.</p>
            <button
              onClick={handleProcessRss}
              disabled={isProcessingRss}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 transition"
            >
              <Sparkles className="w-4 h-4" />
              Processar 5 Notícias Agora
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <div
                key={article.id}
                className="p-5 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700/80 transition space-y-3 shadow-sm dark:shadow-none"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <Rss className="w-3.5 h-3.5" />
                      {article.source?.name || "Fonte RSS"}
                    </span>
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-white leading-snug">
                      {article.title || article.originalTitle}
                    </h3>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ${
                      article.status === "PENDING"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        : article.status === "PUBLISHED"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                    }`}
                  >
                    {article.status === "PENDING"
                      ? "Pendente"
                      : article.status === "PUBLISHED"
                      ? "Publicada"
                      : "Rejeitada"}
                  </span>
                </div>

                {article.summary && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {article.summary}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-xs text-zinc-500">
                  <div className="flex items-center gap-3">
                    {/* AI Score Badge */}
                    {article.aiScore !== null && (
                      <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20">
                        <Sparkles className="w-3 h-3" />
                        Score: {article.aiScore}
                      </span>
                    )}

                    {/* Suggested Category Badge */}
                    {article.suggestedCategory && (
                      <span className="text-zinc-500 dark:text-zinc-400">
                        Cat: <strong className="text-zinc-700 dark:text-zinc-300 font-normal">{article.suggestedCategory.name}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <a
                      href={article.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition"
                    >
                      Original <ExternalLink className="w-3 h-3" />
                    </a>

                    {/* Navigation link to edit/review page */}
                    <Link
                      href={`/articles/${article.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Revisar
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RSS Sources Link Footer Banner */}
      <div className="p-5 rounded-xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm dark:shadow-none">
        <div>
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-white">Gerenciar Fontes RSS</h3>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Cadastre ou ative fontes de notícias nas configurações.</p>
        </div>
        <Link
          href="/settings/sources"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition self-start sm:self-auto"
        >
          Ir para Fontes RSS <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-zinc-500 animate-pulse">Carregando dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
