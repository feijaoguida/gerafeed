"use client";

import { useEffect, useState } from "react";
import { History, Tag, ArrowRight, Clock, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/pricing";

interface PlanHistoryItem {
  id: string;
  eventType: string;
  previousPlanName?: string | null;
  newPlanName: string;
  billingCycle: string;
  originalAmount: number | string;
  chargedAmount: number | string;
  couponCode?: string | null;
  discountDurationMonths?: number | null;
  notes?: string | null;
  createdAt: string;
}

export function PlanHistoryList() {
  const [history, setHistory] = useState<PlanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/billing/plan-history");
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history || []);
        } else {
          setError("Não foi possível carregar o histórico de planos.");
        }
      } catch {
        setError("Erro de rede ao carregar histórico de planos.");
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case "ACCOUNT_CREATED":
        return <Badge variant="secondary">Conta Criada</Badge>;
      case "CHECKOUT_STARTED":
        return <Badge variant="secondary">Checkout Iniciado</Badge>;
      case "SUBSCRIPTION_ACTIVATED":
        return <Badge variant="success">Assinatura Ativada</Badge>;
      case "PLAN_CHANGED":
        return <Badge variant="default">Plano Alterado</Badge>;
      case "COUPON_APPLIED":
        return <Badge variant="success">Cupom Aplicado</Badge>;
      case "DISCOUNT_ENDED":
        return <Badge variant="warning">Desconto Finalizado</Badge>;
      case "SUBSCRIPTION_CANCELED":
        return <Badge variant="danger">Renovação Cancelada</Badge>;
      case "SUBSCRIPTION_REACTIVATED":
        return <Badge variant="success">Renovação Reativada</Badge>;
      default:
        return <Badge variant="outline">{eventType}</Badge>;
    }
  };

  return (
    <Card className="p-6 space-y-4 shadow-xs">
      <CardHeader className="p-0 border-b border-border pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          Histórico de Planos & Assinaturas
        </CardTitle>
        <span className="text-xs text-muted-foreground font-normal">
          {history.length} {history.length === 1 ? "registro" : "registros"}
        </span>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
            Carregando histórico...
          </div>
        ) : error ? (
          <div className="py-4 text-xs text-rose-500 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Nenhum evento registrado no histórico ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/80 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Evento</th>
                  <th className="py-2.5 px-3">Plano</th>
                  <th className="py-2.5 px-3">Valor Cobrado</th>
                  <th className="py-2.5 px-3">Cupom / Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {history.map((item) => {
                  const orig = Number(item.originalAmount);
                  const charged = Number(item.chargedAmount);
                  const hasDiscount = orig > charged && charged >= 0;

                  return (
                    <tr key={item.id} className="hover:bg-surface-muted/30 transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap text-muted-foreground font-mono">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 shrink-0 opacity-70" />
                          {new Date(item.createdAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {getEventBadge(item.eventType)}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-medium">
                          {item.previousPlanName && item.previousPlanName !== item.newPlanName && (
                            <>
                              <span className="text-muted-foreground line-through">
                                {item.previousPlanName}
                              </span>
                              <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                            </>
                          )}
                          <span className="text-foreground font-bold">{item.newPlanName}</span>
                          <span className="text-[10px] text-muted-foreground">
                            ({item.billingCycle === "YEARLY" ? "Anual" : "Mensal"})
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {hasDiscount ? (
                          <div>
                            <span className="line-through text-muted-foreground text-[11px] block">
                              {formatCurrency(orig)}
                            </span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(charged)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-bold text-foreground">
                            {formatCurrency(charged)}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="space-y-0.5 max-w-xs">
                          {item.couponCode && (
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                              <Tag className="w-3 h-3 shrink-0" />
                              <span>{item.couponCode}</span>
                              {item.discountDurationMonths !== undefined && (
                                <span className="font-sans font-normal opacity-90">
                                  {item.discountDurationMonths === 0
                                    ? "(Vitalício)"
                                    : `(${item.discountDurationMonths}m)`}
                                </span>
                              )}
                            </div>
                          )}
                          {item.notes && (
                            <p className="text-[11px] text-muted-foreground leading-snug truncate" title={item.notes}>
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
