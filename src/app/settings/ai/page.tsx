"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Sliders,
  FileText,
  Eye,
} from "lucide-react";
import {
  PromptSettings,
  DEFAULT_PROMPT_SETTINGS,
  buildSystemPrompt,
} from "@/lib/ai/types";

type AIProviderType = "openai" | "gemini" | "anthropic" | "openai-compatible";
type TabType = "connection" | "prompt";

const PORTAL_AREAS = [
  "Tecnologia",
  "Negócios",
  "Política",
  "Ciência",
  "Saúde",
  "Entretenimento",
  "Esportes",
  "Educação",
  "Humor",
  "Meio Ambiente",
  "Outro",
];

const WRITING_STYLES = [
  "Informativo",
  "Atraente",
  "Sério",
  "Alegre",
  "Humorístico",
  "Analítico",
  "Provocativo",
  "Casual",
  "Técnico",
  "Persuasivo",
  "Outro",
];

export default function SettingsAiPage() {
  const [activeTab, setActiveTab] = useState<TabType>("connection");

  // Tab 1: Conexão
  const [provider, setProvider] = useState<AIProviderType>("openai");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  const [hasApiKey, setHasApiKey] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isFromEnv, setIsFromEnv] = useState(false);

  const [isLoadingConnection, setIsLoadingConnection] = useState(true);
  const [isSavingConnection, setIsSavingConnection] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionSuccess, setConnectionSuccess] = useState<string | null>(null);

  // Tab 2: Prompt Editorial
  const [portalArea, setPortalArea] = useState(DEFAULT_PROMPT_SETTINGS.portalArea);
  const [customPortalArea, setCustomPortalArea] = useState(DEFAULT_PROMPT_SETTINGS.customPortalArea);
  const [writingStyles, setWritingStyles] = useState<string[]>(DEFAULT_PROMPT_SETTINGS.writingStyles);
  const [customWritingStyle, setCustomWritingStyle] = useState(DEFAULT_PROMPT_SETTINGS.customWritingStyle);

  const [isLoadingPrompt, setIsLoadingPrompt] = useState(true);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);

  const [promptError, setPromptError] = useState<string | null>(null);
  const [promptSuccess, setPromptSuccess] = useState<string | null>(null);

  // Load connection settings
  useEffect(() => {
    let active = true;

    async function loadConnectionConfig() {
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
        setConnectionError("Erro ao carregar configurações de IA.");
      } finally {
        if (active) setIsLoadingConnection(false);
      }
    }

    loadConnectionConfig();
    return () => {
      active = false;
    };
  }, []);

  // Load prompt settings
  useEffect(() => {
    let active = true;

    async function loadPromptConfig() {
      try {
        const res = await fetch("/api/ai/prompt-settings");
        if (!res.ok) throw new Error("Erro ao buscar configurações do prompt editorial.");
        const data = await res.json();

        if (!active) return;

        if (data.settings) {
          setPortalArea(data.settings.portalArea || DEFAULT_PROMPT_SETTINGS.portalArea);
          setCustomPortalArea(data.settings.customPortalArea || "");
          setWritingStyles(
            Array.isArray(data.settings.writingStyles) && data.settings.writingStyles.length > 0
              ? data.settings.writingStyles
              : DEFAULT_PROMPT_SETTINGS.writingStyles
          );
          setCustomWritingStyle(data.settings.customWritingStyle || "");
        }
      } catch (err) {
        if (!active) return;
        console.error("Error loading prompt settings:", err);
        setPromptError("Erro ao carregar configurações do prompt editorial.");
      } finally {
        if (active) setIsLoadingPrompt(false);
      }
    }

    loadPromptConfig();
    return () => {
      active = false;
    };
  }, []);

  // Handlers for Tab 1: Conexão
  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConnection(true);
    setConnectionError(null);
    setConnectionSuccess(null);

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

      setConnectionSuccess(data.message || "Configurações de IA salvas com sucesso!");
      setHasApiKey(data.config.hasApiKey);
      setIsConfigured(data.config.isConfigured);
      setIsFromEnv(false);
      setApiKey("");
    } catch (err) {
      setConnectionError(err instanceof Error ? err.message : "Erro ao salvar configurações de IA.");
    } finally {
      setIsSavingConnection(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionError(null);
    setConnectionSuccess(null);

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

      setConnectionSuccess(`Conexão bem-sucedida! Provedor: ${data.provider} (Modelo: ${data.model})`);
    } catch (err) {
      setConnectionError(err instanceof Error ? err.message : "Erro ao testar conexão com IA.");
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Handlers for Tab 2: Prompt Editorial
  const handleStyleToggle = (style: string) => {
    if (writingStyles.includes(style)) {
      setWritingStyles(writingStyles.filter((s) => s !== style));
    } else {
      if (writingStyles.length < 3) {
        setWritingStyles([...writingStyles, style]);
      }
    }
  };

  const handleSavePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPrompt(true);
    setPromptError(null);
    setPromptSuccess(null);

    try {
      const payload: PromptSettings = {
        portalArea,
        customPortalArea,
        writingStyles,
        customWritingStyle,
      };

      const res = await fetch("/api/ai/prompt-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar configurações do prompt editorial.");

      setPromptSuccess(data.message || "Configurações do prompt editorial salvas com sucesso!");
    } catch (err) {
      setPromptError(err instanceof Error ? err.message : "Erro ao salvar configurações do prompt editorial.");
    } finally {
      setIsSavingPrompt(false);
    }
  };

  // Live prompt preview calculation
  const promptPreview = useMemo(() => {
    return buildSystemPrompt({
      portalArea,
      customPortalArea,
      writingStyles,
      customWritingStyle,
    });
  }, [portalArea, customPortalArea, writingStyles, customWritingStyle]);

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

  if (isLoadingConnection && isLoadingPrompt) {
    return (
      <div className="p-8 text-xs text-zinc-500 animate-pulse flex items-center justify-center">
        Carregando configurações de Inteligência Artificial...
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <h1 className="text-xl font-bold text-white tracking-tight">Configurações de Inteligência Artificial</h1>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Gerenciamento do provedor de IA (chaves e modelos) e personalização dinâmica das diretrizes editoriais.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("connection")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 ${
            activeTab === "connection"
              ? "border-emerald-500 text-emerald-400 bg-zinc-900/40"
              : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20"
          }`}
        >
          <Sliders className="w-4 h-4" />
          Conexão
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("prompt")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 ${
            activeTab === "prompt"
              ? "border-emerald-500 text-emerald-400 bg-zinc-900/40"
              : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20"
          }`}
        >
          <FileText className="w-4 h-4" />
          Prompt Editorial
        </button>
      </div>

      {/* TAB 1: CONEXÃO */}
      {activeTab === "connection" && (
        <div className="space-y-6">
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
              disabled={isTestingConnection}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? "animate-spin" : ""}`} />
              {isTestingConnection ? "Testando..." : "Testar Conexão"}
            </button>
          </div>

          {/* Alerts */}
          {connectionError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{connectionError}</span>
              </div>
              <button onClick={() => setConnectionError(null)} className="text-rose-400 hover:underline">
                Fechar
              </button>
            </div>
          )}

          {connectionSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{connectionSuccess}</span>
              </div>
              <button onClick={() => setConnectionSuccess(null)} className="text-emerald-400 hover:underline">
                Fechar
              </button>
            </div>
          )}

          {/* Settings Form */}
          <form onSubmit={handleSaveConnection} className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-5">
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

              {/* Base URL */}
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
                disabled={isSavingConnection}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSavingConnection ? "Salvando..." : "Salvar Configurações de Conexão"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: PROMPT EDITORIAL */}
      {activeTab === "prompt" && (
        <div className="space-y-6">
          {/* Alerts */}
          {promptError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{promptError}</span>
              </div>
              <button onClick={() => setPromptError(null)} className="text-rose-400 hover:underline">
                Fechar
              </button>
            </div>
          )}

          {promptSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{promptSuccess}</span>
              </div>
              <button onClick={() => setPromptSuccess(null)} className="text-emerald-400 hover:underline">
                Fechar
              </button>
            </div>
          )}

          <form onSubmit={handleSavePrompt} className="space-y-6">
            {/* Section 1: Área do Portal */}
            <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-200">Área de Atuação do Portal</h2>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Define o nicho editorial utilizado para avaliar relevância e orientar o tom jornalístico.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {PORTAL_AREAS.map((area) => (
                  <label
                    key={area}
                    className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs font-medium cursor-pointer transition select-none ${
                      portalArea === area
                        ? "bg-emerald-950/30 border-emerald-500 text-emerald-300 shadow-sm"
                        : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="portalArea"
                      value={area}
                      checked={portalArea === area}
                      onChange={() => setPortalArea(area)}
                      className="text-emerald-500 focus:ring-emerald-500 h-3.5 w-3.5 bg-zinc-900 border-zinc-700"
                    />
                    <span>{area}</span>
                  </label>
                ))}
              </div>

              {portalArea === "Outro" && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-zinc-300">
                      Informe a área personalizada
                    </label>
                    <span className="text-[10px] text-zinc-500">{customPortalArea.length}/100</span>
                  </div>
                  <input
                    type="text"
                    value={customPortalArea}
                    onChange={(e) => setCustomPortalArea(e.target.value.slice(0, 100))}
                    placeholder="Ex: Criptoeconomia, Gastronomia, Games, etc."
                    maxLength={100}
                    required={portalArea === "Outro"}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>

            {/* Section 2: Estilos de Escrita */}
            <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-200">Estilos de Escrita</h2>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Escolha até 3 estilos editoriais para direcionar o tom da reescrita dos artigos.
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                    writingStyles.length === 3
                      ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                      : "bg-zinc-800 text-zinc-400 border-zinc-700"
                  }`}
                >
                  {writingStyles.length}/3 selecionados
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {WRITING_STYLES.map((style) => {
                  const isChecked = writingStyles.includes(style);
                  const isDisabled = !isChecked && writingStyles.length >= 3;

                  return (
                    <label
                      key={style}
                      className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs font-medium transition select-none ${
                        isDisabled
                          ? "opacity-40 cursor-not-allowed bg-zinc-950/30 border-zinc-800 text-zinc-600"
                          : isChecked
                          ? "cursor-pointer bg-emerald-950/30 border-emerald-500 text-emerald-300 shadow-sm"
                          : "cursor-pointer bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isDisabled}
                        onChange={() => handleStyleToggle(style)}
                        className="rounded text-emerald-500 focus:ring-emerald-500 h-3.5 w-3.5 bg-zinc-900 border-zinc-700 disabled:opacity-40"
                      />
                      <span>{style}</span>
                    </label>
                  );
                })}
              </div>

              {writingStyles.includes("Outro") && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-zinc-300">
                      Informe o estilo personalizado
                    </label>
                    <span className="text-[10px] text-zinc-500">{customWritingStyle.length}/100</span>
                  </div>
                  <input
                    type="text"
                    value={customWritingStyle}
                    onChange={(e) => setCustomWritingStyle(e.target.value.slice(0, 100))}
                    placeholder="Ex: Investigativo, Irônico, Didático, etc."
                    maxLength={100}
                    required={writingStyles.includes("Outro")}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>

            {/* Section 3: Live Prompt Preview */}
            <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                <Eye className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-zinc-200">Preview do System Prompt Gerado</h2>
              </div>
              <p className="text-[11px] text-zinc-400">
                Visualização em tempo real das instruções de sistema que serão enviadas para o modelo de IA.
              </p>

              <div className="mt-2 p-4 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                {promptPreview}
              </div>
            </div>

            {/* Save Prompt Settings Button */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                disabled={isSavingPrompt}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSavingPrompt ? "Salvando..." : "Salvar Configurações do Prompt"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
