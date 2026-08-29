import { Metadata } from "next";
import Link from "next/link";
import { getAuthenticatedWorkspace, DEFAULT_WORKSPACE_ID } from "@/lib/workspace";
import { BillingService } from "@/lib/billing";
import { BillingProfileForm } from "@/components/settings/billing-profile-form";
import { BillingInvoicesList } from "@/components/settings/billing-invoices-list";
import { SubscriptionManagementCard } from "@/components/settings/subscription-management-card";
import { CreditCard, Sparkles, Layers, Globe } from "lucide-react";

import { PageHeader } from "@/components/design-system/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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

  // If returning from checkout or checking status, sync directly with gateway
  if (checkout === "success") {
    await BillingService.syncWorkspaceWithGateway(workspaceId);
  }

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
      {/* Header com PageHeader */}
      <PageHeader
        title="Plano & Cobrança"
        description="Gerencie seu plano ativo, vigência, consumo de IA, faturas e dados de faturamento do Workspace."
        icon={<CreditCard className="w-5 h-5 text-primary" />}
        actions={
          <Link href="/settings/billing/upgrade">
            <Button variant="gradient" size="sm" leadingIcon={<Sparkles className="w-3.5 h-3.5" />}>
              Fazer Upgrade de Plano
            </Button>
          </Link>
        }
      />

      {redirect === "upgrade" && planName && (
        <Alert variant="warning">
          Atenção: Preencha ou confirme seus dados de cobrança abaixo para continuar com a contratação do plano {decodeURIComponent(planName)}.
        </Alert>
      )}

      {/* Callback Status Banners */}
      {checkout === "success" && (
        subscription.status === "ACTIVE" && subscription.plan.slug !== "free" ? (
          <Alert variant="success">
            <strong>🎉 Pagamento confirmado com sucesso!</strong> Seu plano {subscription.plan.name} foi ativado com sucesso. Todos os benefícios, limites e recursos já estão liberados para seu workspace.
          </Alert>
        ) : (
          <Alert variant="warning">
            <strong>⏳ Solicitação de pagamento registrada:</strong> A cobrança foi gerada no Asaas. Se você realizou o pagamento via Pix ou Cartão, a liberação ocorre em instantes. Para boleto bancário, a ativação ocorre após a compensação.
          </Alert>
        )
      )}

      {checkout === "canceled" && (
        <Alert variant="default">
          O processo de checkout foi cancelado. Seu plano atual permanece inalterado.
        </Alert>
      )}

      {/* Subscription Card with Actions */}
      <SubscriptionManagementCard subscription={serializableSubscription} />

      {/* Consumo & Limites */}
      <Card className="p-6 space-y-4 shadow-xs">
        <CardHeader className="p-0 border-b border-border pb-3">
          <CardTitle className="text-base font-bold">
            Consumo de Recursos no Ciclo Vigente
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-surface-muted/50 border border-border space-y-1.5">
              <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Artigos IA / Mês:
              </span>
              <div className="font-heading text-xl font-bold text-foreground flex items-baseline justify-between pt-1">
                <span>{articlesCheck.current}</span>
                <span className="text-xs font-normal text-muted-foreground font-sans">
                  / {articlesCheck.limit === -1 ? "Ilimitado" : articlesCheck.limit}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-muted/50 border border-border space-y-1.5">
              <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                Fontes RSS Ativas:
              </span>
              <div className="font-heading text-xl font-bold text-foreground flex items-baseline justify-between pt-1">
                <span>{sourcesCheck.current}</span>
                <span className="text-xs font-normal text-muted-foreground font-sans">
                  / {sourcesCheck.limit === -1 ? "Ilimitado" : sourcesCheck.limit}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-muted/50 border border-border space-y-1.5">
              <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-primary" />
                Sites WordPress:
              </span>
              <div className="font-heading text-xl font-bold text-foreground flex items-baseline justify-between pt-1">
                <span>{wpCheck.current}</span>
                <span className="text-xs font-normal text-muted-foreground font-sans">
                  / {wpCheck.limit === -1 ? "Ilimitado" : wpCheck.limit}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Cobranças / Faturas */}
      <BillingInvoicesList />

      {/* Formulário de Dados Cadastrais de Cobrança */}
      <BillingProfileForm />
    </div>
  );
}
