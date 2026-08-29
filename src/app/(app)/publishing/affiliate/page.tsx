import { auth, DEFAULT_WORKSPACE_ID } from "@/auth";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import { AffiliatePublishingWizard } from "@/components/publishing/affiliate-publishing-wizard";
import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
      <div className="p-8 max-w-xl mx-auto text-center space-y-4 my-12">
        <Card className="p-8 space-y-4 text-center">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-heading text-xl font-bold text-foreground">
            Módulo de Afiliados Exclusivo
          </h2>
          <p className="font-sans text-xs text-muted-foreground leading-relaxed">
            A criação de conteúdo comercial de afiliados (reviews, comparativos e guias de compra) exige um plano com o Módulo de Afiliados habilitado.
          </p>
          <div className="pt-2">
            <Link href="/settings/billing/upgrade">
              <Button
                variant="gradient"
                trailingIcon={<ArrowRight className="w-4 h-4" />}
              >
                Fazer Upgrade de Plano
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <AffiliatePublishingWizard />
    </div>
  );
}
