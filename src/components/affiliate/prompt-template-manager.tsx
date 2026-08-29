"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Eye,
  Code2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Sliders,
} from "lucide-react";
import { CommercialArticleType } from "@/lib/affiliate/types";

import { PageHeader } from "@/components/design-system/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface EffectiveTemplate {
  id?: string;
  type: CommercialArticleType;
  name: string;
  description?: string | null;
  systemPrompt: string;
  userPromptTemplate: string;
  version: number;
  isCustomOverride: boolean;
  selectionMode?: string | null;
  minProducts?: number | null;
  maxProducts?: number | null;
  requiresCategory?: boolean | null;
  allowsSuggestedTitle?: boolean | null;
  variables?: string[];
}

const TEMPLATE_NAMES: Record<CommercialArticleType, { title: string; desc: string }> = {
  PRODUCT_REVIEW: {
    title: "Review de Produto",
    desc: "Análise aprofundada com prós, contras, ficha técnica e veredito.",
  },
  COMPARISON: {
    title: "Comparativo Lado a Lado",
    desc: "Comparação entre 2 ou mais produtos com tabela e recomendação.",
  },
  BEST_PRODUCTS: {
    title: "Top Escolhas (Roundup)",
    desc: "Lista dos melhores produtos da categoria com selos e destaques.",
  },
  BUYING_GUIDE: {
    title: "Guia de Compra",
    desc: "Manual educativo ensinando o consumidor a escolher o modelo ideal.",
  },
  PROBLEM_SOLUTION: {
    title: "Problema & Solução",
    desc: "Focado em uma dor do leitor e como o produto resolve com eficiência.",
  },
  DEALS: {
    title: "Alerta de Oferta",
    desc: "Destaque de desconto expressivo com senso de oportunidade.",
  },
  SEASONAL: {
    title: "Especial Sazonal",
    desc: "Conteúdo temático para datas como Black Friday, Natal, etc.",
  },
};

export function PromptTemplateManager() {
  const [templates, setTemplates] = useState<EffectiveTemplate[]>([]);
  const [selectedType, setSelectedType] = useState<CommercialArticleType>("PRODUCT_REVIEW");
  const [loading, setLoading] = useState(true);
  const [activeTemplate, setActiveTemplate] = useState<EffectiveTemplate | null>(null);

  // Preview State
  const [previewing, setPreviewing] = useState(false);
  const [renderedPreview, setRenderedPreview] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch("/api/affiliate/prompt-templates");
        if (!ignore && res.ok) {
          const data: EffectiveTemplate[] = await res.json();
          setTemplates(data);
          const current = data.find((t) => t.type === selectedType);
          if (current) {
            setActiveTemplate(current);
          }
        }
      } catch (err) {
        if (!ignore) console.error(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [selectedType]);

  const handleSelectType = (type: CommercialArticleType) => {
    setSelectedType(type);
    setRenderedPreview(null);
    const found = templates.find((t) => t.type === type);
    if (found) {
      setActiveTemplate(found);
    }
  };

  const handleGeneratePreview = async () => {
    if (!activeTemplate) return;
    setPreviewing(true);
    try {
      const res = await fetch("/api/affiliate/prompt-templates/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          userPromptTemplate: activeTemplate.userPromptTemplate,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRenderedPreview(data.renderedPrompt);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewing(false);
    }
  };

  const typesList = Object.keys(TEMPLATE_NAMES) as CommercialArticleType[];

  return (
    <div className="space-y-6">
      {/* Header com PageHeader */}
      <PageHeader
        title="Formatos Comerciais & Prompts de IA"
        description="Consulte os 7 modelos de conteúdo e diretrizes de IA disponíveis para seu workspace. Os prompts são padronizados globalmente para garantir conformidade de SEO e alta conversão."
        icon={<Sparkles className="w-5 h-5 text-primary" />}
        badge={
          <Badge variant="success" size="sm" className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Governança Global Ativa
          </Badge>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Types Navigation */}
        <div className="lg:col-span-4 space-y-2">
          <h2 className="text-xs font-heading font-bold uppercase tracking-wider text-muted-foreground px-1 mb-2">
            Formatos Disponíveis ({typesList.length})
          </h2>
          {typesList.map((type) => {
            const isSelected = selectedType === type;
            const meta = TEMPLATE_NAMES[type];
            const tData = templates.find((t) => t.type === type);

            return (
              <button
                key={type}
                type="button"
                onClick={() => handleSelectType(type)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/20 text-foreground"
                    : "bg-surface border-border hover:border-muted-foreground/30 text-foreground/80 hover:text-foreground"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-heading text-xs font-bold text-foreground">{meta.title}</span>
                  <div className="flex items-center gap-1.5">
                    {tData && (
                      <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                        v{tData.version}
                      </Badge>
                    )}
                    <Badge variant="purple" size="sm">
                      Global
                    </Badge>
                  </div>
                </div>
                <p className="font-sans text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {meta.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Right Column: Template Detail (Read-Only) */}
        <div className="lg:col-span-8 space-y-5">
          {loading ? (
            <Card className="p-12 text-center shadow-xs">
              <Skeleton className="h-48 w-full rounded-xl" />
            </Card>
          ) : activeTemplate ? (
            <Card className="p-6 space-y-6 shadow-xs">
              {/* Header Info */}
              <CardHeader className="p-0 border-b border-border pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="purple" size="sm" className="font-mono">
                      {activeTemplate.type}
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">
                      Versão Global v{activeTemplate.version}
                    </span>
                  </div>
                  <CardTitle className="text-lg font-bold">
                    {activeTemplate.name}
                  </CardTitle>
                  {activeTemplate.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {activeTemplate.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGeneratePreview}
                    isLoading={previewing}
                    leadingIcon={<Eye className="w-3.5 h-3.5 text-primary" />}
                  >
                    Testar Prévia
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0 space-y-6">
                {/* Template Parameters & Constraints Info */}
                <div className="p-4 bg-surface-muted/50 border border-border rounded-xl space-y-3">
                  <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-primary" />
                    Regras & Diretrizes do Formato
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 bg-surface rounded-lg border border-border">
                      <span className="text-[10px] text-muted-foreground block uppercase font-bold">Modo de Seleção</span>
                      <span className="text-foreground font-semibold">
                        {selectedType === "PRODUCT_REVIEW"
                          ? "1 Produto Único"
                          : selectedType === "COMPARISON"
                          ? "Exatamente 2 Produtos"
                          : selectedType === "BUYING_GUIDE"
                          ? "0 a 10 Produtos (Opcional)"
                          : "2 a 10 Produtos"}
                      </span>
                    </div>
                    <div className="p-2.5 bg-surface rounded-lg border border-border">
                      <span className="text-[10px] text-muted-foreground block uppercase font-bold">Categoria</span>
                      <span className="text-foreground font-semibold">
                        {selectedType === "BEST_PRODUCTS" || selectedType === "BUYING_GUIDE"
                          ? "Obrigatória"
                          : "Opcional / Automática"}
                      </span>
                    </div>
                    <div className="p-2.5 bg-surface rounded-lg border border-border">
                      <span className="text-[10px] text-muted-foreground block uppercase font-bold">Governança</span>
                      <span className="text-[#00C2A8] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Global SuperAdmin
                      </span>
                    </div>
                  </div>
                </div>

                {/* System Prompt View (Read-Only) */}
                <div>
                  <label className="block font-heading text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-primary" />
                    System Prompt (Diretrizes de Persona e Output JSON)
                  </label>
                  <div className="bg-surface-muted/60 border border-border rounded-xl p-4 text-xs font-mono text-foreground max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {activeTemplate.systemPrompt}
                  </div>
                </div>

                {/* User Prompt View (Read-Only) */}
                <div>
                  <label className="block font-heading text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    Template de Prompt do Usuário (Placeholders Globais)
                  </label>
                  <div className="bg-surface-muted/60 border border-border rounded-xl p-4 text-xs font-mono text-foreground max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {activeTemplate.userPromptTemplate}
                  </div>
                </div>

                {/* Preview Result Modal / Container */}
                {renderedPreview && (
                  <div className="p-4 bg-surface-muted/80 border border-primary/30 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Exemplo de Prompt Renderizado com Contexto Real de Teste:
                    </span>
                    <div className="text-xs font-mono text-foreground whitespace-pre-wrap max-h-60 overflow-y-auto bg-surface p-3 rounded-lg border border-border">
                      {renderedPreview}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
