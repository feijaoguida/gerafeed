"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  RefreshCw,
  Plus,
  History,
  ShieldCheck,
  X,
  Send,
  Eye,
} from "lucide-react";

import { PageHeader } from "@/components/design-system/page-header";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/design-system/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface PromptTemplateItem {
  id: string;
  type: string;
  name: string;
  description: string | null;
  systemPrompt: string;
  userPromptTemplate: string;
  version: number;
  active: boolean;
  selectionMode: string | null;
  minProducts: number | null;
  maxProducts: number | null;
  requiresCategory: boolean | null;
  allowsSuggestedTitle: boolean | null;
  variables: string[];
  createdAt: string;
}

const TEMPLATE_NAMES: Record<string, string> = {
  PRODUCT_REVIEW: "Review Completo de Produto",
  COMPARISON: "Comparativo Lado a Lado",
  BEST_PRODUCTS: "Guia dos Melhores Produtos (Roundup)",
  BUYING_GUIDE: "Guia de Compra por Categoria",
  PROBLEM_SOLUTION: "Problema & Solução",
  DEALS: "Radar de Ofertas e Descontos",
  SEASONAL: "Especial Sazonal / Datas Comemorativas",
};

const ALLOWED_VARS_BY_TYPE: Record<string, string[]> = {
  PRODUCT_REVIEW: [
    "product.name",
    "product.brand",
    "product.description",
    "product.price",
    "product.specs",
    "product.pros",
    "product.cons",
    "product.rating",
    "product.reviews",
    "product.referenceSources",
    "category.name",
    "customInstructions",
    "referenceSummaries",
  ],
  COMPARISON: [
    "productsList",
    "productsCount",
    "category.name",
    "customInstructions",
    "referenceSummaries",
  ],
  BEST_PRODUCTS: [
    "productsList",
    "productsCount",
    "category.name",
    "customInstructions",
    "referenceSummaries",
  ],
  BUYING_GUIDE: [
    "productsList",
    "productsCount",
    "category.name",
    "customInstructions",
    "referenceSummaries",
  ],
  PROBLEM_SOLUTION: [
    "product.name",
    "product.brand",
    "product.description",
    "product.price",
    "product.specs",
    "product.pros",
    "product.cons",
    "product.rating",
    "product.reviews",
    "product.referenceSources",
    "productsList",
    "productsCount",
    "category.name",
    "customInstructions",
    "referenceSummaries",
  ],
  DEALS: [
    "productsList",
    "productsCount",
    "category.name",
    "customInstructions",
    "referenceSummaries",
  ],
  SEASONAL: [
    "productsList",
    "productsCount",
    "category.name",
    "customInstructions",
    "referenceSummaries",
    "eventTheme",
  ],
};

export function AffiliatePromptManager() {
  const [templates, setTemplates] = useState<PromptTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit / Version modal
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplateItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSystemPrompt, setFormSystemPrompt] = useState("");
  const [formUserPrompt, setFormUserPrompt] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Preview state
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [previewContent, setPreviewContent] = useState("");
  const [previewing, setPreviewing] = useState(false);

  // History modal
  const [historyType, setHistoryType] = useState<string | null>(null);
  const [historyList, setHistoryList] = useState<PromptTemplateItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/backoffice/affiliate-prompts");
      if (!res.ok) {
        throw new Error("Erro ao carregar templates.");
      }
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await fetch("/api/backoffice/affiliate-prompts");
        if (!res.ok) throw new Error("Erro ao carregar templates.");
        const data = await res.json();
        if (!ignore) setTemplates(data.templates || []);
      } catch (err: unknown) {
        if (!ignore) setError(err instanceof Error ? err.message : "Erro desconhecido.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  const handleOpenEdit = (tpl: PromptTemplateItem) => {
    setEditingTemplate(tpl);
    setFormName(tpl.name || TEMPLATE_NAMES[tpl.type] || tpl.type);
    setFormDescription(tpl.description || "");
    setFormSystemPrompt(tpl.systemPrompt);
    setFormUserPrompt(tpl.userPromptTemplate);
    setFormActive(true);
    setActiveTab("edit");
    setPreviewContent("");
    setError(null);
    setSuccess(null);
  };

  const handleSaveNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/backoffice/affiliate-prompts/${editingTemplate.type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          systemPrompt: formSystemPrompt,
          userPromptTemplate: formUserPrompt,
          active: formActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar nova versão.");
      }

      setSuccess(`Nova versão v${data.template.version} de ${editingTemplate.type} criada com sucesso!`);
      setEditingTemplate(null);
      await loadTemplates();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar versão.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (templateId: string, currentActive: boolean) => {
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/backoffice/affiliate-prompts/toggle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: templateId, active: !currentActive }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao alternar status do template.");
      }

      setSuccess("Status do template atualizado!");
      await loadTemplates();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao alternar status.");
    }
  };

  const handleOpenHistory = async (type: string) => {
    setHistoryType(type);
    setLoadingHistory(true);
    setError(null);
    try {
      const res = await fetch(`/api/backoffice/affiliate-prompts/${type}`);
      if (!res.ok) {
        throw new Error("Erro ao carregar histórico de versões.");
      }
      const data = await res.json();
      setHistoryList(data.versions || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao buscar histórico.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handlePreview = async () => {
    if (!editingTemplate) return;
    setPreviewing(true);
    setError(null);

    try {
      const res = await fetch("/api/backoffice/affiliate-prompts/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editingTemplate.type,
          userPromptTemplate: formUserPrompt,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao renderizar prévia.");
      }

      setPreviewContent(data.renderedPrompt);
      setActiveTab("preview");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro na prévia.");
    } finally {
      setPreviewing(false);
    }
  };

  const uniqueTypes = Array.from(new Set(templates.map((t) => t.type)));

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header com PageHeader */}
      <PageHeader
        title="Prompts Globais de Afiliados"
        description="Gerencie e versione centralmente os prompts de IA dos 7 formatos comerciais. Todas as gerações do ecossistema utilizam estas versões globais."
        icon={<Sparkles className="w-5 h-5 text-amber-500" />}
        badge={
          <Badge variant="warning" size="sm">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Governança Superadmin
          </Badge>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={loadTemplates}
            disabled={loading}
            leadingIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
          >
            Atualizar
          </Button>
        }
      />

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Templates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {uniqueTypes.map((type) => {
            const typeTemplates = templates.filter((t) => t.type === type);
            const activeTemplate = typeTemplates.find((t) => t.active) || typeTemplates[0];
            if (!activeTemplate) return null;

            return (
              <Card
                key={type}
                className="p-5 flex flex-col justify-between shadow-xs hover:border-primary/40 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge variant="purple" size="sm">
                      {type}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" size="sm">
                        v{activeTemplate.version}
                      </Badge>
                      <Badge variant={activeTemplate.active ? "success" : "secondary"} size="sm">
                        {activeTemplate.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>

                  <h3 className="font-heading text-base font-bold text-foreground mb-1.5">
                    {activeTemplate.name || TEMPLATE_NAMES[type] || type}
                  </h3>
                  <p className="font-sans text-xs text-muted-foreground line-clamp-2 mb-4">
                    {activeTemplate.description || "Nenhuma descrição fornecida."}
                  </p>

                  <div className="bg-surface-muted/60 border border-border rounded-xl p-3 text-[11px] font-mono text-muted-foreground mb-4 max-h-24 overflow-hidden relative">
                    <span className="text-foreground font-bold block mb-1 uppercase text-[9px]">Preview do User Prompt:</span>
                    {activeTemplate.userPromptTemplate}
                    <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-surface-muted to-transparent" />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenHistory(type)}
                    leadingIcon={<History className="w-3.5 h-3.5" />}
                  >
                    Histórico ({typeTemplates.length})
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(activeTemplate.id, activeTemplate.active)}
                    >
                      {activeTemplate.active ? "Desativar" : "Ativar"}
                    </Button>

                    <Button
                      type="button"
                      variant="gradient"
                      size="sm"
                      onClick={() => handleOpenEdit(activeTemplate)}
                      leadingIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Nova Versão
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit / Version Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden bg-surface border-border">
            {/* Modal Header */}
            <CardHeader className="p-5 border-b border-border flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="purple" size="sm">
                    {editingTemplate.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-medium">
                    Criando Versão v{editingTemplate.version + 1}
                  </span>
                </div>
                <CardTitle className="text-lg font-bold">
                  Editar & Publicar Nova Versão Global
                </CardTitle>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 bg-surface-muted border border-border p-1 rounded-xl">
                <Button
                  size="sm"
                  variant={activeTab === "edit" ? "secondary" : "ghost"}
                  onClick={() => setActiveTab("edit")}
                  className={activeTab === "edit" ? "bg-surface shadow-xs font-bold text-foreground" : "text-muted-foreground"}
                >
                  Editor
                </Button>
                <Button
                  size="sm"
                  variant={activeTab === "preview" ? "secondary" : "ghost"}
                  onClick={handlePreview}
                  disabled={previewing}
                  className={activeTab === "preview" ? "bg-surface shadow-xs font-bold text-foreground" : "text-muted-foreground"}
                  leadingIcon={<Eye className="w-3 h-3" />}
                >
                  {previewing ? "Gerando..." : "Prévia"}
                </Button>
              </div>
            </CardHeader>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {activeTab === "edit" ? (
                <form id="template-version-form" onSubmit={handleSaveNewVersion} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Nome de Exibição" required>
                      <Input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                      />
                    </FormField>

                    <FormField label="Status da Nova Versão">
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="formActiveCheck"
                          checked={formActive}
                          onChange={(e) => setFormActive(e.target.checked)}
                          className="accent-primary h-4 w-4 rounded"
                        />
                        <label htmlFor="formActiveCheck" className="text-xs font-semibold text-foreground cursor-pointer">
                          Definir como Versão Ativa Global
                        </label>
                      </div>
                    </FormField>
                  </div>

                  <FormField label="Descrição da Versão">
                    <Input
                      type="text"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Ex: Refinamento de tom persuasivo e foco em conversão"
                    />
                  </FormField>

                  <FormField label="System Prompt (Diretrizes Globais do Modelo)" required>
                    <Textarea
                      rows={5}
                      required
                      value={formSystemPrompt}
                      onChange={(e) => setFormSystemPrompt(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </FormField>

                  <FormField label="User Prompt Template (Instruções com Variáveis)" required>
                    <Textarea
                      rows={8}
                      required
                      value={formUserPrompt}
                      onChange={(e) => setFormUserPrompt(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </FormField>

                  {/* Variables Helper */}
                  <div className="p-3 bg-surface-muted/60 border border-border rounded-xl">
                    <span className="text-[11px] font-bold text-foreground block mb-1">
                      Variáveis Suportadas para {editingTemplate.type}:
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(ALLOWED_VARS_BY_TYPE[editingTemplate.type] || []).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setFormUserPrompt((prev) => `${prev} {{${v}}}`)}
                          className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface border border-border text-primary hover:border-primary transition-colors"
                          title="Clique para inserir no prompt"
                        >
                          {`{{${v}}}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-surface-muted/50 border border-border rounded-xl">
                    <span className="text-xs font-bold text-foreground block mb-2">
                      Prévia de Interpolação com Dados Simulados:
                    </span>
                    <pre className="font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                      {previewContent || "Nenhuma prévia disponível."}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <CardFooter className="p-4 border-t border-border flex items-center justify-between bg-surface-muted/20">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingTemplate(null)}
              >
                Cancelar
              </Button>

              <div className="flex items-center gap-2">
                {activeTab === "edit" ? (
                  <Button
                    type="submit"
                    form="template-version-form"
                    variant="gradient"
                    size="sm"
                    isLoading={saving}
                    leadingIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    Publicar Versão v{editingTemplate.version + 1}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setActiveTab("edit")}
                  >
                    Voltar ao Editor
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* History Modal */}
      {historyType && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden bg-surface border-border">
            <CardHeader className="p-5 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-500" />
                  Histórico de Versões: {historyType}
                </CardTitle>
                <p className="font-sans text-xs text-muted-foreground mt-0.5">
                  Todas as versões salvas para este formato comercial de afiliados.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setHistoryType(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>

            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {loadingHistory ? (
                <div className="space-y-3 py-4">
                  <Skeleton className="h-16 rounded-xl" />
                  <Skeleton className="h-16 rounded-xl" />
                </div>
              ) : historyList.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">Nenhuma versão encontrada.</p>
              ) : (
                historyList.map((ver) => (
                  <div
                    key={ver.id}
                    className="p-4 rounded-xl border border-border bg-surface-muted/30 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="purple" size="sm">
                          v{ver.version}
                        </Badge>
                        <span className="font-heading text-xs font-bold text-foreground">
                          {ver.name}
                        </span>
                        {ver.active && (
                          <Badge variant="success" size="sm">
                            Ativa Globalmente
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {ver.description || "Sem descrição"}
                      </p>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Criado em: {new Date(ver.createdAt).toLocaleString("pt-BR")}
                      </span>
                    </div>

                    {!ver.active && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await handleToggleActive(ver.id, false);
                          await handleOpenHistory(historyType);
                        }}
                      >
                        Ativar
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
