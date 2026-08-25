"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Sliders,
  FileText,
  Lock,
} from "lucide-react";
import { DEFAULT_PROMPT_SETTINGS } from "@/lib/ai/types";
import {
  ALLOWED_NICHES_RESTRICTED,
  ALLOWED_STYLES_RESTRICTED,
  ALLOWED_PROVIDERS_RESTRICTED,
} from "@/lib/billing-constants";

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

  // Plan entitlements for AI restrictions
  const [unlimitedNiches, setUnlimitedNiches] = useState(false);
  const [unlimitedStyles, setUnlimitedStyles] = useState(false);
  const [advancedProviders, setAdvancedProviders] = useState(false);

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
        console.error("Error loading AI connection config:", err);
        setConnectionError("Erro ao carregar configurações de conexão de IA.");
      } finally {
        if (active) setIsLoadingConnection(false);
      }
    }

    loadConnectionConfig();
    return () => {
      active = false;
    };
  }, []);

  // Load prompt settings and billing entitlements
  useEffect(() => {
    let active = true;

    async function loadPromptConfig() {
      try {
        const [settingsRes, billingRes] = await Promise.all([
          fetch("/api/ai/prompt-settings"),
          fetch("/api/billing/subscription"),
        ]);

        if (!settingsRes.ok) throw new Error("Erro ao carregar prompt settings.");
        const data = await settingsRes.json();

        if (!active) return;

        const settings = data.settings || data;
        if (settings.portalArea) setPortalArea(settings.portalArea);
        if (settings.customPortalArea !== undefined) setCustomPortalArea(settings.customPortalArea);
        if (Array.isArray(settings.writingStyles)) {
          const validStyles = settings.writingStyles.filter((s: string) => WRITING_STYLES.includes(s));
          setWritingStyles(validStyles);
        }
        if (settings.customWritingStyle !== undefined) setCustomWritingStyle(settings.customWritingStyle);

        // Load AI feature entitlements
        if (billingRes.ok) {
          const billing = await billingRes.json();
          const features = billing.aiFeatures || {};
          setUnlimitedNiches(Boolean(features.unlimitedNiches));
          setUnlimitedStyles(Boolean(features.unlimitedStyles));
          setAdvancedProviders(Boolean(features.advancedProviders));
        }
      } catch (err) {
        if (!active) return;
        console.error("Error loading prompt settings:", err);
        setPromptError("Erro ao carregar configurações de prompt.");
      } finally {
        if (active) setIsLoadingPrompt(false);
      }
    }

    loadPromptConfig();
    return () => {
      active = false;
    };
  }, []);

  // Handler for writing style toggle (max 3)
  const handleStyleToggle = (style: string) => {
    if (writingStyles.includes(style)) {
      setWritingStyles(writingStyles.filter((s) => s !== style));
    } else {
      if (writingStyles.length >= 3) {
        setPromptError("Você pode selecionar no máximo 3 estilos de escrita.");
        return;
      }
      setPromptError(null);
      setWritingStyles([...writingStyles, style]);
    }
  };

  // Save connection handler
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
      if (!res.ok) throw new Error(data.error || "Erro ao salvar conexão.");

      setConnectionSuccess(data.message || "Configurações de conexão salvas com sucesso!");
      setHasApiKey(data.config.hasApiKey);
      setIsConfigured(data.config.isConfigured);
      setIsFromEnv(false);
      setApiKey(""); // Clear input
    } catch (err) {
      setConnectionError(err instanceof Error ? err.message : "Erro ao salvar conexão.");
    } finally {
      setIsSavingConnection(false);
    }
  };

  // Test connection handler
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionError(null);
    setConnectionSuccess(null);

    try {
      const res = await fetch("/api/ai/test", { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Falha ao testar conexão com IA.");

      setConnectionSuccess(`Conexão OK! Modelo: ${data.model} | Resposta: "${data.response}"`);
    } catch (err) {
      setConnectionError(err instanceof Error ? err.message : "Erro ao testar IA.");
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Save prompt settings handler
  const handleSavePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPrompt(true);
    setPromptError(null);
    setPromptSuccess(null);

    if (portalArea === "Outro" && !customPortalArea.trim()) {
      setPromptError("Por favor, preencha o campo de área personalizada.");
      setIsSavingPrompt(false);
      return;
    }

    if (writingStyles.includes("Outro") && !customWritingStyle.trim()) {
      setPromptError("Por favor, preencha o campo de estilo personalizado.");
      setIsSavingPrompt(false);
      return;
    }

    try {
      const res = await fetch("/api/ai/prompt-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portalArea,
          customPortalArea,
          writingStyles,
          customWritingStyle,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar prompt.");

      setPromptSuccess(data.message || "Configurações do Prompt salvas com sucesso!");
    } catch (err) {
      setPromptError(err instanceof Error ? err.message : "Erro ao salvar prompt.");
    } finally {
      setIsSavingPrompt(false);
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
        return "deepseek/deepseek-chat";
      default:
        return "";
    }
  };

  const getBaseUrlPlaceholder = () => {
    switch (provider) {
      case "openai-compatible":
        return "https://openrouter.ai/api/v1";
      case "openai":
        return "https://api.openai.com/v1 (opcional)";
      default:
        return "";
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
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6 transition-colors duration-200">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Configurações de Inteligência Artificial</h1>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Gerenciamento do provedor de IA (chaves e modelos) e personalização dinâmica das diretrizes editoriais.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-px mt-6">
        <button
          type="button"
          onClick={() => setActiveTab("connection")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 ${
            activeTab === "connection"
              ? "border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-zinc-900/40"
              : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/20"
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
              ? "border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-zinc-900/40"
              : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/20"
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
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm dark:shadow-none">
            <div className="flex items-center gap-3">
              <ShieldCheck className={`w-5 h-5 ${isConfigured ? "text-emerald-500 dark:text-emerald-400" : "text-amber-500 dark:text-amber-400"}`} />
              <div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                  Provedor Ativo: <span className="uppercase text-emerald-600 dark:text-emerald-400 font-bold">{provider}</span> ({isConfigured ? "Configurado" : "Pendente"})
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {isFromEnv
                    ? "Utilizando OPENAI_API_KEY das variáveis de ambiente (.env) como fallback"
                    : "Utilizando provedor e API Key criptografada armazenados no banco de dados"}
                </p>
              </div>
            </div>

            <button
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? "animate-spin" : ""}`} />
              {isTestingConnection ? "Testando..." : "Testar Conexão"}
            </button>
          </div>

          {/* Incompatibility Warning for Advanced Providers */}
          {!advancedProviders && !(ALLOWED_PROVIDERS_RESTRICTED as readonly string[]).includes(provider) && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Provedor incompatível com seu plano atual</p>
                <p className="mt-0.5 text-[11px]">
                  O provedor atualmente salvo (<strong className="uppercase">{provider}</strong>) requer o recurso de Provedores Avançados.
                  Para utilizar Gemini ou Anthropic, faça o <a href="/billing" className="underline font-bold">upgrade do plano</a> ou altere para OpenAI / OpenAI-Compatible abaixo.
                </p>
              </div>
            </div>
          )}

          {/* Alerts */}
          {connectionError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                <span>{connectionError}</span>
              </div>
              <button onClick={() => setConnectionError(null)} className="text-rose-500 hover:underline">
                Fechar
              </button>
            </div>
          )}

          {connectionSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span>{connectionSuccess}</span>
              </div>
              <button onClick={() => setConnectionSuccess(null)} className="text-emerald-600 hover:underline">
                Fechar
              </button>
            </div>
          )}

          {/* Settings Form */}
          <form onSubmit={handleSaveConnection} className="p-6 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-5 shadow-sm dark:shadow-none">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              Seleção e Credenciais do Provedor de IA
            </h2>

            <div className="space-y-4">
              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Selecione o Provedor de IA</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as AIProviderType)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                  <option value="gemini" disabled={!advancedProviders}>
                    Google Gemini (Gemini 1.5 Flash / Pro){!advancedProviders ? " 🔒 (Requer Upgrade)" : ""}
                  </option>
                  <option value="anthropic" disabled={!advancedProviders}>
                    Anthropic Claude (Claude 3.5 Haiku / Sonnet){!advancedProviders ? " 🔒 (Requer Upgrade)" : ""}
                  </option>
                  <option value="openai-compatible">OpenAI-Compatible (DeepSeek, OpenRouter, Kimi, etc.)</option>
                </select>
              </div>

              {/* Model Input */}
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Modelo de IA (Model)</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={`Ex: ${getModelPlaceholder()}`}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  Deixe em branco para utilizar o modelo padrão recomendado do provedor ({getModelPlaceholder()}).
                </p>
              </div>

              {/* Base URL */}
              {(provider === "openai-compatible" || provider === "openai") && (
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Base URL do Endpoint {provider === "openai-compatible" ? "(Obrigatório)" : "(Opcional)"}
                  </label>
                  <input
                    type="url"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder={getBaseUrlPlaceholder()}
                    required={provider === "openai-compatible"}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* API Key Input */}
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  API Key {hasApiKey ? "(Chave criptografada em uso)" : ""}
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={hasApiKey ? "•••••••••••••••• (Deixe em branco para manter a chave atual)" : "sk-..."}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
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
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                <span>{promptError}</span>
              </div>
              <button onClick={() => setPromptError(null)} className="text-rose-500 hover:underline">
                Fechar
              </button>
            </div>
          )}

          {promptSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span>{promptSuccess}</span>
              </div>
              <button onClick={() => setPromptSuccess(null)} className="text-emerald-600 hover:underline">
                Fechar
              </button>
            </div>
          )}

          <form onSubmit={handleSavePrompt} className="space-y-6">
            {/* Section 1: Área do Portal */}
            <div className="p-6 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm dark:shadow-none">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">Área de Atuação do Portal</h2>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Define o nicho editorial utilizado para avaliar relevância e orientar o tom jornalístico.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {PORTAL_AREAS.map((area) => {
                  const isAllowed = unlimitedNiches ||
                    (ALLOWED_NICHES_RESTRICTED as readonly string[]).includes(area);
                  const isLocked = !isAllowed;

                  return (
                    <label
                      key={area}
                      title={isLocked ? `Disponível apenas em planos superiores. Opções disponíveis: ${ALLOWED_NICHES_RESTRICTED.join(", ")}` : undefined}
                      className={`relative flex items-center gap-2.5 p-3 rounded-lg border text-xs font-medium transition select-none ${
                        isLocked
                          ? "opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-zinc-950/30 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600"
                          : portalArea === area
                          ? "cursor-pointer bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm"
                          : "cursor-pointer bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      {isLocked ? (
                        <>
                          <Lock className="w-3.5 h-3.5 shrink-0" />
                          <span className="flex-1">{area}</span>
                          <a
                            href="/billing"
                            onClick={(e) => e.stopPropagation()}
                            className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition"
                          >
                            Upgrade
                          </a>
                        </>
                      ) : (
                        <>
                          <input
                            type="radio"
                            name="portalArea"
                            value={area}
                            checked={portalArea === area}
                            onChange={() => setPortalArea(area)}
                            className="text-emerald-500 focus:ring-emerald-500 h-3.5 w-3.5 bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700"
                          />
                          <span>{area}</span>
                        </>
                      )}
                    </label>
                  );
                })}
              </div>

              {portalArea === "Outro" && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
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
                    className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>

            {/* Section 2: Estilos de Escrita */}
            <div className="p-6 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm dark:shadow-none">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">Estilos de Escrita</h2>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Escolha até 3 estilos editoriais para direcionar o tom da reescrita dos artigos.
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                    writingStyles.length === 3
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  {writingStyles.length}/3 selecionados
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {WRITING_STYLES.map((style) => {
                  const isAllowed = unlimitedStyles ||
                    (ALLOWED_STYLES_RESTRICTED as readonly string[]).includes(style);
                  const isLocked = !isAllowed;
                  const isChecked = writingStyles.includes(style);
                  const isDisabledByCount = !isChecked && writingStyles.length >= 3;
                  const isDisabled = isLocked || isDisabledByCount;

                  return (
                    <label
                      key={style}
                      title={isLocked ? `Disponível apenas em planos superiores. Estilos disponíveis: ${ALLOWED_STYLES_RESTRICTED.join(", ")}` : undefined}
                      className={`relative flex items-center gap-2.5 p-3 rounded-lg border text-xs font-medium transition select-none ${
                        isLocked
                          ? "opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-zinc-950/30 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600"
                          : isDisabledByCount
                          ? "opacity-40 cursor-not-allowed bg-zinc-100 dark:bg-zinc-950/30 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600"
                          : isChecked
                          ? "cursor-pointer bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm"
                          : "cursor-pointer bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      {isLocked ? (
                        <>
                          <Lock className="w-3.5 h-3.5 shrink-0" />
                          <span className="flex-1">{style}</span>
                          <a
                            href="/billing"
                            onClick={(e) => e.stopPropagation()}
                            className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition"
                          >
                            Upgrade
                          </a>
                        </>
                      ) : (
                        <>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={() => handleStyleToggle(style)}
                            className="rounded text-emerald-500 focus:ring-emerald-500 h-3.5 w-3.5 bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 disabled:opacity-40"
                          />
                          <span>{style}</span>
                        </>
                      )}
                    </label>
                  );
                })}
              </div>

              {writingStyles.includes("Outro") && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
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
                    className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}
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
