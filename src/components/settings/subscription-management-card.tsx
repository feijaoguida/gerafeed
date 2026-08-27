"use client";

import { useState } from "react";
import { ArrowUpCircle, XCircle, RotateCcw, AlertTriangle, Calendar, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { formatCurrency, calculateAnnualPlanPrice } from "@/lib/pricing";

interface SubscriptionCardProps {
  subscription: {
    id: string;
    status: string;
    billingCycle?: string;
    billingMethod?: string;
    amount?: number | string | null;
    annualDiscountPercentSnapshot?: number | string | null;
    validUntil?: string | Date | null;
    currentPeriodEnd?: string | Date | null;
    nextDueDate?: string | Date | null;
    cancelAtPeriodEnd?: boolean;
    canceledAt?: string | Date | null;
    plan: {
      id: string;
      name: string;
      slug: string;
      price: number;
      monthlyPrice?: number | string;
      annualDiscountPercent?: number | string;
    };
  };
}

export function SubscriptionManagementCard({ subscription }: SubscriptionCardProps) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isCanceled, setIsCanceled] = useState(Boolean(subscription.cancelAtPeriodEnd));

  const plan = subscription.plan;
  const isFree = plan.slug === "free";
  const monthlyPrice = plan.monthlyPrice !== undefined ? Number(plan.monthlyPrice) : plan.price;
  const discountPercent = plan.annualDiscountPercent !== undefined ? Number(plan.annualDiscountPercent) : 0;
  const annualCalculated = calculateAnnualPlanPrice(monthlyPrice, discountPercent);
  const isYearly = subscription.billingCycle === "YEARLY";

  const handleCancel = async () => {
    if (!confirm("Deseja realmente cancelar a renovação automática da sua assinatura? Seu acesso permanecerá ativo até o final do período já pago.")) {
      return;
    }

    try {
      setLoading(true);
      setMsg(null);
      const res = await fetch("/api/billing/subscription/cancel", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setIsCanceled(true);
        setMsg({ type: "success", text: data.message || "Renovação cancelada com sucesso." });
      } else {
        setMsg({ type: "error", text: data.error || "Erro ao cancelar renovação." });
      }
    } catch {
      setMsg({ type: "error", text: "Erro de conexão." });
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    try {
      setLoading(true);
      setMsg(null);
      const res = await fetch("/api/billing/subscription/reactivate", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setIsCanceled(false);
        setMsg({ type: "success", text: data.message || "Assinatura reativada com sucesso." });
      } else {
        setMsg({ type: "error", text: data.error || "Erro ao reativar assinatura." });
      }
    } catch {
      setMsg({ type: "error", text: "Erro de conexão." });
    } finally {
      setLoading(false);
    }
  };

  const validUntilDate = subscription.validUntil || subscription.currentPeriodEnd;

  return (
    <div className="p-6 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-6 shadow-sm">
      {/* Top Banner & Plan Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-5">
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
            Plano Ativo do Workspace
          </span>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white">{plan.name}</h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                subscription.status === "ACTIVE"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : subscription.status === "PAST_DUE"
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                  : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20"
              }`}
            >
              {subscription.status}
            </span>

            {isYearly && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                Ciclo Anual
              </span>
            )}
          </div>
        </div>

        <div className="text-left sm:text-right">
          <div className="text-2xl font-bold text-zinc-900 dark:text-white">
            {formatCurrency(isYearly ? annualCalculated : monthlyPrice)}{" "}
            <span className="text-xs text-zinc-500 font-normal">/{isYearly ? "ano" : "mês"}</span>
          </div>
          {!isFree && !isYearly && (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Economize contratando o Anual: {formatCurrency(annualCalculated)}/ano ({discountPercent}% OFF)
            </p>
          )}
        </div>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-lg text-xs font-medium ${
            msg.type === "success"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
              : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Cancellation Notice if applicable */}
      {isCanceled && (
        <div className="p-4 rounded-xl text-xs bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Renovação automática cancelada</p>
            <p className="text-[11px] opacity-90 leading-relaxed">
              Você não receberá novas cobranças futuras. Seu plano e recursos contratados continuarão plenamente
              ativos até o fim da vigência paga em{" "}
              {validUntilDate ? new Date(validUntilDate).toLocaleDateString("pt-BR") : "breve"}.
            </p>
          </div>
        </div>
      )}

      {/* Dates & Renewal Info */}
      {!isFree && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 text-xs">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">Vigência do Período Atual</p>
              <p className="font-semibold text-zinc-900 dark:text-white">
                {validUntilDate ? new Date(validUntilDate).toLocaleDateString("pt-BR") : "Indeterminada"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">Garantia / Fidelidade</p>
              <p className="font-semibold text-zinc-900 dark:text-white">Sem fidelidade ou multa rescisória</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Link
          href="/settings/billing/upgrade"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
        >
          <ArrowUpCircle className="w-4 h-4" />
          {isFree ? "Fazer Upgrade de Plano" : "Alterar Plano"}
        </Link>

        {!isFree && (
          <>
            {isCanceled ? (
              <button
                type="button"
                onClick={handleReactivate}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                {loading ? "Reativando..." : "Reativar Renovação Automática"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-medium rounded-lg transition-colors border border-zinc-200 dark:border-zinc-800 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                {loading ? "Processando..." : "Cancelar Renovação Automática"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
