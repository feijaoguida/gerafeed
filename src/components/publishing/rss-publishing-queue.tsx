"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  RefreshCw,
  Newspaper,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Edit3,
  AlertCircle,
  FolderSync,
  Filter,
  RotateCcw,
  Globe,
  Calendar,
  Layers,
} from "lucide-react";

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

export function RssPublishingQueue() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 animate-pulse">
          Carregando fila de notícias...
        </div>
      }
    >
      <RssPublishingQueueContent />
    </Suspense>
  );
}

function RssPublishingQueueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawStatus = searchParams.get("status");
  const rawSource = searchParams.get("sourceId") || searchParams.get("feed") || "ALL";
  const rawWp = searchParams.get("wordpressSiteId") || searchParams.get("wordpress") || "ALL";
  const rawStart = searchParams.get("startDate") || "";
  const rawEnd = searchParams.get("endDate") || "";

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

  const [articles, setArticles] = useState<Article[]>([]);
  const [isProcessingRss, setIsProcessingRss] = useState(false);
  const [isSyncingWp, setIsSyncingWp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<React.ReactNode | null>(null);
  const [successMessage, setSuccessMessage] = useState<React.ReactNode | null>(null);

  // Load filter options
  useEffect(() => {
    let ignore = false;
    async function loadOptions() {
      try {
        const [sourcesRes, sitesRes] = await Promise.all([
          fetch("/api/sources"),
          fetch("/api/wordpress/sites"),
        ]);

        if (sourcesRes.ok && !ignore) {
          const sourcesData = await sourcesRes.json();
          setAvailableSources(
            Array.isArray(sourcesData)
              ? sourcesData
              : Array.isArray(sourcesData?.sources)
              ? sourcesData.sources
              : []
          );
        }
        if (sitesRes.ok && !ignore) {
          const sitesData = await sitesRes.json();
          setAvailableWpSites(
            Array.isArray(sitesData?.sites)
              ? sitesData.sites
              : Array.isArray(sitesData)
              ? sitesData
              : []
          );
        }
      } catch (err) {
        console.error("Erro ao carregar opções de filtros:", err);
      }
    }
    loadOptions();
    return () => {
      ignore = true;
    };
  }, []);

  // Fetch articles based on query params
  const fetchArticles = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (sourceFilter !== "ALL") params.set("sourceId", sourceFilter);
      if (wpFilter !== "ALL") params.set("wordpressSiteId", wpFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/articles?${params.toString()}`);
      if (!res.ok) throw new Error("Falha ao buscar notícias.");
      const data = await res.json();
      setArticles(Array.isArray(data) ? data : Array.isArray(data?.articles) ? data.articles : []);
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function loadArticles() {
      try {
        const params = new URLSearchParams();
        if (statusFilter !== "ALL") params.set("status", statusFilter);
        if (sourceFilter !== "ALL") params.set("sourceId", sourceFilter);
        if (wpFilter !== "ALL") params.set("wordpressSiteId", wpFilter);
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);

        const res = await fetch(`/api/articles?${params.toString()}`);
        if (!res.ok) throw new Error("Falha ao buscar notícias.");
        const data = await res.json();
        if (!ignore) {
          setArticles(Array.isArray(data) ? data : Array.isArray(data?.articles) ? data.articles : []);
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

    loadArticles();
    return () => {
      ignore = true;
    };
  }, [statusFilter, sourceFilter, wpFilter, startDate, endDate]);

  const updateFilters = (newFilters: {
    status?: string;
    sourceId?: string;
    wordpressSiteId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newFilters.status !== undefined) {
      if (newFilters.status === "PENDING") params.delete("status");
      else params.set("status", newFilters.status);
    }
    if (newFilters.sourceId !== undefined) {
      if (newFilters.sourceId === "ALL") params.delete("sourceId");
      else params.set("sourceId", newFilters.sourceId);
    }
    if (newFilters.wordpressSiteId !== undefined) {
      if (newFilters.wordpressSiteId === "ALL") params.delete("wordpressSiteId");
      else params.set("wordpressSiteId", newFilters.wordpressSiteId);
    }
    if (newFilters.startDate !== undefined) {
      if (!newFilters.startDate) params.delete("startDate");
      else params.set("startDate", newFilters.startDate);
    }
    if (newFilters.endDate !== undefined) {
      if (!newFilters.endDate) params.delete("endDate");
      else params.set("endDate", newFilters.endDate);
    }

    router.push(`?${params.toString()}`);
  };

  const handleProcessRss = async () => {
    setIsProcessingRss(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/rss/process", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao processar RSS.");

      if (data.processedCount === 0 && data.message?.includes("Nenhuma fonte RSS ativa")) {
        setErrorMessage(
          <span>
            Nenhum feed RSS ativo encontrado. Cadastre suas fontes em{" "}
            <Link href="/settings/sources" className="underline font-bold hover:text-rose-700 dark:hover:text-rose-400">Configurações &gt; Fontes RSS</Link>.
          </span>
        );
      } else {
        setSuccessMessage(
          `Coleta finalizada: ${data.itemsFound || 0} notícias encontradas, ${data.itemsInserted || 0} novas cadastradas.`
        );
        fetchArticles();
      }
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsProcessingRss(false);
    }
  };

  const handleSyncWpCategories = async () => {
    setIsSyncingWp(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/wordpress/categories/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao sincronizar categorias.");

      setSuccessMessage("Categorias do WordPress sincronizadas com sucesso!");
    } catch (err) {
      const errMsg = (err as Error).message;
      if (errMsg.includes("Configuração do WordPress não encontrada")) {
        setErrorMessage(
          <span>
            Nenhuma configuração do WordPress encontrada. Configure um site WordPress em{" "}
            <Link href="/settings/wordpress" className="underline font-bold hover:text-rose-700 dark:hover:text-rose-400">Configurações &gt; WordPress</Link>.
          </span>
        );
      } else {
        setErrorMessage(errMsg);
      }
    } finally {
      setIsSyncingWp(false);
    }
  };

  const handleProcessAi = async (articleId: string) => {
    try {
      const res = await fetch(`/api/articles/${articleId}/process-ai`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Erro no processamento de IA.");

      setSuccessMessage("Artigo processado e reescrito com IA com sucesso!");
      fetchArticles();
    } catch (err) {
      setErrorMessage((err as Error).message);
    }
  };

  const handleReject = async (articleId: string) => {
    try {
      const res = await fetch(`/api/articles/${articleId}/reject`, { method: "POST" });
      if (!res.ok) throw new Error("Erro ao rejeitar notícia.");

      setSuccessMessage("Notícia rejeitada com sucesso.");
      fetchArticles();
    } catch (err) {
      setErrorMessage((err as Error).message);
    }
  };

  const handleRepublish = async (articleId: string) => {
    try {
      const res = await fetch(`/api/articles/${articleId}/republish`, { method: "POST" });
      if (!res.ok) throw new Error("Erro ao restaurar notícia.");

      setSuccessMessage("Notícia restaurada para a fila de pendentes.");
      fetchArticles();
    } catch (err) {
      setErrorMessage((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
            <Link href="/publishing" className="hover:underline flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Central de Publicação
            </Link>
            <span>/</span>
            <span>Fluxo Noticioso</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-amber-500" />
            Publicação de Notícias & Curadoria RSS
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Filtre por destino WordPress e feeds de origem, processe reescritas com IA e revise antes de publicar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSyncWpCategories}
            disabled={isSyncingWp}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <FolderSync className={`w-3.5 h-3.5 text-blue-600 ${isSyncingWp ? "animate-spin" : ""}`} />
            Sincronizar Categorias
          </button>

          <button
            onClick={handleProcessRss}
            disabled={isProcessingRss}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessingRss ? "animate-spin" : ""}`} />
            Buscar Novas Notícias nos Feeds
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-slate-400 hover:text-slate-600">
            &times;
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-slate-400 hover:text-slate-600">
            &times;
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-indigo-500" />
          Filtros de Publicação & Destino
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Status */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
              Status da Notícia
            </label>
            <select
              value={statusFilter}
              onChange={(e) => updateFilters({ status: e.target.value })}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-800 dark:text-zinc-200"
            >
              <option value="PENDING">Pendentes de Revisão</option>
              <option value="PUBLISHED">Publicadas</option>
              <option value="REJECTED">Rejeitadas</option>
              <option value="ALL">Todos os Status</option>
            </select>
          </div>

          {/* WordPress Destination */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
              Destino WordPress
            </label>
            <select
              value={wpFilter}
              onChange={(e) => updateFilters({ wordpressSiteId: e.target.value })}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-800 dark:text-zinc-200"
            >
              <option value="ALL">Todos os Portais</option>
              {(Array.isArray(availableWpSites) ? availableWpSites : []).map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>

          {/* Feed/Source */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
              Feed RSS de Origem
            </label>
            <select
              value={sourceFilter}
              onChange={(e) => updateFilters({ sourceId: e.target.value })}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-800 dark:text-zinc-200"
            >
              <option value="ALL">Todos os Feeds</option>
              {(Array.isArray(availableSources) ? availableSources : []).map((src) => (
                <option key={src.id} value={src.id}>
                  {src.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => updateFilters({ startDate: e.target.value })}
              className="w-full text-xs px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-800 dark:text-zinc-200"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
              Data Final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => updateFilters({ endDate: e.target.value })}
              className="w-full text-xs px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-800 dark:text-zinc-200"
            />
          </div>
        </div>
      </div>

      {/* Articles Queue List */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-zinc-800 rounded-xl"></div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-3">
          <Newspaper className="w-12 h-12 text-slate-300 dark:text-zinc-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-zinc-200">
            Nenhuma notícia encontrada
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
            Não há artigos correspondentes aos filtros selecionados. Clique em &quot;Buscar Novas Notícias nos Feeds&quot; para atualizar a fila de curadoria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 flex items-center justify-between">
            <span>Mostrando {(Array.isArray(articles) ? articles : []).length} notícia(s) na fila</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {(Array.isArray(articles) ? articles : []).map((art) => (
              <div
                key={art.id}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded">
                        {art.source?.name || "Feed RSS"}
                      </span>
                      {art.wordpressSite && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 rounded flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {art.wordpressSite.name}
                        </span>
                      )}
                      {art.status === "PENDING" && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 rounded flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pendente
                        </span>
                      )}
                      {art.status === "PUBLISHED" && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Publicado
                        </span>
                      )}
                      {art.status === "REJECTED" && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 rounded flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Rejeitado
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {art.title || art.originalTitle}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2">
                      {art.summary || "Notícia capturada via RSS aguardando reescrita ou revisão editorial."}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {art.originalPublishedAt
                        ? new Date(art.originalPublishedAt).toLocaleDateString("pt-BR")
                        : new Date(art.createdAt).toLocaleDateString("pt-BR")}
                    </div>

                    <a
                      href={art.originalUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      Fonte Original <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Actions toolbar */}
                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {art.status === "PENDING" && !art.title && (
                      <button
                        onClick={() => handleProcessAi(art.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        Processar com IA
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {art.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleReject(art.id)}
                          className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                        >
                          Rejeitar
                        </button>
                        <Link
                          href={`/articles/${art.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Revisar & Publicar
                        </Link>
                      </>
                    )}

                    {art.status === "REJECTED" && (
                      <button
                        onClick={() => handleRepublish(art.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restaurar para Pendentes
                      </button>
                    )}

                    {art.status === "PUBLISHED" && (
                      <Link
                        href={`/articles/${art.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Ver / Editar Publicação
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
