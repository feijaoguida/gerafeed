"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Globe,
  Plus,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FolderSync,
  ShieldCheck,
  Trash2,
  Edit3,
  ExternalLink,
  Rss,
  Sparkles,
  ArrowLeft,
  Check,
  X,
} from "lucide-react";

interface WordPressSiteItem {
  id: string;
  workspaceId: string;
  name: string;
  url: string;
  username: string;
  hasPassword: boolean;
  defaultPromptType: string | null;
  active: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SourceItem {
  id: string;
  name: string;
  rssUrl: string;
  creditName: string | null;
  defaultPromptType: string | null;
  active: boolean;
}

interface AssignedSourceItem {
  id: string;
  wordpressSiteId: string;
  sourceId: string;
  active: boolean;
  promptTypeOverride: string | null;
  source: SourceItem;
}

export default function SettingsWordPressPage() {
  const [sites, setSites] = useState<WordPressSiteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  // Edit / Details State
  const [siteDetails, setSiteDetails] = useState<WordPressSiteItem | null>(null);
  const [assignedSources, setAssignedSources] = useState<AssignedSourceItem[]>([]);
  const [allSources, setAllSources] = useState<SourceItem[]>([]);
  const [categoryCount, setCategoryCount] = useState<number>(0);

  // Form State for Selected Site
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [applicationPassword, setApplicationPassword] = useState("");
  const [defaultPromptType, setDefaultPromptType] = useState("");
  const [active, setActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);

  // Modal / Create Site State
  const [isCreatingSite, setIsCreatingSite] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteUrl, setNewSiteUrl] = useState("");
  const [newSiteUsername, setNewSiteUsername] = useState("");
  const [newSitePassword, setNewSitePassword] = useState("");
  const [newSitePromptType, setNewSitePromptType] = useState("");
  const [newSiteIsDefault, setNewSiteIsDefault] = useState(false);

  // Quick-create feed state
  const [isAddingNewFeed, setIsAddingNewFeed] = useState(false);
  const [newFeedName, setNewFeedName] = useState("");
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newFeedCredit, setNewFeedCredit] = useState("");
  const [newFeedPrompt, setNewFeedPrompt] = useState("");

  // Action loaders and feedback
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchSites = useCallback(async () => {
    const res = await fetch("/api/wordpress/sites");
    if (res.ok) {
      const data = await res.json();
      return data.sites || [];
    }
    throw new Error("Erro ao buscar sites");
  }, []);

  const refreshSites = useCallback(async () => {
    try {
      const data = await fetchSites();
      setSites(data);
    } catch (err) {
      console.error(err);
      setErrorMessage("Não foi possível carregar a lista de sites WordPress.");
    }
  }, [fetchSites]);

  const loadSiteDetails = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      const res = await fetch(`/api/wordpress/sites/${id}`);
      if (!res.ok) throw new Error("Erro ao carregar detalhes do site.");
      const data = await res.json();

      setSiteDetails(data.site);
      setAssignedSources(data.assignedSources || []);
      setAllSources(data.allSources || []);
      setCategoryCount(data.categoryCount || 0);

      setName(data.site.name || "");
      setUrl(data.site.url || "");
      setUsername(data.site.username || "");
      setDefaultPromptType(data.site.defaultPromptType || "");
      setActive(data.site.active);
      setIsDefault(data.site.isDefault || false);
      setApplicationPassword("");
      setSelectedSiteId(id);
    } catch (err) {
      console.error(err);
      setErrorMessage("Erro ao abrir configurações do site.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    fetchSites()
      .then((data) => {
        if (!ignore) setSites(data);
      })
      .catch((err) => {
        if (!ignore) {
          console.error(err);
          setErrorMessage("Não foi possível carregar a lista de sites WordPress.");
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [fetchSites]);

  // Handle Save Site
  const handleSaveSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiteId) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload: {
        name: string;
        url: string;
        username: string;
        defaultPromptType: string | null;
        active: boolean;
        isDefault: boolean;
        applicationPassword?: string;
      } = {
        name,
        url,
        username,
        defaultPromptType: defaultPromptType.trim() || null,
        active,
        isDefault,
      };

      if (applicationPassword.trim()) {
        payload.applicationPassword = applicationPassword.trim();
      }

      const res = await fetch(`/api/wordpress/sites/${selectedSiteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar alterações.");

      setSuccessMessage("Site WordPress atualizado com sucesso!");
      setApplicationPassword("");
      await loadSiteDetails(selectedSiteId);
      await fetchSites();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao salvar alterações.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Create Site
  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/wordpress/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSiteName,
          url: newSiteUrl,
          username: newSiteUsername,
          applicationPassword: newSitePassword,
          defaultPromptType: newSitePromptType.trim() || null,
          active: true,
          isDefault: newSiteIsDefault,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar site.");

      setSuccessMessage("Site WordPress adicionado com sucesso!");
      setIsCreatingSite(false);
      setNewSiteName("");
      setNewSiteUrl("");
      setNewSiteUsername("");
      setNewSitePassword("");
      setNewSitePromptType("");
      setNewSiteIsDefault(false);

      await refreshSites();
      if (data.site?.id) {
        await loadSiteDetails(data.site.id);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao criar site.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Site
  const handleDeleteSite = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta configuração de WordPress?")) return;

    setIsDeleting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/wordpress/sites/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao remover site.");

      setSuccessMessage("Site WordPress removido com sucesso.");
      if (selectedSiteId === id) {
        setSelectedSiteId(null);
        setSiteDetails(null);
      }
      await refreshSites();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao remover site.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Test Connection
  const handleTestConnection = async () => {
    if (!selectedSiteId) return;
    setIsTesting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/wordpress/sites/${selectedSiteId}/test`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha na conexão com o WordPress.");

      setSuccessMessage(`Conexão bem-sucedida! Autenticado como: ${data.user?.name || data.user?.slug || "Usuário WP"}`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao testar conexão.");
    } finally {
      setIsTesting(false);
    }
  };

  // Handle Sync Categories
  const handleSyncCategories = async () => {
    if (!selectedSiteId) return;
    setIsSyncing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/wordpress/sites/${selectedSiteId}/categories/sync`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao sincronizar categorias.");

      setSuccessMessage(`${data.syncedCount || 0} categoria(s) sincronizadas com sucesso!`);
      await loadSiteDetails(selectedSiteId);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao sincronizar categorias.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Assign / Unassign Feed
  const handleToggleFeedAssignment = async (sourceId: string, currentlyAssigned: boolean) => {
    if (!selectedSiteId) return;
    setErrorMessage(null);

    try {
      if (currentlyAssigned) {
        // Unassign
        const res = await fetch(`/api/wordpress/sites/${selectedSiteId}/sources?sourceId=${sourceId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Erro ao desassociar feed.");
      } else {
        // Assign
        const res = await fetch(`/api/wordpress/sites/${selectedSiteId}/sources`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceId, active: true }),
        });
        if (!res.ok) throw new Error("Erro ao associar feed.");
      }
      await loadSiteDetails(selectedSiteId);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao alterar vínculo do feed.");
    }
  };

  // Handle Update Assignment Override
  const handleUpdateFeedOverride = async (sourceId: string, promptTypeOverride: string) => {
    if (!selectedSiteId) return;
    try {
      const res = await fetch(`/api/wordpress/sites/${selectedSiteId}/sources`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId, promptTypeOverride: promptTypeOverride.trim() || null }),
      });
      if (!res.ok) throw new Error("Erro ao salvar override.");
      setSuccessMessage("Override de prompt salvo com sucesso!");
      await loadSiteDetails(selectedSiteId);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao atualizar override.");
    }
  };

  // Handle Quick Create Feed & Assign
  const handleQuickCreateFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiteId) return;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/wordpress/sites/${selectedSiteId}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newSource: {
            name: newFeedName,
            rssUrl: newFeedUrl,
            creditName: newFeedCredit,
            defaultPromptType: newFeedPrompt.trim() || null,
          },
          active: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar e associar feed.");

      setSuccessMessage("Novo Feed criado e associado ao site com sucesso!");
      setIsAddingNewFeed(false);
      setNewFeedName("");
      setNewFeedUrl("");
      setNewFeedCredit("");
      setNewFeedPrompt("");

      await loadSiteDetails(selectedSiteId);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao criar novo feed.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && sites.length === 0) {
    return (
      <div className="p-8 text-xs text-zinc-500 animate-pulse flex items-center justify-center">
        Carregando destinos WordPress...
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-8 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-sky-500 dark:text-sky-400" />
            <h1 className="text-xl font-bold text-zinc-900 dark:white tracking-tight">
              Destinos WordPress (Multi-Site)
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Gerencie múltiplos portais WordPress, associe feeds RSS e defina regras editoriais por destino.
          </p>
        </div>

        {!selectedSiteId && (
          <button
            onClick={() => setIsCreatingSite(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Novo Destino WordPress
          </button>
        )}
      </div>

      {/* Global Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="flex-1">{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="hover:text-emerald-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal: Novo Site WordPress */}
      {isCreatingSite && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">Adicionar Novo Site WordPress</h2>
              <button onClick={() => setIsCreatingSite(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nome do Destino *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Portal de Humor, Tech News"
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  URL Base do WordPress *
                </label>
                <input
                  type="url"
                  placeholder="https://exemplo.com.br"
                  value={newSiteUrl}
                  onChange={(e) => setNewSiteUrl(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Usuário REST API *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: admin_api"
                    value={newSiteUsername}
                    onChange={(e) => setNewSiteUsername(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Application Password *
                  </label>
                  <input
                    type="password"
                    placeholder="xxxx xxxx xxxx xxxx"
                    value={newSitePassword}
                    onChange={(e) => setNewSitePassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Prompt Padrão do Site (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Humorístico, Informativo, Crítico"
                  value={newSitePromptType}
                  onChange={(e) => setNewSitePromptType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newSiteIsDefault}
                    onChange={(e) => setNewSiteIsDefault(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-300 dark:bg-zinc-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Definir como Destino Padrão
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingSite(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {isSaving ? "Salvando..." : "Criar Destino"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main View: Listing vs Site Details */}
      {!selectedSiteId ? (
        <div className="space-y-4">
          {sites.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-4">
              <Globe className="w-10 h-10 text-zinc-400 mx-auto" />
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">Nenhum site WordPress configurado</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Adicione seu primeiro destino WordPress para começar a publicar notícias personalizadas por portal.
                </p>
              </div>
              <button
                onClick={() => setIsCreatingSite(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition"
              >
                <Plus className="w-4 h-4" />
                Criar Primeiro Site
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sites.map((site) => (
                <div
                  key={site.id}
                  className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition flex flex-col justify-between space-y-4 shadow-sm dark:shadow-none"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${site.active ? "bg-emerald-500" : "bg-zinc-400"}`}
                        />
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{site.name}</h3>
                        {site.isDefault && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 uppercase tracking-wider ml-1">
                            Padrão
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          site.active
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border border-zinc-500/20"
                        }`}
                      >
                        {site.active ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    <a
                      href={site.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                    >
                      {site.url}
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span>Usuário: <strong className="text-zinc-700 dark:text-zinc-300">{site.username}</strong></span>
                      <span>•</span>
                      <span>
                        Prompt:{" "}
                        <strong className="text-zinc-700 dark:text-zinc-300">
                          {site.defaultPromptType || "Padrão Workspace"}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                      <ShieldCheck className={`w-3.5 h-3.5 ${site.hasPassword ? "text-emerald-500" : "text-amber-500"}`} />
                      {site.hasPassword ? "Credenciais OK" : "Senha Pendente"}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteSite(site.id)}
                        disabled={isDeleting}
                        className="p-1.5 text-zinc-400 hover:text-red-500 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                        title="Excluir site"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => loadSiteDetails(site.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-semibold transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Gerenciar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Site Details / Manage View */
        <div className="space-y-6">
          {/* Back button */}
          <button
            onClick={() => {
              setSelectedSiteId(null);
              setSiteDetails(null);
            }}
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para lista de sites
          </button>

          {/* Section 1: Dados Básicos & Conexão */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-sky-500" />
                  Configuração: {siteDetails?.name}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Atualize as credenciais e teste a comunicação direta com a REST API.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
                  {isTesting ? "Testando..." : "Testar Conexão"}
                </button>

                <button
                  type="button"
                  onClick={handleSyncCategories}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  <FolderSync className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                  {isSyncing ? "Sincronizando..." : `Sincronizar Categorias (${categoryCount})`}
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveSite} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Nome do Site / Portal
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    URL do WordPress
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Usuário REST API
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Application Password
                  </label>
                  <input
                    type="password"
                    placeholder={siteDetails?.hasPassword ? "•••••••• (Configurada — preencha para alterar)" : "Digite a nova senha"}
                    value={applicationPassword}
                    onChange={(e) => setApplicationPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Prompt Padrão deste Site
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Humorístico, Informativo (opcional)"
                    value={defaultPromptType}
                    onChange={(e) => setDefaultPromptType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4 sm:pt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-300 dark:bg-zinc-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                  </label>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Destino Ativo para Curadoria
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-4 sm:pt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-300 dark:bg-zinc-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                  </label>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Definir como Padrão
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Salvando..." : "Salvar Configurações"}
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Feeds Associados */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Rss className="w-4 h-4 text-orange-500" />
                  Feeds RSS Associados a este Destino
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Associe quais fontes alimentam este portal WordPress e configure overrides editoriais.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingNewFeed(!isAddingNewFeed)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Novo Feed
              </button>
            </div>

            {/* Quick Create Feed Form */}
            {isAddingNewFeed && (
              <form onSubmit={handleQuickCreateFeed} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-orange-500/20 space-y-4">
                <h3 className="text-xs font-bold text-zinc-900 dark:text-white">Cadastrar e Vincular Novo Feed</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Nome do Feed *</label>
                    <input
                      type="text"
                      placeholder="Ex: Canaltech"
                      value={newFeedName}
                      onChange={(e) => setNewFeedName(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">URL RSS *</label>
                    <input
                      type="url"
                      placeholder="https://exemplo.com/rss"
                      value={newFeedUrl}
                      onChange={(e) => setNewFeedUrl(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Nome de Crédito</label>
                    <input
                      type="text"
                      placeholder="Ex: Canaltech News"
                      value={newFeedCredit}
                      onChange={(e) => setNewFeedCredit(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Prompt Padrão do Feed</label>
                    <input
                      type="text"
                      placeholder="Ex: Informativo"
                      value={newFeedPrompt}
                      onChange={(e) => setNewFeedPrompt(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNewFeed(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                  >
                    Salvar e Associar
                  </button>
                </div>
              </form>
            )}

            {/* List of all workspace sources with association toggles */}
            {allSources.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">Nenhuma fonte RSS cadastrada no Workspace.</p>
            ) : (
              <div className="space-y-3">
                {allSources.map((source) => {
                  const assignment = assignedSources.find((a) => a.sourceId === source.id);
                  const isAssigned = Boolean(assignment);

                  return (
                    <div
                      key={source.id}
                      className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isAssigned
                          ? "bg-sky-500/5 dark:bg-sky-500/10 border-sky-500/30"
                          : "bg-zinc-50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-800 opacity-70"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleFeedAssignment(source.id, isAssigned)}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition border ${
                            isAssigned
                              ? "bg-sky-600 border-sky-600 text-white"
                              : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-transparent"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>

                        <div>
                          <p className="text-xs font-bold text-zinc-900 dark:text-white">{source.name}</p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-sm sm:max-w-md">{source.rssUrl}</p>
                        </div>
                      </div>

                      {isAssigned && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] text-zinc-500 dark:text-zinc-400">Override Prompt:</label>
                            <input
                              type="text"
                              placeholder={source.defaultPromptType ? `Padrão Feed: ${source.defaultPromptType}` : "Sem override"}
                              defaultValue={assignment?.promptTypeOverride || ""}
                              onBlur={(e) => handleUpdateFeedOverride(source.id, e.target.value)}
                              className="px-2.5 py-1 text-xs rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white w-36 focus:ring-1 focus:ring-sky-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
