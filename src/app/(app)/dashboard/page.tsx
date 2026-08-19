"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
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
  Filter,
  RotateCcw,
  Globe,
  Calendar,
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
  source?: { id: string; name: string; creditName?: string | null } | null;
  wordpressSite?: { id: string; name: string; url: string } | null;
  suggestedCategory: { id: string; name: string } | null;
  category: { id: string; name: string } | null;
}

interface SourceOption {
  id: string;
  name: string;
}

interface WordPressSiteOption {
  id: string;
  name: string;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawStatus = searchParams.get("status");
  const rawSource = searchParams.get("sourceId") || searchParams.get("feed") || "ALL";
  const rawWp = searchParams.get("wordpressSiteId") || searchParams.get("wordpress") || "ALL";
  const rawStart = searchParams.get("startDate") || "";
  const rawEnd = searchParams.get("endDate") || "";

  // Single source of truth: searchParams
  const statusFilter =
    rawStatus && ["PENDING", "PUBLISHED", "REJECTED", "ALL"].includes(rawStatus.toUpperCase())
      ? rawStatus.toUpperCase()
      : "PENDING";
  const sourceFilter = rawSource;
  const wpFilter = rawWp;
  const startDate = rawStart;
  const endDate = rawEnd;

  const [availableSources, setAvailableSources] = useState<SourceOption[]>([]);
  const [availableWpSites, setAvailableWpSites] = useState<WordPressSiteOption[]>([]);

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

  // Load filter options (Sources & WordPress Sites)
  useEffect(() => {
    let ignore = false;
    async function loadOptions() {
      try {
        const [sourcesRes, sitesRes] = await Promise.all([
          fetch("/api/sources"),
          fetch("/api/wordpress/sites"),
        ]);
        if (!ignore && sourcesRes.ok) {
          const data = await sourcesRes.json();
          setAvailableSources(data || []);
        }
        if (!ignore && sitesRes.ok) {
          const data = await sitesRes.json();
          setAvailableWpSites(data.sites || []);
        }
      } catch (err) {
        console.error("Error loading filter dropdown options:", err);
      }
    }
    loadOptions();
    return () => {
      ignore = true;
    };
  }, []);

  const fetchDashboardData = useCallback(async (
    status: string,
    sourceId: string,
    wpId: string,
    start: string,
    end: string
  ) => {
    const params = new URLSearchParams();
    if (status && status !== "ALL") params.set("status", status);
    if (sourceId && sourceId !== "ALL") params.set("sourceId", sourceId);
    if (wpId && wpId !== "ALL") params.set("wordpressSiteId", wpId);
    if (start) params.set("startDate", start);
    if (end) params.set("endDate", end);

    const queryString = params.toString() ? `?${params.toString()}` : "";

    const [statsRes, articlesRes] = await Promise.all([
      fetch("/api/dashboard/stats"),
      fetch(`/api/articles${queryString}`),
    ]);

    const newStats = statsRes.ok ? await statsRes.json() : null;
    const newArticles = articlesRes.ok ? await articlesRes.json() : null;

    return { newStats, newArticles };
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const { newStats, newArticles } = await fetchDashboardData(
        statusFilter,
        sourceFilter,
        wpFilter,
        startDate,
        endDate
      );
      if (newStats) setStats(newStats);
      if (newArticles) setArticles(newArticles);
    } catch (err) {
      console.error("Error refreshing dashboard data:", err);
      setErrorMessage("Erro ao atualizar dados.");
    }
  }, [fetchDashboardData, statusFilter, sourceFilter, wpFilter, startDate, endDate]);

  useEffect(() => {
    let ignore = false;

    fetchDashboardData(statusFilter, sourceFilter, wpFilter, startDate, endDate)
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
  }, [fetchDashboardData, statusFilter, sourceFilter, wpFilter, startDate, endDate]);

  // Update URL params
  const updateQueryParams = (newFilters: {
    status?: string;
    sourceId?: string;
    wordpressSiteId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const params = new URLSearchParams();
    const s = newFilters.status !== undefined ? newFilters.status : statusFilter;
    const src = newFilters.sourceId !== undefined ? newFilters.sourceId : sourceFilter;
    const wp = newFilters.wordpressSiteId !== undefined ? newFilters.wordpressSiteId : wpFilter;
    const start = newFilters.startDate !== undefined ? newFilters.startDate : startDate;
    const end = newFilters.endDate !== undefined ? newFilters.endDate : endDate;

    if (s && s !== "PENDING") params.set("status", s);
    if (src && src !== "ALL") params.set("sourceId", src);
    if (wp && wp !== "ALL") params.set("wordpressSiteId", wp);
    if (start) params.set("startDate", start);
    if (end) params.set("endDate", end);

    const query = params.toString() ? `?${params.toString()}` : "";
    router.replace(`/dashboard${query}`);
  };

  const handleResetFilters = () => {
    router.replace("/dashboard");
  };

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

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="hover:underline font-medium">
            Fechar
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="hover:underline font-medium">
            Fechar
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => {
            updateQueryParams({ status: "PENDING" });
          }}
          className="text-left group"
        >
          <div className="p-5 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-amber-500/50 shadow-sm dark:shadow-none transition space-y-1">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
              <span>Pendentes</span>
              <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{stats.pendingCount}</p>
          </div>
        </button>

        <button
          onClick={() => {
            updateQueryParams({ status: "PUBLISHED" });
          }}
          className="text-left group"
        >
          <div className="p-5 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-emerald-500/50 shadow-sm dark:shadow-none transition space-y-1">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
              <span>Publicadas</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{stats.publishedCount}</p>
          </div>
        </button>

        <button
          onClick={() => {
            updateQueryParams({ status: "REJECTED" });
          }}
          className="text-left group"
        >
          <div className="p-5 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-rose-500/50 shadow-sm dark:shadow-none transition space-y-1">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
              <span>Rejeitadas</span>
              <XCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{stats.rejectedCount}</p>
          </div>
        </button>

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
        {/* Filters Bar */}
        <div className="p-5 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm dark:shadow-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-white">
              <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Filtros Editoriais</span>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
              {[
                { tab: "PENDING", label: "Pendentes" },
                { tab: "PUBLISHED", label: "Publicadas" },
                { tab: "REJECTED", label: "Rejeitadas" },
                { tab: "ALL", label: "Todas" },
              ].map(({ tab, label }) => (
                <button
                  key={tab}
                  onClick={() => {
                    updateQueryParams({ status: tab });
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                    statusFilter === tab
                      ? "bg-indigo-600 text-white shadow-sm font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Feed / Source Selector */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Fonte RSS</label>
              <select
                value={sourceFilter}
                onChange={(e) => {
                  updateQueryParams({ sourceId: e.target.value });
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">Todas as Fontes</option>
                {availableSources.map((src) => (
                  <option key={src.id} value={src.id}>
                    {src.name}
                  </option>
                ))}
              </select>
            </div>

            {/* WordPress Site Destination Selector */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Destino WordPress</label>
              <select
                value={wpFilter}
                onChange={(e) => {
                  updateQueryParams({ wordpressSiteId: e.target.value });
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">Todos os Sites</option>
                {availableWpSites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Editorial Start Date */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Data Inicial (Notícia)</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  updateQueryParams({ startDate: e.target.value });
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Editorial End Date */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Data Final (Notícia)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  updateQueryParams({ endDate: e.target.value });
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Heading Bar */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Fila de Notícias ({articles.length})
          </h2>
        </div>

        {/* Articles List / Empty State */}
        {isLoading ? (
          <div className="p-12 text-center text-zinc-400 dark:text-zinc-500 text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-600 dark:text-indigo-400" />
            <span>Carregando notícias...</span>
          </div>
        ) : articles.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm dark:shadow-none">
            <p className="text-zinc-500 dark:text-zinc-400 text-xs">Nenhuma notícia encontrada para os filtros selecionados.</p>
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
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                        <Rss className="w-3.5 h-3.5" />
                        {article.source?.name || "Fonte RSS"}
                      </span>

                      {article.wordpressSite && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px]">
                          <Globe className="w-3 h-3" />
                          Destino: {article.wordpressSite.name}
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                        <Calendar className="w-3 h-3" />
                        {article.originalPublishedAt
                          ? new Date(article.originalPublishedAt).toLocaleDateString("pt-BR", {
                              timeZone: "America/Sao_Paulo",
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Data não informada pela fonte"}
                      </span>
                    </div>

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
