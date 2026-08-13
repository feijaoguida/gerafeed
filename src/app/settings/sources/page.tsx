"use client";

import { useState, useEffect, useCallback } from "react";
import { Rss, Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

interface Source {
  id: string;
  name: string;
  rssUrl: string;
  active: boolean;
  createdAt: string;
}

export default function SettingsSourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [isAddingSource, setIsAddingSource] = useState(false);

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
        body: JSON.stringify({ name: newSourceName, rssUrl: newSourceUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao adicionar fonte RSS.");
      }

      setNewSourceName("");
      setNewSourceUrl("");
      setSuccessMessage("Fonte RSS cadastrada com sucesso!");
      await refreshSources();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao cadastrar fonte.");
    } finally {
      setIsAddingSource(false);
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
          Cadastre, ative ou remova fontes de notícias alimentadas por feeds RSS/Atom.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <h2 className="text-sm font-semibold text-zinc-200">Fontes Ativas e Inativas</h2>

        {isLoading ? (
          <p className="text-xs text-zinc-500 py-4 animate-pulse">Carregando fontes...</p>
        ) : sources.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4">Nenhuma fonte cadastrada no banco de dados.</p>
        ) : (
          <div className="space-y-3">
            {sources.map((src) => (
              <div
                key={src.id}
                className="p-4 rounded-lg bg-zinc-950/60 border border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="font-semibold text-white">{src.name}</p>
                  <p className="text-zinc-400 font-mono text-[11px] truncate">{src.rssUrl}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
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
                    onClick={() => handleDelete(src.id)}
                    className="p-1.5 rounded bg-zinc-900 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition"
                    title="Excluir Fonte"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
