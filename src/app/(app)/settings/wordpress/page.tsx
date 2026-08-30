"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Globe,
  Plus,
  Save,
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

import { PageHeader } from "@/components/design-system/page-header";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/design-system/form-field";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { trackEvent } from "@/lib/analytics";

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
      setErrorMessage(err instanceof Error ? err.message : "Erro ao carregar site.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const loadedSites = await fetchSites();
        if (!ignore) {
          setSites(loadedSites);
        }
      } catch (err) {
        if (!ignore) {
          setErrorMessage("Erro ao conectar à API de sites.");
          console.error(err);
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [fetchSites]);

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteName.trim() || !newSiteUrl.trim() || !newSiteUsername.trim() || !newSitePassword.trim()) {
      setErrorMessage("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/wordpress/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSiteName.trim(),
          url: newSiteUrl.trim(),
          username: newSiteUsername.trim(),
          applicationPassword: newSitePassword.trim(),
          defaultPromptType: newSitePromptType.trim() || null,
          isDefault: newSiteIsDefault,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao adicionar site.");

      setSuccessMessage("Site WordPress cadastrado com sucesso!");
      trackEvent("wordpress_connected", { site_type: "wordpress" });
      setIsCreatingSite(false);
      setNewSiteName("");
      setNewSiteUrl("");
      setNewSiteUsername("");
      setNewSitePassword("");
      setNewSitePromptType("");
      setNewSiteIsDefault(false);

      await refreshSites();
      if (data.site?.id) {
        loadSiteDetails(data.site.id);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao criar site.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiteId) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const bodyPayload: Record<string, unknown> = {
        name: name.trim(),
        url: url.trim(),
        username: username.trim(),
        defaultPromptType: defaultPromptType.trim() || null,
        active,
        isDefault,
      };

      if (applicationPassword.trim()) {
        bodyPayload.applicationPassword = applicationPassword.trim();
      }

      const res = await fetch(`/api/wordpress/sites/${selectedSiteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar configurações do site.");

      setSuccessMessage("Configurações atualizadas com sucesso!");
      setApplicationPassword("");
      await refreshSites();
      loadSiteDetails(selectedSiteId);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!selectedSiteId) return;
    setIsTesting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/wordpress/sites/${selectedSiteId}/test`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha na conexão com o site WordPress.");

      setSuccessMessage(`Conexão validada com sucesso! Site: ${data.siteName || url}`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao testar comunicação.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncCategories = async () => {
    if (!selectedSiteId) return;
    setIsSyncing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/wordpress/sites/${selectedSiteId}/categories/sync`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao sincronizar categorias.");

      setSuccessMessage(data.message || "Categorias sincronizadas com sucesso!");
      setCategoryCount(data.count || 0);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao sincronizar categorias.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteSite = async (id: string) => {
    if (!confirm("Tem certeza de que deseja excluir este site? Suas configurações de associação serão perdidas.")) return;
    setIsDeleting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/wordpress/sites/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao excluir site.");
      }

      setSuccessMessage("Site WordPress removido com sucesso.");
      if (selectedSiteId === id) {
        setSelectedSiteId(null);
        setSiteDetails(null);
      }
      await refreshSites();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao excluir site.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleFeedAssignment = async (sourceId: string, isAssigned: boolean) => {
    if (!selectedSiteId) return;
    try {
      if (isAssigned) {
        await fetch(`/api/wordpress/sites/${selectedSiteId}/sources`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceId }),
        });
      } else {
        await fetch(`/api/wordpress/sites/${selectedSiteId}/sources`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceId }),
        });
      }
      await loadSiteDetails(selectedSiteId);
    } catch (err) {
      console.error(err);
      setErrorMessage("Erro ao atualizar associação de feed.");
    }
  };

  const handleUpdateFeedOverride = async (sourceId: string, promptTypeOverride: string) => {
    if (!selectedSiteId) return;
    try {
      await fetch(`/api/wordpress/sites/${selectedSiteId}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId,
          promptTypeOverride: promptTypeOverride.trim() || null,
        }),
      });
      await loadSiteDetails(selectedSiteId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickCreateFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedName.trim() || !newFeedUrl.trim() || !selectedSiteId) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const srcRes = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFeedName.trim(),
          rssUrl: newFeedUrl.trim(),
          creditName: newFeedCredit.trim() || null,
          defaultPromptType: newFeedPrompt.trim() || null,
        }),
      });

      const srcData = await srcRes.json();
      if (!srcRes.ok) throw new Error(srcData.error || "Erro ao criar nova fonte.");

      await fetch(`/api/wordpress/sites/${selectedSiteId}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: srcData.id,
          promptTypeOverride: newFeedPrompt.trim() || null,
        }),
      });

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
      <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header com PageHeader */}
      <PageHeader
        title="Destinos WordPress (Multi-Site)"
        description="Gerencie múltiplos portais WordPress, associe feeds RSS e defina regras editoriais por destino."
        icon={<Globe className="w-5 h-5 text-primary" />}
        actions={
          !selectedSiteId ? (
            <Button
              variant="gradient"
              size="sm"
              onClick={() => setIsCreatingSite(true)}
              leadingIcon={<Plus className="w-4 h-4" />}
            >
              Novo Destino WordPress
            </Button>
          ) : undefined
        }
      />

      {/* Global Alerts */}
      {errorMessage && (
        <Alert variant="destructive" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Modal: Novo Site WordPress */}
      {isCreatingSite && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 shadow-2xl space-y-6 bg-surface border-border">
            <CardHeader className="p-0 border-b border-border pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold">Adicionar Novo Site WordPress</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCreatingSite(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>

            <form onSubmit={handleCreateSite} className="space-y-4">
              <FormField label="Nome do Destino" required>
                <Input
                  type="text"
                  placeholder="Ex: Portal de Humor, Tech News"
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  required
                />
              </FormField>

              <FormField label="URL Base do WordPress" required>
                <Input
                  type="url"
                  placeholder="https://exemplo.com.br"
                  value={newSiteUrl}
                  onChange={(e) => setNewSiteUrl(e.target.value)}
                  required
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Usuário REST API" required>
                  <Input
                    type="text"
                    placeholder="Ex: admin_api"
                    value={newSiteUsername}
                    onChange={(e) => setNewSiteUsername(e.target.value)}
                    required
                  />
                </FormField>

                <FormField label="Application Password" required>
                  <Input
                    type="password"
                    placeholder="xxxx xxxx xxxx xxxx"
                    value={newSitePassword}
                    onChange={(e) => setNewSitePassword(e.target.value)}
                    required
                  />
                </FormField>
              </div>

              <FormField label="Prompt Padrão do Site (Opcional)">
                <Input
                  type="text"
                  placeholder="Ex: Humorístico, Informativo, Crítico"
                  value={newSitePromptType}
                  onChange={(e) => setNewSitePromptType(e.target.value)}
                />
              </FormField>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="newSiteIsDefault"
                  checked={newSiteIsDefault}
                  onChange={(e) => setNewSiteIsDefault(e.target.checked)}
                  className="accent-primary h-4 w-4 rounded"
                />
                <label htmlFor="newSiteIsDefault" className="font-heading text-xs font-semibold text-foreground cursor-pointer">
                  Definir como Destino Padrão
                </label>
              </div>

              <CardFooter className="p-0 flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreatingSite(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  size="sm"
                  isLoading={isSaving}
                >
                  Criar Destino
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* Main View: Listing vs Site Details */}
      {!selectedSiteId ? (
        <div className="space-y-4">
          {sites.length === 0 ? (
            <EmptyState
              title="Nenhum site WordPress configurado"
              description="Adicione seu primeiro destino WordPress para começar a publicar notícias personalizadas por portal."
              action={
                <Button
                  variant="gradient"
                  onClick={() => setIsCreatingSite(true)}
                  leadingIcon={<Plus className="w-4 h-4" />}
                >
                  Criar Primeiro Site
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sites.map((site) => (
                <Card
                  key={site.id}
                  className="p-5 shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${site.active ? "bg-[#00C2A8]" : "bg-muted-foreground/40"}`}
                        />
                        <h3 className="font-heading text-sm font-bold text-foreground">{site.name}</h3>
                        {site.isDefault && (
                          <Badge variant="purple" size="sm">
                            Padrão
                          </Badge>
                        )}
                      </div>
                      <Badge variant={site.active ? "success" : "secondary"} size="sm">
                        {site.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>

                    <a
                      href={site.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                    >
                      {site.url}
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-muted-foreground">
                      <span>Usuário: <strong className="text-foreground">{site.username}</strong></span>
                      <span>•</span>
                      <span>
                        Prompt:{" "}
                        <strong className="text-foreground">
                          {site.defaultPromptType || "Padrão Workspace"}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <ShieldCheck className={`w-3.5 h-3.5 ${site.hasPassword ? "text-[#00C2A8]" : "text-amber-500"}`} />
                      {site.hasPassword ? "Credenciais OK" : "Senha Pendente"}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSite(site.id)}
                        disabled={isDeleting}
                        title="Excluir site"
                        className="text-muted-foreground hover:text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => loadSiteDetails(site.id)}
                        leadingIcon={<Edit3 className="w-3.5 h-3.5" />}
                      >
                        Gerenciar
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Site Details / Manage View */
        <div className="space-y-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedSiteId(null);
              setSiteDetails(null);
            }}
            leadingIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Voltar para lista de sites
          </Button>

          {/* Section 1: Dados Básicos & Conexão */}
          <Card className="p-6 shadow-xs space-y-6">
            <CardHeader className="p-0 border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  Configuração: {siteDetails?.name}
                </CardTitle>
                <p className="font-sans text-xs text-muted-foreground mt-0.5">
                  Atualize as credenciais e teste a comunicação direta com a REST API.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  isLoading={isTesting}
                  leadingIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Testar Conexão
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSyncCategories}
                  isLoading={isSyncing}
                  leadingIcon={<FolderSync className="w-3.5 h-3.5" />}
                >
                  Sincronizar Categorias ({categoryCount})
                </Button>
              </div>
            </CardHeader>

            <form onSubmit={handleSaveSite} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Nome do Site / Portal" required>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </FormField>

                <FormField label="URL do WordPress" required>
                  <Input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Usuário REST API" required>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </FormField>

                <FormField label="Application Password">
                  <Input
                    type="password"
                    placeholder={siteDetails?.hasPassword ? "•••••••• (Configurada — preencha para alterar)" : "Digite a nova senha"}
                    value={applicationPassword}
                    onChange={(e) => setApplicationPassword(e.target.value)}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center pt-2">
                <FormField label="Prompt Padrão deste Site">
                  <Input
                    type="text"
                    placeholder="Ex: Humorístico, Informativo (opcional)"
                    value={defaultPromptType}
                    onChange={(e) => setDefaultPromptType(e.target.value)}
                    leadingIcon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                  />
                </FormField>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="siteActive"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="accent-primary h-4 w-4 rounded"
                  />
                  <label htmlFor="siteActive" className="font-heading text-xs font-semibold text-foreground cursor-pointer">
                    Destino Ativo para Curadoria
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="siteIsDefault"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="accent-primary h-4 w-4 rounded"
                  />
                  <label htmlFor="siteIsDefault" className="font-heading text-xs font-semibold text-foreground cursor-pointer">
                    Definir como Padrão
                  </label>
                </div>
              </div>

              <CardFooter className="p-0 flex justify-end pt-4 border-t border-border">
                <Button
                  type="submit"
                  variant="gradient"
                  isLoading={isSaving}
                  leadingIcon={<Save className="w-4 h-4" />}
                >
                  Salvar Configurações
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Section 2: Feeds Associados */}
          <Card className="p-6 shadow-xs space-y-6">
            <CardHeader className="p-0 border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Rss className="w-4 h-4 text-amber-500" />
                  Feeds RSS Associados a este Destino
                </CardTitle>
                <p className="font-sans text-xs text-muted-foreground mt-0.5">
                  Associe quais fontes alimentam este portal WordPress e configure overrides editoriais.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddingNewFeed(!isAddingNewFeed)}
                leadingIcon={<Plus className="w-3.5 h-3.5 text-primary" />}
              >
                Novo Feed
              </Button>
            </CardHeader>

            {/* Quick Create Feed Form */}
            {isAddingNewFeed && (
              <Card className="p-4 border-primary/30 bg-surface-muted/50 space-y-4">
                <h3 className="font-heading text-xs font-bold text-foreground">Cadastrar e Vincular Novo Feed</h3>
                <form onSubmit={handleQuickCreateFeed} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="Nome do Feed" required>
                      <Input
                        type="text"
                        placeholder="Ex: Canaltech"
                        value={newFeedName}
                        onChange={(e) => setNewFeedName(e.target.value)}
                        required
                      />
                    </FormField>
                    <FormField label="URL RSS" required>
                      <Input
                        type="url"
                        placeholder="https://exemplo.com/rss"
                        value={newFeedUrl}
                        onChange={(e) => setNewFeedUrl(e.target.value)}
                        required
                      />
                    </FormField>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="Nome de Crédito">
                      <Input
                        type="text"
                        placeholder="Ex: Canaltech News"
                        value={newFeedCredit}
                        onChange={(e) => setNewFeedCredit(e.target.value)}
                      />
                    </FormField>
                    <FormField label="Prompt Padrão do Feed">
                      <Input
                        type="text"
                        placeholder="Ex: Informativo"
                        value={newFeedPrompt}
                        onChange={(e) => setNewFeedPrompt(e.target.value)}
                      />
                    </FormField>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAddingNewFeed(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      variant="gradient"
                      size="sm"
                      isLoading={isSaving}
                    >
                      Salvar e Associar
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* List of all workspace sources with association toggles */}
            {allSources.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Nenhuma fonte RSS cadastrada no Workspace.</p>
            ) : (
              <div className="space-y-3">
                {allSources.map((source) => {
                  const assignment = assignedSources.find((a) => a.sourceId === source.id);
                  const isAssigned = Boolean(assignment);

                  return (
                    <div
                      key={source.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isAssigned
                          ? "bg-primary/5 border-primary/40 shadow-xs"
                          : "bg-surface-muted/30 border-border opacity-70"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleFeedAssignment(source.id, isAssigned)}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition border ${
                            isAssigned
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-border bg-surface text-transparent"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>

                        <div>
                          <p className="font-heading text-xs font-bold text-foreground">{source.name}</p>
                          <p className="font-mono text-[11px] text-muted-foreground truncate max-w-sm sm:max-w-md">{source.rssUrl}</p>
                        </div>
                      </div>

                      {isAssigned && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] text-muted-foreground font-medium">Override Prompt:</label>
                            <Input
                              type="text"
                              placeholder={source.defaultPromptType ? `Padrão: ${source.defaultPromptType}` : "Sem override"}
                              defaultValue={assignment?.promptTypeOverride || ""}
                              onBlur={(e) => handleUpdateFeedOverride(source.id, e.target.value)}
                              className="h-8 w-40 text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
