"use client";

import { useState, useEffect, useCallback } from "react";
import { Rss, Plus, Trash2, CheckCircle2, AlertCircle, Edit2, Save, X } from "lucide-react";

interface Source {
  id: string;
  name: string;
  creditName?: string | null;
  rssUrl: string;
  active: boolean;
  createdAt: string;
}

export default function SettingsSourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newSourceName, setNewSourceName] = useState("");
  const [newCreditName, setNewCreditName] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [isAddingSource, setIsAddingSource] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCreditName, setEditCreditName] = useState("");
  const [editRssUrl, setEditRssUrl] = useState("");
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
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao adicionar fonte RSS.");
      }

      setNewSourceName("");
      setNewCreditName("");
      setNewSourceUrl("");
      setSuccessMessage("Fonte RSS cadastrada com sucesso!");
      await refreshSources();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao cadastrar fonte.");
    } finally {
      setIsAddingSource(false);
    }
  };

  const startEdit = (src: Source) => {
    setEditingId(src.id);
    setEditName(src.name);
    setEditCreditName(src.creditName || "");
    setEditRssUrl(src.rssUrl);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditCreditName("");
    setEditRssUrl("");
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
          name: editName.trim(),
          creditName: editCreditName.trim() || null,
          rssUrl: editRssUrl.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao atualizar fonte RSS.");
      }

      setSuccessMessage("Fonte RSS atualizada com sucesso!");
      cancelEdit();
      await refreshSources();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao atualizar fonte.");
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
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Rss className="w-5 h-5 text-indigo-400" />
          Configurações de Fontes RSS
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Cadastre, ative ou remova fontes de notícias alimentadas por feeds RSS/Atom e configure o nome comercial para créditos.
        </p>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:underline">
            Fechar
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:underline">
            Fechar
          </button>
        </div>
      )}

      {/* Form Add Source */}
      <form onSubmit={handleAddSource} className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-200">Cadastrar Nova Fonte RSS</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Nome da Fonte</label>
            <input
              type="text"
              placeholder="Ex: TechCrunch, G1 Tecnologia..."
              value={newSourceName}
              onChange={(e) => setNewSourceName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Fonte / Crédito <span className="text-[10px] text-zinc-500">(Opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ex: TechCrunch Brasil..."
              value={newCreditName}
              onChange={(e) => setNewCreditName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">URL do Feed RSS</label>
            <input
              type="url"
              placeholder="https://exemplo.com/feed.xml"
              value={newSourceUrl}
              onChange={(e) => setNewSourceUrl(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isAddingSource}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {isAddingSource ? "Adicionando..." : "Adicionar Fonte"}
        </button>
      </form>

      {/* Sources List */}
      <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-200">Fontes Cadastradas</h2>

        {isLoading ? (
          <p className="text-xs text-zinc-500 py-4 animate-pulse">Carregando fontes...</p>
        ) : sources.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4">Nenhuma fonte cadastrada no banco de dados.</p>
        ) : (
          <div className="space-y-3">
            {sources.map((src) => (
              <div
                key={src.id}
                className="p-4 rounded-lg bg-zinc-950/60 border border-zinc-800/60 flex flex-col justify-between gap-3 text-xs"
              >
                {editingId === src.id ? (
                  /* Inline Editing Form */
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">Nome</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">Nome de Crédito</label>
                        <input
                          type="text"
                          value={editCreditName}
                          onChange={(e) => setEditCreditName(e.target.value)}
                          placeholder="Exibe nos créditos..."
                          className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">URL RSS</label>
                        <input
                          type="url"
                          value={editRssUrl}
                          onChange={(e) => setEditRssUrl(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-white text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleSaveEdit(src.id)}
                        disabled={isSavingEdit}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Salvar
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display View */
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white">{src.name}</p>
                        {src.creditName && (
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px]">
                            Crédito: {src.creditName}
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-400 font-mono text-[11px] truncate">{src.rssUrl}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleActive(src.id, src.active)}
                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase border transition ${
                          src.active
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : "bg-zinc-800 text-zinc-500 border-zinc-700"
                        }`}
                      >
                        {src.active ? "Ativa" : "Inativa"}
                      </button>

                      <button
                        onClick={() => startEdit(src)}
                        className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                        title="Editar Fonte"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(src.id)}
                        className="p-1.5 rounded bg-zinc-900 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition"
                        title="Excluir Fonte"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
