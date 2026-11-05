"use client";

import React, { useState } from "react";
import {
  Link2,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Tag,
  Store,
  DollarSign,
  Package,
  Star,
  Layers,
  FileText,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import type { PreviewImportResult } from "@/lib/affiliate/service";

interface AffiliateImporterProps {
  onSuccess?: (product: unknown) => void;
}

export function AffiliateImporter({ onSuccess }: AffiliateImporterProps) {
  const [providerCode, setProviderCode] = useState("MERCADO_LIVRE");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sales Copy State
  const [autoSalesCopy, setAutoSalesCopy] = useState(true);
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);

  // Preview State
  const [previewData, setPreviewData] = useState<PreviewImportResult | null>(null);

  // Editable Form Fields
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [seller, setSeller] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [pros, setPros] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState<string>("");
  const [oldPrice, setOldPrice] = useState<string>("");
  const [overwriteExisting, setOverwriteExisting] = useState(false);

  // WooCommerce Publishing State
  const [wordpressSites, setWordpressSites] = useState<Array<{ id: string; name: string; url: string; isDefault: boolean }>>([]);
  const [publishToWc, setPublishToWc] = useState(false);
  const [selectedWpSiteId, setSelectedWpSiteId] = useState("");
  const [wcProductType, setWcProductType] = useState<"external" | "simple">("external");
  const [wcStatus, setWcStatus] = useState<"publish" | "draft">("publish");
  const [wcButtonText, setWcButtonText] = useState("");
  const [publishedWcUrl, setPublishedWcUrl] = useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/wordpress/sites")
      .then((res) => (res.ok ? res.json() : { sites: [] }))
      .then((data) => {
        const sites = Array.isArray(data) ? data : Array.isArray(data?.sites) ? data.sites : [];
        setWordpressSites(sites);
        const def = sites.find((s: { isDefault: boolean }) => s.isDefault) || sites[0];
        if (def) setSelectedWpSiteId(def.id);
      })
      .catch(() => {});
  }, []);

  const handleFetchPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!affiliateUrl.trim()) {
      setErrorMessage("Por favor, informe um link de afiliado válido.");
      return;
    }

    setIsLoadingPreview(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setPublishedWcUrl(null);
    setPreviewData(null);

    try {
      const res = await fetch("/api/affiliate/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliateUrl: affiliateUrl.trim(),
          providerCode,
          generateSalesCopy: autoSalesCopy,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao consultar informações do produto.");
      }

      if (data.metadata?.status === "FAILED") throw new Error(data.metadata.warnings.join(" "));
      setPreviewData(data);
      const meta = data.metadata;
      const copy = data.salesCopy;

      setName(meta.name || "");
      setBrand(meta.brand || "");
      setSeller(meta.seller || "");
      setDescription(copy?.description || meta.description || "");
      setShortDescription(copy?.shortDescription || meta.shortDescription || "");
      setPros(
        Array.isArray(copy?.pros) && copy.pros.length > 0
          ? copy.pros
          : Array.isArray(meta.pros)
          ? meta.pros
          : []
      );
      setImageUrl(meta.imageUrl || "");
      setPrice(meta.price !== undefined && meta.price !== null ? String(meta.price) : "");
      setOldPrice(meta.oldPrice !== undefined && meta.oldPrice !== null ? String(meta.oldPrice) : "");
      setOverwriteExisting(data.isDuplicate);
      if (meta.providerCode === "SHOPEE") {
        setWcButtonText("Compre na Shopee");
      } else {
        setWcButtonText("Compre no Mercado Livre");
      }
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleGenerateSalesCopy = async () => {
    if (!previewData) return;
    setIsGeneratingCopy(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/affiliate/import/sales-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          brand: brand.trim() || undefined,
          seller: seller.trim() || undefined,
          price: price ? parseFloat(price) : undefined,
          sourceDescription: previewData.metadata.sourceDescription || previewData.metadata.description || "",
          specs: previewData.metadata.specs || previewData.metadata.sourceSpecs || {},
          providerCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar copy de vendas com IA.");

      if (data.shortDescription) setShortDescription(data.shortDescription);
      if (data.description) setDescription(data.description);
      if (Array.isArray(data.pros) && data.pros.length > 0) setPros(data.pros);
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  const handleRestoreSourceDescription = () => {
    if (previewData?.metadata?.sourceDescription || previewData?.metadata?.description) {
      setDescription(previewData.metadata.sourceDescription || previewData.metadata.description || "");
    }
  };

  const handleConfirmSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewData) return;

    if (!name.trim()) {
      setErrorMessage("O nome do produto é obrigatório para o catálogo.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setPublishedWcUrl(null);

    try {
      const res = await fetch("/api/affiliate/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerCode,
          affiliateUrl: previewData.metadata.affiliateUrl,
          resolvedUrl: previewData.metadata.resolvedUrl,
          canonicalUrl: previewData.metadata.canonicalUrl,
          externalProductId: previewData.metadata.externalProductId,
          name: name.trim(),
          brand: brand.trim() || undefined,
          description: description.trim() || undefined,
          shortDescription: shortDescription.trim() || undefined,
          pros: pros.length > 0 ? pros : undefined,
          sourceDescription: previewData.metadata.sourceDescription || description.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
          images: previewData.metadata.images || undefined,
          specs: previewData.metadata.specs || previewData.metadata.sourceSpecs || undefined,
          sourceSpecs: previewData.metadata.sourceSpecs || previewData.metadata.specs || undefined,
          marketplaceCategoryId: previewData.metadata.marketplaceCategoryId || undefined,
          marketplaceCategoryName: previewData.metadata.marketplaceCategoryName || undefined,
          sourceRating: previewData.metadata.sourceRating !== undefined ? previewData.metadata.sourceRating : undefined,
          sourceReviewCount: previewData.metadata.sourceReviewCount !== undefined ? previewData.metadata.sourceReviewCount : undefined,
          reviewSamples: previewData.metadata.reviewSamples || undefined,
          seller: seller.trim() || undefined,
          price: price ? parseFloat(price) : undefined,
          oldPrice: oldPrice ? parseFloat(oldPrice) : undefined,
          currency: previewData.metadata.currency || "BRL",
          metadataSource: previewData.metadata.metadataSource,
          overwriteExistingProductId:
            overwriteExisting && previewData.existingProduct ? previewData.existingProduct.id : undefined,
          publishToWooCommerce: publishToWc
            ? {
                enabled: true,
                wordpressSiteId: selectedWpSiteId || undefined,
                productType: wcProductType,
                status: wcStatus,
                buttonText: wcButtonText.trim() || undefined,
              }
            : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar produto no catálogo.");
      }

      let successMsg = `Produto "${data.product.name}" salvo com sucesso no catálogo!`;
      if (data.publishedWooCommerceUrl) {
        setPublishedWcUrl(data.publishedWooCommerceUrl);
        successMsg += ` E publicado no WooCommerce com sucesso!`;
      }
      setSuccessMessage(successMsg);
      setPreviewData(null);
      setAffiliateUrl("");
      if (onSuccess) onSuccess(data.product);
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* URL Input Box */}
      <div className="bg-card border rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Importar Produto de Afiliado</h2>
            <p className="text-sm text-muted-foreground">
              Cole seu link de afiliado. Vamos buscar os dados disponíveis para você revisar.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <label className="block text-sm font-medium">Marketplace
            <select aria-label="Marketplace" value={providerCode} disabled={isLoadingPreview || isSaving} onChange={e => { setProviderCode(e.target.value); setPreviewData(null); setErrorMessage(null); }} className="ml-3 rounded-lg border bg-background p-2">
              <option value="MERCADO_LIVRE">Mercado Livre</option><option value="SHOPEE">Shopee</option>
            </select>
          </label>

          <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground bg-primary/5 hover:bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg transition-colors">
            <input
              type="checkbox"
              checked={autoSalesCopy}
              onChange={(e) => setAutoSalesCopy(e.target.checked)}
              disabled={isLoadingPreview || isSaving}
              className="rounded text-primary focus:ring-primary"
            />
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Criar descrição focada em vendas com IA (AIDA)</span>
          </label>
        </div>
        <form onSubmit={handleFetchPreview} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            <div className="relative flex-1">
              <input
                type="url"
                value={affiliateUrl}
                onChange={(e) => { setAffiliateUrl(e.target.value); setPreviewData(null); }}
                placeholder={providerCode === "SHOPEE" ? "https://s.shopee.com.br/..." : "https://mercadolivre.com/sec/..."}
                className="w-full h-full px-4 py-2.5 bg-background border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                disabled={isLoadingPreview || isSaving}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoadingPreview || isSaving || !affiliateUrl.trim()}
              className="inline-flex items-center justify-center h-full whitespace-nowrap px-6 py-2.5 bg-primary text-primary-foreground font-medium text-sm rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 space-x-2 shrink-0"
            >
              {isLoadingPreview ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Extraindo dados...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Buscar Dados</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex items-start space-x-3 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
          {publishedWcUrl && (
            <a
              href={publishedWcUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shrink-0"
            >
              <span>Ver Produto na Loja</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Preview & Review Card */}
      {previewData && (
        <div className="bg-card border rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b">
            <div className="flex items-center space-x-3">
              <Package className="w-5 h-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">Revisão de Metadados do Produto</h3>
            </div>
            <div className="flex items-center space-x-2">
              {previewData.metadata.externalProductId && (
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground border">
                  ID: {previewData.metadata.externalProductId}
                </span>
              )}
              {previewData.metadata.marketplaceCategoryName && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
                  <Layers className="w-3 h-3" />
                  <span>{previewData.metadata.marketplaceCategoryName}</span>
                </span>
              )}
              {previewData.metadata.sourceRating !== undefined && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span>
                    {previewData.metadata.sourceRating.toFixed(1)}
                    {previewData.metadata.sourceReviewCount !== undefined ? ` (${previewData.metadata.sourceReviewCount})` : ""}
                  </span>
                </span>
              )}
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  previewData.metadata.status === "COMPLETE"
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                    : previewData.metadata.status === "PARTIAL"
                    ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                    : "bg-destructive/10 text-destructive border border-destructive/20"
                }`}
              >
                {previewData.metadata.status === "COMPLETE"
                  ? "Metadados Completos"
                  : previewData.metadata.status === "PARTIAL"
                  ? "Metadados Parciais"
                  : "Extração Incompleta"}
              </span>
            </div>
          </div>

          {/* Duplicate Alert */}
          {previewData.isDuplicate && previewData.existingProduct && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 rounded-xl text-sm space-y-2">
              <div className="flex items-center space-x-2 font-medium">
                <AlertTriangle className="w-4 h-4" />
                <span>Produto já cadastrado no catálogo</span>
              </div>
              <p>
                Este item coincide com <strong>{previewData.existingProduct.name}</strong>.
              </p>
              <label className="flex items-center space-x-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={overwriteExisting}
                  onChange={(e) => setOverwriteExisting(e.target.checked)}
                  className="rounded text-primary focus:ring-primary"
                />
                <span className="font-medium">Atualizar produto existente em vez de criar um novo</span>
              </label>
            </div>
          )}

          {/* Warnings List */}
          {previewData.metadata.warnings.length > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-1">
              <span className="font-semibold text-foreground">Avisos da importação:</span>
              <ul className="list-disc pl-4 space-y-0.5">
                {previewData.metadata.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Editable Details Form */}
          <form onSubmit={handleConfirmSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Image Preview & URL */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Imagem do Produto
                </label>
                <div className="aspect-square bg-muted/30 border rounded-lg flex items-center justify-center overflow-hidden relative">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt={name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <span className="text-xs text-muted-foreground">Sem imagem</span>
                  )}
                </div>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="URL da imagem..."
                  className="w-full px-3 py-1.5 bg-background border rounded-md text-xs"
                />
              </div>

              {/* Product Info */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-background border rounded-lg text-sm font-medium text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1 flex items-center space-x-1">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Marca</span>
                    </label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="Ex: Samsung, Sony"
                      className="w-full px-3 py-1.5 bg-background border rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1 flex items-center space-x-1">
                      <Store className="w-3.5 h-3.5" />
                      <span>Vendedor / Loja</span>
                    </label>
                    <input
                      type="text"
                      value={seller}
                      onChange={(e) => setSeller(e.target.value)}
                      placeholder="Ex: Loja Oficial"
                      className="w-full px-3 py-1.5 bg-background border rounded-md text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1 flex items-center space-x-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Preço Atual (R$)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 bg-background border rounded-md text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Preço Anterior (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={oldPrice}
                      onChange={(e) => setOldPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 bg-background border rounded-md text-sm"
                    />
                  </div>
                </div>

                {/* Short Description (Hook / Resumo de Vendas) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Descrição Curta / Gancho de Vendas (AIDA)
                    </label>
                    <span className="text-[11px] text-muted-foreground">Exibida no topo da página do WooCommerce</span>
                  </div>
                  <textarea
                    rows={2}
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Frase de impacto destacando o benefício principal e a oferta..."
                    className="w-full px-3 py-2 bg-background border rounded-lg text-xs focus:ring-2 focus:ring-primary focus:outline-hidden"
                  />
                </div>

                {/* Main Sales Description */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Descrição Completa do Produto
                    </label>
                    <div className="flex items-center gap-2">
                      {previewData.metadata.sourceDescription && (
                        <button
                          type="button"
                          onClick={handleRestoreSourceDescription}
                          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                          title="Restaurar o texto bruto original do marketplace"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restaurar Original</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleGenerateSalesCopy}
                        disabled={isGeneratingCopy}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                      >
                        {isGeneratingCopy ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Gerando Copy...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Reescrever com IA Vendedora</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição detalhada do produto, vantagens e chamada para ação..."
                    className="w-full px-3 py-2 bg-background border rounded-lg text-xs focus:ring-2 focus:ring-primary focus:outline-hidden font-mono text-[11px]"
                  />
                </div>

                {/* Pros / Benefícios de Conversão */}
                {pros.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-xs font-semibold text-muted-foreground">
                      Destaques & Benefícios de Conversão ({pros.length})
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {pros.map((pro, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{pro}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(previewData.metadata.sourceSpecs || previewData.metadata.specs) && (
                  <div className="space-y-1.5 pt-2 border-t">
                    <label className="block text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      <span>Especificações Técnicas Importadas ({Object.keys(previewData.metadata.sourceSpecs || previewData.metadata.specs || {}).length})</span>
                    </label>
                    <div className="max-h-40 overflow-y-auto rounded-lg border bg-muted/20 p-2.5 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(previewData.metadata.sourceSpecs || previewData.metadata.specs || {}).map(
                          ([key, value]) => (
                            <div key={key} className="flex justify-between py-0.5 border-b border-muted last:border-0">
                              <span className="font-medium text-muted-foreground truncate mr-2">{key}:</span>
                              <span className="text-foreground text-right truncate">{value}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* WooCommerce Publishing Section */}
            <div className="p-4 bg-muted/20 border rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Publicação no WordPress / WooCommerce</span>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={publishToWc}
                    onChange={(e) => setPublishToWc(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-medium text-foreground">Publicar no WooCommerce ao salvar</span>
                </label>
              </div>

              {publishToWc && (
                <div className="pt-2 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-muted-foreground mb-1 font-medium">Site WordPress</label>
                    <select
                      value={selectedWpSiteId}
                      onChange={(e) => setSelectedWpSiteId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-background border rounded-md"
                    >
                      {wordpressSites.length === 0 ? (
                        <option value="">Nenhum site configurado</option>
                      ) : (
                        wordpressSites.map((site) => (
                          <option key={site.id} value={site.id}>
                            {site.name} {site.isDefault ? "(Padrão)" : ""}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-1 font-medium">Tipo de Produto</label>
                    <select
                      value={wcProductType}
                      onChange={(e) => setWcProductType(e.target.value as "external" | "simple")}
                      className="w-full px-2.5 py-1.5 bg-background border rounded-md"
                    >
                      <option value="external">Externo / Afiliado (Recomendado)</option>
                      <option value="simple">Simples (Loja Local)</option>
                    </select>
                  </div>

                  {wcProductType === "external" && (
                    <div>
                      <label className="block text-muted-foreground mb-1 font-medium">Texto do Botão de Compra</label>
                      <input
                        type="text"
                        value={wcButtonText}
                        onChange={(e) => setWcButtonText(e.target.value)}
                        placeholder="Ex: Compre no Mercado Livre"
                        className="w-full px-2.5 py-1.5 bg-background border rounded-md"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-muted-foreground mb-1 font-medium">Status do Produto</label>
                    <select
                      value={wcStatus}
                      onChange={(e) => setWcStatus(e.target.value as "publish" | "draft")}
                      className="w-full px-2.5 py-1.5 bg-background border rounded-md"
                    >
                      <option value="publish">Publicado Imediatamente</option>
                      <option value="draft">Rascunho (Revisar no WP)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setPreviewData(null)}
                className="px-4 py-2 border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving || !name.trim()}
                className="inline-flex items-center px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50 space-x-2"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar e Salvar no Catálogo</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
