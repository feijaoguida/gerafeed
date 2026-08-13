"use client";

import { useState, useEffect } from "react";
import { Sparkles, Save, CheckCircle2, AlertCircle, ShieldCheck, RefreshCw } from "lucide-react";

type AIProviderType = "openai" | "gemini" | "anthropic" | "openai-compatible";

export default function SettingsAiPage() {
  const [provider, setProvider] = useState<AIProviderType>("openai");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  const [hasApiKey, setHasApiKey] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isFromEnv, setIsFromEnv] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadConfig() {
      try {
        const res = await fetch("/api/ai/config");
        if (!res.ok) throw new Error("Erro ao buscar configurações.");
        const data = await res.json();

        if (!active) return;

        setProvider(data.provider || "openai");
        setModel(data.model || "");
        setBaseUrl(data.baseUrl || "");
        setHasApiKey(Boolean(data.hasApiKey));
        setIsConfigured(Boolean(data.isConfigured));
        setIsFromEnv(Boolean(data.isFromEnv));
      } catch (err) {
        if (!active) return;
        console.error("Error loading AI config:", err);
        setErrorMessage("Erro ao carregar configurações de IA.");
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
      const res = await fetch("/api/ai/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey,
          model,
          baseUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar configurações de IA.");

      setSuccessMessage(data.message || "Configurações de IA salvas com sucesso!");
      setHasApiKey(data.config.hasApiKey);
      setIsConfigured(data.config.isConfigured);
      setIsFromEnv(false);
      setApiKey(""); // Clear API Key input after saving
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao salvar configurações de IA.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey,
          model,
          baseUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.connected) {
        throw new Error(data.message || "Falha na conexão com o provedor de IA.");
      }

      setSuccessMessage(`Conexão bem-sucedida! Provedor: ${data.provider} (Modelo: ${data.model})`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao testar conexão com IA.");
    } finally {
      setIsTesting(false);
    }
  };

  const getModelPlaceholder = () => {
    switch (provider) {
      case "openai":
        return "gpt-4o-mini";
      case "gemini":
        return "gemini-1.5-flash";
      case "anthropic":
        return "claude-3-5-haiku-20241022";
      case "openai-compatible":
        return "deepseek-chat";
      default:
        return "modelo";
    }
  };

  const getBaseUrlPlaceholder = () => {
    switch (provider) {
      case "openai-compatible":
        return "https://api.deepseek.com/v1 (ou https://openrouter.ai/api/v1)";
      default:
        return "https://api.exemplo.com (Opcional)";
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-xs text-zinc-500 animate-pulse flex items-center justify-center">
        Carregando configurações de Inteligência Artificial...
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <h1 className="text-xl font-bold text-white tracking-tight">Configurações de Inteligência Artificial</h1>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Gerenciamento visual do Provedor de IA (OpenAI, Gemini, Anthropic, OpenAI-Compatible) com API Keys criptografadas em AES-256-GCM.
        </p>
      </div>

      {/* Connection Status Badge */}
      <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className={`w-5 h-5 ${isConfigured ? "text-emerald-400" : "text-amber-400"}`} />
          <div>
            <p className="text-xs font-semibold text-white">
              Provedor Ativo: <span className="uppercase text-emerald-400 font-bold">{provider}</span> ({isConfigured ? "Configurado" : "Pendente"})
            </p>
            <p className="text-[11px] text-zinc-400">
              {isFromEnv
                ? "Utilizando OPENAI_API_KEY das variáveis de ambiente (.env) como fallback"
                : "Utilizando provedor e API Key criptografada armazenados no banco de dados"}
            </p>
          </div>
        </div>

        <button
          onClick={handleTestConnection}
          disabled={isTesting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
          {isTesting ? "Testando..." : "Testar Conexão"}
        </button>
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
      <form onSubmit={handleSave} className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-5">
        <h2 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800 pb-3">
          Seleção e Credenciais do Provedor de IA
        </h2>

        <div className="space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Selecione o Provedor de IA</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as AIProviderType)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
              <option value="gemini">Google Gemini (Gemini 1.5 Flash / Pro)</option>
              <option value="anthropic">Anthropic Claude (Claude 3.5 Haiku / Sonnet)</option>
              <option value="openai-compatible">OpenAI-Compatible (DeepSeek, OpenRouter, Kimi, etc.)</option>
            </select>
          </div>

          {/* Model Input */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Modelo de IA (Model)</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={`Ex: ${getModelPlaceholder()}`}
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Deixe em branco para utilizar o modelo padrão recomendado do provedor ({getModelPlaceholder()}).
            </p>
          </div>

          {/* Base URL (displayed for OpenAI-Compatible or custom endpoints) */}
          {(provider === "openai-compatible" || provider === "openai") && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Base URL do Endpoint {provider === "openai-compatible" ? "(Obrigatório)" : "(Opcional)"}
              </label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={getBaseUrlPlaceholder()}
                required={provider === "openai-compatible"}
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* API Key Input */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              API Key {hasApiKey ? "(Chave criptografada em uso)" : ""}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={hasApiKey ? "•••••••••••••••• (Deixe em branco para manter a chave atual)" : "sk-..."}
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              A chave é armazenada de forma segura com criptografia autenticada AES-256-GCM.
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Salvando..." : "Salvar Configurações de IA"}
          </button>
        </div>
      </form>
    </div>
  );
}
