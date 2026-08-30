"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  RefreshCw,
  Newspaper,
  ExternalLink,
  Edit3,
  FolderSync,
  Filter,
  RotateCcw,
  Globe,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";

import { PageHeader } from "@/components/design-system/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { FormField } from "@/components/design-system/form-field";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { trackEvent } from "@/lib/analytics";

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
        <div className="p-8 text-center text-muted-foreground animate-pulse">
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
            <Link href="/settings/sources" className="underline font-bold text-primary">
              Configurações &gt; Fontes RSS
            </Link>.
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
            <Link href="/settings/wordpress" className="underline font-bold text-primary">
              Configurações &gt; WordPress
            </Link>.
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
      trackEvent("article_generated", { content_type: "rss_rewrite" });
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
      {/* Header com PageHeader */}
      <PageHeader
        title="Publicação de Notícias & Curadoria RSS"
        description="Filtre por destino WordPress e feeds de origem, processe reescritas com IA e revise antes de publicar."
        icon={<Newspaper className="w-5 h-5" />}
        badge={
          <Link href="/publishing" className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium">
            <Layers className="w-3.5 h-3.5" /> Central de Publicação
          </Link>
        }
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncWpCategories}
              isLoading={isSyncingWp}
              leadingIcon={<FolderSync className="w-3.5 h-3.5 text-primary" />}
            >
              Sincronizar Categorias
            </Button>

            <Button
              variant="gradient"
              size="sm"
              onClick={handleProcessRss}
              isLoading={isProcessingRss}
              leadingIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Buscar Novas Notícias nos Feeds
            </Button>
          </div>
        }
      />

      {/* Messages */}
      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {/* Filter Bar com Card */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-primary" />
          Filtros de Publicação & Destino
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Status */}
          <FormField label="Status da Notícia">
            <Select
              value={statusFilter}
              onChange={(e) => updateFilters({ status: e.target.value })}
            >
              <option value="PENDING">Pendentes de Revisão</option>
              <option value="PUBLISHED">Publicadas</option>
              <option value="REJECTED">Rejeitadas</option>
              <option value="ALL">Todos os Status</option>
            </Select>
          </FormField>

          {/* WordPress Destination */}
          <FormField label="Destino WordPress">
            <Select
              value={wpFilter}
              onChange={(e) => updateFilters({ wordpressSiteId: e.target.value })}
            >
              <option value="ALL">Todos os Portais</option>
              {(Array.isArray(availableWpSites) ? availableWpSites : []).map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </Select>
          </FormField>

          {/* Feed/Source */}
          <FormField label="Feed RSS de Origem">
            <Select
              value={sourceFilter}
              onChange={(e) => updateFilters({ sourceId: e.target.value })}
            >
              <option value="ALL">Todos os Feeds</option>
              {(Array.isArray(availableSources) ? availableSources : []).map((src) => (
                <option key={src.id} value={src.id}>
                  {src.name}
                </option>
              ))}
            </Select>
          </FormField>

          {/* Start Date */}
          <FormField label="Data Inicial">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => updateFilters({ startDate: e.target.value })}
            />
          </FormField>

          {/* End Date */}
          <FormField label="Data Final">
            <Input
              type="date"
              value={endDate}
              onChange={(e) => updateFilters({ endDate: e.target.value })}
            />
          </FormField>
        </div>
      </Card>

      {/* Articles Queue List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <EmptyState
          title="Nenhuma notícia encontrada"
          description="Não há artigos correspondentes aos filtros selecionados. Clique em 'Buscar Novas Notícias nos Feeds' para atualizar a fila de curadoria."
          action={
            <Button
              variant="gradient"
              onClick={handleProcessRss}
              isLoading={isProcessingRss}
              leadingIcon={<RefreshCw className="w-4 h-4" />}
            >
              Buscar Novas Notícias nos Feeds
            </Button>
          }
          secondaryAction={
            <Button
              variant="outline"
              onClick={() => updateFilters({ status: "ALL", sourceId: "ALL", wordpressSiteId: "ALL", startDate: "", endDate: "" })}
            >
              Limpar Filtros
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
            <span>Mostrando {(Array.isArray(articles) ? articles : []).length} notícia(s) na fila</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {(Array.isArray(articles) ? articles : []).map((art) => (
              <Card
                key={art.id}
                className="p-5 shadow-xs hover:border-primary/40 transition-colors space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" size="sm">
                        {art.source?.name || "Feed RSS"}
                      </Badge>
                      {art.wordpressSite && (
                        <Badge variant="secondary" size="sm" className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-primary" />
                          {art.wordpressSite.name}
                        </Badge>
                      )}
                      {art.status === "PENDING" && (
                        <Badge variant="warning" size="sm">
                          Pendente
                        </Badge>
                      )}
                      {art.status === "PUBLISHED" && (
                        <Badge variant="success" size="sm">
                          Publicado
                        </Badge>
                      )}
                      {art.status === "REJECTED" && (
                        <Badge variant="danger" size="sm">
                          Rejeitado
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-heading text-base font-bold text-foreground leading-snug">
                      {art.title || art.originalTitle}
                    </h3>
                    <p className="font-sans text-xs text-muted-foreground line-clamp-2">
                      {art.summary || "Notícia capturada via RSS aguardando reescrita ou revisão editorial."}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0">
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      {art.originalPublishedAt
                        ? new Date(art.originalPublishedAt).toLocaleDateString("pt-BR")
                        : new Date(art.createdAt).toLocaleDateString("pt-BR")}
                    </div>

                    <a
                      href={art.originalUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
                    >
                      Fonte Original <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Actions toolbar */}
                <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {art.status === "PENDING" && !art.title && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleProcessAi(art.id)}
                        leadingIcon={<Sparkles className="w-3.5 h-3.5 text-primary" />}
                      >
                        Processar com IA
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {art.status === "PENDING" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReject(art.id)}
                          className="text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                        >
                          Rejeitar
                        </Button>
                        <Link href={`/articles/${art.id}`}>
                          <Button
                            variant="gradient"
                            size="sm"
                            leadingIcon={<Edit3 className="w-3.5 h-3.5" />}
                          >
                            Revisar & Publicar
                          </Button>
                        </Link>
                      </>
                    )}

                    {art.status === "REJECTED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRepublish(art.id)}
                        leadingIcon={<RotateCcw className="w-3.5 h-3.5" />}
                      >
                        Restaurar para Pendentes
                      </Button>
                    )}

                    {art.status === "PUBLISHED" && (
                      <Link href={`/articles/${art.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          leadingIcon={<Edit3 className="w-3.5 h-3.5" />}
                        >
                          Ver / Editar Publicação
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
