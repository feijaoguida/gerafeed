"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Tag,
  RefreshCw,
  ExternalLink,
  Package,
  Clock,
  Trash2,
} from "lucide-react";

import { PageHeader } from "@/components/design-system/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductOfferItem {
  id: string;
  affiliateUrl: string;
  seller: string | null;
  price: number | null;
  oldPrice: number | null;
  currency: string;
  trackingLabel: string | null;
  status: "ACTIVE" | "PAUSED" | "OUT_OF_STOCK" | "ARCHIVED";
  metadataLastFetchedAt: string | null;
  product: {
    id: string;
    name: string;
    brand: string | null;
    imageUrl: string | null;
  };
  affiliateProgram: {
    id: string;
    name: string;
    code: string;
  };
}

export function OfferList() {
  const [offers, setOffers] = useState<ProductOfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const fetchOffers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/affiliate/offers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOffers(data.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const params = new URLSearchParams();
        if (statusFilter) params.set("status", statusFilter);
        const res = await fetch(`/api/affiliate/offers?${params.toString()}`);
        if (!ignore && res.ok) {
          const data = await res.json();
          setOffers(data.items || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [statusFilter]);

  const handleRefresh = async (offerId: string) => {
    setRefreshingId(offerId);
    try {
      const res = await fetch(`/api/affiliate/offers/${offerId}/refresh`, {
        method: "POST",
      });
      if (res.ok) {
        fetchOffers();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshingId(null);
    }
  };

  const handleDelete = async (offerId: string) => {
    if (!confirm("Deseja realmente remover esta oferta?")) return;
    try {
      const res = await fetch(`/api/affiliate/offers/${offerId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchOffers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com PageHeader */}
      <PageHeader
        title="Ofertas de Afiliados"
        description="Monitore preços, status de estoque e rastreamento de links em todos os programas parceiros."
        icon={<Tag className="w-5 h-5" />}
        actions={
          <div className="w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos os Status</option>
              <option value="ACTIVE">Ativas</option>
              <option value="PAUSED">Pausadas</option>
              <option value="OUT_OF_STOCK">Sem Estoque</option>
              <option value="ARCHIVED">Arquivadas</option>
            </Select>
          </div>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <EmptyState
          title="Nenhuma oferta cadastrada"
          description="Importe produtos ou vincule novas ofertas a partir do Catálogo de Produtos."
          action={
            <Link href="/affiliates/products">
              <Button variant="gradient" leadingIcon={<Package className="w-4 h-4" />}>
                Ver Catálogo de Produtos
              </Button>
            </Link>
          }
        />
      ) : (
        <Card className="overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-muted/50 text-muted-foreground uppercase font-heading font-semibold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Programa</th>
                  <th className="px-4 py-3">Vendedor</th>
                  <th className="px-4 py-3">Preço Atual</th>
                  <th className="px-4 py-3">Tracking</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Última Atualização</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-sans">
                {offers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-surface-muted/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <Link
                        href={`/affiliates/products/${offer.product.id}`}
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                      >
                        {offer.product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={offer.product.imageUrl}
                            alt={offer.product.name}
                            className="w-8 h-8 object-contain rounded-lg bg-surface-muted border border-border"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-surface-muted border border-border flex items-center justify-center">
                            <Package className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <span className="line-clamp-1 max-w-[200px]">{offer.product.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {offer.affiliateProgram?.name || "Mercado Livre"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{offer.seller || "--"}</td>
                    <td className="px-4 py-3">
                      <div className="font-heading font-bold text-foreground">
                        {offer.price
                          ? new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: offer.currency,
                            }).format(offer.price)
                          : "--"}
                      </div>
                      {offer.oldPrice && offer.oldPrice > (offer.price || 0) && (
                        <div className="text-[10px] line-through text-muted-foreground">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: offer.currency,
                          }).format(offer.oldPrice)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-[11px]">
                      {offer.trackingLabel || "--"}
                    </td>
                    <td className="px-4 py-3">
                      {offer.status === "ACTIVE" && (
                        <Badge variant="success" size="sm">
                          Ativa
                        </Badge>
                      )}
                      {offer.status === "OUT_OF_STOCK" && (
                        <Badge variant="danger" size="sm">
                          Sem Estoque
                        </Badge>
                      )}
                      {offer.status !== "ACTIVE" && offer.status !== "OUT_OF_STOCK" && (
                        <Badge variant="secondary" size="sm">
                          {offer.status}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        {offer.metadataLastFetchedAt
                          ? new Date(offer.metadataLastFetchedAt).toLocaleDateString("pt-BR")
                          : "Nunca"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRefresh(offer.id)}
                          disabled={refreshingId === offer.id}
                          title="Atualizar preço agora"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 ${refreshingId === offer.id ? "animate-spin text-primary" : ""}`}
                          />
                        </Button>
                        <a
                          href={offer.affiliateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Abrir link de afiliado"
                          className="p-2 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(offer.id)}
                          title="Excluir oferta"
                          className="text-muted-foreground hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
