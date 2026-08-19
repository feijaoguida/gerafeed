"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Power,
  X,
  Check,
} from "lucide-react";

export interface CompanyStats {
  membersCount: number;
  sourcesCount: number;
  activeSourcesCount: number;
  wordpressCount: number;
  articlesProcessedThisMonth: number;
  maxArticles: number;
  maxSources: number;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  createdAt: string;
  plan: {
    name: string;
    slug: string;
  };
  stats: CompanyStats;
}

export interface PlanOption {
  id: string;
  name: string;
  slug: string;
}

interface CompanyListProps {
  initialPlans: PlanOption[];
  initialCompanies?: Company[];
  initialTotal?: number;
  initialTotalPages?: number;
}

export function CompanyList({
  initialPlans,
  initialCompanies = [],
  initialTotal = 0,
  initialTotalPages = 1,
}: CompanyListProps) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");

  // Modal create
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newPlanSlug, setNewPlanSlug] = useState("free");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (planFilter !== "all") params.set("plan", planFilter);

    fetch(`/api/backoffice/companies?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data.companies) {
          setCompanies(data.companies);
          setTotal(data.pagination?.total || 0);
          setTotalPages(data.pagination?.totalPages || 1);
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar empresas:", err);
      });

    return () => {
      active = false;
    };
  }, [page, pageSize, search, statusFilter, planFilter, refreshKey]);

  const handleToggleActive = async (company: Company) => {
    const nextActive = !company.active;
    const confirmMsg = nextActive
      ? `Reativar a empresa "${company.name}"?`
      : `Deseja inativar o acesso da empresa "${company.name}"?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/backoffice/companies/${company.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: nextActive }),
      });

      if (res.ok) {
        setCompanies((prev) =>
          prev.map((c) => (c.id === company.id ? { ...c, active: nextActive } : c))
        );
        setAlertMsg({
          type: "success",
          text: `Empresa "${company.name}" ${nextActive ? "ativada" : "inativada"} com sucesso.`,
        });
      } else {
        const err = await res.json();
        setAlertMsg({ type: "error", text: err.error || "Falha ao alterar status." });
      }
    } catch {
      setAlertMsg({ type: "error", text: "Erro ao comunicar com o servidor." });
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlertMsg(null);

    try {
      const res = await fetch("/api/backoffice/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          slug: newSlug,
          planSlug: newPlanSlug,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar empresa.");

      setIsCreateOpen(false);
      setNewName("");
      setNewSlug("");
      setAlertMsg({ type: "success", text: `Empresa "${data.name}" cadastrada com sucesso!` });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setAlertMsg({ type: "error", text: err instanceof Error ? err.message : "Erro ao cadastrar." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-sky-400" />
            Empresas & Workspaces
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Gerenciamento global de tenants, planos associados, consumo de cotas e status de operação.
          </p>
        </div>
        <button
          onClick={() => {
            setAlertMsg(null);
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition shadow-md shadow-amber-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Empresa</span>
        </button>
      </div>

      {/* Global Alerts */}
      {alertMsg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            alertMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/20 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {alertMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{alertMsg.text}</span>
          </div>
          <button onClick={() => setAlertMsg(null)} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar empresa por nome ou slug..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>

          {/* Plan Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-400">Plano:</span>
            <select
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">Todos os Planos</option>
              {initialPlans.map((p) => (
                <option key={p.id} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-zinc-500 font-mono">
            {total} empresa(s)
          </span>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/80 text-zinc-400 uppercase font-mono text-[10px] border-b border-zinc-800">
              <tr>
                <th className="py-3.5 px-4">Empresa / Slug</th>
                <th className="py-3.5 px-4">Plano</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Uso de Artigos (Mês)</th>
                <th className="py-3.5 px-4">Feeds RSS</th>
                <th className="py-3.5 px-4">Sites WP</th>
                <th className="py-3.5 px-4">Membros</th>
                <th className="py-3.5 px-4">Criado em</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-500 italic">
                    Nenhuma empresa encontrada com os filtros atuais.
                  </td>
                </tr>
              ) : (
                companies.map((company) => {
                  const articlePercent =
                    company.stats.maxArticles > 0
                      ? Math.min(
                          Math.round(
                            (company.stats.articlesProcessedThisMonth / company.stats.maxArticles) *
                              100
                          ),
                          100
                        )
                      : 0;

                  return (
                    <tr key={company.id} className="hover:bg-zinc-900/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{company.name}</div>
                        <div className="text-[11px] font-mono text-zinc-500">{company.slug}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {company.plan.name}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                            company.active
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}
                        >
                          {company.active ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              Ativa
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                              Inativa
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono text-zinc-200">
                              {company.stats.articlesProcessedThisMonth} /{" "}
                              {company.stats.maxArticles === -1
                                ? "∞"
                                : company.stats.maxArticles}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {company.stats.maxArticles === -1 ? "100%" : `${articlePercent}%`}
                            </span>
                          </div>
                          {company.stats.maxArticles !== -1 && (
                            <div className="w-28 h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  articlePercent >= 90
                                    ? "bg-rose-500"
                                    : articlePercent >= 70
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                }`}
                                style={{ width: `${articlePercent}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-300">
                        {company.stats.activeSourcesCount} /{" "}
                        {company.stats.maxSources === -1 ? "∞" : company.stats.maxSources}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-300">
                        {company.stats.wordpressCount}
                      </td>
                      <td className="py-3 px-4 text-zinc-400">
                        {company.stats.membersCount}
                      </td>
                      <td className="py-3 px-4 text-zinc-500 whitespace-nowrap">
                        {new Date(company.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(company)}
                            title={company.active ? "Inativar Empresa" : "Reativar Empresa"}
                            className={`p-1.5 rounded-lg border transition ${
                              company.active
                                ? "bg-zinc-900 text-zinc-400 hover:text-rose-400 hover:border-rose-500/30 border-zinc-800"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            href={`/backoffice/companies/${company.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800 font-medium text-xs transition"
                          >
                            <span>Detalhes</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span>
              Página {page} de {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Company Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-400" />
                Nova Empresa / Workspace
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Nome da Empresa / Organização
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (!newSlug) {
                      setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-"));
                    }
                  }}
                  placeholder="Ex: Portal de Notícias Alpha"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Slug do Workspace (Único)
                </label>
                <input
                  type="text"
                  required
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="Ex: portal-alpha"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Plano Inicial
                </label>
                <select
                  value={newPlanSlug}
                  onChange={(e) => setNewPlanSlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {initialPlans.map((p) => (
                    <option key={p.id} value={p.slug}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? "Criando..." : "Criar Empresa"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
