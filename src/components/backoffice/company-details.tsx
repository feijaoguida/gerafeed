"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  ArrowLeft,
  Layers,
  Rss,
  Globe,
  Sparkles,
  Users,
  Settings,
  Check,
  X,
  ShieldCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Power,
  RefreshCw,
  Zap,
} from "lucide-react";

import { PageHeader } from "@/components/design-system/page-header";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";

export interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  maxArticles: number;
  maxSources: number;
}

export interface WorkspaceMember {
  id: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
  };
}

export interface WordPressSiteSourceItem {
  id: string;
  wordpressSiteId: string;
  wordpressSite?: {
    id: string;
    name: string;
    url?: string;
  };
}

export interface SourceItem {
  id: string;
  name: string;
  creditName?: string | null;
  rssUrl?: string;
  url?: string;
  defaultPromptType?: string | null;
  active: boolean;
  wordpressSiteSources?: WordPressSiteSourceItem[];
}

export interface WordPressSiteItem {
  id: string;
  name: string;
  url: string;
  username: string;
  hasPassword: boolean;
  defaultPromptType?: string | null;
  active: boolean;
  isDefault?: boolean;
  sources?: Array<{
    id: string;
    source?: {
      id: string;
      name: string;
    };
  }>;
  _count?: {
    categories?: number;
    articles?: number;
  };
}

export interface ConfigItem {
  id: string;
  key: string;
  value: Record<string, unknown>;
}

export interface WorkspaceStats {
  articlesProcessedThisMonth: number;
  totalArticlesCount: number;
  activeSourcesCount: number;
  totalSourcesCount: number;
  wordpressCount: number;
  membersCount: number;
  maxArticles: number;
  maxSources: number;
}

export interface WorkspaceDetailData {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  subscription?: {
    id?: string;
    status?: string;
    billingCycle?: string;
    billingMethod?: string;
    amount?: number | null;
    asaasSubscriptionId?: string | null;
    providerCustomerId?: string | null;
    providerSubscriptionId?: string | null;
    validUntil?: string | null;
    currentPeriodEnd?: string | null;
    nextDueDate?: string | null;
    cancelAtPeriodEnd?: boolean;
    canceledAt?: string | null;
    plan?: Plan;
    planId?: string;
  } | null;
  billingProfile?: {
    name?: string;
    email?: string;
    cpfCnpj?: string;
    mobilePhone?: string | null;
    providerCustomerId?: string | null;
  } | null;
  invoices?: Array<{
    id: string;
    provider: string;
    providerPaymentId: string;
    amount: number;
    billingMethod: string;
    status: string;
    dueDate: string | null;
    confirmedAt: string | null;
    receivedAt: string | null;
    invoiceUrl: string | null;
    bankSlipUrl: string | null;
    createdAt: string;
  }>;

  members?: WorkspaceMember[];
  sources?: SourceItem[];
  wordpressSites?: WordPressSiteItem[];
  configurations?: ConfigItem[];
  stats?: WorkspaceStats;
}

interface CompanyDetailsProps {
  initialWorkspace: WorkspaceDetailData;
  availablePlans: Plan[];
}

export function CompanyDetails({ initialWorkspace, availablePlans }: CompanyDetailsProps) {
  const [workspace, setWorkspace] = useState<WorkspaceDetailData>(initialWorkspace);
  const [activeTab, setActiveTab] = useState<
    "overview" | "plan" | "feeds" | "wordpress" | "ai" | "settings"
  >("overview");

  // Edit settings form
  const [name, setName] = useState(workspace.name);
  const [slug, setSlug] = useState(workspace.slug);
  const [active, setActive] = useState(workspace.active);

  // Plan change form
  const [selectedPlanId, setSelectedPlanId] = useState(
    workspace.subscription?.planId || availablePlans[0]?.id || ""
  );

  // Feeds management state
  const [feedSearch, setFeedSearch] = useState("");
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
  const [editingFeed, setEditingFeed] = useState<SourceItem | null>(null);
  const [feedName, setFeedName] = useState("");
  const [feedCreditName, setFeedCreditName] = useState("");
  const [feedRssUrl, setFeedRssUrl] = useState("");
  const [feedDefaultPromptType, setFeedDefaultPromptType] = useState<string>("default");
  const [feedActive, setFeedActive] = useState(true);
  const [feedSelectedWpSites, setFeedSelectedWpSites] = useState<string[]>([]);

  // WordPress management state
  const [isWpModalOpen, setIsWpModalOpen] = useState(false);
  const [editingWp, setEditingWp] = useState<WordPressSiteItem | null>(null);
  const [wpName, setWpName] = useState("");
  const [wpUrl, setWpUrl] = useState("");
  const [wpUsername, setWpUsername] = useState("");
  const [wpPassword, setWpPassword] = useState("");
  const [wpDefaultPromptType, setWpDefaultPromptType] = useState<string>("default");
  const [wpActive, setWpActive] = useState(true);
  const [wpSelectedSources, setWpSelectedSources] = useState<string[]>([]);
  const [isTestingWpId, setIsTestingWpId] = useState<string | null>(null);
  const [isSyncingWpId, setIsSyncingWpId] = useState<string | null>(null);

  // AI & Prompts state
  const initialAi = (workspace.configurations?.find((c) => c.key === "aiProvider")?.value || {}) as Record<string, unknown>;
  const initialPrompt = (workspace.configurations?.find((c) => c.key === "aiPromptSettings")?.value || {}) as Record<string, unknown>;

  const [aiProvider, setAiProvider] = useState<string>((initialAi.provider as string) || "openai");
  const [aiModel, setAiModel] = useState<string>((initialAi.model as string) || "gpt-4o-mini");
  const [aiBaseUrl, setAiBaseUrl] = useState<string>((initialAi.baseUrl as string) || "");
  const [aiApiKey, setAiApiKey] = useState<string>("");
  const [aiHasApiKey, setAiHasApiKey] = useState<boolean>(Boolean(initialAi.hasApiKey || initialAi.apiKey));
  const [isTestingAi, setIsTestingAi] = useState(false);

  const [promptPortalArea, setPromptPortalArea] = useState<string>((initialPrompt.portalArea as string) || "Geral");
  const [promptCustomPortalArea, setPromptCustomPortalArea] = useState<string>((initialPrompt.customPortalArea as string) || "");
  const [promptWritingStyles, setPromptWritingStyles] = useState<string[]>(
    Array.isArray(initialPrompt.writingStyles) ? (initialPrompt.writingStyles as string[]) : ["Informativo", "Direto"]
  );
  const [promptCustomWritingStyle, setPromptCustomWritingStyle] = useState<string>((initialPrompt.customWritingStyle as string) || "");

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/backoffice/companies/${workspace.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, active }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar dados.");

      setWorkspace((prev) => ({ ...prev, name: data.name, slug: data.slug, active: data.active }));
      setMessage({ type: "success", text: "Dados da empresa atualizados com sucesso!" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erro ao atualizar." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePlan = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/backoffice/companies/${workspace.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlanId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao alterar plano.");

      setWorkspace((prev) => ({
        ...prev,
        subscription: data.subscription,
      }));
      setMessage({ type: "success", text: "Plano da empresa alterado com sucesso!" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erro ao alterar plano." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReconcile = async () => {
    if (!confirm("Deseja forçar a reconciliação desta empresa com a API do Asaas? O sistema irá consultar a assinatura e sincronizar cobranças e faturas.")) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/backoffice/companies/${workspace.id}/reconcile`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro na reconciliação.");

      if (data.workspace) {
        setWorkspace((prev) => ({
          ...prev,
          subscription: data.workspace.subscription,
          invoices: data.workspace.invoices,
        }));
      }

      const logsSummary = data.logs ? data.logs.join(" | ") : "";
      setMessage({
        type: "success",
        text: `Reconciliação concluída com sucesso! ${logsSummary}`,
      });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erro ao reconciliar." });
    } finally {
      setIsLoading(false);
    }
  };

  // Open modal to create feed
  const handleOpenCreateFeed = () => {
    setEditingFeed(null);
    setFeedName("");
    setFeedCreditName("");
    setFeedRssUrl("");
    setFeedDefaultPromptType("default");
    setFeedActive(true);
    setFeedSelectedWpSites([]);
    setIsFeedModalOpen(true);
  };

  // Open modal to edit feed
  const handleOpenEditFeed = (feed: SourceItem) => {
    setEditingFeed(feed);
    setFeedName(feed.name);
    setFeedCreditName(feed.creditName || "");
    setFeedRssUrl(feed.rssUrl || feed.url || "");
    setFeedDefaultPromptType(feed.defaultPromptType || "default");
    setFeedActive(feed.active);
    setFeedSelectedWpSites(feed.wordpressSiteSources?.map((s) => s.wordpressSiteId) || []);
    setIsFeedModalOpen(true);
  };

  // Save feed (create or update)
  const handleSaveFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      if (editingFeed) {
        const res = await fetch(`/api/backoffice/companies/${workspace.id}/feeds/${editingFeed.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: feedName,
            creditName: feedCreditName,
            rssUrl: feedRssUrl,
            defaultPromptType: feedDefaultPromptType === "default" ? null : feedDefaultPromptType,
            active: feedActive,
            wordpressSiteIds: feedSelectedWpSites,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao salvar alterações no feed.");

        setWorkspace((prev) => ({
          ...prev,
          sources: prev.sources?.map((s) => (s.id === data.id ? data : s)),
        }));
        setMessage({ type: "success", text: "Feed atualizado com sucesso!" });
      } else {
        const res = await fetch(`/api/backoffice/companies/${workspace.id}/feeds`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: feedName,
            creditName: feedCreditName,
            rssUrl: feedRssUrl,
            defaultPromptType: feedDefaultPromptType === "default" ? null : feedDefaultPromptType,
            active: feedActive,
            wordpressSiteIds: feedSelectedWpSites,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao cadastrar feed.");

        setWorkspace((prev) => ({
          ...prev,
          sources: [data, ...(prev.sources || [])],
        }));
        setMessage({ type: "success", text: "Novo feed criado com sucesso!" });
      }
      setIsFeedModalOpen(false);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erro ao salvar feed." });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle feed active status
  const handleToggleFeedActive = async (feed: SourceItem) => {
    try {
      const res = await fetch(`/api/backoffice/companies/${workspace.id}/feeds/${feed.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !feed.active }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao alterar status do feed.");

      setWorkspace((prev) => ({
        ...prev,
        sources: prev.sources?.map((s) => (s.id === data.id ? data : s)),
      }));
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erro ao alterar status." });
    }
  };

  // Delete feed
  const handleDeleteFeed = async (feedId: string) => {
    if (!confirm("Tem certeza que deseja excluir este feed permanentemente?")) return;

    try {
      const res = await fetch(`/api/backoffice/companies/${workspace.id}/feeds/${feedId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir feed.");

      setWorkspace((prev) => ({
        ...prev,
        sources: prev.sources?.filter((s) => s.id !== feedId),
      }));
      setMessage({ type: "success", text: "Feed excluído com sucesso!" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erro ao excluir feed." });
    }
  };

  // Open modal to create WP
  const handleOpenCreateWp = () => {
    setEditingWp(null);
    setWpName("");
    setWpUrl("");
    setWpUsername("");
    setWpPassword("");
    setWpDefaultPromptType("default");
    setWpActive(true);
    setWpSelectedSources([]);
    setIsWpModalOpen(true);
  };

  // Open modal to edit WP
  const handleOpenEditWp = (site: WordPressSiteItem) => {
    setEditingWp(site);
    setWpName(site.name);
    setWpUrl(site.url);
    setWpUsername(site.username);
    setWpPassword("");
    setWpDefaultPromptType(site.defaultPromptType || "default");
    setWpActive(site.active);
    setWpSelectedSources(site.sources?.map((s) => s.source?.id || "")?.filter(Boolean) || []);
    setIsWpModalOpen(true);
  };

  // Save WP Site (create or update)
  const handleSaveWp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      if (editingWp) {
        const payload: Record<string, unknown> = {
          name: wpName,
          url: wpUrl,
          username: wpUsername,
          defaultPromptType: wpDefaultPromptType === "default" ? null : wpDefaultPromptType,
          active: wpActive,
          sourceIds: wpSelectedSources,
        };
        if (wpPassword.trim()) {
          payload.applicationPassword = wpPassword.trim();
        }

        const res = await fetch(
          `/api/backoffice/companies/${workspace.id}/wordpress/${editingWp.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao salvar alterações no WordPress.");

        setWorkspace((prev) => ({
          ...prev,
          wordpressSites: prev.wordpressSites?.map((w) => (w.id === data.id ? data : w)),
        }));
        setMessage({ type: "success", text: "Destino WordPress atualizado com sucesso!" });
      } else {
        const res = await fetch(`/api/backoffice/companies/${workspace.id}/wordpress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: wpName,
            url: wpUrl,
            username: wpUsername,
            applicationPassword: wpPassword.trim(),
            defaultPromptType: wpDefaultPromptType === "default" ? null : wpDefaultPromptType,
            active: wpActive,
            sourceIds: wpSelectedSources,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao conectar novo WordPress.");

        setWorkspace((prev) => ({
          ...prev,
          wordpressSites: [data, ...(prev.wordpressSites || [])],
        }));
        setMessage({ type: "success", text: "Novo site WordPress configurado com sucesso!" });
      }
      setIsWpModalOpen(false);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erro ao salvar WordPress." });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle WP active status
  const handleToggleWpActive = async (site: WordPressSiteItem) => {
    try {
      const res = await fetch(`/api/backoffice/companies/${workspace.id}/wordpress/${site.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !site.active }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao alterar status do WordPress.");

      setWorkspace((prev) => ({
        ...prev,
        wordpressSites: prev.wordpressSites?.map((w) => (w.id === data.id ? data : w)),
      }));
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erro ao alterar status." });
    }
  };

  // Test WP connection
  const handleTestWp = async (siteId: string) => {
    setIsTestingWpId(siteId);
    setMessage(null);

    try {
      const res = await fetch(`/api/backoffice/companies/${workspace.id}/wordpress/${siteId}/test`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Falha na conexão com o WordPress.");
      }

      setMessage({ type: "success", text: data.message });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erro ao testar conexão." });
    } finally {
      setIsTestingWpId(null);
    }
  };

  // Sync WP categories
  const handleSyncWp = async (siteId: string) => {
    setIsSyncingWpId(siteId);
    setMessage(null);

    try {
      const res = await fetch(`/api/backoffice/companies/${workspace.id}/wordpress/${siteId}/sync`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Falha ao sincronizar categorias do WordPress.");
      }

      setMessage({ type: "success", text: data.message });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Erro ao sincronizar categorias.",
      });
    } finally {
      setIsSyncingWpId(null);
    }
  };

  // Delete WP
  const handleDeleteWp = async (siteId: string) => {
    if (!confirm("Tem certeza que deseja desvincular este site WordPress permanentemente?")) return;

    try {
      const res = await fetch(`/api/backoffice/companies/${workspace.id}/wordpress/${siteId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir WordPress.");

      setWorkspace((prev) => ({
        ...prev,
        wordpressSites: prev.wordpressSites?.filter((w) => w.id !== siteId),
      }));
      setMessage({ type: "success", text: "Site WordPress desvinculado com sucesso!" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erro ao excluir." });
    }
  };

  // Save AI and Prompt configurations
  const handleSaveAiAndPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const payload: Record<string, unknown> = {
        ai: {
          provider: aiProvider,
          model: aiModel,
          baseUrl: aiBaseUrl,
        },
        prompt: {
          portalArea: promptPortalArea,
          customPortalArea: promptCustomPortalArea,
          writingStyles: promptWritingStyles,
          customWritingStyle: promptCustomWritingStyle,
        },
      };

      if (aiApiKey.trim()) {
        (payload.ai as Record<string, unknown>).apiKey = aiApiKey.trim();
      }

      const res = await fetch(`/api/backoffice/companies/${workspace.id}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar configurações de IA.");

      if (aiApiKey.trim()) setAiHasApiKey(true);
      setAiApiKey("");
      setMessage({ type: "success", text: data.message || "Configurações de IA e Prompts salvas!" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erro ao salvar." });
    } finally {
      setIsLoading(false);
    }
  };

  // Test AI Provider Connection
  const handleTestAi = async () => {
    setIsTestingAi(true);
    setMessage(null);

    try {
      const payload: Record<string, unknown> = {
        provider: aiProvider,
        model: aiModel,
        baseUrl: aiBaseUrl,
      };
      if (aiApiKey.trim()) {
        payload.apiKey = aiApiKey.trim();
      }

      const res = await fetch(`/api/backoffice/companies/${workspace.id}/ai/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.connected) {
        throw new Error(data.message || "Falha na conexão com o provedor de IA.");
      }

      setMessage({ type: "success", text: `Conexão bem-sucedida com ${data.provider} (${data.model})!` });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erro ao testar IA." });
    } finally {
      setIsTestingAi(false);
    }
  };

  const currentPlan = workspace.subscription?.plan;
  const stats: WorkspaceStats = workspace.stats || {
    articlesProcessedThisMonth: 0,
    totalArticlesCount: 0,
    activeSourcesCount: workspace.sources?.filter((s) => s.active).length || 0,
    totalSourcesCount: workspace.sources?.length || 0,
    wordpressCount: workspace.wordpressSites?.length || 0,
    membersCount: workspace.members?.length || 0,
    maxArticles: currentPlan?.maxArticles || 50,
    maxSources: currentPlan?.maxSources || 3,
  };

  const articlePercent =
    stats.maxArticles > 0
      ? Math.min(Math.round((stats.articlesProcessedThisMonth / stats.maxArticles) * 100), 100)
      : 0;

  // Filtered feeds list
  const filteredSources = useMemo(() => {
    if (!workspace.sources) return [];
    if (!feedSearch.trim()) return workspace.sources;
    const q = feedSearch.toLowerCase().trim();
    return workspace.sources.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.creditName && s.creditName.toLowerCase().includes(q)) ||
        (s.rssUrl && s.rssUrl.toLowerCase().includes(q)) ||
        (s.url && s.url.toLowerCase().includes(q))
    );
  }, [workspace.sources, feedSearch]);

  return (
    <div className="space-y-6">
      {/* PageHeader */}
      <PageHeader
        title={workspace.name}
        description={`slug: ${workspace.slug} • id: ${workspace.id}`}
        icon={<Building2 className="w-5 h-5 text-primary" />}
        badge={
          <div className="flex items-center gap-2">
            <Badge variant={workspace.active ? "success" : "danger"} size="sm">
              {workspace.active ? "Empresa Ativa" : "Empresa Inativa"}
            </Badge>
            <Badge variant="purple" size="sm">
              Plano: {currentPlan?.name || "Gratuito"}
            </Badge>
          </div>
        }
        actions={
          <Link
            href="/backoffice/companies"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Lista de Empresas</span>
          </Link>
        }
      />

      {/* Global Alerts */}
      {message && (
        <Alert
          variant={message.type === "success" ? "success" : "destructive"}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-px">
        {[
          { key: "overview", label: "Visão Geral", icon: Building2 },
          { key: "plan", label: "Plano & Cobrança", icon: Layers },
          { key: "feeds", label: `Feeds RSS (${workspace.sources?.length || 0})`, icon: Rss },
          {
            key: "wordpress",
            label: `Sites WordPress (${workspace.wordpressSites?.length || 0})`,
            icon: Globe,
          },
          { key: "ai", label: "IA & Prompts", icon: Sparkles },
          { key: "settings", label: "Configurações", icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() =>
                setActiveTab(
                  tab.key as "overview" | "plan" | "feeds" | "wordpress" | "ai" | "settings"
                )
              }
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap rounded-t-lg ${
                isSelected
                  ? "border-primary text-primary bg-primary/5 font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-surface-muted/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-surface border border-border shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Consumo de Artigos (Mês)</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {stats.articlesProcessedThisMonth}{" "}
                <span className="text-xs text-zinc-500 font-normal">
                  / {stats.maxArticles === -1 ? "Ilimitado" : stats.maxArticles}
                </span>
              </div>
              {stats.maxArticles !== -1 && (
                <div className="space-y-1">
                  <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className={`h-full rounded-full transition-all ${
                        articlePercent >= 90
                          ? "bg-rose-500"
                          : articlePercent >= 70
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${articlePercent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 text-right">{articlePercent}% utilizado</p>
                </div>
              )}
            </div>

            <div className="p-5 rounded-xl bg-surface border border-border shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Fontes RSS Ativas</span>
                <Rss className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-white">
                {stats.activeSourcesCount}{" "}
                <span className="text-xs text-zinc-500 font-normal">
                  / {stats.maxSources === -1 ? "Ilimitado" : stats.maxSources}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                {stats.totalSourcesCount} fontes cadastradas no total
              </p>
            </div>

            <div className="p-5 rounded-xl bg-surface border border-border shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Destinos WordPress</span>
                <Globe className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.wordpressCount}</div>
              <p className="text-[11px] text-zinc-500">Sites conectados e operacionais</p>
            </div>

            {/* Team Members */}
            <div className="md:col-span-3 p-5 rounded-xl bg-surface border border-border shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Membros da Empresa ({workspace.members?.length || 0})
              </h3>
              <div className="divide-y divide-zinc-800/80">
                {workspace.members?.map((member) => (
                  <div key={member.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-zinc-200">
                        {member.user?.name || "Sem nome"}
                      </span>
                      <span className="text-zinc-500 ml-2 font-mono">({member.user?.email})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400">
                        {member.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PLAN & BILLING */}
        {activeTab === "plan" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Plan & Limits */}
              <div className="lg:col-span-2 p-6 rounded-xl bg-surface border border-border shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    Plano & Assinatura Ativa
                  </h3>

                  <button
                    type="button"
                    onClick={handleReconcile}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold disabled:opacity-50 transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                    <span>Reconciliar Asaas</span>
                  </button>
                </div>

                <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Status Local:</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-bold">
                      {workspace.subscription?.status || "ACTIVE"}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-amber-400">
                    {currentPlan?.name || "Gratuito"}
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 text-xs text-zinc-300 border-t border-zinc-800/80">
                    <div>
                      <span className="text-zinc-500">Valor Mensal:</span> R${" "}
                      {currentPlan ? (currentPlan.price / 100).toFixed(2) : "0,00"}
                    </div>
                    <div>
                      <span className="text-zinc-500">Créditos de Artigos:</span>{" "}
                      {stats.articlesProcessedThisMonth} /{" "}
                      {stats.maxArticles === -1 ? "Ilimitado" : stats.maxArticles}
                    </div>
                    <div>
                      <span className="text-zinc-500">Fontes Ativas:</span>{" "}
                      {stats.activeSourcesCount} /{" "}
                      {stats.maxSources === -1 ? "Ilimitado" : stats.maxSources}
                    </div>
                    <div>
                      <span className="text-zinc-500">Artigos Restantes:</span>{" "}
                      {stats.maxArticles === -1
                        ? "Ilimitado"
                        : Math.max(0, stats.maxArticles - stats.articlesProcessedThisMonth)}
                    </div>
                  </div>
                </div>

                {/* Gateway Metadata */}
                <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/60 space-y-2 text-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Integração Gateway (Asaas)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-300 font-mono text-[11px]">
                    <div>
                      <span className="text-zinc-500 font-sans">Customer ID:</span>{" "}
                      {workspace.subscription?.providerCustomerId || "—"}
                    </div>
                    <div>
                      <span className="text-zinc-500 font-sans">Subscription ID:</span>{" "}
                      {workspace.subscription?.asaasSubscriptionId || "—"}
                    </div>
                    <div>
                      <span className="text-zinc-500 font-sans">Próx. Vencimento:</span>{" "}
                      {workspace.subscription?.nextDueDate
                        ? new Date(workspace.subscription.nextDueDate).toLocaleDateString("pt-BR")
                        : "—"}
                    </div>
                    <div>
                      <span className="text-zinc-500 font-sans">Vigência Período:</span>{" "}
                      {workspace.subscription?.validUntil
                        ? new Date(workspace.subscription.validUntil).toLocaleDateString("pt-BR")
                        : "—"}
                    </div>
                  </div>
                </div>

                {/* Change Plan */}
                <div className="space-y-4 pt-2 border-t border-zinc-800/80">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-200 mb-1">
                      Alterar Plano da Empresa
                    </label>
                    <select
                      value={selectedPlanId}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      {availablePlans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — R$ {(p.price / 100).toFixed(2)}/mês (Artigos: {p.maxArticles}, Feeds:{" "}
                          {p.maxSources})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleChangePlan}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs disabled:opacity-50 transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isLoading ? "Salvando..." : "Salvar Alteração de Plano"}</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Billing Profile Summary */}
              <div className="p-6 rounded-xl bg-surface border border-border shadow-xs space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Dados de Faturamento
                </h3>

                {workspace.billingProfile ? (
                  <div className="space-y-2.5 text-xs text-zinc-300">
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">Razão Social / Nome:</span>
                      <span className="font-semibold text-white">{workspace.billingProfile.name}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">CPF / CNPJ:</span>
                      <span className="font-mono text-zinc-200">{workspace.billingProfile.cpfCnpj}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">E-mail:</span>
                      <span className="text-zinc-200">{workspace.billingProfile.email}</span>
                    </div>
                    {workspace.billingProfile.mobilePhone && (
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase">Telefone:</span>
                        <span className="text-zinc-200">{workspace.billingProfile.mobilePhone}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-zinc-500 bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800">
                    Nenhum perfil de faturamento cadastrado.
                  </div>
                )}
              </div>
            </div>

            {/* Invoices History Table */}
            <div className="p-6 rounded-xl bg-surface border border-border shadow-xs space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Histórico de Cobranças & Faturas ({workspace.invoices?.length || 0})
              </h3>

              {!workspace.invoices || workspace.invoices.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-500 bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800">
                  Nenhuma fatura registrada para esta empresa.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-400">
                        <th className="py-2.5 font-medium">Data</th>
                        <th className="py-2.5 font-medium">Vencimento</th>
                        <th className="py-2.5 font-medium">Valor</th>
                        <th className="py-2.5 font-medium">Método</th>
                        <th className="py-2.5 font-medium">Status</th>
                        <th className="py-2.5 font-medium">ID Cobrança Asaas</th>
                        <th className="py-2.5 font-medium text-right">Comprovante</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                      {workspace.invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-zinc-900/30">
                          <td className="py-2.5 text-zinc-300">
                            {new Date(inv.createdAt).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="py-2.5 text-zinc-400">
                            {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("pt-BR") : "—"}
                          </td>
                          <td className="py-2.5 font-semibold text-white font-sans">
                            R$ {Number(inv.amount).toFixed(2)}
                          </td>
                          <td className="py-2.5 text-zinc-300 font-sans">{inv.billingMethod}</td>
                          <td className="py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                inv.status === "CONFIRMED" || inv.status === "RECEIVED"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : inv.status === "PENDING"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-zinc-400">{inv.providerPaymentId}</td>
                          <td className="py-2.5 text-right font-sans">
                            {inv.invoiceUrl || inv.bankSlipUrl ? (
                              <a
                                href={inv.invoiceUrl || inv.bankSlipUrl || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-400 hover:underline text-xs"
                              >
                                Ver fatura ↗
                              </a>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}


        {/* TAB 3: FEEDS */}
        {activeTab === "feeds" && (
          <div className="p-6 rounded-xl bg-surface border border-border shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Rss className="w-5 h-5 text-amber-500" />
                Fontes RSS ({workspace.sources?.length || 0})
              </h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar feed..."
                    value={feedSearch}
                    onChange={(e) => setFeedSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  onClick={handleOpenCreateFeed}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Feed</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900 text-zinc-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Nome / Crédito</th>
                    <th className="py-2.5 px-3">URL do RSS</th>
                    <th className="py-2.5 px-3">Prompt Default</th>
                    <th className="py-2.5 px-3">Destinos WordPress</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-300">
                  {filteredSources.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-zinc-500 italic">
                        Nenhum feed encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredSources.map((s) => (
                      <tr key={s.id}>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-white">{s.name}</div>
                          {s.creditName && (
                            <div className="text-[11px] text-zinc-500">Crédito: {s.creditName}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-zinc-400 max-w-xs truncate">
                          {s.rssUrl || s.url || "—"}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 border border-zinc-800 text-amber-300">
                            {s.defaultPromptType || "Padrão"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {s.wordpressSiteSources && s.wordpressSiteSources.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {s.wordpressSiteSources.map((wss) => (
                                <span
                                  key={wss.id}
                                  className="px-1.5 py-0.5 rounded text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20"
                                >
                                  {wss.wordpressSite?.name || "WP Site"}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-zinc-500 italic text-[11px]">Todos os destinos</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => handleToggleFeedActive(s)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border transition ${
                              s.active
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:bg-zinc-800"
                            }`}
                          >
                            <Power className="w-3 h-3" />
                            <span>{s.active ? "Ativo" : "Inativo"}</span>
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditFeed(s)}
                              className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                              title="Editar Feed"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteFeed(s.id)}
                              className="p-1 rounded bg-zinc-900 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 transition"
                              title="Excluir Feed"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: WORDPRESS */}
        {activeTab === "wordpress" && (
          <div className="p-6 rounded-xl bg-surface border border-border shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-sky-400" />
                Destinos WordPress ({workspace.wordpressSites?.length || 0})
              </h3>
              <button
                onClick={handleOpenCreateWp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Destino WordPress</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workspace.wordpressSites?.length === 0 ? (
                <p className="text-xs text-zinc-500 italic col-span-2 py-6 text-center">
                  Nenhum site WordPress configurado.
                </p>
              ) : (
                workspace.wordpressSites?.map((wp) => (
                  <div
                    key={wp.id}
                    className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{wp.name}</span>
                        {wp.isDefault && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            Padrão
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleToggleWpActive(wp)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border transition ${
                          wp.active
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:bg-zinc-800"
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{wp.active ? "Ativo" : "Inativo"}</span>
                      </button>
                    </div>

                    <p className="font-mono text-zinc-400 text-[11px] truncate">{wp.url}</p>

                    <div className="grid grid-cols-2 gap-2 py-2 border-y border-zinc-800/80 text-[11px] text-zinc-400">
                      <div>
                        <span className="text-zinc-500">Usuário:</span> {wp.username}
                      </div>
                      <div>
                        <span className="text-zinc-500">Prompt:</span>{" "}
                        <span className="text-amber-300">{wp.defaultPromptType || "Padrão"}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Feeds associados:</span>{" "}
                        {wp.sources?.length || 0}
                      </div>
                      <div>
                        <span className="text-zinc-500">Categorias:</span>{" "}
                        {wp._count?.categories ?? "—"}
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Senha criptografada
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleTestWp(wp.id)}
                          disabled={isTestingWpId === wp.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] disabled:opacity-50 transition"
                          title="Testar Conexão REST"
                        >
                          <Zap
                            className={`w-3 h-3 text-amber-400 ${
                              isTestingWpId === wp.id ? "animate-spin" : ""
                            }`}
                          />
                          <span>{isTestingWpId === wp.id ? "Testando..." : "Testar"}</span>
                        </button>

                        <button
                          onClick={() => handleSyncWp(wp.id)}
                          disabled={isSyncingWpId === wp.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] disabled:opacity-50 transition"
                          title="Sincronizar Categorias"
                        >
                          <RefreshCw
                            className={`w-3 h-3 text-sky-400 ${
                              isSyncingWpId === wp.id ? "animate-spin" : ""
                            }`}
                          />
                          <span>{isSyncingWpId === wp.id ? "Sincronizando..." : "Categorias"}</span>
                        </button>

                        <button
                          onClick={() => handleOpenEditWp(wp)}
                          className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                          title="Editar Configurações"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteWp(wp.id)}
                          className="p-1 rounded bg-zinc-800 hover:bg-rose-950 text-zinc-300 hover:text-rose-400 transition"
                          title="Excluir Destino"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: AI & PROMPTS */}
        {activeTab === "ai" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Provider Config */}
            <div className="p-6 rounded-xl bg-surface border border-border shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>Provedor de IA & Modelo</span>
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] border ${
                    aiHasApiKey
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}
                >
                  {aiHasApiKey ? "API Key Configurada" : "Usando Padrão Global"}
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-zinc-400 mb-1">
                    Provedor Principal
                  </label>
                  <select
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="openai">OpenAI (GPT-4o, GPT-4o-mini)</option>
                    <option value="gemini">Google Gemini (Gemini 2.0 Flash / Pro)</option>
                    <option value="anthropic">Anthropic Claude (Claude 3.5 Sonnet)</option>
                    <option value="openai-compatible">OpenAI-Compatible (Local / Custom)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-zinc-400 mb-1">
                    Nome do Modelo
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: gpt-4o-mini, gemini-2.0-flash, claude-3-5-sonnet-20241022"
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-400 mb-1">
                    Base URL (Opcional para Local/Custom)
                  </label>
                  <input
                    type="url"
                    placeholder="https://api.openai.com/v1"
                    value={aiBaseUrl}
                    onChange={(e) => setAiBaseUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-400 mb-1">
                    Nova API Key (deixe em branco para manter a atual)
                  </label>
                  <input
                    type="password"
                    placeholder="sk-..."
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Protegida por criptografia AES-256-GCM. Nunca é enviada de volta ao frontend.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleTestAi}
                    disabled={isTestingAi}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold disabled:opacity-50 transition"
                  >
                    <Zap className={`w-3.5 h-3.5 text-amber-400 ${isTestingAi ? "animate-spin" : ""}`} />
                    <span>{isTestingAi ? "Testando Provedor..." : "Testar Conexão IA"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Prompt Editorial Settings */}
            <div className="p-6 rounded-xl bg-surface border border-border shadow-xs space-y-4">
              <div className="border-b border-zinc-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <span>Diretrizes do Prompt Editorial</span>
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-zinc-400 mb-1">
                    Área Editorial do Portal
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Tecnologia, Economia, Games, Saúde"
                    value={promptPortalArea}
                    onChange={(e) => setPromptPortalArea(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-400 mb-1">
                    Área Personalizada Detalhada
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Portal focado em inteligência artificial e startups"
                    value={promptCustomPortalArea}
                    onChange={(e) => setPromptCustomPortalArea(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-400 mb-1">
                    Estilos de Escrita (Máximo 3)
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                    {[
                      "Informativo",
                      "Direto",
                      "Analítico",
                      "Didático",
                      "Jornalístico",
                      "Descontraído",
                    ].map((style) => {
                      const isChecked = promptWritingStyles.includes(style);
                      return (
                        <label
                          key={style}
                          className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-white"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                if (promptWritingStyles.length < 3) {
                                  setPromptWritingStyles([...promptWritingStyles, style]);
                                }
                              } else {
                                setPromptWritingStyles(
                                  promptWritingStyles.filter((s) => s !== style)
                                );
                              }
                            }}
                            className="accent-amber-500 rounded"
                          />
                          <span>{style}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-zinc-400 mb-1">
                    Instrução Editorial Complementar
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Priorizar títulos chamativos mas sem sensacionalismo"
                    value={promptCustomWritingStyle}
                    onChange={(e) => setPromptCustomWritingStyle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSaveAiAndPrompt}
                    disabled={isLoading}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs disabled:opacity-50 transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isLoading ? "Salvando..." : "Salvar Configurações de IA & Prompts"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SETTINGS */}
        {activeTab === "settings" && (
          <div className="p-6 rounded-xl bg-surface border border-border shadow-xs space-y-5 max-w-lg">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-400" />
              Configurações do Workspace
            </h3>

            <form onSubmit={handleUpdateSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Slug Único
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="accent-amber-500 rounded"
                  />
                  <span>Empresa Ativa (Acesso Liberado)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-zinc-800">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs disabled:opacity-50 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>{isLoading ? "Salvando..." : "Salvar Alterações"}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* MODAL: CREATE / EDIT FEED */}
      {isFeedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-border shadow-xs p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Rss className="w-5 h-5 text-amber-500" />
                <span>{editingFeed ? "Editar Feed RSS" : "Cadastrar Novo Feed RSS"}</span>
              </h3>
              <button
                onClick={() => setIsFeedModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFeed} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-zinc-400 mb-1">Nome da Fonte *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: TechCrunch Brasil"
                  value={feedName}
                  onChange={(e) => setFeedName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-400 mb-1">
                  Nome do Crédito (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Fonte: TechCrunch"
                  value={feedCreditName}
                  onChange={(e) => setFeedCreditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-400 mb-1">URL do Feed RSS *</label>
                <input
                  type="url"
                  required
                  placeholder="https://exemplo.com/feed.xml"
                  value={feedRssUrl}
                  onChange={(e) => setFeedRssUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-400 mb-1">
                  Tipo de Prompt Padrão
                </label>
                <select
                  value={feedDefaultPromptType}
                  onChange={(e) => setFeedDefaultPromptType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="default">Padrão Geral (Standard)</option>
                  <option value="curto">Notícia Curta / Direta</option>
                  <option value="analitico">Artigo Analítico / Aprofundado</option>
                  <option value="opinativo">Opinião / Editorial</option>
                </select>
              </div>

              {/* WordPress Site Associations */}
              {workspace.wordpressSites && workspace.wordpressSites.length > 0 && (
                <div>
                  <label className="block font-medium text-zinc-400 mb-1">
                    Destinos WordPress Vinculados
                  </label>
                  <div className="space-y-1.5 p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                    {workspace.wordpressSites.map((site) => {
                      const isChecked = feedSelectedWpSites.includes(site.id);
                      return (
                        <label
                          key={site.id}
                          className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-white"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFeedSelectedWpSites([...feedSelectedWpSites, site.id]);
                              } else {
                                setFeedSelectedWpSites(
                                  feedSelectedWpSites.filter((id) => id !== site.id)
                                );
                              }
                            }}
                            className="accent-amber-500 rounded"
                          />
                          <span>{site.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={feedActive}
                    onChange={(e) => setFeedActive(e.target.checked)}
                    className="accent-amber-500 rounded"
                  />
                  <span>Feed Ativo (Captura de Notícias Liberada)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsFeedModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold disabled:opacity-50 transition"
                >
                  {isLoading ? "Salvando..." : editingFeed ? "Salvar Alterações" : "Criar Feed"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT WORDPRESS SITE */}
      {isWpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-border shadow-xs p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-sky-400" />
                <span>{editingWp ? "Editar Destino WordPress" : "Conectar Destino WordPress"}</span>
              </h3>
              <button
                onClick={() => setIsWpModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWp} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-zinc-400 mb-1">Nome de Exibição *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Portal Principal"
                  value={wpName}
                  onChange={(e) => setWpName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-400 mb-1">URL do Site WordPress *</label>
                <input
                  type="url"
                  required
                  placeholder="https://meusite.com.br"
                  value={wpUrl}
                  onChange={(e) => setWpUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-400 mb-1">Usuário / Login *</label>
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={wpUsername}
                  onChange={(e) => setWpUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-400 mb-1">
                  {editingWp ? "Nova Application Password (opcional)" : "Application Password *"}
                </label>
                <input
                  type="password"
                  required={!editingWp}
                  placeholder={editingWp ? "Deixe em branco para manter a senha atual" : "xxxx xxxx xxxx xxxx"}
                  value={wpPassword}
                  onChange={(e) => setWpPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Gerada no painel do WordPress em Usuários → Perfil → Senhas de Aplicativo.
                </p>
              </div>

              <div>
                <label className="block font-medium text-zinc-400 mb-1">
                  Tipo de Prompt Padrão
                </label>
                <select
                  value={wpDefaultPromptType}
                  onChange={(e) => setWpDefaultPromptType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="default">Padrão Geral (Standard)</option>
                  <option value="curto">Notícia Curta / Direta</option>
                  <option value="analitico">Artigo Analítico / Aprofundado</option>
                  <option value="opinativo">Opinião / Editorial</option>
                </select>
              </div>

              {/* Associated Feeds */}
              {workspace.sources && workspace.sources.length > 0 && (
                <div>
                  <label className="block font-medium text-zinc-400 mb-1">
                    Feeds RSS Vinculados
                  </label>
                  <div className="space-y-1.5 p-3 rounded-lg bg-zinc-900 border border-zinc-800 max-h-32 overflow-y-auto">
                    {workspace.sources.map((s) => {
                      const isChecked = wpSelectedSources.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-white"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setWpSelectedSources([...wpSelectedSources, s.id]);
                              } else {
                                setWpSelectedSources(
                                  wpSelectedSources.filter((id) => id !== s.id)
                                );
                              }
                            }}
                            className="accent-amber-500 rounded"
                          />
                          <span>{s.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={wpActive}
                    onChange={(e) => setWpActive(e.target.checked)}
                    className="accent-amber-500 rounded"
                  />
                  <span>Destino Ativo (Publicação Liberada)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsWpModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold disabled:opacity-50 transition"
                >
                  {isLoading ? "Salvando..." : editingWp ? "Salvar Alterações" : "Conectar Site"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
