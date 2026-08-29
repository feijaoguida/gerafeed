"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Power,
  X,
  Check,
} from "lucide-react";

import { PageHeader } from "@/components/design-system/page-header";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/design-system/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";

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
    if (!newName.trim() || !newSlug.trim()) return;

    setIsSubmitting(true);
    setAlertMsg(null);

    try {
      const res = await fetch("/api/backoffice/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          slug: newSlug.trim(),
          planSlug: newPlanSlug,
        }),
      });

      if (res.ok) {
        setAlertMsg({
          type: "success",
          text: `Empresa "${newName}" criada com sucesso no plano ${newPlanSlug}!`,
        });
        setIsCreateOpen(false);
        setNewName("");
        setNewSlug("");
        setNewPlanSlug("free");
        setRefreshKey((k) => k + 1);
      } else {
        const err = await res.json();
        setAlertMsg({ type: "error", text: err.error || "Erro ao criar empresa." });
      }
    } catch {
      setAlertMsg({ type: "error", text: "Erro na requisição ao servidor." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com PageHeader */}
      <PageHeader
        title="Empresas & Tenants"
        description="Gerencie as contas corporativas, limites de consumo, planos contratados e status de operação."
        icon={<Building2 className="w-5 h-5 text-primary" />}
        badge={
          <Badge variant="secondary" size="sm">
            {total} Organizações
          </Badge>
        }
        actions={
          <Button
            variant="gradient"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            leadingIcon={<Plus className="w-4 h-4" />}
          >
            Nova Empresa
          </Button>
        }
      />

      {/* Alerts */}
      {alertMsg && (
        <Alert
          variant={alertMsg.type === "success" ? "success" : "destructive"}
          onClose={() => setAlertMsg(null)}
        >
          {alertMsg.text}
        </Alert>
      )}

      {/* Filter Toolbar */}
      <Card className="p-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-80">
            <Input
              type="text"
              placeholder="Buscar por nome ou slug..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leadingIcon={<Search className="w-4 h-4 text-muted-foreground" />}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground font-medium">Status:</span>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-28 h-9 text-xs"
              >
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </Select>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground font-medium">Plano:</span>
              <Select
                value={planFilter}
                onChange={(e) => {
                  setPlanFilter(e.target.value);
                  setPage(1);
                }}
                className="w-36 h-9 text-xs"
              >
                <option value="all">Todos os Planos</option>
                {initialPlans.map((p) => (
                  <option key={p.id} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Companies Table */}
      <Card className="overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-muted/60 text-muted-foreground uppercase font-mono text-[10px] border-b border-border">
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
            <tbody className="divide-y divide-border text-foreground">
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground italic">
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
                    <tr key={company.id} className="hover:bg-surface-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-heading font-semibold text-foreground">{company.name}</div>
                        <div className="text-[11px] font-mono text-muted-foreground">{company.slug}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="purple" size="sm">
                          {company.plan.name}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={company.active ? "success" : "danger"} size="sm">
                          {company.active ? "Ativa" : "Inativa"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono text-foreground font-semibold">
                              {company.stats.articlesProcessedThisMonth} /{" "}
                              {company.stats.maxArticles === -1
                                ? "∞"
                                : company.stats.maxArticles}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {company.stats.maxArticles === -1 ? "100%" : `${articlePercent}%`}
                            </span>
                          </div>
                          {company.stats.maxArticles !== -1 && (
                            <div className="w-28 h-1.5 bg-surface-muted rounded-full overflow-hidden border border-border">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  articlePercent >= 90
                                    ? "bg-rose-500"
                                    : articlePercent >= 70
                                    ? "bg-amber-500"
                                    : "bg-[#00C2A8]"
                                }`}
                                style={{ width: `${articlePercent}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-foreground">
                        {company.stats.activeSourcesCount} /{" "}
                        {company.stats.maxSources === -1 ? "∞" : company.stats.maxSources}
                      </td>
                      <td className="py-3 px-4 font-mono text-foreground">
                        {company.stats.wordpressCount}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {company.stats.membersCount}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {new Date(company.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(company)}
                            title={company.active ? "Inativar Empresa" : "Reativar Empresa"}
                            className={company.active ? "text-muted-foreground hover:text-rose-500" : "text-[#00C2A8]"}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </Button>
                          <Link href={`/backoffice/companies/${company.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              trailingIcon={<ExternalLink className="w-3 h-3" />}
                            >
                              Detalhes
                            </Button>
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
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Página {page} de {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create Company Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 space-y-4 shadow-2xl bg-surface border-border">
            <CardHeader className="p-0 flex flex-row items-center justify-between border-b border-border pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Nova Empresa / Workspace
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCreateOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>

            <form onSubmit={handleCreateCompany} className="space-y-4">
              <FormField label="Nome da Empresa / Organização" required>
                <Input
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
                />
              </FormField>

              <FormField label="Slug do Workspace (Único)" required>
                <Input
                  type="text"
                  required
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="Ex: portal-alpha"
                />
              </FormField>

              <FormField label="Plano Inicial" required>
                <Select
                  value={newPlanSlug}
                  onChange={(e) => setNewPlanSlug(e.target.value)}
                >
                  {initialPlans.map((p) => (
                    <option key={p.id} value={p.slug}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </FormField>

              <CardFooter className="p-0 flex items-center justify-end gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  size="sm"
                  isLoading={isSubmitting}
                  leadingIcon={<Check className="w-4 h-4" />}
                >
                  Criar Empresa
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
