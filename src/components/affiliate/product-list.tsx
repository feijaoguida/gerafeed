"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  Package,
  Layers,
  ArrowRight,
  Filter,
} from "lucide-react";

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

interface AffiliateProgram {
  id: string;
  name: string;
  code: string;
}

interface ProductOffer {
  id: string;
  price: number | null;
  oldPrice: number | null;
  currency: string;
  seller: string | null;
  affiliateUrl: string;
  status: string;
  affiliateProgram: AffiliateProgram;
  metadataLastFetchedAt: string | null;
}

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  imageUrl: string | null;
  rating: number | null;
  status: "ACTIVE" | "ARCHIVED" | "DRAFT";
  updatedAt: string;
  category: ProductCategory | null;
  offers: ProductOffer[];
}

export function ProductList() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);



  const fetchProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (selectedCategory) params.set("categoryId", selectedCategory);
      if (selectedStatus) params.set("status", selectedStatus);
      params.set("page", page.toString());
      params.set("limit", limit.toString());

      const res = await fetch(`/api/affiliate/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.items || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedStatus, page, limit]);

  useEffect(() => {
    let ignore = false;
    async function loadCats() {
      try {
        const res = await fetch("/api/affiliate/categories");
        if (!ignore && res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setCategories(data);
          } else {
            setCategories([]);
          }
        }
      } catch {
        // ignore
      }
    }
    loadCats();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());
        if (selectedCategory) params.set("categoryId", selectedCategory);
        if (selectedStatus) params.set("status", selectedStatus);
        params.set("page", page.toString());
        params.set("limit", limit.toString());

        const res = await fetch(`/api/affiliate/products?${params.toString()}`);
        if (!ignore && res.ok) {
          const data = await res.json();
          setProducts(data.items || []);
          setTotal(data.total || 0);
        }
      } catch (err) {
        console.error("Erro ao carregar produtos:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [search, selectedCategory, selectedStatus, page, limit]);

  const handleRefreshProduct = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRefreshingId(productId);
    try {
      const res = await fetch(`/api/affiliate/products/${productId}/refresh`, {
        method: "POST",
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch {
      // ignore
    } finally {
      setRefreshingId(null);
    }
  };

  const formatCurrency = (val: number | null, curr = "BRL") => {
    if (val === null || val === undefined) return "--";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: curr,
    }).format(val);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Catálogo de Produtos de Afiliados
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gerencie produtos, ofertas, especificações e sincronização de preços.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/affiliates/import"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/60 rounded-lg transition-colors"
          >
            <Package className="w-4 h-4" />
            Importar do Mercado Livre
          </Link>
          <Link
            href="/affiliates/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nome, marca ou descrição..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="">Todas as Categorias</option>
              {Array.isArray(categories) &&
                categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          >
            <option value="">Todos os Status</option>
            <option value="ACTIVE">Ativos</option>
            <option value="ARCHIVED">Arquivados</option>
            <option value="DRAFT">Rascunho</option>
          </select>
        </div>
      </div>

      {/* Product Grid / Table */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Carregando catálogo...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Nenhum produto encontrado
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
            {search || selectedCategory || selectedStatus
              ? "Tente ajustar seus filtros de busca."
              : "Comece importando um produto do Mercado Livre ou criando manualmente."}
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/affiliates/import"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg"
            >
              Importar Mercado Livre
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const bestOffer = product.offers[0] || null;
            return (
              <div
                key={product.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Top Image & Status */}
                  <div className="relative h-48 bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain rounded"
                      />
                    ) : (
                      <Package className="w-12 h-12 text-slate-300" />
                    )}

                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium shadow-sm ${
                          product.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                            : product.status === "ARCHIVED"
                            ? "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300"
                        }`}
                      >
                        {product.status === "ACTIVE"
                          ? "Ativo"
                          : product.status === "ARCHIVED"
                          ? "Arquivado"
                          : "Rascunho"}
                      </span>
                    </div>

                    {product.category && (
                      <div className="absolute bottom-3 left-3">
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-medium backdrop-blur-sm shadow-sm">
                          <Layers className="w-3 h-3" />
                          {product.category.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="p-4 space-y-3">
                    <div>
                      {product.brand && (
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                          {product.brand}
                        </p>
                      )}
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white line-clamp-2 mt-0.5">
                        {product.name}
                      </h3>
                    </div>

                    {/* Offer Summary */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                      {bestOffer ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Melhor Oferta ({bestOffer.affiliateProgram?.name || "Mercado Livre"})
                            </p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg font-bold text-slate-900 dark:text-white">
                                {formatCurrency(bestOffer.price, bestOffer.currency)}
                              </span>
                              {bestOffer.oldPrice && bestOffer.oldPrice > (bestOffer.price || 0) && (
                                <span className="text-xs line-through text-slate-400">
                                  {formatCurrency(bestOffer.oldPrice, bestOffer.currency)}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-slate-400">
                            {product.offers.length}{" "}
                            {product.offers.length === 1 ? "oferta" : "ofertas"}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Nenhuma oferta vinculada</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-700/60 mt-2">
                  <button
                    onClick={(e) => handleRefreshProduct(product.id, e)}
                    disabled={refreshingId === product.id}
                    title="Atualizar dados e preços das ofertas"
                    className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${refreshingId === product.id ? "animate-spin text-blue-600" : ""}`}
                    />
                  </button>

                  <div className="flex items-center gap-2">
                    {bestOffer?.affiliateUrl && (
                      <a
                        href={bestOffer.affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Ver link de afiliado"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <Link
                      href={`/affiliates/products/${product.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                    >
                      Gerenciar
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Mostrando {products.length} de {total} produtos
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded disabled:opacity-50 text-slate-700 dark:text-slate-300"
            >
              Anterior
            </button>
            <span className="text-xs text-slate-500">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded disabled:opacity-50 text-slate-700 dark:text-slate-300"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
