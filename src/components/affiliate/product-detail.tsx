"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  RefreshCw,
  Save,
  Package,
  Layers,
  Tag,
  FileText,
  Trash2,
  Plus,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Star,
} from "lucide-react";

interface ProductCategory {
  id: string;
  name: string;
}

interface AffiliateProgram {
  id: string;
  name: string;
  code: string;
}

interface ProductOffer {
  id: string;
  affiliateProgramId: string;
  externalProductId: string | null;
  affiliateUrl: string;
  seller: string | null;
  price: number | null;
  oldPrice: number | null;
  currency: string;
  trackingLabel: string | null;
  status: "ACTIVE" | "PAUSED" | "OUT_OF_STOCK" | "ARCHIVED";
  metadataSource: string | null;
  metadataLastFetchedAt: string | null;
  affiliateProgram: AffiliateProgram;
}

interface ProductData {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  description: string | null;
  sourceDescription: string | null;
  imageUrl: string | null;
  specs: Record<string, string> | null;
  sourceSpecs: Record<string, string> | null;
  marketplaceCategoryId: string | null;
  marketplaceCategoryName: string | null;
  pros: string[];
  cons: string[];
  rating: number | null;
  sourceRating: number | null;
  reviewSamples?: Array<{
    id: string;
    provider: string;
    rating: number | null;
    title: string | null;
    text: string;
    authorName: string | null;
    sourceUrl: string | null;
    capturedAt: string;
  }>;
  categoryId: string | null;
  status: "ACTIVE" | "ARCHIVED" | "DRAFT";
  category: ProductCategory | null;
  offers: ProductOffer[];
  createdAt: string;
  updatedAt: string;
}

export function ProductDetail({ productId }: { productId: string }) {
  const router = useRouter();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [activeTab, setActiveTab] = useState<"general" | "specs" | "offers" | "reviews" | "articles">("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Editable Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [brand, setBrand] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "ARCHIVED" | "DRAFT">("ACTIVE");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [rating, setRating] = useState<number | "">("");
  const [pros, setPros] = useState<string[]>([]);
  const [cons, setCons] = useState<string[]>([]);
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([]);

  // New Offer Modal / Inline Form
  const [showAddOffer, setShowAddOffer] = useState(false);
  const [newOfferUrl, setNewOfferUrl] = useState("");
  const [newOfferSeller, setNewOfferSeller] = useState("");
  const [newOfferPrice, setNewOfferPrice] = useState("");
  const [newOfferTracking, setNewOfferTracking] = useState("");
  const [newOfferAutoFetch, setNewOfferAutoFetch] = useState(true);
  const [addingOffer, setAddingOffer] = useState(false);

  // Reference Sources State
  const [referenceSources, setReferenceSources] = useState<Array<{
    id: string;
    url: string;
    title: string | null;
    summary: string | null;
    status: "PENDING" | "PROCESSING" | "READY" | "FAILED";
    error: string | null;
    capturedAt: string;
    createdAt: string;
  }>>([]);
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [addingSource, setAddingSource] = useState(false);
  const [processingSourceId, setProcessingSourceId] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    setErrorMsg(null);
    try {
      const [resProd, resCats, resSources] = await Promise.all([
        fetch(`/api/affiliate/products/${productId}`),
        fetch("/api/affiliate/categories"),
        fetch(`/api/affiliate/products/${productId}/sources`),
      ]);

      if (!resProd.ok) {
        throw new Error("Produto não encontrado.");
      }

      const prodData: ProductData = await resProd.json();
      setProduct(prodData);
      setName(prodData.name || "");
      setSlug(prodData.slug || "");
      setBrand(prodData.brand || "");
      setCategoryId(prodData.categoryId || "");
      setStatus(prodData.status || "ACTIVE");
      setDescription(prodData.description || "");
      setImageUrl(prodData.imageUrl || "");
      setRating(prodData.rating !== null ? prodData.rating : "");
      setPros(prodData.pros || []);
      setCons(prodData.cons || []);

      if (resSources.ok) {
        const sourcesData = await resSources.json();
        setReferenceSources(sourcesData.sources || []);
      }

      if (prodData.specs && typeof prodData.specs === "object") {
        setSpecs(
          Object.entries(prodData.specs).map(([key, value]) => ({
            key,
            value: String(value),
          }))
        );
      } else {
        setSpecs([]);
      }

      if (resCats.ok) {
        const catsData = await resCats.json();
        setCategories(Array.isArray(catsData) ? catsData : []);
      }
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [resProd, resCats] = await Promise.all([
          fetch(`/api/affiliate/products/${productId}`),
          fetch("/api/affiliate/categories"),
        ]);

        if (!ignore && !resProd.ok) {
          throw new Error("Produto não encontrado.");
        }

        if (!ignore && resProd.ok) {
          const prodData: ProductData = await resProd.json();
          setProduct(prodData);
          setName(prodData.name || "");
          setSlug(prodData.slug || "");
          setBrand(prodData.brand || "");
          setCategoryId(prodData.categoryId || "");
          setStatus(prodData.status || "ACTIVE");
          setDescription(prodData.description || "");
          setImageUrl(prodData.imageUrl || "");
          setRating(prodData.rating !== null ? prodData.rating : "");
          setPros(prodData.pros || []);
          setCons(prodData.cons || []);

          if (prodData.specs && typeof prodData.specs === "object") {
            setSpecs(
              Object.entries(prodData.specs).map(([key, value]) => ({
                key,
                value: String(value),
              }))
            );
          } else {
            setSpecs([]);
          }
        }

        if (!ignore && resCats.ok) {
          const catsData = await resCats.json();
          setCategories(Array.isArray(catsData) ? catsData : []);
        }
      } catch (err) {
        if (!ignore) setErrorMsg((err as Error).message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [productId]);

  const handleSaveProduct = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const specsRecord: Record<string, string> = {};
    specs.forEach((s) => {
      if (s.key.trim()) {
        specsRecord[s.key.trim()] = s.value.trim();
      }
    });

    try {
      const res = await fetch(`/api/affiliate/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || undefined,
          brand: brand.trim() || null,
          categoryId: categoryId || null,
          status,
          description: description.trim() || null,
          imageUrl: imageUrl.trim() || null,
          rating: rating !== "" ? Number(rating) : null,
          pros: pros.filter((p) => p.trim()),
          cons: cons.filter((c) => c.trim()),
          specs: Object.keys(specsRecord).length > 0 ? specsRecord : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar produto.");
      }

      setSuccessMsg("Produto atualizado com sucesso!");
      fetchProduct();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshAll = async () => {
    setRefreshing(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/affiliate/products/${productId}/refresh`, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error("Erro ao atualizar ofertas do produto.");
      }
      setSuccessMsg("Ofertas e preços atualizados com sucesso!");
      fetchProduct();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefreshSingleOffer = async (offerId: string) => {
    try {
      const res = await fetch(`/api/affiliate/offers/${offerId}/refresh`, {
        method: "POST",
      });
      if (res.ok) {
        fetchProduct();
      }
    } catch {
      // ignore
    }
  };

  const handleAddOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfferUrl.trim()) return;
    setAddingOffer(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/affiliate/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          affiliateUrl: newOfferUrl.trim(),
          seller: newOfferSeller.trim() || null,
          price: newOfferPrice ? parseFloat(newOfferPrice) : null,
          trackingLabel: newOfferTracking.trim() || null,
          autoFetchMetadata: newOfferAutoFetch,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao adicionar oferta.");
      }

      setNewOfferUrl("");
      setNewOfferSeller("");
      setNewOfferPrice("");
      setNewOfferTracking("");
      setShowAddOffer(false);
      fetchProduct();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setAddingOffer(false);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!confirm("Deseja realmente remover esta oferta?")) return;
    try {
      const res = await fetch(`/api/affiliate/offers/${offerId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchProduct();
      }
    } catch {
      // ignore
    }
  };

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceUrl.trim()) return;
    setAddingSource(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/affiliate/products/${productId}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newSourceUrl.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao adicionar fonte de referência.");
      }
      setNewSourceUrl("");
      fetchProduct();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setAddingSource(false);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm("Deseja realmente remover esta fonte de pesquisa?")) return;
    try {
      const res = await fetch(`/api/affiliate/products/${productId}/sources/${sourceId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchProduct();
      }
    } catch {
      // ignore
    }
  };

  const handleReprocessSource = async (sourceId: string) => {
    setProcessingSourceId(sourceId);
    try {
      const res = await fetch(`/api/affiliate/products/${productId}/sources/${sourceId}/reprocess`, {
        method: "POST",
      });
      if (res.ok) {
        fetchProduct();
      }
    } catch {
      // ignore
    } finally {
      setProcessingSourceId(null);
    }
  };

  const handleDeleteProduct = async () => {
    if (!confirm("Deseja realmente excluir este produto e todas as suas ofertas?")) return;
    try {
      const res = await fetch(`/api/affiliate/products/${productId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/affiliates/products");
      }
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">Carregando produto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Produto não encontrado</h2>
        <Link href="/affiliates/products" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          Voltar ao Catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/affiliates/products"
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{product.name}</h1>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  status === "ACTIVE"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                    : status === "ARCHIVED"
                    ? "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300"
                }`}
              >
                {status === "ACTIVE" ? "Ativo" : status === "ARCHIVED" ? "Arquivado" : "Rascunho"}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Slug: <code className="font-mono">{product.slug}</code> • Atualizado em{" "}
              {new Date(product.updatedAt).toLocaleString("pt-BR")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshAll}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
            Atualizar Ofertas
          </button>
          <button
            onClick={handleSaveProduct}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          {errorMsg}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab("general")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "general"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Package className="w-4 h-4" />
          Produto & Editorial
        </button>
        <button
          onClick={() => setActiveTab("specs")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "specs"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Layers className="w-4 h-4" />
          Especificações ({specs.length})
        </button>
        <button
          onClick={() => setActiveTab("offers")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "offers"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Tag className="w-4 h-4" />
          Ofertas ({product.offers.length})
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "reviews"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Star className="w-4 h-4" />
          Opiniões de Compradores ({product.reviewSamples?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("articles")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "articles"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4" />
          Conteúdos & Pesquisa ({referenceSources.length})
        </button>
      </div>

      {/* Tab 1: General & Editorial */}
      {activeTab === "general" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-5 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome do Produto
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Marca
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Ex: Apple, Sony, Samsung"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Categoria
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
                >
                  <option value="">Sem Categoria</option>
                  {Array.isArray(categories) &&
                    categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
                {product.marketplaceCategoryName && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-blue-500" />
                    Categoria de Origem (ML): <strong>{product.marketplaceCategoryName}</strong>
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Descrição Editorial / Sinopse do Produto
                </label>
                {product.sourceDescription && (
                  <button
                    type="button"
                    onClick={() => setDescription(product.sourceDescription || "")}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Copiar descrição de origem
                  </button>
                )}
              </div>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Insira detalhes contextuais, veredito e destaques do produto..."
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
              {product.sourceDescription && (
                <div className="p-3 mt-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Descrição de Origem no Marketplace:
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 line-clamp-3">
                    {product.sourceDescription}
                  </p>
                </div>
              )}
            </div>

            {/* Pros and Cons Editor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Pontos Positivos (Prós)
                  </label>
                  <button
                    type="button"
                    onClick={() => setPros([...pros, ""])}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Adicionar
                  </button>
                </div>
                {pros.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={p}
                      onChange={(e) => {
                        const copy = [...pros];
                        copy[idx] = e.target.value;
                        setPros(copy);
                      }}
                      placeholder="Ex: Excelente custo-benefício"
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setPros(pros.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                    Pontos Negativos (Contras)
                  </label>
                  <button
                    type="button"
                    onClick={() => setCons([...cons, ""])}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Adicionar
                  </button>
                </div>
                {cons.map((c, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={c}
                      onChange={(e) => {
                        const copy = [...cons];
                        copy[idx] = e.target.value;
                        setCons(copy);
                      }}
                      placeholder="Ex: Bateria com duração moderada"
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setCons(cons.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Settings (Image, Rating, Status) */}
          <div className="space-y-5">
            {/* Image Preview & URL */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
              <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Imagem do Produto
              </h3>
              <div className="h-44 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center p-3">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={name}
                    className="max-h-full max-w-full object-contain rounded"
                  />
                ) : (
                  <Package className="w-10 h-10 text-slate-300" />
                )}
              </div>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
              />
            </div>

            {/* Status & Rating */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status do Catálogo
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "ACTIVE" | "ARCHIVED" | "DRAFT")}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                >
                  <option value="ACTIVE">Ativo (visível para artigos e reviews)</option>
                  <option value="DRAFT">Rascunho</option>
                  <option value="ARCHIVED">Arquivado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  Avaliação / Nota (0 a 5)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={rating}
                  onChange={(e) => setRating(e.target.value === "" ? "" : parseFloat(e.target.value))}
                  placeholder="Ex: 4.8"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Custom Slug (Opcional)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={handleDeleteProduct}
                  className="w-full py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                >
                  Excluir Produto Permanentemente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Specs */}
      {activeTab === "specs" && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Ficha Técnica & Especificações
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Adicione atributos chave-valor para comparações, tabelas técnicas e reviews.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {product.sourceSpecs && Object.keys(product.sourceSpecs).length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const imported = Object.entries(product.sourceSpecs || {}).map(([key, value]) => ({
                      key,
                      value: String(value),
                    }));
                    setSpecs(imported);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 rounded-lg transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" /> Copiar Especificações de Origem ({Object.keys(product.sourceSpecs).length})
                </button>
              )}
              <button
                onClick={() => setSpecs([...specs, { key: "", value: "" }])}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Atributo
              </button>
            </div>
          </div>

          {product.sourceSpecs && Object.keys(product.sourceSpecs).length > 0 && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  Especificações de Origem (Snapshot do Marketplace):
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-36 overflow-y-auto">
                {Object.entries(product.sourceSpecs).map(([key, val]) => (
                  <div key={key} className="bg-white dark:bg-slate-800 p-1.5 rounded border border-slate-100 dark:border-slate-700 flex justify-between">
                    <span className="text-slate-500 truncate mr-1">{key}:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {specs.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
              <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Nenhuma especificação cadastrada.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {specs.map((s, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={s.key}
                    onChange={(e) => {
                      const copy = [...specs];
                      copy[idx].key = e.target.value;
                      setSpecs(copy);
                    }}
                    placeholder="Nome (Ex: Memória RAM)"
                    className="w-1/3 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white font-medium"
                  />
                  <input
                    type="text"
                    value={s.value}
                    onChange={(e) => {
                      const copy = [...specs];
                      copy[idx].value = e.target.value;
                      setSpecs(copy);
                    }}
                    placeholder="Valor (Ex: 16GB DDR5)"
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                  <button
                    onClick={() => setSpecs(specs.filter((_, i) => i !== idx))}
                    className="p-2 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Offers */}
      {activeTab === "offers" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Ofertas & Links de Afiliados
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gerencie links de parceiros (Mercado Livre, etc.), rastreamento e histórico de preços.
              </p>
            </div>
            <button
              onClick={() => setShowAddOffer(!showAddOffer)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Nova Oferta
            </button>
          </div>

          {/* Add Offer Form */}
          {showAddOffer && (
            <form
              onSubmit={handleAddOffer}
              className="p-5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl space-y-4"
            >
              <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300">
                Cadastrar Nova Oferta / Link de Afiliado
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    URL de Afiliado (Mercado Livre) *
                  </label>
                  <input
                    type="url"
                    required
                    value={newOfferUrl}
                    onChange={(e) => setNewOfferUrl(e.target.value)}
                    placeholder="https://produto.mercadolivre.com.br/MLB-..."
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vendedor / Seller (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newOfferSeller}
                    onChange={(e) => setNewOfferSeller(e.target.value)}
                    placeholder="Ex: Loja Oficial"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Preço Inicial (R$) (Opcional se auto-fetch ativo)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newOfferPrice}
                    onChange={(e) => setNewOfferPrice(e.target.value)}
                    placeholder="Ex: 1299.90"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tag / Tracking Label (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newOfferTracking}
                    onChange={(e) => setNewOfferTracking(e.target.value)}
                    placeholder="Ex: promo-black-friday"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    id="autoFetch"
                    checked={newOfferAutoFetch}
                    onChange={(e) => setNewOfferAutoFetch(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="autoFetch" className="text-xs text-slate-700 dark:text-slate-300">
                    Buscar preço e metadados automaticamente no parceiro
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddOffer(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addingOffer}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  {addingOffer ? "Adicionando..." : "Salvar Oferta"}
                </button>
              </div>
            </form>
          )}

          {/* Offers Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Programa</th>
                  <th className="px-4 py-3">Vendedor</th>
                  <th className="px-4 py-3">Preço Atual</th>
                  <th className="px-4 py-3">Tracking</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Última Consulta</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {product.offers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {offer.affiliateProgram?.name || "Mercado Livre"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {offer.seller || "--"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {offer.price
                          ? new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: offer.currency,
                            }).format(offer.price)
                          : "--"}
                      </div>
                      {offer.oldPrice && offer.oldPrice > (offer.price || 0) && (
                        <div className="text-[10px] line-through text-slate-400">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: offer.currency,
                          }).format(offer.oldPrice)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                      {offer.trackingLabel || "--"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          offer.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                            : offer.status === "OUT_OF_STOCK"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {offer.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {offer.metadataLastFetchedAt
                        ? new Date(offer.metadataLastFetchedAt).toLocaleDateString("pt-BR")
                        : "Nunca"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleRefreshSingleOffer(offer.id)}
                          title="Atualizar preço agora"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={offer.affiliateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Abrir link"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDeleteOffer(offer.id)}
                          title="Excluir oferta"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Reviews (Qualitative Samples) */}
      {activeTab === "reviews" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/80 pb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  Amostras Qualitativas de Opiniões de Consumidores
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Amostra de até 5 opiniões públicas reais de compradores no marketplace utilizadas pelo motor de IA para percepção de uso.
                </p>
              </div>
              <div className="text-xs px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-lg">
                ⚠️ Amostra qualitativa (não representa métrica estatística)
              </div>
            </div>

            {(!product.reviewSamples || product.reviewSamples.length === 0) ? (
              <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                <Star className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">
                  Nenhuma avaliação pública importada ainda para este produto. Ao atualizar ou importar o produto via link de afiliado, até 5 amostras serão capturadas automaticamente.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {product.reviewSamples.map((rev, idx) => (
                  <div
                    key={rev.id || idx}
                    className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {rev.rating !== null && rev.rating !== undefined && (
                          <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            {rev.rating.toFixed(1)}
                          </div>
                        )}
                        {rev.title && (
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">
                            {rev.title}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {rev.authorName ? `Comprador: ${rev.authorName}` : "Comprador anônimo"} •{" "}
                        {new Date(rev.capturedAt).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                      &ldquo;{rev.text}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Articles & Reference Sources */}
      {activeTab === "articles" && (
        <div className="space-y-6">
          {/* Reference Sources Section */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/80 pb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                  Fontes de Pesquisa & Artigos de Referência ({referenceSources.length})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Adicione URLs de reviews especializados, fóruns ou comparativos. O sistema extrai o conteúdo e gera um resumo por IA para enriquecer o grounding.
                </p>
              </div>
            </div>

            {/* Add Source Form */}
            <form onSubmit={handleAddSource} className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                required
                value={newSourceUrl}
                onChange={(e) => setNewSourceUrl(e.target.value)}
                placeholder="https://exemplo.com/analise-completa-produto..."
                className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
              <button
                type="submit"
                disabled={addingSource}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                {addingSource ? "Adicionando..." : "Cadastrar Fonte"}
              </button>
            </form>

            {/* List of Sources */}
            {referenceSources.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                <ExternalLink className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">
                  Nenhuma fonte externa cadastrada ainda. Cadastre URLs de reviews de portais de tecnologia para aprofundar o conteúdo da IA.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {referenceSources.map((source) => (
                  <div
                    key={source.id}
                    className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700/80 space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            source.status === "READY"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                              : source.status === "PROCESSING"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 animate-pulse"
                              : source.status === "FAILED"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                          }`}
                        >
                          {source.status === "READY"
                            ? "Pronto (Resumido)"
                            : source.status === "PROCESSING"
                            ? "Processando IA..."
                            : source.status === "FAILED"
                            ? "Falha"
                            : "Pendente"}
                        </span>
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                          {source.title || "Fonte Externa"}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleReprocessSource(source.id)}
                          disabled={processingSourceId === source.id}
                          title="Reprocessar resumo por IA"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded transition-colors"
                        >
                          <RefreshCw
                            className={`w-3 h-3 ${processingSourceId === source.id ? "animate-spin text-blue-600" : ""}`}
                          />
                          Reprocessar
                        </button>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Abrir URL original"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteSource(source.id)}
                          title="Excluir fonte de pesquisa"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      {source.url}
                    </div>

                    {source.summary && (
                      <div className="p-3 bg-white dark:bg-slate-800/80 rounded border border-slate-100 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        <span className="font-semibold text-blue-600 dark:text-blue-400 mr-1">
                          Resumo da IA:
                        </span>
                        {source.summary}
                      </div>
                    )}

                    {source.error && (
                      <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                        <strong>Erro:</strong> {source.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Related Articles Section */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Conteúdos & Artigos Publicados Vinculados
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Artigos gerados no portal que incluem este produto no card de recomendação ou comparativo.
              </p>
            </div>
            <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">
                Nenhum artigo vinculado ainda. Utilize a Fase 12 (Affiliate Content Engine) para gerar reviews.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
