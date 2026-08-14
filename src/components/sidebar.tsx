"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Newspaper,
  Clock,
  CheckCircle2,
  XCircle,
  Settings,
  Rss,
  Globe,
  Sparkles,
  Image as ImageIcon,
  Menu,
  X,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status");

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (path: string, statusFilter?: string) => {
    if (statusFilter !== undefined) {
      return pathname === "/" && currentStatus === statusFilter;
    }
    if (path === "/") {
      return pathname === "/" && (!currentStatus || currentStatus === "PENDING");
    }
    return pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white shadow-lg"
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
        className={`fixed lg:static top-0 left-0 bottom-0 z-30 w-64 bg-zinc-900 border-r border-zinc-800/80 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-4 space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">News Curator</h2>
              <p className="text-[11px] text-zinc-400">Painel Editorial & IA</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-6">
            {/* Dashboard */}
            <div>
              <Link
                href="/"
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  isActive("/", undefined) && pathname === "/" && !currentStatus
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            </div>

            {/* Notícias Fila */}
            <div className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Notícias
              </div>
              <Link
                href="/?status=PENDING"
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive("/", "PENDING")
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                }`}
              >
                <Clock className="w-4 h-4 text-amber-400" />
                Pendentes
              </Link>

              <Link
                href="/?status=PUBLISHED"
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive("/", "PUBLISHED")
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Publicadas
              </Link>

              <Link
                href="/?status=REJECTED"
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive("/", "REJECTED")
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                }`}
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                Rejeitadas
              </Link>
            </div>

            {/* Configurações */}
            <div className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="w-3 h-3" />
                Configurações
              </div>

              <Link
                href="/settings/sources"
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive("/settings/sources")
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                }`}
              >
                <Rss className="w-4 h-4 text-indigo-400" />
                Fontes RSS
              </Link>

              <Link
                href="/settings/wordpress"
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive("/settings/wordpress")
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                }`}
              >
                <Globe className="w-4 h-4 text-sky-400" />
                WordPress
              </Link>

              <Link
                href="/settings/ai"
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive("/settings/ai")
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                }`}
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Inteligência Artificial
              </Link>

              <Link
                href="/settings/images"
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive("/settings/images")
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                }`}
              >
                <ImageIcon className="w-4 h-4 text-purple-400" />
                Estratégia de Imagens
              </Link>
            </div>
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-zinc-800/80 text-[11px] text-zinc-500">
          News Curator v0.2.0 • Phase 2
        </div>
      </aside>
    </>
  );
}
