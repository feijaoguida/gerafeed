"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Save,
  ShieldCheck,
  RefreshCw,
  Sliders,
  FileText,
  Lock,
  Image as ImageIcon,
} from "lucide-react";
import { DEFAULT_PROMPT_SETTINGS } from "@/lib/ai/types";
import {
  ALLOWED_NICHES_RESTRICTED,
  ALLOWED_STYLES_RESTRICTED,
  ALLOWED_PROVIDERS_RESTRICTED,
} from "@/lib/billing-constants";
import {
  ImageProviderType,
  ImageStrategy,
  ImageStyle,
} from "@/lib/images/types";

import { PageHeader } from "@/components/design-system/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/design-system/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

type AIProviderType = "openai" | "gemini" | "anthropic" | "openai-compatible";
type TabType = "connection" | "images" | "prompt";

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

  // Tab 2: IA de Imagens
  const [imageProvider, setImageProvider] = useState<ImageProviderType>("huggingface");
  const [useSameKeyAsTextAi, setUseSameKeyAsTextAi] = useState(false);
  const [imageApiKey, setImageApiKey] = useState("");
  const [imageModel, setImageModel] = useState("");
  const [imageStrategy, setImageStrategy] = useState<ImageStrategy>("AI_GENERATED");
  const [imageStyle, setImageStyle] = useState<ImageStyle>("REALISTIC");
  const [customImageStyle, setCustomImageStyle] = useState("");
  const [hasImageApiKey, setHasImageApiKey] = useState(false);
  const [isImageConfigured, setIsImageConfigured] = useState(false);
  const [isImageFromEnv, setIsImageFromEnv] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [isTestingImage, setIsTestingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageSuccess, setImageSuccess] = useState<string | null>(null);
  const [imageTestResult, setImageTestResult] = useState<{
    imageUrl?: string;
    message?: string;
  } | null>(null);

  // Tab 3: Prompt Editorial
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
        if (settings.customPortalArea) setCustomPortalArea(settings.customPortalArea);
        if (Array.isArray(settings.writingStyles)) setWritingStyles(settings.writingStyles);
        if (settings.customWritingStyle) setCustomWritingStyle(settings.customWritingStyle);

        if (billingRes.ok) {
          const billingData = await billingRes.json();
          const aiFeats = billingData.aiFeatures || {};
          const features: string[] = billingData.features || [];

          setUnlimitedNiches(
            Boolean(aiFeats.unlimitedNiches) ||
            features.includes("ai_unlimited_niches") ||
            features.includes("unlimited_ai_niches")
          );
          setUnlimitedStyles(
            Boolean(aiFeats.unlimitedStyles) ||
            features.includes("ai_unlimited_styles") ||
            features.includes("unlimited_ai_styles")
          );
          setAdvancedProviders(
            Boolean(aiFeats.advancedProviders) ||
            features.includes("ai_advanced_providers") ||
            features.includes("advanced_ai_providers")
          );
        }
      } catch (err) {
        if (!active) return;
        console.error("Error loading prompt settings:", err);
        setPromptError("Erro ao carregar configurações de prompt editorial.");
      } finally {
        if (active) setIsLoadingPrompt(false);
      }
    }

    loadPromptConfig();
    return () => {
      active = false;
    };
  }, []);

  // Load image settings
  useEffect(() => {
    let active = true;

    async function loadImageConfig() {
      try {
        const res = await fetch("/api/images/config");
        if (!res.ok) throw new Error("Erro ao buscar configurações de imagem.");
        const data = await res.json();

        if (!active) return;

        setImageProvider(data.imageProvider || "huggingface");
        setUseSameKeyAsTextAi(Boolean(data.useSameKeyAsTextAi));
        setImageModel(data.customModel || "");
        setImageStrategy(data.defaultStrategy || "AI_GENERATED");
        setImageStyle(data.imageStyle || "REALISTIC");
        setCustomImageStyle(data.customImageStyle || "");
        setHasImageApiKey(Boolean(data.hasCustomApiKey));
        setIsImageConfigured(Boolean(data.isConfigured));
        setIsImageFromEnv(Boolean(data.isFromEnv));
      } catch (err) {
        if (!active) return;
        console.error("Error loading image settings:", err);
      } finally {
        if (active) setIsLoadingImage(false);
      }
    }

    loadImageConfig();
    return () => {
      active = false;
    };
  }, []);

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
          apiKey: apiKey.trim() || undefined,
          model: model.trim() || undefined,
          baseUrl: baseUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar configurações.");

      setConnectionSuccess("Configurações do provedor de IA salvas com sucesso!");
      setHasApiKey(Boolean(data.hasApiKey));
      setIsConfigured(Boolean(data.isConfigured));
      setIsFromEnv(Boolean(data.isFromEnv));
      setApiKey("");
    } catch (err) {
      setConnectionError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setIsSavingConnection(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionError(null);
    setConnectionSuccess(null);

    try {
      const res = await fetch("/api/ai/test", { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Falha no teste de conexão.");

      setConnectionSuccess(`Conexão bem-sucedida! Resposta do modelo: "${data.reply}"`);
    } catch (err) {
      setConnectionError(err instanceof Error ? err.message : "Falha ao testar IA.");
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveImage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingImage(true);
    setImageError(null);
    setImageSuccess(null);

    try {
      const payload: Record<string, unknown> = {
        defaultStrategy: imageStrategy,
        imageStyle,
        customImageStyle: imageStyle === "CUSTOM" ? customImageStyle : undefined,
        useSameKeyAsTextAi,
        imageProvider,
        customModel: imageModel.trim() || undefined,
      };

      if (imageApiKey.trim()) {
        payload.customApiKey = imageApiKey.trim();
      }

      const res = await fetch("/api/images/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar configurações de imagem.");

      setImageSuccess("Configurações da IA de Imagens salvas com sucesso!");
      if (imageApiKey.trim()) {
        setHasImageApiKey(true);
        setImageApiKey("");
      }
      setIsImageConfigured(true);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Erro ao salvar configurações de imagem.");
    } finally {
      setIsSavingImage(false);
    }
  };

  const handleTestImage = async () => {
    setIsTestingImage(true);
    setImageError(null);
    setImageSuccess(null);
    setImageTestResult(null);

    try {
      const res = await fetch("/api/images/test", { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Falha no teste de geração de imagem.");

      setImageSuccess(data.message || "Imagem gerada com sucesso!");
      if (data.imageUrl) {
        setImageTestResult({
          imageUrl: data.imageUrl,
          message: data.message,
        });
      }
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Falha ao testar IA de imagens.");
    } finally {
      setIsTestingImage(false);
    }
  };

  const handleSavePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPrompt(true);
    setPromptError(null);
    setPromptSuccess(null);

    try {
      const res = await fetch("/api/ai/prompt-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portalArea,
          customPortalArea: portalArea === "Outro" ? customPortalArea.trim() : null,
          writingStyles,
          customWritingStyle: writingStyles.includes("Outro") ? customWritingStyle.trim() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar prompt settings.");

      setPromptSuccess("Diretrizes do prompt editorial salvas com sucesso!");
    } catch (err) {
      setPromptError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const handleStyleToggle = (style: string) => {
    setWritingStyles((prev) => {
      if (prev.includes(style)) {
        return prev.filter((s) => s !== style);
      } else {
        if (prev.length >= 3) return prev;
        return [...prev, style];
      }
    });
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
        return "";
    }
  };

  const getBaseUrlPlaceholder = () => {
    switch (provider) {
      case "openai-compatible":
        return "https://api.deepseek.com/v1";
      case "openai":
        return "https://api.openai.com/v1 (opcional)";
      default:
        return "";
    }
  };

  const getImageModelPlaceholder = () => {
    switch (imageProvider) {
      case "huggingface":
        return "black-forest-labs/FLUX.1-schnell";
      case "pollinations":
        return "flux";
      case "openai":
        return "dall-e-3";
      case "gemini":
        return "imagen-3.0-generate-002";
      case "openrouter":
        return "black-forest-labs/flux.2-klein-4b";
      default:
        return "";
    }
  };

  if (isLoadingConnection && isLoadingPrompt && isLoadingImage) {
    return (
      <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header com PageHeader */}
      <PageHeader
        title="Configurações de Inteligência Artificial"
        description="Gerenciamento do provedor de IA (chaves e modelos) e personalização dinâmica das diretrizes editoriais."
        icon={<Sparkles className="w-5 h-5 text-primary" />}
      />

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <Button
          type="button"
          variant={activeTab === "connection" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("connection")}
          leadingIcon={<Sliders className="w-4 h-4" />}
          className={activeTab === "connection" ? "font-bold text-primary shadow-xs" : "text-muted-foreground"}
        >
          Conexão & Provedor (Texto)
        </Button>
        <Button
          type="button"
          variant={activeTab === "images" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("images")}
          leadingIcon={<ImageIcon className="w-4 h-4" />}
          className={activeTab === "images" ? "font-bold text-primary shadow-xs" : "text-muted-foreground"}
        >
          IA de Imagens (Hugging Face / DALL-E)
        </Button>
        <Button
          type="button"
          variant={activeTab === "prompt" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("prompt")}
          leadingIcon={<FileText className="w-4 h-4" />}
          className={activeTab === "prompt" ? "font-bold text-primary shadow-xs" : "text-muted-foreground"}
        >
          Prompt Editorial & Nichos
        </Button>
      </div>

      {/* TAB 1: CONEXÃO */}
      {activeTab === "connection" && (
        <div className="space-y-6">
          {/* Connection Status Card */}
          <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs bg-surface-muted/30">
            <div className="flex items-center gap-3">
              <ShieldCheck className={`w-5 h-5 ${isConfigured ? "text-[#00C2A8]" : "text-amber-500"}`} />
              <div>
                <p className="font-heading text-xs font-semibold text-foreground">
                  Provedor Ativo: <span className="uppercase text-primary font-bold">{provider}</span> ({isConfigured ? "Configurado" : "Pendente"})
                </p>
                <p className="font-sans text-[11px] text-muted-foreground">
                  {isFromEnv
                    ? "Utilizando OPENAI_API_KEY das variáveis de ambiente (.env) como fallback"
                    : "Utilizando provedor e API Key criptografada com AES-256-GCM"}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              isLoading={isTestingConnection}
              leadingIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Testar Conexão
            </Button>
          </Card>

          {/* Incompatibility Warning for Advanced Providers */}
          {!advancedProviders && !(ALLOWED_PROVIDERS_RESTRICTED as readonly string[]).includes(provider) && (
            <Alert variant="warning">
              <div>
                <p className="font-semibold">Provedor incompatível com seu plano atual</p>
                <p className="mt-0.5 text-[11px]">
                  O provedor atualmente salvo (<strong className="uppercase">{provider}</strong>) requer o recurso de Provedores Avançados.
                  Para utilizar Gemini ou Anthropic, faça o <Link href="/settings/billing/upgrade" className="underline font-bold text-primary">upgrade do plano</Link> ou altere para OpenAI abaixo.
                </p>
              </div>
            </Alert>
          )}

          {/* Alerts */}
          {connectionError && (
            <Alert variant="destructive" onClose={() => setConnectionError(null)}>
              {connectionError}
            </Alert>
          )}

          {connectionSuccess && (
            <Alert variant="success" onClose={() => setConnectionSuccess(null)}>
              {connectionSuccess}
            </Alert>
          )}

          {/* Settings Form */}
          <form onSubmit={handleSaveConnection}>
            <Card className="p-6 space-y-5 shadow-xs">
              <CardHeader className="p-0 border-b border-border pb-3">
                <CardTitle className="text-sm font-semibold">
                  Seleção e Credenciais do Provedor de IA
                </CardTitle>
              </CardHeader>

              <CardContent className="p-0 space-y-4">
                <FormField label="Selecione o Provedor de IA" required>
                  <Select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as AIProviderType)}
                  >
                    <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                    <option value="gemini" disabled={!advancedProviders}>
                      Google Gemini (Gemini 1.5 Flash / Pro){!advancedProviders ? " 🔒 (Requer Upgrade)" : ""}
                    </option>
                    <option value="anthropic" disabled={!advancedProviders}>
                      Anthropic Claude (Claude 3.5 Haiku / Sonnet){!advancedProviders ? " 🔒 (Requer Upgrade)" : ""}
                    </option>
                    <option value="openai-compatible">OpenAI-Compatible (DeepSeek, OpenRouter, Kimi, etc.)</option>
                  </Select>
                </FormField>

                <FormField label="Modelo de IA (Model)">
                  <Input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={`Ex: ${getModelPlaceholder()}`}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Deixe em branco para utilizar o modelo padrão recomendado do provedor ({getModelPlaceholder()}).
                  </p>
                </FormField>

                {(provider === "openai-compatible" || provider === "openai") && (
                  <FormField
                    label={`Base URL do Endpoint ${provider === "openai-compatible" ? "(Obrigatório)" : "(Opcional)"}`}
                    required={provider === "openai-compatible"}
                  >
                    <Input
                      type="url"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder={getBaseUrlPlaceholder()}
                      required={provider === "openai-compatible"}
                    />
                  </FormField>
                )}

                <FormField
                  label={`API Key ${hasApiKey ? "(Chave criptografada em uso)" : ""}`}
                >
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={hasApiKey ? "•••••••••••••••• (Deixe em branco para manter a chave atual)" : "sk-..."}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    A chave é armazenada de forma segura com criptografia autenticada AES-256-GCM.
                  </p>
                </FormField>
              </CardContent>

              <CardFooter className="p-0 pt-2">
                <Button
                  type="submit"
                  variant="gradient"
                  isLoading={isSavingConnection}
                  leadingIcon={<Save className="w-4 h-4" />}
                >
                  Salvar Configurações de Conexão
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      )}

      {/* TAB 2: IA DE IMAGENS */}
      {activeTab === "images" && (
        <div className="space-y-6">
          {/* Image Connection Status Card */}
          <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs bg-surface-muted/30">
            <div className="flex items-center gap-3">
              <ShieldCheck className={`w-5 h-5 ${isImageConfigured ? "text-[#00C2A8]" : "text-amber-500"}`} />
              <div>
                <p className="font-heading text-xs font-semibold text-foreground">
                  Provedor de Imagens:{" "}
                  <span className="uppercase text-primary font-bold">
                    {useSameKeyAsTextAi ? `Herdado (${provider})` : imageProvider}
                  </span>{" "}
                  ({isImageConfigured ? "Configurado" : "Pendente"})
                </p>
                <p className="font-sans text-[11px] text-muted-foreground">
                  {imageProvider === "pollinations"
                    ? "Pollinations.ai — 100% gratuito e sem necessidade de chave de API"
                    : isImageFromEnv
                    ? "Utilizando HUGGINGFACE_API_KEY das variáveis de ambiente (.env) como fallback"
                    : hasImageApiKey
                    ? "Chave de API criptografada com AES-256-GCM ativa no banco de dados"
                    : "Configure o token de acesso (Bearer Token) para geração de imagens"}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleTestImage}
              isLoading={isTestingImage}
              leadingIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Testar IA de Imagens
            </Button>
          </Card>

          {/* Alerts */}
          {imageError && (
            <Alert variant="destructive" onClose={() => setImageError(null)}>
              {imageError}
            </Alert>
          )}

          {imageSuccess && (
            <Alert variant="success" onClose={() => setImageSuccess(null)}>
              {imageSuccess}
            </Alert>
          )}

          {/* Image Test Result Preview */}
          {imageTestResult?.imageUrl && (
            <Card className="p-4 bg-surface-muted/40 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  {imageTestResult.message || "Resultado do Teste de Imagem"}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setImageTestResult(null)}
                >
                  Fechar
                </Button>
              </div>
              <div className="max-w-xs mx-auto rounded-lg overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageTestResult.imageUrl}
                  alt="Preview do Teste de Imagem"
                  className="w-full h-auto object-cover"
                />
              </div>
            </Card>
          )}

          <form onSubmit={handleSaveImage}>
            <Card className="p-6 space-y-5 shadow-xs">
              <CardHeader className="p-0 border-b border-border pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  Configuração e Credenciais da IA de Imagens
                </CardTitle>
                <p className="font-sans text-[11px] text-muted-foreground mt-0.5">
                  Escolha o provedor de imagens, modelo, estilo padrão e configure sua chave de acesso.
                </p>
              </CardHeader>

              <CardContent className="p-0 space-y-4">
                {/* Herança ou Chave Dedicada */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="inheritKeyCheckbox"
                    checked={useSameKeyAsTextAi}
                    disabled={provider === "anthropic"}
                    onChange={(e) => setUseSameKeyAsTextAi(e.target.checked)}
                    className="accent-primary rounded-sm"
                  />
                  <label htmlFor="inheritKeyCheckbox" className="text-xs font-medium cursor-pointer">
                    Reaproveitar a mesma chave da IA de Texto ({provider.toUpperCase()})
                  </label>
                  {provider === "anthropic" && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400">
                      (Anthropic não gera imagens; utilize Hugging Face, Pollinations, OpenAI ou Gemini)
                    </span>
                  )}
                </div>

                {!useSameKeyAsTextAi && (
                  <>
                    <FormField label="Selecione o Provedor de Imagens" required>
                      <Select
                        value={imageProvider}
                        onChange={(e) => setImageProvider(e.target.value as ImageProviderType)}
                      >
                        <option value="huggingface">Hugging Face (FLUX.1 Schnell — Gratuito com Token HF)</option>
                        <option value="pollinations">Pollinations.ai (FLUX — Gratuito Sem Chave)</option>
                        <option value="openai">OpenAI (DALL-E 3)</option>
                        <option value="gemini">Google Gemini (Imagen 3)</option>
                        <option value="openrouter">OpenRouter (FLUX.1 / FLUX.2)</option>
                      </Select>
                    </FormField>

                    <FormField label="Modelo de Imagem (Model)">
                      <Input
                        type="text"
                        value={imageModel}
                        onChange={(e) => setImageModel(e.target.value)}
                        placeholder={`Ex: ${getImageModelPlaceholder()}`}
                      />
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Deixe em branco para utilizar o modelo padrão recomendado ({getImageModelPlaceholder()}).
                      </p>
                    </FormField>

                    {imageProvider !== "pollinations" ? (
                      <FormField
                        label={`API Key / Token de Acesso ${
                          hasImageApiKey ? "(Chave criptografada em uso)" : ""
                        }`}
                        required={!hasImageApiKey}
                      >
                        <Input
                          type="password"
                          value={imageApiKey}
                          onChange={(e) => setImageApiKey(e.target.value)}
                          placeholder={
                            hasImageApiKey
                              ? "•••••••••••••••• (Deixe em branco para manter a chave atual)"
                              : imageProvider === "huggingface"
                              ? "hf_..."
                              : "sk-..."
                          }
                        />
                        <p className="text-[11px] text-muted-foreground mt-1">
                          A chave é armazenada de forma segura com criptografia autenticada AES-256-GCM.
                        </p>
                      </FormField>
                    ) : (
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300">
                        ✓ A Pollinations.ai é 100% gratuita e de código aberto. Não exige cadastro nem chave de API.
                      </div>
                    )}
                  </>
                )}

                {/* Estratégia de Imagem */}
                <FormField label="Estratégia Padrão para Matérias RSS">
                  <Select
                    value={imageStrategy}
                    onChange={(e) => setImageStrategy(e.target.value as ImageStrategy)}
                  >
                    <option value="AI_GENERATED">Gerar Nova Imagem com IA (Contextualizada)</option>
                    <option value="ORIGINAL">Imagem Original (RSS — Sem IA)</option>
                    <option value="MODIFIED">Processar com Sharp (Inversão Local — Sem Custo)</option>
                  </Select>
                </FormField>

                {/* Estilo Visual */}
                <FormField label="Estilo Visual Padrão da Imagem">
                  <Select
                    value={imageStyle}
                    onChange={(e) => setImageStyle(e.target.value as ImageStyle)}
                  >
                    <option value="REALISTIC">Realista / Fotojornalismo (DSLR, 35mm, 8k)</option>
                    <option value="CARTOON">Cartoon / 3D (Estilo Pixar, cores vibrantes)</option>
                    <option value="DRAWING">Desenho / Ilustração (2D vetorial editorial)</option>
                    <option value="SATIRICAL_CARTOON">Sátira Cartoon / Charge Editorial</option>
                    <option value="CUSTOM">Personalizado</option>
                  </Select>
                </FormField>

                {imageStyle === "CUSTOM" && (
                  <FormField label="Descrição do Estilo Personalizado" required>
                    <Input
                      type="text"
                      value={customImageStyle}
                      onChange={(e) => setCustomImageStyle(e.target.value)}
                      placeholder="Ex: retro synthwave editorial photography, cinematic lighting..."
                    />
                  </FormField>
                )}
              </CardContent>

              <CardFooter className="p-0 pt-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
                <Link
                  href="/settings/images"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Configurações avançadas e template de prompt →
                </Link>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestImage}
                    isLoading={isTestingImage}
                    leadingIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Testar IA de Imagens
                  </Button>
                  <Button
                    type="submit"
                    variant="gradient"
                    isLoading={isSavingImage}
                    leadingIcon={<Save className="w-4 h-4" />}
                  >
                    Salvar Configurações de Imagem
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </form>
        </div>
      )}

      {/* TAB 3: PROMPT EDITORIAL */}
      {activeTab === "prompt" && (
        <div className="space-y-6">
          {promptError && (
            <Alert variant="destructive" onClose={() => setPromptError(null)}>
              {promptError}
            </Alert>
          )}

          {promptSuccess && (
            <Alert variant="success" onClose={() => setPromptSuccess(null)}>
              {promptSuccess}
            </Alert>
          )}

          <form onSubmit={handleSavePrompt} className="space-y-6">
            {/* Section 1: Área do Portal */}
            <Card className="p-6 space-y-4 shadow-xs">
              <CardHeader className="p-0 border-b border-border pb-3">
                <CardTitle className="text-sm font-semibold">
                  Área de Atuação do Portal
                </CardTitle>
                <p className="font-sans text-[11px] text-muted-foreground mt-0.5">
                  Define o nicho editorial utilizado para avaliar relevância e orientar o tom jornalístico.
                </p>
              </CardHeader>

              <CardContent className="p-0 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {PORTAL_AREAS.map((area) => {
                    const isAllowed = unlimitedNiches ||
                      (ALLOWED_NICHES_RESTRICTED as readonly string[]).includes(area);
                    const isLocked = !isAllowed;

                    return (
                      <label
                        key={area}
                        title={isLocked ? `Disponível apenas em planos superiores. Opções disponíveis: ${ALLOWED_NICHES_RESTRICTED.join(", ")}` : undefined}
                        className={`relative flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium transition-all select-none ${
                          isLocked
                            ? "opacity-50 cursor-not-allowed bg-surface-muted/40 border-border text-muted-foreground"
                            : portalArea === area
                            ? "cursor-pointer bg-primary/10 border-primary text-primary shadow-xs ring-1 ring-primary/20"
                            : "cursor-pointer bg-surface border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                        }`}
                      >
                        {isLocked ? (
                          <>
                            <Lock className="w-3.5 h-3.5 shrink-0" />
                            <span className="flex-1 truncate">{area}</span>
                            <Link
                              href="/settings/billing/upgrade"
                              onClick={(e) => e.stopPropagation()}
                              className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
                            >
                              Upgrade
                            </Link>
                          </>
                        ) : (
                          <>
                            <input
                              type="radio"
                              name="portalArea"
                              value={area}
                              checked={portalArea === area}
                              onChange={() => setPortalArea(area)}
                              className="accent-primary h-3.5 w-3.5"
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
                    <FormField label="Informe a área personalizada" required>
                      <Input
                        type="text"
                        value={customPortalArea}
                        onChange={(e) => setCustomPortalArea(e.target.value.slice(0, 100))}
                        placeholder="Ex: Criptoeconomia, Gastronomia, Games, etc."
                        maxLength={100}
                        required={portalArea === "Outro"}
                      />
                    </FormField>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section 2: Estilos de Escrita */}
            <Card className="p-6 space-y-4 shadow-xs">
              <CardHeader className="p-0 border-b border-border pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    Estilos de Escrita
                  </CardTitle>
                  <p className="font-sans text-[11px] text-muted-foreground mt-0.5">
                    Escolha até 3 estilos editoriais para direcionar o tom da reescrita dos artigos.
                  </p>
                </div>
                <Badge variant={writingStyles.length === 3 ? "warning" : "secondary"}>
                  {writingStyles.length}/3 selecionados
                </Badge>
              </CardHeader>

              <CardContent className="p-0 space-y-4">
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
                        className={`relative flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium transition-all select-none ${
                          isLocked
                            ? "opacity-50 cursor-not-allowed bg-surface-muted/40 border-border text-muted-foreground"
                            : isDisabledByCount
                            ? "opacity-40 cursor-not-allowed bg-surface-muted/40 border-border text-muted-foreground"
                            : isChecked
                            ? "cursor-pointer bg-primary/10 border-primary text-primary shadow-xs ring-1 ring-primary/20"
                            : "cursor-pointer bg-surface border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                        }`}
                      >
                        {isLocked ? (
                          <>
                            <Lock className="w-3.5 h-3.5 shrink-0" />
                            <span className="flex-1 truncate">{style}</span>
                            <Link
                              href="/settings/billing/upgrade"
                              onClick={(e) => e.stopPropagation()}
                              className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
                            >
                              Upgrade
                            </Link>
                          </>
                        ) : (
                          <>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isDisabled}
                              onChange={() => handleStyleToggle(style)}
                              className="accent-primary h-3.5 w-3.5 disabled:opacity-40"
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
                    <FormField label="Informe o estilo personalizado" required>
                      <Input
                        type="text"
                        value={customWritingStyle}
                        onChange={(e) => setCustomWritingStyle(e.target.value.slice(0, 100))}
                        placeholder="Ex: Investigativo, Irônico, Didático, etc."
                        maxLength={100}
                        required={writingStyles.includes("Outro")}
                      />
                    </FormField>
                  </div>
                )}
              </CardContent>

              <CardFooter className="p-0 pt-2">
                <Button
                  type="submit"
                  variant="gradient"
                  isLoading={isSavingPrompt}
                  leadingIcon={<Save className="w-4 h-4" />}
                >
                  Salvar Configurações do Prompt
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      )}
    </div>
  );
}
