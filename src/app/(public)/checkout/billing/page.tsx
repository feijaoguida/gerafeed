import type { Metadata } from "next";
import { Suspense } from "react";
import { BillingOnboardingView } from "@/components/checkout/billing-onboarding-view";

export const metadata: Metadata = {
  title: "Dados de Faturamento & Assinatura",
  description: "Complete seus dados de faturamento para prosseguir ao pagamento seguro via Asaas.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function BillingOnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <BillingOnboardingView />
    </Suspense>
  );
}
