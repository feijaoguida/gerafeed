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

import { PageHeader } from "@/components/design-system/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
      {/* Header com PageHeader */}
      <PageHeader
        title="Central de Publicação & Monetização"
        description="Escolha a modalidade de publicação para produzir, enriquecer com IA e distribuir seu conteúdo no WordPress."
        icon={<Send className="w-5 h-5" />}
      />

      {/* Two Publishing Flows Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flow 1: RSS & News Curation */}
        <Card className="flex flex-col justify-between shadow-xs hover:border-primary/40 transition-colors">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20">
                <Newspaper className="w-6 h-6" />
              </div>
              <Badge variant="warning">
                Curadoria & Notícias
              </Badge>
            </div>

            <div className="space-y-1.5">
              <CardTitle className="text-xl">
                Notícias & Curadoria RSS
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Importe e processe notícias das suas fontes RSS cadastradas, aplique reescrita jornalística via IA, insira produtos de afiliados recomendados e publique instantaneamente nos portais WordPress.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Workflow steps */}
            <div className="space-y-2.5 pt-2 border-t border-border">
              <h4 className="text-[11px] font-heading font-bold text-muted-foreground uppercase tracking-wider">
                Etapas do Fluxo
              </h4>
              <ul className="space-y-2 text-xs text-foreground/90 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00C2A8] shrink-0" />
                  <span>1. Coleta automática e seleção de artigos pendentes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00C2A8] shrink-0" />
                  <span>2. Processamento por IA com scraping do texto original</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00C2A8] shrink-0" />
                  <span>3. Inserção de produtos afiliados recomendados (opcional)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00C2A8] shrink-0" />
                  <span>4. Revisão editorial humana e envio para o WordPress</span>
                </li>
              </ul>
            </div>
          </CardContent>

          <CardFooter className="pt-4 border-t border-border">
            <Link href="/articles" className="w-full">
              <Button
                variant="gradient"
                size="lg"
                className="w-full"
                leadingIcon={<Rss className="w-4 h-4" />}
                trailingIcon={<ArrowRight className="w-4 h-4" />}
              >
                Iniciar Publicação de Notícias
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Flow 2: Affiliate Commercial Content */}
        <Card className="flex flex-col justify-between shadow-xs hover:border-primary/40 transition-colors">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-primary/10 text-primary rounded-xl border border-primary/20">
                <ShoppingBag className="w-6 h-6" />
              </div>
              {hasAffiliateModule ? (
                <Badge variant="purple" className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#7C3AED]" />
                  Alta Conversão
                </Badge>
              ) : (
                <Badge variant="warning" className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Plano Pro
                </Badge>
              )}
            </div>

            <div className="space-y-1.5">
              <CardTitle className="text-xl">
                Conteúdo Comercial de Afiliados
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Produza reviews estruturados, comparativos entre modelos, guias de compra e seleções dos melhores produtos ancorados em preços reais, fichas técnicas e opiniões do catálogo.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Workflow steps */}
            <div className="space-y-2.5 pt-2 border-t border-border">
              <h4 className="text-[11px] font-heading font-bold text-muted-foreground uppercase tracking-wider">
                Etapas do Fluxo
              </h4>
              <ul className="space-y-2 text-xs text-foreground/90 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00C2A8] shrink-0" />
                  <span>1. Seleção do formato (Review, Comparativo, Guia de Compra)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00C2A8] shrink-0" />
                  <span>2. Escolha dos produtos do catálogo do Mercado Livre</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00C2A8] shrink-0" />
                  <span>3. Geração canônica com grounding técnico e de fontes externas</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00C2A8] shrink-0" />
                  <span>4. Renderização com links de afiliados seguros e disclosure</span>
                </li>
              </ul>
            </div>
          </CardContent>

          <CardFooter className="pt-4 border-t border-border">
            {hasAffiliateModule ? (
              <Link href="/publishing/affiliate" className="w-full">
                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full"
                  leadingIcon={<Sparkles className="w-4 h-4" />}
                  trailingIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Criar Conteúdo de Afiliado
                </Button>
              </Link>
            ) : (
              <Link href="/settings/billing/upgrade" className="w-full">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  leadingIcon={<Lock className="w-4 h-4 text-amber-500" />}
                >
                  Upgrade para Módulo de Afiliados
                </Button>
              </Link>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Quick Access Strip */}
      <Card className="p-5 border border-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-muted/30">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Layers className="w-4 h-4 text-primary" />
          <span>Configurações Rápidas de Destino e Fontes:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/settings/sources">
            <Button
              variant="outline"
              size="sm"
              leadingIcon={<Rss className="w-3.5 h-3.5 text-amber-500" />}
            >
              Feeds RSS
            </Button>
          </Link>

          <Link href="/settings/wordpress">
            <Button
              variant="outline"
              size="sm"
              leadingIcon={<Globe className="w-3.5 h-3.5 text-primary" />}
            >
              Destinos WordPress
            </Button>
          </Link>

          <Link href={hasAffiliateModule ? "/affiliates/products" : "/settings/billing/upgrade"}>
            <Button
              variant="outline"
              size="sm"
              leadingIcon={
                hasAffiliateModule ? (
                  <Tag className="w-3.5 h-3.5 text-[#00C2A8]" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                )
              }
            >
              Catálogo de Produtos
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
