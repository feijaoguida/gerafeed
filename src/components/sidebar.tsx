"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  Rss,
  Globe,
  Sparkles,
  Image as ImageIcon,
  ShieldAlert,
  Menu,
  X,
  LogOut,
  ShoppingBag,
  ArrowDownToLine,
  Package,
  Tag,
  FileText,
  TrendingUp,
  Lock,
  Send,
  CreditCard,
} from "lucide-react";

import { ThemeToggle, ThemeToggleRow } from "@/components/theme-toggle";
import { PlanUsageCard } from "@/components/plan-usage-card";
import { Badge } from "@/components/ui/badge";
import {
  SidebarItem,
  SidebarSection,
  SidebarSectionLabel,
} from "@/components/layout/sidebar-primitives";
import { Logo } from "@/components/brand/logo";

export function Sidebar({
  isSuperAdmin = false,
  hasAffiliateModule = false,
}: {
  isSuperAdmin?: boolean;
  hasAffiliateModule?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status");

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (path: string, statusFilter?: string) => {
    if (statusFilter !== undefined) {
      return pathname === "/dashboard" && currentStatus === statusFilter;
    }
    if (path === "/dashboard") {
      return (
        pathname === "/dashboard" && (!currentStatus || currentStatus === "PENDING")
      );
    }
    return pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2.5 rounded-xl bg-surface border border-border text-foreground hover:bg-surface-muted shadow-md cursor-pointer transition-colors"
        aria-label="Alternar menu"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Backdrop for Mobile */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-30 w-64 bg-surface border-r border-border flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 select-none ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-4 space-y-6 overflow-y-auto flex-1">
          {/* Brand Header com Logo Oficial */}
          <div className="flex items-center justify-between px-1 py-1">
            <div onClick={() => setIsMobileOpen(false)}>
              <Logo href="/dashboard" size="sm" priority />
            </div>
            <ThemeToggle />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-6">
            {/* Seção Principal */}
            <SidebarSection>
              <SidebarItem
                href="/dashboard"
                label="Dashboard"
                icon={<LayoutDashboard className="w-4 h-4" />}
                active={isActive("/dashboard", undefined) && !currentStatus}
                onClick={() => setIsMobileOpen(false)}
              />
              <SidebarItem
                href="/publishing"
                label="Publicar Posts"
                icon={<Send className="w-4 h-4" />}
                active={isActive("/publishing")}
                onClick={() => setIsMobileOpen(false)}
              />
            </SidebarSection>

            {/* Módulo de Afiliados */}
            <SidebarSection>
              <SidebarSectionLabel className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShoppingBag className="w-3 h-3 text-[#00C2A8]" />
                  <span>Afiliados</span>
                </span>
                {!hasAffiliateModule && (
                  <Badge variant="warning" size="sm">
                    PRO
                  </Badge>
                )}
              </SidebarSectionLabel>

              {hasAffiliateModule ? (
                <>
                  <SidebarItem
                    href="/affiliates/import"
                    label="Importar Produto"
                    icon={<ArrowDownToLine className="w-4 h-4" />}
                    active={isActive("/affiliates/import")}
                    onClick={() => setIsMobileOpen(false)}
                  />
                  <SidebarItem
                    href="/affiliates/products"
                    label="Catálogo de Produtos"
                    icon={<Package className="w-4 h-4" />}
                    active={isActive("/affiliates/products")}
                    onClick={() => setIsMobileOpen(false)}
                  />
                  <SidebarItem
                    href="/affiliates/offers"
                    label="Ofertas"
                    icon={<Tag className="w-4 h-4" />}
                    active={isActive("/affiliates/offers")}
                    onClick={() => setIsMobileOpen(false)}
                  />
                  <SidebarItem
                    href="/affiliates/prompts"
                    label="Prompts Afiliados"
                    icon={<FileText className="w-4 h-4" />}
                    active={isActive("/affiliates/prompts")}
                    onClick={() => setIsMobileOpen(false)}
                  />
                  <SidebarItem
                    href="/affiliates/dashboard"
                    label="Analytics Afiliados"
                    icon={<TrendingUp className="w-4 h-4" />}
                    active={isActive("/affiliates/dashboard")}
                    onClick={() => setIsMobileOpen(false)}
                  />
                </>
              ) : (
                <SidebarItem
                  href="/settings/billing/upgrade"
                  label="Módulo Afiliados"
                  icon={<Lock className="w-4 h-4 text-amber-500" />}
                  badge={
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase">
                      Upgrade
                    </span>
                  }
                  onClick={() => setIsMobileOpen(false)}
                />
              )}
            </SidebarSection>

            {/* Configurações */}
            <SidebarSection>
              <SidebarSectionLabel className="flex items-center gap-1.5">
                <Settings className="w-3 h-3 text-muted-foreground" />
                <span>Configurações</span>
              </SidebarSectionLabel>

              <SidebarItem
                href="/settings/billing"
                label="Plano & Cobrança"
                icon={<CreditCard className="w-4 h-4 text-amber-500 dark:text-amber-400" />}
                active={isActive("/settings/billing")}
                onClick={() => setIsMobileOpen(false)}
              />
              <SidebarItem
                href="/settings/sources"
                label="Fontes RSS"
                icon={<Rss className="w-4 h-4 text-primary" />}
                active={isActive("/settings/sources")}
                onClick={() => setIsMobileOpen(false)}
              />
              <SidebarItem
                href="/settings/wordpress"
                label="WordPress"
                icon={<Globe className="w-4 h-4 text-[#38BDF8]" />}
                active={isActive("/settings/wordpress")}
                onClick={() => setIsMobileOpen(false)}
              />
              <SidebarItem
                href="/settings/ai"
                label="Inteligência Artificial"
                icon={<Sparkles className="w-4 h-4 text-[#C084FC]" />}
                active={isActive("/settings/ai")}
                onClick={() => setIsMobileOpen(false)}
              />
              <SidebarItem
                href="/settings/images"
                label="Estratégia de Imagens"
                icon={<ImageIcon className="w-4 h-4 text-[#8B5CF6]" />}
                active={isActive("/settings/images")}
                onClick={() => setIsMobileOpen(false)}
              />
            </SidebarSection>

            {/* Tema e Governança */}
            <div className="pt-2 border-t border-border space-y-1">
              <ThemeToggleRow />
            </div>

            {/* Link para Backoffice SuperAdmin */}
            {isSuperAdmin && (
              <div className="pt-2 border-t border-border">
                <Link
                  href="/backoffice"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>Superadmin Backoffice</span>
                </Link>
              </div>
            )}

            {/* Logout */}
            <div className="pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Sair do Sistema</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Plan Usage Card & Footer */}
        <div className="p-4 border-t border-border space-y-3 bg-surface-muted/30">
          <PlanUsageCard />
          <div className="flex items-center justify-between text-[11px] pt-1 text-muted-foreground">
            <span className="font-heading font-medium">GeraFeed v1.0</span>
            <span>Seguro & Criptografado</span>
          </div>
        </div>
      </aside>
    </>
  );
}
