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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ofertas de Afiliados</h1>
          <p className="text-sm text-slate-500">
            Monitore preços, status de estoque e rastreamento de links em todos os programas parceiros.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
          >
            <option value="">Todos os Status</option>
            <option value="ACTIVE">Ativas</option>
            <option value="PAUSED">Pausadas</option>
            <option value="OUT_OF_STOCK">Sem Estoque</option>
            <option value="ARCHIVED">Arquivadas</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Carregando ofertas...</p>
        </div>
      ) : offers.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8">
          <Tag className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Nenhuma oferta cadastrada
          </h3>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            Importe produtos ou vincule novas ofertas a partir do Catálogo de Produtos.
          </p>
          <Link
            href="/affiliates/products"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Ver Catálogo de Produtos
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-700">
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
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {offers.map((offer) => (
                <tr key={offer.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    <Link
                      href={`/affiliates/products/${offer.product.id}`}
                      className="flex items-center gap-2 hover:text-blue-600"
                    >
                      {offer.product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={offer.product.imageUrl}
                          alt={offer.product.name}
                          className="w-8 h-8 object-contain rounded bg-slate-50 dark:bg-slate-900"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
                          <Package className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                      <span className="line-clamp-1 max-w-[200px]">{offer.product.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    {offer.affiliateProgram?.name || "Mercado Livre"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{offer.seller || "--"}</td>
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
                        onClick={() => handleRefresh(offer.id)}
                        disabled={refreshingId === offer.id}
                        title="Atualizar preço agora"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${refreshingId === offer.id ? "animate-spin text-blue-600" : ""}`}
                        />
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
                        onClick={() => handleDelete(offer.id)}
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
      )}
    </div>
  );
}
