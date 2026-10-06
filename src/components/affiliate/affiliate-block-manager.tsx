"use client";

import { useState, useEffect, useCallback, useMemo, useId } from "react";
import {
  Sparkles,
  Search,
  Copy,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
} from "lucide-react";
import {
  AFFILIATE_LAYOUTS,
  AffiliateLayout,
  AffiliateProductReference,
  AffiliateGroupData,
} from "@/lib/affiliate/block-contract";
import {
  blockMarker,
  parseBlockOccurrences,
  removeBlockOccurrence,
  duplicateBlockOccurrence,
  updateBlockOccurrence,
  ParsedBlockOccurrence,
} from "@/lib/affiliate/editor-document";
import { splitHtmlAtCursor } from "@/lib/affiliate/html-position";
import { renderProductGroup, RenderProduct } from "@/lib/affiliate/render-document";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export interface AffiliateBlockManagerProps {
  content: string;
  onChangeContent: (content: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  articleProducts?: Array<{
    productId: string;
    product?: {
      id: string;
      name: string;
      brand?: string | null;
      imageUrl?: string | null;
      description?: string | null;
      offers?: Array<{
        id: string;
        price: number | null;
        currency: string;
        seller: string | null;
        affiliateUrl: string;
        status: string;
      }>;
    };
  }>;
}

const LAYOUT_INFO: Record<
  AffiliateLayout,
  { label: string; description: string; icon: string }
> = {
  IMAGE_CARD: {
    label: "Card com foto",
    description: "Imagem original, título, texto disponível e botão de oferta.",
    icon: "🖼️",
  },
  TEXT_CARD: {
    label: "Card de texto",
    description: "Formato editorial compacto sem imagem, com descrição e botão.",
    icon: "📄",
  },
  GRID: {
    label: "Grade",
    description: "Exibição lado a lado com imagem, título e botão para vários produtos.",
    icon: "▦",
  },
  CAROUSEL: {
    label: "Carrossel",
    description: "Rolagem horizontal com foto, título e botão, navegável por toque ou teclado.",
    icon: "↔",
  },
  BUTTON: {
    label: "Botão",
    description: "Botão de chamada direto com nome do produto menor logo abaixo.",
    icon: "🔘",
  },
};

interface ApiProductOffer {
  id: string;
  affiliateUrl: string;
  status?: string;
  price?: number | null;
  currency?: string;
  seller?: string | null;
}

interface ApiProductItem {
  id: string;
  name: string;
  brand?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  rating?: number | null;
  specs?: unknown;
  pros?: string[];
  cons?: string[];
  offers?: ApiProductOffer[];
}

export function AffiliateBlockManager({
  content,
  onChangeContent,
  textareaRef,
  articleProducts,
}: AffiliateBlockManagerProps) {
  // Fail-closed initial state for entitlement
  const [hasEntitlement, setHasEntitlement] = useState(false);
  const [cursorError, setCursorError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingBlock, setEditingBlock] = useState<ParsedBlockOccurrence | null>(null);
  const [capturedSnapshot, setCapturedSnapshot] = useState<{
    content: string;
    cursor: number;
  }>({ content: "", cursor: 0 });

  // Modal Form State
  const [selectedLayout, setSelectedLayout] = useState<AffiliateLayout>("IMAGE_CARD");
  const [selectedProducts, setSelectedProducts] = useState<RenderProduct[]>([]);
  const [ctaText, setCtaText] = useState("Conferir oferta");
  const [modalError, setModalError] = useState<string | null>(null);

  // Catalog / Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogTotalPages, setCatalogTotalPages] = useState(1);
  const [catalogItems, setCatalogItems] = useState<RenderProduct[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  // Derived cache from articleProducts
  const articleProductsCache = useMemo(() => {
    const map: Record<string, RenderProduct> = {};
    if (articleProducts && articleProducts.length > 0) {
      for (const item of articleProducts) {
        if (item.product && item.product.id) {
          map[item.product.id] = {
            id: item.product.id,
            name: item.product.name,
            brand: item.product.brand || null,
            description: item.product.description || null,
            imageUrl: item.product.imageUrl || null,
            offers: item.product.offers || [],
          };
        }
      }
    }
    return map;
  }, [articleProducts]);

  // Fetched products cache
  const [fetchedCache, setFetchedCache] = useState<Record<string, RenderProduct>>({});

  // Combined catalog cache
  const catalogCache = useMemo(
    () => ({ ...articleProductsCache, ...fetchedCache }),
    [articleProductsCache, fetchedCache]
  );

  const modalTitleId = useId();

  // Check entitlement on mount
  useEffect(() => {
    let active = true;
    async function checkEntitlement() {
      try {
        const res = await fetch("/api/billing/subscription");
        if (res.ok && active) {
          const data = await res.json();
          const hasModule = Array.isArray(data.features) && data.features.includes("affiliate_module");
          setHasEntitlement(Boolean(hasModule));
        }
      } catch {
        if (active) setHasEntitlement(false);
      }
    }
    checkEntitlement();
    return () => {
      active = false;
    };
  }, []);

  // Fetch catalog products for search/modal
  const fetchProducts = useCallback(async (search: string, page: number) => {
    setIsLoadingCatalog(true);
    try {
      const q = new URLSearchParams({
        search,
        page: String(page),
        limit: "6",
        status: "ACTIVE",
      });
      const res = await fetch(`/api/affiliate/products?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const items: RenderProduct[] = (data.items || []).map((p: ApiProductItem) => ({
          id: p.id,
          name: p.name,
          brand: p.brand || null,
          description: p.description || null,
          imageUrl: p.imageUrl || null,
          rating: p.rating || null,
          specs: p.specs || undefined,
          pros: p.pros || [],
          cons: p.cons || [],
          offers: (p.offers || []).map((o: ApiProductOffer) => ({
            id: o.id,
            affiliateUrl: o.affiliateUrl,
            status: o.status || "ACTIVE",
            price: o.price != null ? Number(o.price) : null,
            currency: o.currency || "BRL",
            seller: o.seller || null,
          })),
        }));
        setCatalogItems(items);
        setCatalogTotalPages(data.totalPages || 1);
        setFetchedCache((prev) => {
          const next = { ...prev };
          items.forEach((item) => {
            next[item.id] = item;
          });
          return next;
        });
      }
    } catch {
      // keep existing items on error
    } finally {
      setIsLoadingCatalog(false);
    }
  }, []);

  // Ensure all products referenced in content are in catalogCache
  useEffect(() => {
    const occurrences = parseBlockOccurrences(content);
    const missingIds: string[] = [];
    for (const occ of occurrences) {
      if (occ.block.type === "PRODUCT_GROUP") {
        for (const p of occ.block.data.products) {
          if (!catalogCache[p.productId] && !missingIds.includes(p.productId)) {
            missingIds.push(p.productId);
          }
        }
      }
    }
    if (missingIds.length > 0) {
      fetch("/api/affiliate/products?limit=100")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data.items)) {
            setFetchedCache((prev) => {
              const next = { ...prev };
              data.items.forEach((p: ApiProductItem) => {
                next[p.id] = {
                  id: p.id,
                  name: p.name,
                  brand: p.brand || null,
                  description: p.description || null,
                  imageUrl: p.imageUrl || null,
                  offers: (p.offers || []).map((o: ApiProductOffer) => ({
                    id: o.id,
                    affiliateUrl: o.affiliateUrl,
                    status: o.status || "ACTIVE",
                    price: o.price != null ? Number(o.price) : null,
                    currency: o.currency || "BRL",
                    seller: o.seller || null,
                  })),
                };
              });
              return next;
            });
          }
        })
        .catch(() => {});
    }
  }, [content, catalogCache]);

  // Open modal to insert at cursor position
  const handleOpenInsertAtCursor = () => {
    setCursorError(null);
    setModalError(null);
    const textarea = textareaRef.current;
    const start = textarea ? textarea.selectionStart ?? 0 : content.length;

    // Validate cursor position before opening
    try {
      splitHtmlAtCursor(content, start);
    } catch (err) {
      setCursorError(
        err instanceof Error
          ? err.message
          : "Posicione o cursor em um parágrafo ou entre seções antes de inserir."
      );
      return;
    }

    setCapturedSnapshot({ content, cursor: start });
    setSelectedLayout("IMAGE_CARD");
    setSelectedProducts([]);
    setCtaText("Conferir oferta");
    setModalMode("create");
    setEditingBlock(null);
    setIsModalOpen(true);
    setSearchTerm("");
    setCatalogPage(1);
    fetchProducts("", 1);
  };

  // Open modal to edit an existing occurrence
  const handleOpenEditBlock = (occ: ParsedBlockOccurrence) => {
    if (occ.block.type !== "PRODUCT_GROUP") return;
    setCursorError(null);
    setModalError(null);
    const group = occ.block.data as AffiliateGroupData;
    setSelectedLayout(group.layout);
    setCtaText(group.ctaText || "Conferir oferta");

    // Load selected products from cache or minimal stubs
    const prods = group.products.map((ref) => {
      return (
        catalogCache[ref.productId] || {
          id: ref.productId,
          name: `Produto ${ref.productId}`,
          offers: ref.offerId
            ? [{ id: ref.offerId, affiliateUrl: "#", status: "ACTIVE" }]
            : [{ id: "off-1", affiliateUrl: "#", status: "ACTIVE" }],
        }
      );
    });
    setSelectedProducts(prods);
    setModalMode("edit");
    setEditingBlock(occ);
    setIsModalOpen(true);
    setSearchTerm("");
    setCatalogPage(1);
    fetchProducts("", 1);
  };

  // Duplicate an occurrence
  const handleDuplicateBlock = (occ: ParsedBlockOccurrence) => {
    const newId = `group-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newContent = duplicateBlockOccurrence(content, occ.rawMarker, newId);
    onChangeContent(newContent);
  };

  // Remove an occurrence
  const handleRemoveBlock = (occ: ParsedBlockOccurrence) => {
    const newContent = removeBlockOccurrence(content, occ.rawMarker);
    onChangeContent(newContent);
  };

  // Toggle selection of a product in the modal
  const handleToggleProduct = (product: RenderProduct) => {
    setSelectedProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 20) {
        setModalError("Máximo de 20 produtos por bloco permitido.");
        return prev;
      }
      setModalError(null);
      return [...prev, product];
    });
  };

  // Confirm Modal Action (Insert or Update)
  const handleConfirmModal = () => {
    if (selectedProducts.length === 0) {
      setModalError("Selecione pelo menos um produto do catálogo.");
      return;
    }

    const productRefs: AffiliateProductReference[] = selectedProducts.map((p) => {
      const activeOffer = p.offers.find((o) => o.status === "ACTIVE") || p.offers[0];
      return {
        productId: p.id,
        offerId: activeOffer?.id,
      };
    });

    if (modalMode === "create") {
      // Check if body was altered while modal was open
      if (content !== capturedSnapshot.content) {
        setModalError(
          "O conteúdo do artigo foi alterado enquanto o seletor estava aberto. Feche o modal, reposicione o cursor e tente novamente."
        );
        return;
      }

      try {
        const [before, after] = splitHtmlAtCursor(content, capturedSnapshot.cursor);
        const blockId = `group-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
        const marker = blockMarker({
          type: "PRODUCT_GROUP",
          data: {
            id: blockId,
            layout: selectedLayout,
            products: productRefs,
            ctaText: ctaText.trim() || undefined,
          },
        });

        const newContent = `${before ? before + "\n\n" : ""}${marker}${after ? "\n\n" + after : ""}`;
        onChangeContent(newContent);
        setIsModalOpen(false);

        // Restore focus to textarea
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            const insertPos = (before ? before + "\n\n" : "").length + marker.length;
            textareaRef.current.setSelectionRange(insertPos, insertPos);
          }
        }, 50);
      } catch (err) {
        setModalError(
          err instanceof Error ? err.message : "Erro ao inserir bloco no cursor."
        );
      }
    } else if (modalMode === "edit" && editingBlock) {
      const currentGroup = editingBlock.block.data as AffiliateGroupData;
      const updatedBlock = {
        type: "PRODUCT_GROUP" as const,
        data: {
          id: currentGroup.id,
          layout: selectedLayout,
          products: productRefs,
          ctaText: ctaText.trim() || undefined,
        },
      };
      const newContent = updateBlockOccurrence(content, editingBlock.rawMarker, updatedBlock);
      onChangeContent(newContent);
      setIsModalOpen(false);
    }
  };

  // Do not display if plan does not have AFFILIATE_MODULE entitlement
  if (!hasEntitlement) {
    return null;
  }

  // Parse existing occurrences
  const occurrences = parseBlockOccurrences(content);

  // Build live preview HTML for the modal
  let previewHtml = "";
  if (selectedProducts.length > 0) {
    try {
      previewHtml = renderProductGroup(
        {
          id: "preview-modal",
          layout: selectedLayout,
          products: selectedProducts.map((p) => ({
            productId: p.id,
            offerId: p.offers.find((o) => o.status === "ACTIVE")?.id || p.offers[0]?.id,
          })),
          ctaText: ctaText.trim() || undefined,
        },
        selectedProducts
      );
    } catch {
      previewHtml = "";
    }
  }

  return (
    <div className="space-y-4 my-2">
      {/* Insertion Toolbar Button */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleOpenInsertAtCursor}
          className="bg-primary/5 hover:bg-primary/10 border-primary/30 text-primary font-medium flex items-center gap-1.5 text-xs shadow-xs"
          aria-label="Inserir produto afiliado na posição do cursor"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Inserir produto afiliado
        </Button>

        {occurrences.length > 0 && (
          <span className="text-[11px] text-muted-foreground font-medium">
            {occurrences.length} bloco(s) de afiliado no artigo
          </span>
        )}
      </div>

      {/* Cursor Error Alert */}
      {cursorError && (
        <div
          role="alert"
          className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between gap-2 animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{cursorError}</span>
          </div>
          <button
            type="button"
            onClick={() => setCursorError(null)}
            className="text-rose-600 hover:text-rose-800 p-1"
            aria-label="Fechar aviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Occurrences List & Management */}
      {occurrences.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-primary" />
            Blocos de Afiliados no Artigo ({occurrences.length})
          </h4>

          <div className="space-y-3">
            {occurrences.map((occ, idx) => {
              if (occ.block.type !== "PRODUCT_GROUP") return null;
              const group = occ.block.data as AffiliateGroupData;
              const info = LAYOUT_INFO[group.layout] || LAYOUT_INFO.IMAGE_CARD;
              const prodNames = group.products
                .map((ref) => catalogCache[ref.productId]?.name || `ID: ${ref.productId}`)
                .join(", ");

              // Render visual preview
              let occurrencePreview = "";
              const prodsForPreview = group.products
                .map((ref) => catalogCache[ref.productId])
                .filter(Boolean) as RenderProduct[];

              if (prodsForPreview.length === group.products.length) {
                try {
                  occurrencePreview = renderProductGroup(group, prodsForPreview);
                } catch {
                  occurrencePreview = "";
                }
              }

              return (
                <Card
                  key={group.id || idx}
                  className="p-4 bg-surface/70 border border-border space-y-3 shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="purple" size="sm">
                        {info.icon} {info.label}
                      </Badge>
                      <span className="text-xs font-semibold text-foreground">
                        Bloco #{idx + 1}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        ({group.products.length} produto{group.products.length > 1 ? "s" : ""})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditBlock(occ)}
                        className="h-7 text-xs px-2 flex items-center gap-1 hover:text-primary"
                        aria-label={`Editar bloco ${idx + 1}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Editar
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicateBlock(occ)}
                        className="h-7 text-xs px-2 flex items-center gap-1 hover:text-primary"
                        aria-label={`Duplicar bloco ${idx + 1}`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Duplicar
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveBlock(occ)}
                        className="h-7 text-xs px-2 flex items-center gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        aria-label={`Remover bloco ${idx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remover
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-1">
                    <strong className="text-foreground">Produtos:</strong> {prodNames}
                  </p>

                  {/* Real visual preview rendered in place */}
                  {occurrencePreview ? (
                    <div className="p-3 bg-muted/20 border border-border/40 rounded-xl overflow-hidden text-xs">
                      <div
                        className="preview-wrapper"
                        dangerouslySetInnerHTML={{ __html: occurrencePreview }}
                      />
                    </div>
                  ) : (
                    <div className="p-2.5 bg-muted/10 border border-border/30 rounded-lg text-[11px] text-muted-foreground italic">
                      Aguardando catálogo para pré-visualização completa...
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Accessible Modal Dialog */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={modalTitleId}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-surface border border-border rounded-2xl shadow-xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-muted/40">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3
                  id={modalTitleId}
                  className="font-heading text-base font-bold text-foreground"
                >
                  {modalMode === "create"
                    ? "Inserir Bloco de Produto Afiliado"
                    : "Editar Bloco de Produto Afiliado"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
                aria-label="Fechar seletor"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Error */}
            {modalError && (
              <div
                role="alert"
                className="mx-6 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Modal Body with Scroll */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Step 1: Select Products */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      1. Selecione os produtos ({selectedProducts.length} selecionado{selectedProducts.length !== 1 ? "s" : ""})
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Escolha de 1 a 20 produtos para compor a recomendação comercial.
                    </p>
                  </div>

                  {/* Search Input */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Buscar produto..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCatalogPage(1);
                          fetchProducts(e.target.value, 1);
                        }}
                        className="pl-8 text-xs h-8 w-48 sm:w-56"
                        aria-label="Buscar produtos do catálogo"
                      />
                    </div>
                  </div>
                </div>

                {/* Catalog Grid */}
                {isLoadingCatalog ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    Carregando produtos do catálogo...
                  </div>
                ) : catalogItems.length === 0 ? (
                  <div className="p-6 text-center bg-muted/20 border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                    Nenhum produto ativo encontrado com este termo.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {catalogItems.map((prod) => {
                      const isSelected = selectedProducts.some((p) => p.id === prod.id);
                      const bestOffer = prod.offers.find((o) => o.status === "ACTIVE") || prod.offers[0];
                      const priceText = bestOffer?.price
                        ? `R$ ${bestOffer.price.toFixed(2).replace(".", ",")}`
                        : "Preço sob consulta";

                      return (
                        <div
                          key={prod.id}
                          onClick={() => handleToggleProduct(prod)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                            isSelected
                              ? "bg-primary/10 border-primary ring-2 ring-primary/20 shadow-xs"
                              : "bg-surface border-border hover:border-primary/40"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-1 accent-primary shrink-0"
                            aria-label={`Selecionar ${prod.name}`}
                          />
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-xs font-semibold text-foreground line-clamp-2">
                              {prod.name}
                            </p>
                            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              {priceText}
                            </p>
                            {prod.brand && (
                              <p className="text-[10px] text-muted-foreground">
                                {prod.brand}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                {catalogTotalPages > 1 && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <span>
                      Página {catalogPage} de {catalogTotalPages}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={catalogPage <= 1}
                        onClick={() => {
                          const p = catalogPage - 1;
                          setCatalogPage(p);
                          fetchProducts(searchTerm, p);
                        }}
                        className="h-7 px-2"
                        aria-label="Página anterior"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={catalogPage >= catalogTotalPages}
                        onClick={() => {
                          const p = catalogPage + 1;
                          setCatalogPage(p);
                          fetchProducts(searchTerm, p);
                        }}
                        className="h-7 px-2"
                        aria-label="Próxima página"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Choose Layout */}
              <div className="space-y-3 pt-4 border-t border-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  2. Modelo Visual do Bloco
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {AFFILIATE_LAYOUTS.map((layout) => {
                    const info = LAYOUT_INFO[layout];
                    const isSelected = selectedLayout === layout;
                    return (
                      <div
                        key={layout}
                        onClick={() => setSelectedLayout(layout)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? "bg-primary/10 border-primary ring-2 ring-primary/20 shadow-xs"
                            : "bg-surface border-border hover:border-primary/40"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-base">{info.icon}</span>
                            {isSelected && (
                              <Badge variant="purple" size="sm">
                                Selecionado
                              </Badge>
                            )}
                          </div>
                          <h5 className="text-xs font-bold text-foreground mt-1">
                            {info.label}
                          </h5>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {info.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: CTA Text */}
              <div className="space-y-2 pt-4 border-t border-border">
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground">
                  3. Texto do Botão (CTA)
                </label>
                <Input
                  type="text"
                  value={ctaText}
                  maxLength={100}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="Conferir oferta"
                  className="text-xs h-9"
                  aria-label="Texto do botão de chamada"
                />
              </div>

              {/* Step 4: Real Visual Preview */}
              {previewHtml && (
                <div className="space-y-2 pt-4 border-t border-border">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
                    <Eye className="w-3.5 h-3.5 text-primary" />
                    Pré-visualização do Bloco
                  </div>
                  <div className="p-4 bg-muted/20 border border-border/50 rounded-xl overflow-hidden text-xs">
                    <div
                      className="preview-wrapper"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface-muted/40">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>

              <Button
                type="button"
                variant="gradient"
                size="sm"
                onClick={handleConfirmModal}
                disabled={selectedProducts.length === 0}
                className="flex items-center gap-1.5 font-semibold"
              >
                <Check className="w-4 h-4" />
                {modalMode === "create" ? "Inserir no Artigo" : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
