import { Metadata } from "next";
import { getAuthenticatedWorkspace, DEFAULT_WORKSPACE_ID } from "@/lib/workspace";
import { BillingService } from "@/lib/billing";
import { BillingProfileForm } from "@/components/settings/billing-profile-form";
import { CreditCard } from "lucide-react";
import { formatCurrency, calculateAnnualPlanPrice } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Plano & Cobrança | GeraFeed",
  description: "Gerencie seu plano, consumo e dados cadastrais de cobrança.",
};

export default async function BillingSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; sessionId?: string }>;
}) {
  const { checkout } = await searchParams;
  const authData = await getAuthenticatedWorkspace();
  const workspaceId = authData?.workspaceId || DEFAULT_WORKSPACE_ID;

  const subscription = await BillingService.getWorkspaceSubscription(workspaceId);
  const plan = subscription.plan;

  const articlesCheck = await BillingService.checkLimit(workspaceId, "ARTICLES");
  const sourcesCheck = await BillingService.checkLimit(workspaceId, "SOURCES");
  const wpCheck = await BillingService.checkLimit(workspaceId, "WORDPRESS_SITES");

  const planAny = plan as unknown as { price: number; monthlyPrice?: number | string; annualDiscountPercent?: number | string; name: string };
  const monthlyPrice = planAny.monthlyPrice !== undefined ? Number(planAny.monthlyPrice) : plan.price;
  const discountPercent = planAny.annualDiscountPercent !== undefined ? Number(planAny.annualDiscountPercent) : 0;
  const annualCalculated = calculateAnnualPlanPrice(monthlyPrice, discountPercent);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-indigo-500" />
          Plano & Cobrança
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Gerencie seu plano ativo, consumo mensal de IA e atualize os dados cadastrais de faturamento do seu Workspace.
        </p>
      </div>

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

      {/* Plano Atual & Consumo */}
      <div className="p-6 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
              Plano Ativo do Workspace
            </span>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white">{plan.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {subscription.status}
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-2xl font-bold text-zinc-900 dark:text-white">
              {formatCurrency(monthlyPrice)} <span className="text-xs text-zinc-500 font-normal">/mês</span>
            </div>
            {monthlyPrice > 0 && (
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Opção Anual: {formatCurrency(annualCalculated)}/ano ({discountPercent}% OFF)
              </p>
            )}
          </div>
        </div>

        {/* Consumo */}
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

      {/* Formulário de Dados Cadastrais de Cobrança */}
      <BillingProfileForm />
    </div>
  );
}
