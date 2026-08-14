"use client";

import { useState, useEffect } from "react";
import { Image as ImageIcon, Save, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";

type ImageStrategy = "ORIGINAL" | "MODIFIED";

export default function SettingsImagesPage() {
  const [defaultStrategy, setDefaultStrategy] = useState<ImageStrategy>("ORIGINAL");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadConfig() {
      try {
        const res = await fetch("/api/images/config");
        if (!res.ok) throw new Error("Erro ao buscar configurações.");
        const data = await res.json();

        if (!active) return;

        setDefaultStrategy(data.defaultStrategy || "ORIGINAL");
      } catch (err) {
        if (!active) return;
        console.error("Error loading image config:", err);
        setErrorMessage("Erro ao carregar configurações de imagem.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadConfig();
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/images/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultStrategy,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar configurações de imagem.");

      setSuccessMessage(data.message || "Estratégia de imagens salva com sucesso!");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao salvar configurações de imagem.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-xs text-zinc-500 animate-pulse flex items-center justify-center">
        Carregando configurações de imagem...
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-indigo-400" />
          <h1 className="text-xl font-bold text-white tracking-tight">Estratégia de Imagens</h1>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Defina o comportamento padrão para as imagens das matérias coletadas via RSS (imagem original vs. imagem processada).
        </p>
      </div>

      {/* Current Active Strategy Badge */}
      <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <div>
            <p className="text-xs font-semibold text-white">
              Estratégia Padrão Ativa:{" "}
              <span className="uppercase text-indigo-400 font-bold">
                {defaultStrategy === "ORIGINAL" ? "Usar Imagem Original" : "Processar / Modificar Imagem"}
              </span>
            </p>
            <p className="text-[11px] text-zinc-400">
              Esta preferência será aplicada como valor inicial no editor de notícias.
            </p>
          </div>
        </div>
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

      {/* Settings Form */}
      <form onSubmit={handleSave} className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-6">
        <h2 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800 pb-3">
          Seleção da Estratégia Padrão
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Option 1: Original Image */}
          <label
            className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between space-y-3 ${
              defaultStrategy === "ORIGINAL"
                ? "bg-indigo-600/10 border-indigo-500/50 text-white"
                : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="strategy"
                  value="ORIGINAL"
                  checked={defaultStrategy === "ORIGINAL"}
                  onChange={() => setDefaultStrategy("ORIGINAL")}
                  className="accent-indigo-500"
                />
                <span className="text-xs font-bold text-white">Usar Imagem Original</span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Mantém a imagem original extraída do feed RSS da matéria sem alterações ou filtros adicionais.
            </p>
          </label>

          {/* Option 2: Processed / Modified Image */}
          <label
            className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between space-y-3 ${
              defaultStrategy === "MODIFIED"
                ? "bg-indigo-600/10 border-indigo-500/50 text-white"
                : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="strategy"
                  value="MODIFIED"
                  checked={defaultStrategy === "MODIFIED"}
                  onChange={() => setDefaultStrategy("MODIFIED")}
                  className="accent-indigo-500"
                />
                <span className="text-xs font-bold text-white">Processar / Alterar Imagem</span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Gera e aplica filtros/marcas d&apos;água na imagem para padronização visual e diferenciação do conteúdo original.
            </p>
          </label>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Salvando..." : "Salvar Estratégia de Imagens"}
          </button>
        </div>
      </form>
    </div>
  );
}
