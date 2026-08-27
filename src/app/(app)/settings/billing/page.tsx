import { Metadata } from "next";
import { getAuthenticatedWorkspace, DEFAULT_WORKSPACE_ID } from "@/lib/workspace";
import { BillingService } from "@/lib/billing";
import { BillingProfileForm } from "@/components/settings/billing-profile-form";
import { BillingInvoicesList } from "@/components/settings/billing-invoices-list";
import { SubscriptionManagementCard } from "@/components/settings/subscription-management-card";
import { CreditCard, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Plano & Cobrança | GeraFeed",
  description: "Gerencie seu plano, consumo e dados cadastrais de cobrança.",
};

export default async function BillingSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; sessionId?: string; redirect?: string; planName?: string; planId?: string; cycle?: string }>;
}) {
  const { checkout, redirect, planName } = await searchParams;
  const authData = await getAuthenticatedWorkspace();
  const workspaceId = authData?.workspaceId || DEFAULT_WORKSPACE_ID;

  const subscription = await BillingService.getWorkspaceSubscription(workspaceId);

  const articlesCheck = await BillingService.checkLimit(workspaceId, "ARTICLES");
  const sourcesCheck = await BillingService.checkLimit(workspaceId, "SOURCES");
  const wpCheck = await BillingService.checkLimit(workspaceId, "WORDPRESS_SITES");

  const subAny = subscription as Record<string, unknown>;
  const serializableSubscription = {
    id: String(subAny.id || ""),
    status: String(subAny.status || "ACTIVE"),
    billingCycle: String(subAny.billingCycle || "MONTHLY"),
    billingMethod: String(subAny.billingMethod || "CREDIT_CARD"),
    amount: subAny.amount ? Number(subAny.amount) : null,
    annualDiscountPercentSnapshot: subAny.annualDiscountPercentSnapshot ? Number(subAny.annualDiscountPercentSnapshot) : null,
    validUntil: subAny.validUntil instanceof Date ? subAny.validUntil.toISOString() : null,
    currentPeriodEnd: subAny.currentPeriodEnd instanceof Date ? subAny.currentPeriodEnd.toISOString() : null,
    nextDueDate: subAny.nextDueDate instanceof Date ? subAny.nextDueDate.toISOString() : null,
    cancelAtPeriodEnd: Boolean(subAny.cancelAtPeriodEnd),
    canceledAt: subAny.canceledAt instanceof Date ? subAny.canceledAt.toISOString() : null,
    plan: {
      id: subscription.plan.id,
      name: subscription.plan.name,
      slug: subscription.plan.slug,
      price: subscription.plan.price,
      monthlyPrice: Number(subscription.plan.monthlyPrice || subscription.plan.price),
      annualDiscountPercent: Number(subscription.plan.annualDiscountPercent || 0),
    },
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-indigo-500" />
          Plano & Cobrança
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Gerencie seu plano ativo, vigência, consumo de IA, faturas e dados de faturamento do Workspace.
        </p>
      </div>

      {redirect === "upgrade" && planName && (
        <div className="p-4 rounded-xl text-xs bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="font-medium">
            Atenção: Preencha ou confirme seus dados de cobrança abaixo para continuar com a contratação do plano {decodeURIComponent(planName)}.
          </p>
        </div>
      )}

      {/* Callback Status Banners */}
      {checkout === "success" && (
        <div className="p-4 rounded-xl text-xs bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <span>⏳ Solicitação de pagamento realizada</span>
          </p>
          <p className="text-[11px] opacity-90">
            A contratação foi registrada com sucesso. A assinatura do plano será ativada automaticamente assim que a confirmação financeira for recebida via Webhook/Notificação do gateway de pagamento (Asaas).
          </p>
        </div>
      )}

      {checkout === "canceled" && (
        <div className="p-4 rounded-xl text-xs bg-zinc-500/10 border border-zinc-500/20 text-zinc-700 dark:text-zinc-300">
          <p className="font-medium">O processo de checkout foi cancelado. Seu plano atual permanece inalterado.</p>
        </div>
      )}

      {/* Subscription Card with Actions */}
      <SubscriptionManagementCard subscription={serializableSubscription} />

      {/* Consumo & Limites */}
      <div className="p-6 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
        <h2 className="text-base font-bold text-zinc-900 dark:text-white">Consumo de Recursos no Ciclo Vigente</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Artigos IA / Mês:</span>
            <div className="text-lg font-bold text-zinc-900 dark:text-white flex items-baseline justify-between">
              <span>{articlesCheck.current}</span>
              <span className="text-xs font-normal text-zinc-500">
                / {articlesCheck.limit === -1 ? "Ilimitado" : articlesCheck.limit}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Fontes RSS Ativas:</span>
            <div className="text-lg font-bold text-zinc-900 dark:text-white flex items-baseline justify-between">
              <span>{sourcesCheck.current}</span>
              <span className="text-xs font-normal text-zinc-500">
                / {sourcesCheck.limit === -1 ? "Ilimitado" : sourcesCheck.limit}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Sites WordPress:</span>
            <div className="text-lg font-bold text-zinc-900 dark:text-white flex items-baseline justify-between">
              <span>{wpCheck.current}</span>
              <span className="text-xs font-normal text-zinc-500">
                / {wpCheck.limit === -1 ? "Ilimitado" : wpCheck.limit}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Histórico de Cobranças / Faturas */}
      <BillingInvoicesList />

      {/* Formulário de Dados Cadastrais de Cobrança */}
      <BillingProfileForm />
    </div>
  );
}
