"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ShoppingBag,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Scale,
  Award,
  BookOpen,
  Search,
  Tag,
  Loader2,
  Edit3,
} from "lucide-react";
import {
  TEMPLATE_INPUT_RULES,
  validateTemplateInputs,
} from "@/lib/affiliate/template-rules";
import { CommercialArticleType } from "@prisma/client";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductOffer {
  id: string;
  price: number | null;
  seller: string | null;
  affiliateUrl: string;
  status: string;
}

interface ProductItem {
  id: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  category?: { id: string; name: string } | null;
  offers: ProductOffer[];
}

const TEMPLATE_ICONS: Record<string, typeof FileText> = {
  PRODUCT_REVIEW: FileText,
  COMPARISON: Scale,
  BEST_PRODUCTS: Award,
  BUYING_GUIDE: BookOpen,
};

const DISPLAY_TEMPLATES: CommercialArticleType[] = [
  "PRODUCT_REVIEW",
  "COMPARISON",
  "BEST_PRODUCTS",
  "BUYING_GUIDE",
];

export function AffiliatePublishingWizard() {
  // Wizard Steps: 1: Template, 2: Products, 3: Details & SEO, 4: Preview/Publish
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [selectedTemplate, setSelectedTemplate] =
    useState<CommercialArticleType>("PRODUCT_REVIEW");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [focusKeyword, setFocusKeyword] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [titleOverride, setTitleOverride] = useState("");

  // Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [wpSites, setWpSites] = useState<Array<{ id: string; name: string; url: string }>>([]);
  const [wpCategories, setWpCategories] = useState<Array<{ id: string; name: string; wordpressId: number }>>([]);
  const [selectedWpSiteId, setSelectedWpSiteId] = useState<string>("");
  const [selectedWpCategoryId, setSelectedWpCategoryId] = useState<string>("");

  // Generation & Status
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedArticleId, setGeneratedArticleId] = useState<string | null>(null);
  const [generatedTitle, setGeneratedTitle] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load Categories and Active Products
  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const [catRes, prodRes, wpSitesRes, wpCatsRes] = await Promise.all([
          fetch("/api/affiliate/categories"),
          fetch("/api/affiliate/products?limit=100"),
          fetch("/api/wordpress/sites"),
          fetch("/api/wordpress/categories"),
        ]);
        if (catRes.ok && !ignore) {
          const catData = await catRes.json();
          setCategories(Array.isArray(catData) ? catData : Array.isArray(catData?.items) ? catData.items : []);
        }
        if (prodRes.ok && !ignore) {
          const prodData = await prodRes.json();
          setProducts(
            Array.isArray(prodData.items)
              ? prodData.items
              : Array.isArray(prodData.products)
              ? prodData.products
              : Array.isArray(prodData)
              ? prodData
              : []
          );
        }
        if (wpSitesRes.ok && !ignore) {
          const siteData = await wpSitesRes.json();
          const sitesList = Array.isArray(siteData.sites) ? siteData.sites : Array.isArray(siteData) ? siteData : [];
          setWpSites(sitesList);
          if (sitesList.length > 0 && !selectedWpSiteId) {
            setSelectedWpSiteId(sitesList[0].id);
          }
        }
        if (wpCatsRes.ok && !ignore) {
          const catData = await wpCatsRes.json();
          const catsList = Array.isArray(catData) ? catData : [];
          setWpCategories(catsList);
          if (catsList.length > 0 && !selectedWpCategoryId) {
            setSelectedWpCategoryId(catsList[0].id);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados para o assistente de afiliados:", err);
      }
    }
    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  const activeTemplateConfig =
    TEMPLATE_INPUT_RULES[selectedTemplate] ||
    TEMPLATE_INPUT_RULES.PRODUCT_REVIEW;

  const productList = Array.isArray(products) ? products : [];
  const filteredProducts = productList.filter((p) => {
    if (selectedCategory && p.categoryId !== selectedCategory) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.brand && p.brand.toLowerCase().includes(q));
    }
    return true;
  });

  const toggleProduct = (productId: string) => {
    if (activeTemplateConfig.maxProducts === 1) {
      setSelectedProductIds([productId]);
      return;
    }

    if (selectedProductIds.includes(productId)) {
      setSelectedProductIds(selectedProductIds.filter((id) => id !== productId));
    } else {
      if (selectedProductIds.length >= activeTemplateConfig.maxProducts) {
        alert(`O template ${activeTemplateConfig.title} permite no máximo ${activeTemplateConfig.maxProducts} produtos.`);
        return;
      }
      setSelectedProductIds([...selectedProductIds, productId]);
    }
  };

  const handleGenerate = async () => {
    const validation = validateTemplateInputs(selectedTemplate, {
      productIds: selectedProductIds,
      categoryId: selectedCategory,
      title: titleOverride,
    });

    if (!validation.valid) {
      setErrorMessage(validation.errors.join(" "));
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      let endpoint = "/api/affiliate/generate/review";
      let payload: Record<string, unknown> = {};

      const commonPayload = {
        wordpressSiteId: selectedWpSiteId || undefined,
        categoryId: selectedWpCategoryId || undefined,
        focusKeyword: focusKeyword.trim() || undefined,
        customInstructions: customInstructions.trim() || undefined,
      };

      if (selectedTemplate === "PRODUCT_REVIEW") {
        endpoint = "/api/affiliate/generate/review";
        payload = {
          ...commonPayload,
          productId: selectedProductIds[0],
        };
      } else if (selectedTemplate === "COMPARISON") {
        endpoint = "/api/affiliate/generate/comparison";
        payload = {
          ...commonPayload,
          productIds: selectedProductIds,
        };
      } else if (selectedTemplate === "BEST_PRODUCTS") {
        endpoint = "/api/affiliate/generate/best-products";
        payload = {
          ...commonPayload,
          categoryId: selectedCategory || undefined,
          productIds: selectedProductIds,
          title: titleOverride.trim() || undefined,
        };
      } else if (selectedTemplate === "BUYING_GUIDE") {
        endpoint = "/api/affiliate/generate/buying-guide";
        payload = {
          ...commonPayload,
          categoryId: selectedCategory || undefined,
          productIds: selectedProductIds,
          title: titleOverride.trim() || undefined,
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao gerar artigo comercial de afiliados.");
      }

      const createdId = data.article?.id || data.articleId || data.id || null;
      const createdTitle = data.article?.title || data.title || "Artigo de Afiliado Gerado";

      setGeneratedArticleId(createdId);
      setGeneratedTitle(createdTitle);
      setStep(4);
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumb & Header */}
      <div className="border-b border-slate-200 dark:border-zinc-800 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
          <Link href="/publishing" className="hover:underline flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> Central de Publicação
          </Link>
          <span>/</span>
          <span>Conteúdo de Afiliados</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Assistente de Conteúdo Comercial de Afiliados
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
          Produza reviews, comparações e guias ancorados na base de produtos importados para publicação direta no WordPress.
        </p>
      </div>

      {/* Steps Progress Indicator */}
      <div className="flex items-center justify-between max-w-2xl mx-auto px-4">
        {[
          { num: 1, label: "Formato" },
          { num: 2, label: "Produtos" },
          { num: 3, label: "SEO & Título" },
          { num: 4, label: "Conclusão" },
        ].map((s, idx) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s.num
                  ? "bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-950"
                  : step > s.num
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
              }`}
            >
              {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
            </div>
            <span
              className={`text-xs font-medium hidden sm:inline ${
                step === s.num
                  ? "text-indigo-600 dark:text-indigo-400 font-bold"
                  : "text-slate-500 dark:text-zinc-400"
              }`}
            >
              {s.label}
            </span>
            {idx < 3 && (
              <div className="w-8 sm:w-12 h-0.5 bg-slate-200 dark:bg-zinc-800 mx-1 sm:mx-2" />
            )}
          </div>
        ))}
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Step 1: Template Selection */}
      {step === 1 && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Passo 1: Escolha o formato do conteúdo
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Cada modelo orienta a IA com diretrizes específicas de persuasão e regras de ancoragem de produtos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DISPLAY_TEMPLATES.map((type) => {
              const tmpl = TEMPLATE_INPUT_RULES[type];
              const Icon = TEMPLATE_ICONS[type] || FileText;
              const isSelected = selectedTemplate === type;
              const badgeText =
                tmpl.minProducts === tmpl.maxProducts
                  ? `${tmpl.minProducts} Produto`
                  : `${tmpl.minProducts} a ${tmpl.maxProducts} Produtos`;

              return (
                <div
                  key={type}
                  onClick={() => {
                    setSelectedTemplate(type);
                    setSelectedProductIds([]);
                  }}
                  className={`p-5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-md ring-2 ring-indigo-500/20"
                      : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-full">
                      {badgeText}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-3">
                    {tmpl.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    {tmpl.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
            >
              Avançar para Produtos
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Product & Category Selection */}
      {step === 2 && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Passo 2: Selecione os produtos do catálogo
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Formato: <strong>{activeTemplateConfig.title}</strong> ({selectedProductIds.length} de {activeTemplateConfig.minProducts === activeTemplateConfig.maxProducts ? activeTemplateConfig.minProducts : `${activeTemplateConfig.minProducts} a ${activeTemplateConfig.maxProducts}`} selecionados)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-800 dark:text-zinc-200"
              >
                <option value="">{activeTemplateConfig.requiresCategory ? "Selecione uma Categoria *" : "Todas as Categorias"}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar produtos por nome ou marca..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-800 dark:text-zinc-200"
            />
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
              <Tag className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Nenhum produto encontrado. Importe novos itens no menu de Afiliados.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
              {filteredProducts.map((p) => {
                const isSelected = selectedProductIds.includes(p.id);
                const bestOffer = p.offers[0] || null;
                const priceFormatted = bestOffer?.price ? `R$ ${Number(bestOffer.price).toFixed(2).replace(".", ",")}` : "Sob consulta";

                return (
                  <div
                    key={p.id}
                    onClick={() => toggleProduct(p.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20"
                        : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 shrink-0"
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                        {p.name}
                      </h4>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                        {priceFormatted}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {p.brand || p.category?.name || "Mercado Livre"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>

            <button
              onClick={() => {
                if (activeTemplateConfig.requiresCategory && !selectedCategory) {
                  alert("Selecione uma categoria para prosseguir com este template.");
                  return;
                }
                if (selectedProductIds.length < activeTemplateConfig.minProducts) {
                  alert(`Selecione pelo menos ${activeTemplateConfig.minProducts} produto(s).`);
                  return;
                }
                setStep(3);
              }}
              disabled={
                selectedProductIds.length < activeTemplateConfig.minProducts ||
                (activeTemplateConfig.requiresCategory && !selectedCategory)
              }
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              Avançar para SEO & Detalhes
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: SEO & Details */}
      {step === 3 && (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Passo 3: Palavra-chave foco e instruções editoriais
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Personalize o direcionamento de busca e diretrizes adicionais para o motor de IA.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
            {/* WordPress Site & Category Destination Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Site WordPress de Destino
                </label>
                <select
                  value={selectedWpSiteId}
                  onChange={(e) => setSelectedWpSiteId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-800 dark:text-zinc-200"
                >
                  <option value="">Configuração Padrão do Workspace</option>
                  {wpSites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name} ({site.url})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Categoria do Post no WordPress *
                </label>
                <select
                  value={selectedWpCategoryId}
                  onChange={(e) => setSelectedWpCategoryId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-800 dark:text-zinc-200"
                >
                  <option value="">Selecione a Categoria do WordPress *</option>
                  {wpCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} (ID: {cat.wordpressId})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Palavra-Chave Foco (SEO)
              </label>
              <input
                type="text"
                placeholder="Ex: melhor robo aspirador 2026, sony wh-1000xm5 review"
                value={focusKeyword}
                onChange={(e) => setFocusKeyword(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-800 dark:text-zinc-200"
              />
            </div>

            {activeTemplateConfig.allowsCustomTitle && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Título Personalizado (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Deixe em branco para título gerado pela IA ou informe um título personalizado"
                  value={titleOverride}
                  onChange={(e) => setTitleOverride(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-800 dark:text-zinc-200"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Instruções Editoriais Personalizadas (Opcional)
              </label>
              <textarea
                rows={3}
                placeholder="Ex: Foque no custo-benefício para apartamentos pequenos, destaque o recurso de mop..."
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-800 dark:text-zinc-200"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando Artigo com IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar Artigo de Afiliado
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Completion & Review */}
      {step === 4 && (
        <div className="space-y-6 max-w-2xl mx-auto text-center">
          <div className="p-8 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-4">
            <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Artigo de Afiliado Gerado com Sucesso!
              </h2>
              <p className="text-xs text-slate-600 dark:text-zinc-300">
                {generatedTitle}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={generatedArticleId ? `/articles/${generatedArticleId}` : "/publishing"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md transition-all hover:scale-[1.02]"
            >
              <Edit3 className="w-4 h-4" />
              Revisar & Publicar no WordPress
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => {
                setStep(1);
                setSelectedProductIds([]);
                setGeneratedArticleId(null);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-semibold rounded-xl transition-colors border border-slate-200 dark:border-zinc-700"
            >
              Criar Outro Artigo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
