import React from "react";
import { ProductList } from "@/components/affiliate/product-list";
import { auth, DEFAULT_WORKSPACE_ID } from "@/auth";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Catálogo de Produtos | News Curator Afiliados",
  description: "Gerenciamento e curadoria de produtos do catálogo de afiliados.",
};

export default async function AffiliateProductsPage() {
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
          O acesso ao Catálogo de Produtos e criação de conteúdo de afiliados exige um plano com o Módulo de Afiliados habilitado.
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
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <ProductList />
    </div>
  );
}
