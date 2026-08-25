import Link from "next/link";
import { auth, DEFAULT_WORKSPACE_ID } from "@/auth";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import {
  Send,
  Newspaper,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Rss,
  Globe,
  Tag,
  Lock,
  CheckCircle2,
  Layers,
} from "lucide-react";

export default async function PublishingCenterPage() {
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

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Central de Publicação & Monetização
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
              Escolha a modalidade de publicação para produzir, enriquecer com IA e distribuir seu conteúdo no WordPress.
            </p>
          </div>
        </div>
      </div>

      {/* Two Publishing Flows Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flow 1: RSS & News Curation */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 md:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20">
                <Newspaper className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-800">
                Curadoria & Notícias
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Notícias & Curadoria RSS
              </h2>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                Importe e processe notícias das suas fontes RSS cadastradas, aplique reescrita jornalística via IA, insira produtos de afiliados recomendados e publique instantaneamente nos portais WordPress.
              </p>
            </div>

            {/* Workflow steps */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <h4 className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                Etapas do Fluxo
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-zinc-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>1. Coleta automática e seleção de artigos pendentes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>2. Processamento por IA com diretrizes de nicho e tom</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>3. Inserção de produtos afiliados recomendados (opcional)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>4. Revisão editorial humana e envio para o WordPress</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 mt-6 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-4">
            <Link
              href="/articles"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition-colors"
            >
              <Rss className="w-4 h-4" />
              Iniciar Publicação de Notícias
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* Flow 2: Affiliate Commercial Content */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 md:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
                <ShoppingBag className="w-6 h-6" />
              </div>
              {hasAffiliateModule ? (
                <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  Alta Conversão
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-zinc-400" />
                  Plano Pro
                </span>
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Conteúdo Comercial de Afiliados
              </h2>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                Produza reviews estruturados, comparativos entre modelos, guias de compra e seleções dos melhores produtos ancorados em preços reais, fichas técnicas e opiniões do catálogo.
              </p>
            </div>

            {/* Workflow steps */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <h4 className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                Etapas do Fluxo
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-zinc-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>1. Seleção do formato (Review, Comparativo, Guia de Compra)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>2. Escolha dos produtos do catálogo do Mercado Livre</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>3. Geração canônica com grounding técnico e de fontes externas</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>4. Renderização com links de afiliados seguros e disclosure</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 mt-6 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-4">
            {hasAffiliateModule ? (
              <Link
                href="/publishing/affiliate"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Criar Conteúdo de Afiliado
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            ) : (
              <Link
                href="/settings/billing/upgrade"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
              >
                <Lock className="w-4 h-4 text-amber-500" />
                Upgrade para Habilitar Módulo de Afiliados
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Quick Access Strip */}
      <div className="bg-slate-100/70 dark:bg-zinc-900/60 rounded-xl p-5 border border-slate-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400">
          <Layers className="w-4 h-4 text-indigo-500" />
          <span>Configurações Rápidas de Destino e Fontes:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/settings/sources"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors"
          >
            <Rss className="w-3.5 h-3.5 text-amber-500" />
            Feeds RSS
          </Link>
          <Link
            href="/settings/wordpress"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            Destinos WordPress
          </Link>
          <Link
            href={hasAffiliateModule ? "/affiliates/products" : "/settings/billing/upgrade"}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg shadow-sm transition-colors ${
              hasAffiliateModule 
                ? "text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700" 
                : "text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50"
            }`}
          >
            {hasAffiliateModule ? (
              <Tag className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-amber-500" />
            )}
            Catálogo de Produtos
          </Link>
        </div>
      </div>
    </div>
  );
}
