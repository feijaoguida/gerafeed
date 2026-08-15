"use client";

import { useState, useEffect } from "react";
import { Globe, Save, CheckCircle2, AlertCircle, RefreshCw, FolderSync, ShieldCheck } from "lucide-react";

export default function SettingsWordPressPage() {
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [applicationPassword, setApplicationPassword] = useState("");

  const [hasApplicationPassword, setHasApplicationPassword] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isFromEnv, setIsFromEnv] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadConfig() {
      try {
        const res = await fetch("/api/wordpress/config");
        if (!res.ok) throw new Error("Erro ao buscar configurações.");
        const data = await res.json();

        if (!active) return;

        setUrl(data.url || "");
        setUsername(data.username || "");
        setHasApplicationPassword(Boolean(data.hasApplicationPassword));
        setIsConfigured(Boolean(data.isConfigured));
        setIsFromEnv(Boolean(data.isFromEnv));
      } catch (err) {
        if (!active) return;
        console.error("Error loading WP config:", err);
        setErrorMessage("Erro ao carregar configurações do WordPress.");
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
      const res = await fetch("/api/wordpress/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          username,
          applicationPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar configurações.");

      setSuccessMessage(data.message || "Configurações salvas com sucesso!");
      setHasApplicationPassword(data.config.hasApplicationPassword);
      setIsConfigured(data.config.isConfigured);
      setIsFromEnv(false);
      setApplicationPassword(""); // Clear input after save
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao salvar configurações.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/wordpress/test", { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Falha na conexão com o WordPress.");

      setSuccessMessage(`Conexão bem-sucedida! Autenticado como: ${data.user?.name || "Usuário WP"}`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao testar conexão.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncCategories = async () => {
    setIsSyncing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/wordpress/categories/sync", { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao sincronizar categorias.");

      setSuccessMessage(`${data.syncedCount || 0} categoria(s) sincronizadas do WordPress com sucesso!`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao sincronizar categorias.");
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-xs text-zinc-500 animate-pulse flex items-center justify-center">
        Carregando configurações do WordPress...
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-8 transition-colors duration-200">
      <div>
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-sky-500 dark:text-sky-400" />
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Configurações do WordPress</h1>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Gerenciamento visual das credenciais da REST API do WordPress (Application Password criptografada em AES-256-GCM).
        </p>
      </div>

      {/* Connection Status Badge */}
      <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-3">
          <ShieldCheck className={`w-5 h-5 ${isConfigured ? "text-emerald-500 dark:text-emerald-400" : "text-amber-500 dark:text-amber-400"}`} />
          <div>
            <p className="text-xs font-semibold text-zinc-900 dark:text-white">
              Status da Conexão: {isConfigured ? "Configurado" : "Pendente de Configuração"}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {isFromEnv
                ? "Utilizando variáveis de ambiente (.env) como fallback"
                : "Utilizando credenciais salvas de forma segura no banco de dados"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
            {isTesting ? "Testando..." : "Testar Conexão"}
          </button>

          <button
            onClick={handleSyncCategories}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-50 hover:bg-sky-100 dark:bg-sky-600/20 dark:hover:bg-sky-600/30 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30 transition disabled:opacity-50"
          >
            <FolderSync className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Sincronizando..." : "Sincronizar Categorias"}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:underline">
            Fechar
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:underline">
            Fechar
          </button>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="p-6 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-5 shadow-sm dark:shadow-none">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          Credenciais do WordPress
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">URL do Site WordPress</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://meusite.com.br"
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Nome de Usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Application Password {hasApplicationPassword ? "(Chave criptografada em uso)" : ""}
            </label>
            <input
              type="password"
              value={applicationPassword}
              onChange={(e) => setApplicationPassword(e.target.value)}
              placeholder={hasApplicationPassword ? "•••••••••••••••• (Deixe em branco para manter a senha atual)" : "xxxx xxxx xxxx xxxx"}
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-sky-500"
            />
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
              A Application Password é gerada no painel do WordPress em <em>Usuários &gt; Perfil &gt; Senhas de aplicativo</em>.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Salvando..." : "Salvar Configurações"}
          </button>
        </div>
      </form>
    </div>
  );
}
