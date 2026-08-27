"use client";

import { useEffect, useState, useCallback } from "react";
import { Receipt, ExternalLink, RefreshCw, CheckCircle2, Clock, AlertTriangle, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/pricing";

interface InvoiceItem {
  id: string;
  provider: string;
  providerPaymentId: string;
  amount: number | string;
  billingMethod: string;
  status: string;
  dueDate: string | null;
  confirmedAt: string | null;
  receivedAt: string | null;
  overdueAt: string | null;
  refundedAt: string | null;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
  createdAt: string;
}

export function BillingInvoicesList() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/billing/invoices");
      const data = await res.json();
      if (res.ok) {
        setInvoices(data.invoices || []);
      } else {
        setError(data.error || "Erro ao carregar histórico");
      }
    } catch {
      setError("Erro de rede ao carregar faturas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/billing/invoices")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data.invoices) setInvoices(data.invoices);
          else if (data.error) setError(data.error);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Erro de rede ao carregar faturas");
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
      case "RECEIVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            {status === "RECEIVED" ? "Liquidado" : "Confirmado"}
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            Aguardando
          </span>
        );
      case "OVERDUE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3 h-3" />
            Atrasado
          </span>
        );
      case "REFUNDED":
      case "PARTIALLY_REFUNDED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            Reembolsado
          </span>
        );
      case "CANCELED":
      case "FAILED":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
            <XCircle className="w-3 h-3" />
            {status}
          </span>
        );
    }
  };

  const formatMethod = (method: string) => {
    if (method === "PIX") return "Pix";
    if (method === "BOLETO") return "Boleto Bancário";
    if (method === "CREDIT_CARD") return "Cartão de Crédito";
    return method;
  };

  return (
    <div className="p-6 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-500" />
            Histórico de Cobranças & Faturas
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Consulte todas as faturas geradas, comprovantes e status financeiro.
          </p>
        </div>

        <button
          onClick={fetchInvoices}
          disabled={loading}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          title="Atualizar faturas"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="p-3 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-lg">
          {error}
        </div>
      )}

      {loading && invoices.length === 0 ? (
        <div className="py-8 text-center text-xs text-zinc-500">
          Carregando histórico financeiro...
        </div>
      ) : invoices.length === 0 ? (
        <div className="py-8 text-center text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800">
          Nenhuma fatura registrada para este workspace até o momento.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400">
                <th className="py-2.5 font-medium">Data</th>
                <th className="py-2.5 font-medium">Vencimento</th>
                <th className="py-2.5 font-medium">Valor</th>
                <th className="py-2.5 font-medium">Método</th>
                <th className="py-2.5 font-medium">Status</th>
                <th className="py-2.5 font-medium text-right">Comprovante / Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                  <td className="py-3 text-zinc-900 dark:text-zinc-200">
                    {new Date(inv.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="py-3 text-zinc-600 dark:text-zinc-400">
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="py-3 font-semibold text-zinc-900 dark:text-white">
                    {formatCurrency(Number(inv.amount))}
                  </td>
                  <td className="py-3 text-zinc-600 dark:text-zinc-400">
                    {formatMethod(inv.billingMethod)}
                  </td>
                  <td className="py-3">{getStatusBadge(inv.status)}</td>
                  <td className="py-3 text-right">
                    {inv.invoiceUrl || inv.bankSlipUrl ? (
                      <a
                        href={inv.invoiceUrl || inv.bankSlipUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Ver fatura
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-zinc-400 text-[11px]">Indisponível</span>
                    )}
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
