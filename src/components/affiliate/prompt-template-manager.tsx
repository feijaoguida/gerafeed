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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs mb-1">
            <ShieldCheck className="w-4 h-4" />
            Governança Global de Prompts Ativa
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            Formatos Comerciais & Prompts de IA
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Consulte os 7 modelos de conteúdo e diretrizes de IA disponíveis para seu workspace. Os prompts são padronizados globalmente para garantir conformidade de SEO, formato canônico e alta conversão em vendas de afiliados.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Types Navigation */}
        <div className="lg:col-span-4 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1 mb-2">
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
                    ? "bg-amber-500/10 border-amber-500/30 text-white shadow-sm ring-1 ring-amber-500/20"
                    : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold">{meta.title}</span>
                  <div className="flex items-center gap-1.5">
                    {tData && (
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                        v{tData.version}
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Global
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {meta.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Right Column: Template Detail (Read-Only) */}
        <div className="lg:col-span-8 space-y-5">
          {loading ? (
            <div className="p-12 text-center text-zinc-500 text-sm bg-zinc-900 border border-zinc-800 rounded-2xl">
              Carregando template...
            </div>
          ) : activeTemplate ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                      {activeTemplate.type}
                    </span>
                    <span className="text-xs font-bold text-zinc-400 font-mono">
                      Versão Global v{activeTemplate.version}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {activeTemplate.name}
                  </h3>
                  {activeTemplate.description && (
                    <p className="text-xs text-zinc-400 mt-1">
                      {activeTemplate.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGeneratePreview}
                    disabled={previewing}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold transition border border-zinc-700 shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    {previewing ? "Calculando..." : "Testar Prévia"}
                  </button>
                </div>
              </div>

              {/* Template Parameters & Constraints Info */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  Regras & Diretrizes do Formato
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 bg-zinc-900/80 rounded-lg border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 block uppercase font-bold">Modo de Seleção</span>
                    <span className="text-zinc-200 font-semibold">
                      {selectedType === "PRODUCT_REVIEW"
                        ? "1 Produto Único"
                        : selectedType === "COMPARISON"
                        ? "Exatamente 2 Produtos"
                        : selectedType === "BUYING_GUIDE"
                        ? "0 a 10 Produtos (Opcional)"
                        : "2 a 10 Produtos"}
                    </span>
                  </div>
                  <div className="p-2.5 bg-zinc-900/80 rounded-lg border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 block uppercase font-bold">Categoria</span>
                    <span className="text-zinc-200 font-semibold">
                      {selectedType === "BEST_PRODUCTS" || selectedType === "BUYING_GUIDE"
                        ? "Obrigatória"
                        : "Opcional / Automática"}
                    </span>
                  </div>
                  <div className="p-2.5 bg-zinc-900/80 rounded-lg border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 block uppercase font-bold">Governança</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Global SuperAdmin
                    </span>
                  </div>
                </div>
              </div>

              {/* System Prompt View (Read-Only) */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-amber-400" />
                  System Prompt (Diretrizes de Persona e Output JSON)
                </label>
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-mono text-zinc-300 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {activeTemplate.systemPrompt}
                </div>
              </div>

              {/* User Prompt View (Read-Only) */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  Template de Prompt do Usuário (Placeholders Globais)
                </label>
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-mono text-zinc-300 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {activeTemplate.userPromptTemplate}
                </div>
              </div>

              {/* Preview Result Modal / Container */}
              {renderedPreview && (
                <div className="p-4 bg-zinc-950 border border-amber-500/30 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Exemplo de Prompt Renderizado com Contexto Real de Teste:
                  </span>
                  <div className="text-xs font-mono text-zinc-300 whitespace-pre-wrap max-h-60 overflow-y-auto bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                    {renderedPreview}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
