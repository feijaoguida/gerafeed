import { auth, DEFAULT_WORKSPACE_ID } from "@/auth";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import { AffiliatePublishingWizard } from "@/components/publishing/affiliate-publishing-wizard";
import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";

export default async function AffiliatePublishingPage() {
  const session = await auth();
  const workspaceId =
    session?.user?.workspaceId || session?.workspaceId || DEFAULT_WORKSPACE_ID;

  let hasAffiliateModule = false;
  try {
    hasAffiliateModule = await BillingService.hasFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE
    );
  } catch {
    hasAffiliateModule = false;
  }

  if (!hasAffiliateModule) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4 my-12 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Módulo de Afiliados Exclusivo
        </h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
          A criação de conteúdo comercial de afiliados (reviews, comparativos e guias de compra) exige um plano com o Módulo de Afiliados habilitado.
        </p>
        <div className="pt-2">
          <Link
            href="/settings/billing/upgrade"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            Fazer Upgrade de Plano
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <AffiliatePublishingWizard />
    </div>
  );
}
