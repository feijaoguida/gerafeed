"use client";

import { useState, useEffect } from "react";
import {
  Search,
  CheckCircle2,
  XCircle,
  Save,
  ArrowUp,
  ArrowDown,
  ShoppingBag,
  Info,
  Layers,
  Sparkles,
} from "lucide-react";
import { CanonicalDocument } from "@/lib/affiliate/canonical-document";

export interface ArticleProductItem {
  id?: string;
  productId: string;
  offerId?: string | null;
  position: number;
  badge?: string | null;
  score?: number | null;
  recommendation?: string | null;
  product?: {
    id: string;
    name: string;
    brand?: string | null;
    rating?: number | null;
    pros: string[];
    cons: string[];
    imageUrl?: string | null;
    images?: string[];
    specs?: Record<string, unknown> | null;
    offers?: Array<{
      id: string;
      price: number | null;
      currency: string;
      seller: string | null;
      affiliateUrl: string;
      status: string;
    }>;
  };
  offer?: {
    id: string;
    price: number | null;
    currency: string;
    seller: string | null;
    affiliateUrl: string;
  } | null;
}

export interface AffiliateArticleEditorProps {
  articleId: string;
  initialTitle: string;
  initialSummary: string;
  initialContent: string;
  initialCommercialType: string;
  initialStatus: "PENDING" | "PUBLISHED" | "REJECTED";
  initialNeedsRepublish?: boolean;
  initialSeoFocusKeyword?: string;
  initialSeoTitle?: string;
  initialSeoDescription?: string;
  initialTags?: string[];
  initialProducts: ArticleProductItem[];
  initialCanonicalDocument?: CanonicalDocument | null;
  initialWordpressSiteId?: string | null;
  initialCategoryId?: string | null;
  initialOriginalImageUrl?: string | null;
  onSaveSuccess?: () => void;
}

export function AffiliateArticleEditor({
  articleId,
  initialTitle,
  initialSummary,
  initialContent,
  initialCommercialType,
  initialStatus,
  initialNeedsRepublish = false,
  initialSeoFocusKeyword = "",
  initialSeoTitle = "",
  initialSeoDescription = "",
  initialTags = [],
  initialProducts = [],
  initialCanonicalDocument = null,
  initialWordpressSiteId = null,
  initialCategoryId = null,
  initialOriginalImageUrl = null,
  onSaveSuccess,
}: AffiliateArticleEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [summary, setSummary] = useState(initialSummary);
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState(initialStatus);
  const [originalImageUrl, setOriginalImageUrl] = useState<string>(initialOriginalImageUrl || "");
  const [wordpressSiteId, setWordpressSiteId] = useState<string>(initialWordpressSiteId || "");
  const [categoryId, setCategoryId] = useState<string>(initialCategoryId || "");
  const [wpSites, setWpSites] = useState<Array<{ id: string; name: string; url: string; isDefault?: boolean }>>([]);
  const [wpCategories, setWpCategories] = useState<Array<{ id: string; name: string; wordpressId: number; wordpressSiteId?: string }>>([]);
  const [seoFocusKeyword, setSeoFocusKeyword] = useState(initialSeoFocusKeyword);
  const [seoTitle, setSeoTitle] = useState(initialSeoTitle);
  const [seoDescription, setSeoDescription] = useState(initialSeoDescription);
  const [tagsInput, setTagsInput] = useState(initialTags.join(", "));
  const [products, setProducts] = useState<ArticleProductItem[]>(initialProducts);
  const [activeTab, setActiveTab] = useState<"editor" | "products" | "canonical_preview" | "seo">("editor");

  const [needsRepublish, setNeedsRepublish] = useState(initialNeedsRepublish);
  const [isRepublishing, setIsRepublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load WordPress sites & categories
  useEffect(() => {
    let ignore = false;
    async function loadWpConfig() {
      try {
        const [sitesRes, catsRes] = await Promise.all([
          fetch("/api/wordpress/sites"),
          fetch("/api/wordpress/categories"),
        ]);
        if (sitesRes.ok && !ignore) {
          const siteData = await sitesRes.json();
          const list = Array.isArray(siteData.sites) ? siteData.sites : Array.isArray(siteData) ? siteData : [];
          setWpSites(list);
          if (list.length > 0 && !wordpressSiteId && !initialWordpressSiteId) {
            const defaultSite = list.find((s: { id: string; isDefault?: boolean }) => s.isDefault);
            setWordpressSiteId(defaultSite ? defaultSite.id : list[0].id);
          }
        }
        if (catsRes.ok && !ignore) {
          const catData = await catsRes.json();
          const list = Array.isArray(catData) ? catData : [];
          setWpCategories(list);
          if (list.length > 0 && !categoryId && !initialCategoryId) {
            setCategoryId(list[0].id);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados do WordPress:", err);
      }
    }
    loadWpConfig();
    return () => {
      ignore = true;
    };
  }, []);

  // Manual Republish to WordPress
  const handleRepublish = async () => {
    setIsRepublishing(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/articles/${articleId}/republish`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Falha ao republicar artigo.");
      }

      setNeedsRepublish(false);
      setMessage({
        type: "success",
        text: "Artigo republicado com sucesso no WordPress com as ofertas mais recentes sincronizadas!",
      });
      if (onSaveSuccess) onSaveSuccess();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Erro desconhecido ao republicar.";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setIsRepublishing(false);
    }
  };

  // Move Product in ordering
  const moveProduct = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= products.length) return;

    const newItems = [...products];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);

    // Reassign positions
    const reordered = newItems.map((item, idx) => ({ ...item, position: idx }));
    setProducts(reordered);
  };

  // Update single product metadata
  const updateProductMetadata = (
    index: number,
    field: keyof ArticleProductItem,
    value: string | number | null
  ) => {
    setProducts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Save All Changes (Article & Products) and Publish to WordPress if requested
  const handleSave = async (newStatus?: "PENDING" | "PUBLISHED" | "REJECTED") => {
    setIsSaving(true);
    setMessage(null);

    const effectiveStatus = newStatus || status;

    if (effectiveStatus === "PUBLISHED" && !categoryId) {
      setMessage({
        type: "error",
        text: "Selecione uma Categoria do WordPress antes de aprovar e publicar.",
      });
      setIsSaving(false);
      return;
    }

    try {
      // 1. Update Article Core, Category, WordPress Site, Image & SEO
      const articlePayload = {
        title,
        summary,
        content,
        originalImageUrl: originalImageUrl || null,
        modifiedImageUrl: originalImageUrl || null,
        wordpressSiteId: wordpressSiteId || null,
        categoryId: categoryId || null,
        suggestedCategoryId: categoryId || null,
        seoFocusKeyword,
        seoTitle,
        seoDescription,
        tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
        status: effectiveStatus === "PUBLISHED" ? "PENDING" : effectiveStatus,
      };

      const articleRes = await fetch(`/api/articles/${articleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(articlePayload),
      });

      if (!articleRes.ok) {
        const data = await articleRes.json();
        throw new Error(data.error || "Erro ao salvar dados do artigo.");
      }

      // 2. Update Article Products relations if present
      if (products.length > 0) {
        const productsPayload = {
          items: products.map((p, idx) => ({
            productId: p.productId,
            offerId: p.offerId || null,
            position: idx,
            badge: p.badge || null,
            score: typeof p.score === "number" ? p.score : null,
            recommendation: p.recommendation || null,
          })),
        };

        const prodRes = await fetch(`/api/articles/${articleId}/products`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productsPayload),
        });

        if (!prodRes.ok) {
          const data = await prodRes.json();
          throw new Error(data.error || "Erro ao atualizar produtos vinculados.");
        }
      }

      // 3. If action is PUBLISHED, execute full WordPress REST API publication via approve endpoint
      if (effectiveStatus === "PUBLISHED") {
        const approveRes = await fetch(`/api/articles/${articleId}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const approveData = await approveRes.json();
        if (!approveRes.ok) {
          throw new Error(approveData.error || "Erro ao publicar artigo no WordPress.");
        }

        setStatus("PUBLISHED");
        setMessage({
          type: "success",
          text: `Artigo APROVADO e publicado com sucesso no WordPress! ID Post: ${approveData.wordpressPostId}`,
        });
      } else {
        if (newStatus) setStatus(newStatus);
        setMessage({ type: "success", text: "Alterações salvas com sucesso!" });
      }

      onSaveSuccess?.();
    } catch (err: unknown) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Erro desconhecido ao salvar.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-card rounded-xl border shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary rounded-full">
            {initialCommercialType.replace(/_/g, " ")}
          </span>
          <span
            className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full ${
              status === "PUBLISHED"
                ? "bg-emerald-500/10 text-emerald-500"
                : status === "REJECTED"
                ? "bg-rose-500/10 text-rose-500"
                : "bg-amber-500/10 text-amber-500"
            }`}
          >
            {status}
          </span>
          {needsRepublish && (
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-600 border border-amber-500/30 rounded-full animate-pulse">
              ⚠️ Ofertas Desatualizadas
            </span>
          )}

          {/* WordPress Site and Category Selectors in Header */}
          <div className="flex flex-wrap items-center gap-2 border-l pl-3 border-border">
            <select
              value={wordpressSiteId}
              onChange={(e) => {
                setWordpressSiteId(e.target.value);
                setCategoryId(""); // Reset category when site changes
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg border bg-background text-foreground"
              title="Site WordPress de destino"
            >
              <option value="">Site WordPress Padrão</option>
              {wpSites.map((s) => (
                <option key={s.id} value={s.id}>
                  🌐 {s.name} {s.isDefault ? "(Padrão)" : ""}
                </option>
              ))}
            </select>

            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border bg-background ${
                !categoryId ? "border-amber-500 text-amber-600 font-bold" : "text-foreground"
              }`}
              title="Categoria do Post no WordPress"
            >
              <option value="">⚠️ Selecione a Categoria WP *</option>
              {wpCategories
                .filter((c) => !wordpressSiteId || c.wordpressSiteId === wordpressSiteId)
                .map((c) => (
                <option key={c.id} value={c.id}>
                  📁 {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons with Human Approval */}
        <div className="flex items-center gap-3">
          {status === "PUBLISHED" && needsRepublish && (
            <button
              onClick={handleRepublish}
              disabled={isRepublishing || isSaving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              {isRepublishing ? "Republicando..." : "Sincronizar no WordPress"}
            </button>
          )}

          <button
            onClick={() => handleSave()}
            disabled={isSaving || isRepublishing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border hover:bg-muted transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Salvando..." : "Salvar Rascunho"}
          </button>

          {status !== "PUBLISHED" && (
            <button
              onClick={() => handleSave("PUBLISHED")}
              disabled={isSaving || isRepublishing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSaving ? "Publicando..." : "Aprovar & Publicar no WordPress"}
            </button>
          )}

          {status !== "REJECTED" && (
            <button
              onClick={() => handleSave("REJECTED")}
              disabled={isSaving || isRepublishing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-600 border border-rose-200 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Rejeitar
            </button>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("editor")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "editor"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Editor de Conteúdo
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "products"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Produtos Vinculados ({products.length})
        </button>
        <button
          onClick={() => setActiveTab("canonical_preview")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "canonical_preview"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="w-4 h-4" />
          Preview Canônico
        </button>
        <button
          onClick={() => setActiveTab("seo")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "seo"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Search className="w-4 h-4" />
          SEO & Metadados
        </button>
      </div>

      {/* Tab 1: Editor de Conteúdo */}
      {activeTab === "editor" && (
        <div className="space-y-5 bg-card p-6 rounded-xl border">
          {/* Affiliate Disclosure Banner */}
          <div className="flex items-start gap-3 p-3.5 bg-blue-50/50 border border-blue-200 rounded-lg text-blue-900 text-xs">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Transparência de Afiliados (Compliance)</p>
              <p className="text-blue-800">
                Este artigo comercial inclui aviso prévio aos leitores garantindo total conformidade com diretrizes editoriais e de afiliados.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Título do Artigo Comercial
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border bg-background font-medium focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          {/* Product Gallery & Featured Image Selector */}
          <div className="p-4 bg-muted/20 border rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground">
                🖼️ Imagens do Produto (Galeria & Destaque)
              </label>
              {originalImageUrl && (
                <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ✓ Capa do Post Selecionada
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {products.flatMap((p) => {
                const pImgs = p.product?.images || [];
                const mainImg = p.product?.imageUrl;
                const combined = [...pImgs];
                if (mainImg && !combined.includes(mainImg)) combined.unshift(mainImg);
                return combined;
              }).map((imgUrl, idx) => {
                const isSelected = originalImageUrl === imgUrl;
                return (
                  <div key={idx} className={`relative group border-2 rounded-lg overflow-hidden transition-all ${isSelected ? "border-emerald-500 shadow-md ring-2 ring-emerald-500/20" : "border-transparent hover:border-primary/50"}`}>
                    <img src={imgUrl} alt={`Foto ${idx + 1}`} className="w-20 h-20 object-cover bg-white" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity p-1">
                      <button
                        type="button"
                        onClick={() => setOriginalImageUrl(imgUrl)}
                        className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-1.5 py-0.5 rounded w-full text-center"
                      >
                        {isSelected ? "Em Destaque" : "Usar Capa"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setContent((prev) => `${prev}\n\n<figure style="margin: 20px 0; text-align: center;"><img src="${imgUrl}" alt="${title}" style="max-width: 100%; border-radius: 8px;" /></figure>`);
                          setMessage({ type: "success", text: "Imagem inserida no artigo com sucesso!" });
                        }}
                        className="text-[10px] bg-primary hover:bg-primary/90 text-white font-bold px-1.5 py-0.5 rounded w-full text-center"
                      >
                        ➕ Inserir
                      </button>
                    </div>
                    {isSelected && (
                      <span className="absolute top-1 right-1 bg-emerald-600 text-white text-[9px] font-bold px-1 rounded shadow">
                        Capa
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Resumo / Linha Fina
            </label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Conteúdo Editorial (HTML / Texto Rico)
            </label>
            <textarea
              rows={14}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border bg-background font-mono text-xs focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>
      )}

      {/* Tab 2: Produtos Vinculados */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="p-4 bg-muted/40 rounded-lg text-xs text-muted-foreground flex items-center justify-between">
            <span>Reordene ou ajuste badges e notas dos produtos vinculados a este artigo.</span>
            <span>Total: {products.length} produto(s)</span>
          </div>

          {products.map((item, index) => {
            const prod = item.product;
            return (
              <div
                key={item.productId || index}
                className="p-5 bg-card rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveProduct(index, "up")}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-muted disabled:opacity-30"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveProduct(index, "down")}
                      disabled={index === products.length - 1}
                      className="p-1 rounded hover:bg-muted disabled:opacity-30"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{prod?.name || item.productId}</h4>
                    <p className="text-xs text-muted-foreground">
                      Marca: {prod?.brand || "N/A"} • Posição: {index + 1}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-muted-foreground mb-1">
                      Badge em Destaque
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Melhor Escolha"
                      value={item.badge || ""}
                      onChange={(e) => updateProductMetadata(index, "badge", e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded border bg-background"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-muted-foreground mb-1">
                      Score / Nota (0-10)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      placeholder="9.5"
                      value={item.score !== null && item.score !== undefined ? item.score : ""}
                      onChange={(e) =>
                        updateProductMetadata(
                          index,
                          "score",
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded border bg-background"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-muted-foreground mb-1">
                      Recomendação / Veredicto
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Campeão do Teste"
                      value={item.recommendation || ""}
                      onChange={(e) => updateProductMetadata(index, "recommendation", e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded border bg-background"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Preview Canônico */}
      {activeTab === "canonical_preview" && (
        <div className="p-6 bg-card rounded-xl border space-y-6">
          <div className="flex items-center justify-between pb-4 border-b">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Renderização Estruturada dos Blocos Canônicos
            </h3>
            <span className="text-xs text-muted-foreground">
              Versão do Documento: {initialCanonicalDocument?.version || 1}
            </span>
          </div>

          {initialCanonicalDocument?.blocks?.map((block, idx) => {
            switch (block.type) {
              case "AFFILIATE_DISCLOSURE":
                return (
                  <div key={idx} className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground italic border">
                    📢 {block.data.text}
                  </div>
                );
              case "HEADING":
                return (
                  <h2 key={idx} className="text-xl font-bold tracking-tight">
                    {block.data.text}
                  </h2>
                );
              case "RICH_TEXT":
                return (
                  <div
                    key={idx}
                    className="prose dark:prose-invert max-w-none text-sm"
                    dangerouslySetInnerHTML={{ __html: block.data.html || block.data.markdown || "" }}
                  />
                );
              case "PRODUCT_CARD":
                return (
                  <div key={idx} className="p-4 bg-muted/30 rounded-xl border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 text-xs font-semibold bg-primary text-primary-foreground rounded-md">
                        {block.data.highlightBadge || "Destaque"}
                      </span>
                      <span className="text-xs text-muted-foreground">ID: {block.data.productId}</span>
                    </div>
                    <p className="text-sm font-medium">{block.data.ctaText || "Ver Melhor Preço"}</p>
                  </div>
                );
              case "PRODUCT_COMPARISON":
                return (
                  <div key={idx} className="p-4 bg-muted/30 rounded-xl border space-y-3">
                    <h4 className="font-semibold text-xs uppercase text-muted-foreground">Tabela Comparativa</h4>
                    <p className="text-xs">Produtos comparados: {block.data.productIds.join(", ")}</p>
                    <p className="text-xs">Critérios: {block.data.criteria?.join(", ") || "Preço e Recursos"}</p>
                  </div>
                );
              case "PROS_CONS":
                return (
                  <div key={idx} className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-xl border text-xs">
                    <div>
                      <h5 className="font-semibold text-emerald-600 mb-1">✓ Prós</h5>
                      <ul className="list-disc list-inside space-y-0.5">
                        {block.data.pros.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-semibold text-rose-600 mb-1">✗ Contras</h5>
                      <ul className="list-disc list-inside space-y-0.5">
                        {block.data.cons.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              case "CTA":
                return (
                  <div key={idx} className="p-4 text-center bg-primary/5 border border-primary/20 rounded-xl space-y-2">
                    <button className="px-6 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg shadow-sm">
                      {block.data.text}
                    </button>
                    {block.data.subtext && <p className="text-[11px] text-muted-foreground">{block.data.subtext}</p>}
                  </div>
                );
              default:
                return null;
            }
          })}
        </div>
      )}

      {/* Tab 4: SEO & Metadados */}
      {activeTab === "seo" && (
        <div className="space-y-5 bg-card p-6 rounded-xl border">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Palavra-chave Principal (Focus Keyword)
            </label>
            <input
              type="text"
              value={seoFocusKeyword}
              onChange={(e) => setSeoFocusKeyword(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border bg-background text-sm"
              placeholder="Ex: melhores monitores gamer 2026"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              SEO Title
            </label>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border bg-background text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Meta Description
            </label>
            <textarea
              rows={3}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border bg-background text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Tags (separadas por vírgula)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border bg-background text-sm"
              placeholder="Hardware, Monitores, OLED"
            />
          </div>
        </div>
      )}
    </div>
  );
}
