import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  ShieldAlert,
  Building2,
  Users,
  FileText,
  Layers,
  Sparkles,
  ArrowRight,
} from "lucide-react";

import { PageHeader } from "@/components/design-system/page-header";
import { StatCard } from "@/components/design-system/stat-card";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function BackofficePage() {
  const session = await auth();

  // Load real metrics for SuperAdmin
  const [companiesCount, usersCount, articlesCount, plansCount] = await Promise.all([
    prisma.workspace.count(),
    prisma.user.count(),
    prisma.article.count(),
    prisma.plan.count(),
  ]);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header com PageHeader */}
      <PageHeader
        title="Backoffice Superadmin"
        description={`Painel de controle e governança global da plataforma GeraFeed. Conectado como ${session?.user?.email}`}
        icon={<ShieldAlert className="w-5 h-5 text-amber-500" />}
        badge={
          <Badge variant="warning" size="sm">
            Superadmin Ativo
          </Badge>
        }
      />

      {/* Overview StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Empresas / Tenants"
          value={companiesCount}
          icon={<Building2 className="w-4 h-4 text-primary" />}
          description="Total de organizações cadastradas"
        />
        <StatCard
          title="Usuários Ativos"
          value={usersCount}
          icon={<Users className="w-4 h-4 text-purple-500" />}
          description="Contas vinculadas na plataforma"
        />
        <StatCard
          title="Artigos Processados"
          value={articlesCount}
          icon={<FileText className="w-4 h-4 text-[#00C2A8]" />}
          description="Volume global de matérias geradas"
        />
        <StatCard
          title="Planos Comerciais"
          value={plansCount}
          icon={<Layers className="w-4 h-4 text-amber-500" />}
          description="Configurações de planos e limites"
        />
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-4 shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 text-primary rounded-xl">
                <Building2 className="w-5 h-5" />
              </div>
              <CardTitle className="text-base font-bold">Empresas & Tenants</CardTitle>
            </div>
            <p className="font-sans text-xs text-muted-foreground leading-relaxed">
              Consulte e edite organizações clientes, altere planos manualmente e audite sites WordPress e feeds configurados.
            </p>
          </div>
          <Link href="/backoffice/companies">
            <Button variant="secondary" size="sm" className="w-full justify-between" trailingIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Gerenciar Empresas
            </Button>
          </Link>
        </Card>

        <Card className="p-6 space-y-4 shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <CardTitle className="text-base font-bold">Planos & Features</CardTitle>
            </div>
            <p className="font-sans text-xs text-muted-foreground leading-relaxed">
              Defina os limites de artigos, fontes RSS, sites WordPress e features de IA (BYOK, provedores avançados e nichos).
            </p>
          </div>
          <Link href="/backoffice/plans">
            <Button variant="secondary" size="sm" className="w-full justify-between" trailingIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Configurar Planos
            </Button>
          </Link>
        </Card>

        <Card className="p-6 space-y-4 shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <CardTitle className="text-base font-bold">Prompts de Afiliados</CardTitle>
            </div>
            <p className="font-sans text-xs text-muted-foreground leading-relaxed">
              Governança global dos templates de IA para reviews, comparativos, guias de compra e artigos comerciais.
            </p>
          </div>
          <Link href="/backoffice/affiliate-prompts">
            <Button variant="secondary" size="sm" className="w-full justify-between" trailingIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Gerenciar Templates
            </Button>
          </Link>
        </Card>
      </div>

      {/* Security Banner */}
      <Card className="p-4 bg-surface-muted/40 border-border flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            Ambiente administrativo restrito e auditado. Todas as ações manuais ficam registradas para conformidade.
          </span>
        </div>
        <Badge variant="outline" size="sm">
          Auditoria Ativa
        </Badge>
      </Card>
    </div>
  );
}
