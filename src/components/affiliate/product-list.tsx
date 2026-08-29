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

import { PageHeader } from "@/components/design-system/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

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
      {/* Header Actions com PageHeader */}
      <PageHeader
        title="Catálogo de Produtos de Afiliados"
        description="Gerencie produtos, ofertas, especificações e sincronização de preços."
        icon={<Package className="w-5 h-5" />}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/affiliates/import">
              <Button
                variant="outline"
                size="sm"
                leadingIcon={<Package className="w-4 h-4 text-amber-500" />}
              >
                Importar do Mercado Livre
              </Button>
            </Link>
            <Link href="/affiliates/products/new">
              <Button
                variant="gradient"
                size="sm"
                leadingIcon={<Plus className="w-4 h-4" />}
              >
                Novo Produto
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filters Bar com Card */}
      <Card className="p-4 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nome, marca ou descrição..."
            leadingIcon={<Search className="w-4 h-4 text-muted-foreground" />}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <Select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todas as Categorias</option>
              {Array.isArray(categories) &&
                categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </Select>
          </div>

          <Select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos os Status</option>
            <option value="ACTIVE">Ativos</option>
            <option value="ARCHIVED">Arquivados</option>
            <option value="DRAFT">Rascunho</option>
          </Select>
        </div>
      </Card>

      {/* Product Grid / Table */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          title="Nenhum produto encontrado"
          description={
            search || selectedCategory || selectedStatus
              ? "Tente ajustar seus filtros de busca ou remover termos."
              : "Comece importando um produto do Mercado Livre ou criando manualmente."
          }
          action={
            <Link href="/affiliates/import">
              <Button variant="gradient" leadingIcon={<Package className="w-4 h-4" />}>
                Importar Mercado Livre
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const bestOffer = product.offers[0] || null;
            return (
              <Card
                key={product.id}
                className="overflow-hidden shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between"
              >
                <div>
                  {/* Top Image & Status */}
                  <div className="relative h-48 bg-surface-muted/50 flex items-center justify-center p-4">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain rounded"
                      />
                    ) : (
                      <Package className="w-12 h-12 text-muted-foreground/40" />
                    )}

                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {product.status === "ACTIVE" && (
                        <Badge variant="success" size="sm">
                          Ativo
                        </Badge>
                      )}
                      {product.status === "ARCHIVED" && (
                        <Badge variant="secondary" size="sm">
                          Arquivado
                        </Badge>
                      )}
                      {product.status === "DRAFT" && (
                        <Badge variant="warning" size="sm">
                          Rascunho
                        </Badge>
                      )}
                    </div>

                    {product.category && (
                      <div className="absolute bottom-3 left-3">
                        <Badge variant="outline" size="sm" className="bg-surface/90 backdrop-blur-xs flex items-center gap-1">
                          <Layers className="w-3 h-3 text-primary" />
                          {product.category.name}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Body Info */}
                  <CardContent className="p-4 space-y-3">
                    <div>
                      {product.brand && (
                        <p className="font-heading text-xs font-semibold text-primary uppercase tracking-wider">
                          {product.brand}
                        </p>
                      )}
                      <h3 className="font-heading text-base font-semibold text-foreground line-clamp-2 mt-0.5">
                        {product.name}
                      </h3>
                    </div>

                    {/* Offer Summary */}
                    <div className="p-3 bg-surface-muted/50 rounded-lg border border-border">
                      {bestOffer ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Melhor Oferta ({bestOffer.affiliateProgram?.name || "Mercado Livre"})
                            </p>
                            <div className="flex items-baseline gap-2">
                              <span className="font-heading text-lg font-bold text-foreground">
                                {formatCurrency(bestOffer.price, bestOffer.currency)}
                              </span>
                              {bestOffer.oldPrice && bestOffer.oldPrice > (bestOffer.price || 0) && (
                                <span className="text-xs line-through text-muted-foreground">
                                  {formatCurrency(bestOffer.oldPrice, bestOffer.currency)}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground font-medium">
                            {product.offers.length}{" "}
                            {product.offers.length === 1 ? "oferta" : "ofertas"}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Nenhuma oferta vinculada</p>
                      )}
                    </div>
                  </CardContent>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-border mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleRefreshProduct(product.id, e)}
                    disabled={refreshingId === product.id}
                    title="Atualizar dados e preços das ofertas"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${refreshingId === product.id ? "animate-spin text-primary" : ""}`}
                    />
                  </Button>

                  <div className="flex items-center gap-2">
                    {bestOffer?.affiliateUrl && (
                      <a
                        href={bestOffer.affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                        title="Ver link de afiliado"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <Link href={`/affiliates/products/${product.id}`}>
                      <Button
                        variant="secondary"
                        size="sm"
                        trailingIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        Gerenciar
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Mostrando {products.length} de {total} produtos
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Anterior
            </Button>
            <span className="text-xs text-muted-foreground font-medium">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
