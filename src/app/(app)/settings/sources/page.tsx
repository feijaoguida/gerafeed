"use client";

import { useState, useEffect, useCallback } from "react";
import { Rss, Plus, Trash2, Edit2, Save, X } from "lucide-react";

import { PageHeader } from "@/components/design-system/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/design-system/form-field";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { trackEvent } from "@/lib/analytics";

interface Source {
  id: string;
  name: string;
  creditName?: string | null;
  rssUrl: string;
  defaultPromptType?: string | null;
  active: boolean;
  createdAt: string;
}

export default function SettingsSourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newSourceName, setNewSourceName] = useState("");
  const [newCreditName, setNewCreditName] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newDefaultPromptType, setNewDefaultPromptType] = useState("");
  const [isAddingSource, setIsAddingSource] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCreditName, setEditCreditName] = useState("");
  const [editRssUrl, setEditRssUrl] = useState("");
  const [editDefaultPromptType, setEditDefaultPromptType] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchSources = useCallback(async () => {
    const res = await fetch("/api/sources");
    if (res.ok) {
      return await res.json();
    }
    throw new Error("Erro ao buscar fontes");
  }, []);

  const refreshSources = useCallback(async () => {
    try {
      const data = await fetchSources();
      setSources(data);
    } catch (err) {
      console.error("Error refreshing sources:", err);
      setErrorMessage("Erro ao atualizar fontes RSS.");
    }
  }, [fetchSources]);

  useEffect(() => {
    let ignore = false;
    fetchSources()
      .then((data) => {
        if (!ignore) setSources(data);
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Error loading sources:", err);
          setErrorMessage("Erro ao carregar fontes RSS.");
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [fetchSources]);

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName.trim() || !newSourceUrl.trim()) return;

    setIsAddingSource(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSourceName,
          creditName: newCreditName,
          rssUrl: newSourceUrl,
          defaultPromptType: newDefaultPromptType.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao adicionar fonte RSS.");
      }

      setNewSourceName("");
      setNewCreditName("");
      setNewSourceUrl("");
      setNewDefaultPromptType("");
      setSuccessMessage("Fonte RSS cadastrada com sucesso!");
      trackEvent("rss_source_added");
      await refreshSources();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao adicionar fonte.");
    } finally {
      setIsAddingSource(false);
    }
  };

  const startEdit = (src: Source) => {
    setEditingId(src.id);
    setEditName(src.name);
    setEditCreditName(src.creditName || "");
    setEditRssUrl(src.rssUrl);
    setEditDefaultPromptType(src.defaultPromptType || "");
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditCreditName("");
    setEditRssUrl("");
    setEditDefaultPromptType("");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim() || !editRssUrl.trim()) return;
    setIsSavingEdit(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/sources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          creditName: editCreditName,
          rssUrl: editRssUrl,
          defaultPromptType: editDefaultPromptType.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao salvar alterações da fonte.");
      }

      setSuccessMessage("Fonte RSS atualizada com sucesso!");
      cancelEdit();
      await refreshSources();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao salvar alterações.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/sources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentActive }),
      });
      if (res.ok) {
        await refreshSources();
      }
    } catch (err) {
      console.error("Error toggling source active:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta fonte RSS?")) return;
    try {
      const res = await fetch(`/api/sources/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSuccessMessage("Fonte RSS excluída.");
        await refreshSources();
      }
    } catch (err) {
      console.error("Error deleting source:", err);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header com PageHeader */}
      <PageHeader
        title="Configurações de Fontes RSS"
        description="Cadastre, ative ou remova fontes de notícias alimentadas por feeds RSS/Atom e configure o nome comercial para créditos."
        icon={<Rss className="w-5 h-5 text-amber-500" />}
      />

      {/* Alerts */}
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

      {/* Form Add Source */}
      <form onSubmit={handleAddSource}>
        <Card className="p-6 space-y-4 shadow-xs">
          <CardHeader className="p-0 border-b border-border pb-3">
            <CardTitle className="text-sm font-semibold">
              Cadastrar Nova Fonte RSS
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField label="Nome da Fonte" required>
                <Input
                  type="text"
                  placeholder="Ex: TechCrunch, G1..."
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Fonte / Crédito (Opcional)">
                <Input
                  type="text"
                  placeholder="Ex: TechCrunch Brasil..."
                  value={newCreditName}
                  onChange={(e) => setNewCreditName(e.target.value)}
                />
              </FormField>

              <FormField label="URL do Feed RSS" required>
                <Input
                  type="url"
                  placeholder="https://exemplo.com/feed.xml"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Prompt Padrão (Opcional)">
                <Input
                  type="text"
                  placeholder="Ex: Informativo, Humorístico..."
                  value={newDefaultPromptType}
                  onChange={(e) => setNewDefaultPromptType(e.target.value)}
                />
              </FormField>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="gradient"
                size="sm"
                isLoading={isAddingSource}
                leadingIcon={<Plus className="w-4 h-4" />}
              >
                Adicionar Fonte
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Sources List */}
      <Card className="p-6 space-y-4 shadow-xs">
        <CardHeader className="p-0 border-b border-border pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            Fontes Cadastradas ({sources.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 py-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : sources.length === 0 ? (
            <EmptyState
              title="Nenhuma fonte RSS cadastrada"
              description="Cadastre seu primeiro feed RSS para que o sistema comece a curar matérias automaticamente."
              icon={<Rss className="w-8 h-8 text-muted-foreground" />}
            />
          ) : (
            <div className="space-y-3">
              {sources.map((src) => (
                <Card
                  key={src.id}
                  className="p-4 shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between gap-3 text-xs"
                >
                  {editingId === src.id ? (
                    /* Inline Editing Form */
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <FormField label="Nome" required>
                          <Input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        </FormField>

                        <FormField label="Nome de Crédito">
                          <Input
                            type="text"
                            value={editCreditName}
                            onChange={(e) => setEditCreditName(e.target.value)}
                            placeholder="Exibe nos créditos..."
                          />
                        </FormField>

                        <FormField label="URL RSS" required>
                          <Input
                            type="url"
                            value={editRssUrl}
                            onChange={(e) => setEditRssUrl(e.target.value)}
                          />
                        </FormField>

                        <FormField label="Prompt Padrão">
                          <Input
                            type="text"
                            value={editDefaultPromptType}
                            onChange={(e) => setEditDefaultPromptType(e.target.value)}
                            placeholder="Ex: Informativo..."
                          />
                        </FormField>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          type="button"
                          variant="gradient"
                          size="sm"
                          onClick={() => handleSaveEdit(src.id)}
                          isLoading={isSavingEdit}
                          leadingIcon={<Save className="w-3.5 h-3.5" />}
                        >
                          Salvar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={cancelEdit}
                          leadingIcon={<X className="w-3.5 h-3.5" />}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Display View */
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-heading font-semibold text-foreground">{src.name}</p>
                          {src.creditName && (
                            <Badge variant="outline" size="sm">
                              Crédito: {src.creditName}
                            </Badge>
                          )}
                          {src.defaultPromptType && (
                            <Badge variant="purple" size="sm">
                              Prompt: {src.defaultPromptType}
                            </Badge>
                          )}
                        </div>
                        <p className="font-mono text-[11px] text-muted-foreground truncate">{src.rssUrl}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant={src.active ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => handleToggleActive(src.id, src.active)}
                          className={src.active ? "text-[#00C2A8] font-bold" : "text-muted-foreground"}
                        >
                          {src.active ? "Ativa" : "Inativa"}
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEdit(src)}
                          title="Editar Fonte"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(src.id)}
                          title="Excluir Fonte"
                          className="text-muted-foreground hover:text-rose-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
