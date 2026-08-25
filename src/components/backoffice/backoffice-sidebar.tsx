"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  LayoutDashboard,
  Building2,
  Layers,
  Sparkles,
  Settings,
  FileText,
  ArrowLeft,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function BackofficeSidebar({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/backoffice") {
      return pathname === "/backoffice";
    }
    return pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white shadow-lg"
        aria-label="Alternar menu do Backoffice"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Backdrop for Mobile */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-30 bg-black/70 backdrop-blur-sm"
        />
      )}

      {/* Backoffice Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-30 w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                  Backoffice
                </h2>
                <p className="text-[10px] uppercase font-mono tracking-wider text-amber-400">
                  Superadmin
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-6">
            {/* Core Admin Nav */}
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Administração
              </p>

              <Link
                href="/backoffice"
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  isActive("/backoffice")
                    ? "bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-amber-400" />
                Dashboard Geral
              </Link>

              <Link
                href="/backoffice/companies"
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive("/backoffice/companies")
                    ? "bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-sm font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                <Building2 className="w-4 h-4 text-sky-400" />
                Empresas & Tenants
              </Link>

              <Link
                href="/backoffice/plans"
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive("/backoffice/plans")
                    ? "bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-sm font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                <Layers className="w-4 h-4 text-indigo-400" />
                Planos & Features
              </Link>

              <Link
                href="/backoffice/affiliate-prompts"
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive("/backoffice/affiliate-prompts")
                    ? "bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-sm font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                Prompts de Afiliados
              </Link>
            </div>

            {/* System / Audit */}
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Governança & Logs
              </p>

              <Link
                href="/backoffice/audit"
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive("/backoffice/audit")
                    ? "bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-sm font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                Auditoria & Histórico
              </Link>

              <Link
                href="/backoffice/settings"
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive("/backoffice/settings")
                    ? "bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-sm font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                <Settings className="w-4 h-4 text-purple-400" />
                Configurações do Sistema
              </Link>
            </div>
          </nav>
        </div>

        {/* Footer & App Return & Logout */}
        <div className="p-4 border-t border-zinc-800 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg text-xs font-medium bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Workspace App</span>
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Sair do Sistema</span>
          </button>

          <div className="text-center pt-1">
            <span className="text-[10px] text-zinc-500 truncate block max-w-full" title={userEmail || "Superadmin"}>
              {userEmail || "Superadmin"}
            </span>
          </div>
        </div>
      </aside>

    </>
  );
}
