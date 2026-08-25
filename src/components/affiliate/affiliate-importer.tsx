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
} from "lucide-react";
import { PreviewImportResult } from "@/lib/affiliate/service";

interface AffiliateImporterProps {
  onSuccess?: (product: unknown) => void;
}

export function AffiliateImporter({ onSuccess }: AffiliateImporterProps) {
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Preview State
  const [previewData, setPreviewData] = useState<PreviewImportResult | null>(null);

  // Editable Form Fields
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [seller, setSeller] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState<string>("");
  const [oldPrice, setOldPrice] = useState<string>("");
  const [overwriteExisting, setOverwriteExisting] = useState(false);

  const handleFetchPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!affiliateUrl.trim()) {
      setErrorMessage("Por favor, informe um link de afiliado válido.");
      return;
    }

    setIsLoadingPreview(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setPreviewData(null);

    try {
      const res = await fetch("/api/affiliate/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliateUrl: affiliateUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao consultar informações do produto.");
      }

      setPreviewData(data);
      const meta = data.metadata;
      setName(meta.name || "");
      setBrand(meta.brand || "");
      setSeller(meta.seller || "");
      setDescription(meta.description || "");
      setImageUrl(meta.imageUrl || "");
      setPrice(meta.price !== undefined && meta.price !== null ? String(meta.price) : "");
      setOldPrice(meta.oldPrice !== undefined && meta.oldPrice !== null ? String(meta.oldPrice) : "");
      setOverwriteExisting(data.isDuplicate);
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsLoadingPreview(false);
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

    try {
      const res = await fetch("/api/affiliate/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliateUrl: previewData.metadata.affiliateUrl,
          resolvedUrl: previewData.metadata.resolvedUrl,
          canonicalUrl: previewData.metadata.canonicalUrl,
          externalProductId: previewData.metadata.externalProductId,
          name: name.trim(),
          brand: brand.trim() || undefined,
          description: description.trim() || undefined,
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
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar produto no catálogo.");
      }

      setSuccessMessage(`Produto "${data.product.name}" salvo com sucesso no catálogo!`);
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
              Cole o link de afiliado gerado no Mercado Livre (ex: meli.la, mercadolivre.com/sec/...)
            </p>
          </div>
        </div>

        <form onSubmit={handleFetchPreview} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            <div className="relative flex-1">
              <input
                type="url"
                value={affiliateUrl}
                onChange={(e) => setAffiliateUrl(e.target.value)}
                placeholder="https://mercadolivre.com/sec/..."
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
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-start space-x-3 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
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

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Descrição do Produto
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição do item..."
                    className="w-full px-3 py-2 bg-background border rounded-lg text-xs"
                  />
                </div>

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
