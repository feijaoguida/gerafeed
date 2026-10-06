"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Search,
  RefreshCw,
  Building2,
  Layers,
  Eye,
  Copy,
  Check,
  X,
  Clock,
  Globe,
  Code2,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/design-system/page-header";

export interface ErrorLogItem {
  id: string;
  workspaceId: string | null;
  workspace?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  screen: string | null;
  path: string;
  method: string | null;
  query: unknown;
  module: string;
  errorMessage: string;
  errorStack: string | null;
  statusCode: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface WorkspaceOption {
  id: string;
  name: string;
  slug: string;
}

export function ErrorLogsViewer() {
  const [logs, setLogs] = useState<ErrorLogItem[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("all");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("7d");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<{ total: number; count24h: number; count7d: number }>({
    total: 0,
    count24h: 0,
    count7d: 0,
  });

  // Modal de Detalhes
  const [selectedLog, setSelectedLog] = useState<ErrorLogItem | null>(null);
  const [copiedStack, setCopiedStack] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "20",
          period: selectedPeriod,
        });

        if (selectedWorkspace !== "all") {
          params.append("workspaceId", selectedWorkspace);
        }
        if (selectedModule !== "all") {
          params.append("module", selectedModule);
        }
        if (searchTerm.trim()) {
          params.append("search", searchTerm.trim());
        }

        const res = await fetch(`/api/backoffice/error-logs?${params.toString()}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Erro ao carregar logs");
        }

        const data = await res.json();
        if (!ignore) {
          setLogs(data.logs || []);
          setWorkspaces(data.workspaces || []);
          setTotalPages(data.pagination?.totalPages || 1);
          setTotalCount(data.pagination?.total || 0);
          if (data.stats) {
            setStats(data.stats);
          }
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Erro desconhecido");
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [page, selectedWorkspace, selectedModule, selectedPeriod, searchTerm]);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        period: selectedPeriod,
      });

      if (selectedWorkspace !== "all") {
        params.append("workspaceId", selectedWorkspace);
      }
      if (selectedModule !== "all") {
        params.append("module", selectedModule);
      }
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      const res = await fetch(`/api/backoffice/error-logs?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao carregar logs");
      }

      const data = await res.json();
      setLogs(data.logs || []);
      setWorkspaces(data.workspaces || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };


  const handleResetFilters = () => {
    setSelectedWorkspace("all");
    setSelectedModule("all");
    setSelectedPeriod("7d");
    setSearchTerm("");
    setPage(1);
  };

  const copyToClipboard = (text: string, type: "stack" | "payload") => {
    navigator.clipboard.writeText(text);
    if (type === "stack") {
      setCopiedStack(true);
      setTimeout(() => setCopiedStack(false), 2000);
    } else {
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    }
  };

  const getModuleBadgeColor = (moduleName: string) => {
    switch (moduleName) {
      case "AI":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "RSS":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "BILLING":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "WORDPRESS":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "AFFILIATES":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "AUTH":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "BACKOFFICE":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title="Logs de Erro e Diagnóstico"
        description="Monitoramento centralizado de exceções, diagnósticos detalhados e rastreamento de falhas por tenant."
      >
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </PageHeader>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-500/10 text-red-500">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Erros (Últimas 24h)</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">{stats.count24h}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Erros (Últimos 7 dias)</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">{stats.count7d}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Filtrado</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">{totalCount}</p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Busca textual */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por usuário, e-mail, mensagem de erro ou rota..."
              className="pl-9 h-10"
            />
          </div>

          {/* Filtro por Tenant (Workspace) */}
          <div className="w-full md:w-56">
            <select
              value={selectedWorkspace}
              onChange={(e) => {
                setSelectedWorkspace(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl bg-surface-elevated border border-border text-foreground text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-hidden"
              aria-label="Filtrar por Tenant"
            >
              <option value="all">Todos os Tenants</option>
              <option value="none">Sem Tenant (Sistema)</option>
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name} ({ws.slug})
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Módulo */}
          <div className="w-full md:w-44">
            <select
              value={selectedModule}
              onChange={(e) => {
                setSelectedModule(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl bg-surface-elevated border border-border text-foreground text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-hidden"
              aria-label="Filtrar por Módulo"
            >
              <option value="all">Todos os Módulos</option>
              <option value="AI">IA / OpenAI</option>
              <option value="RSS">Fontes RSS</option>
              <option value="BILLING">Faturamento / Asaas</option>
              <option value="WORDPRESS">WordPress</option>
              <option value="AFFILIATES">Afiliados</option>
              <option value="AUTH">Autenticação</option>
              <option value="BACKOFFICE">Backoffice</option>
              <option value="GENERAL">Geral</option>
            </select>
          </div>

          {/* Filtro por Período */}
          <div className="w-full md:w-44">
            <select
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl bg-surface-elevated border border-border text-foreground text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-hidden"
              aria-label="Filtrar por Período"
            >
              <option value="24h">Últimas 24h</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="180d">Últimos 180 dias</option>
              <option value="all">Todo o Histórico</option>
            </select>
          </div>

          {/* Botão Reset */}
          {(selectedWorkspace !== "all" || selectedModule !== "all" || selectedPeriod !== "7d" || searchTerm) && (
            <Button
              onClick={handleResetFilters}
              variant="ghost"
              size="sm"
              className="h-10 text-muted-foreground hover:text-foreground shrink-0"
            >
              <X className="w-4 h-4 mr-1.5" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Erro de busca */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Tabela de Logs */}
      <div className="rounded-2xl bg-card border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Data / Hora</th>
                <th className="py-3.5 px-4">Tenant / Empresa</th>
                <th className="py-3.5 px-4">Módulo</th>
                <th className="py-3.5 px-4">Usuário</th>
                <th className="py-3.5 px-4">Tela / Rota</th>
                <th className="py-3.5 px-4">Mensagem de Erro</th>
                <th className="py-3.5 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Carregando logs de erro...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <AlertTriangle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    Nenhum registro de erro encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-surface-muted/40 transition-colors group cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    {/* Data */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    {/* Tenant */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {log.workspace ? (
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                          {log.workspace.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/70 italic flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5" />
                          Sistema / Global
                        </span>
                      )}
                    </td>

                    {/* Módulo */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getModuleBadgeColor(
                          log.module
                        )}`}
                      >
                        {log.module}
                      </span>
                    </td>

                    {/* Usuário */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {log.userEmail ? (
                        <div>
                          <p className="font-medium text-foreground">{log.userName || "Usuário"}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{log.userEmail}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60 italic">Anônimo / Cron</span>
                      )}
                    </td>

                    {/* Tela / Rota */}
                    <td className="py-3.5 px-4 max-w-xs truncate">
                      {log.screen && (
                        <p className="font-medium text-foreground truncate">{log.screen}</p>
                      )}
                      <p className="text-[11px] text-muted-foreground font-mono truncate">
                        <span className="font-semibold text-primary/80 mr-1">{log.method || "GET"}</span>
                        {log.path}
                      </p>
                    </td>

                    {/* Mensagem de Erro Bruta */}
                    <td className="py-3.5 px-4 max-w-md">
                      <p className="text-red-400 font-mono text-[11px] truncate" title={log.errorMessage}>
                        {log.errorMessage}
                      </p>
                    </td>

                    {/* Ação */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Detalhes
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Página {page} de {totalPages} ({totalCount} registros no total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Erro */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-card border border-border rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-start justify-between bg-surface-muted/30">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${getModuleBadgeColor(
                      selectedLog.module
                    )}`}
                  >
                    {selectedLog.module}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    Status: {selectedLog.statusCode || 500}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    ID: {selectedLog.id}
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground">
                  Diagnóstico e Simulação do Erro
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Contexto Rápido */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-surface-muted/40 border border-border">
                <div>
                  <span className="text-muted-foreground font-semibold">Tenant (Empresa):</span>{" "}
                  <span className="text-foreground font-medium">
                    {selectedLog.workspace?.name || "Global / Sem Workspace"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold">Data / Hora:</span>{" "}
                  <span className="text-foreground font-mono">
                    {new Date(selectedLog.createdAt).toLocaleString("pt-BR")}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold">Usuário:</span>{" "}
                  <span className="text-foreground font-mono">
                    {selectedLog.userEmail || "Anônimo"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold">Tela:</span>{" "}
                  <span className="text-foreground">{selectedLog.screen || "Não identificada"}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground font-semibold">Caminho / Rota:</span>{" "}
                  <span className="text-primary font-mono font-semibold">
                    {selectedLog.method || "GET"} {selectedLog.path}
                  </span>
                </div>
                {selectedLog.ipAddress && (
                  <div>
                    <span className="text-muted-foreground font-semibold">IP:</span>{" "}
                    <span className="text-foreground font-mono">{selectedLog.ipAddress}</span>
                  </div>
                )}
                {selectedLog.userAgent && (
                  <div className="sm:col-span-2 truncate">
                    <span className="text-muted-foreground font-semibold">User-Agent:</span>{" "}
                    <span className="text-muted-foreground font-mono" title={selectedLog.userAgent}>
                      {selectedLog.userAgent}
                    </span>
                  </div>
                )}
              </div>

              {/* Mensagem de Erro Bruta */}
              <div className="space-y-1.5">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Mensagem Original que estourou antes do tratamento:
                </p>
                <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 text-red-300 font-mono text-xs leading-relaxed select-all">
                  {selectedLog.errorMessage}
                </div>
              </div>

              {/* Consulta / Payload de Entrada (Para Simulação) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-cyan-500" />
                    Consulta / Payload de Entrada (Para Simulação):
                  </p>
                  {Boolean(selectedLog.query) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        copyToClipboard(JSON.stringify(selectedLog.query, null, 2), "payload")
                      }
                      className="h-7 text-[11px] gap-1 text-muted-foreground"
                    >
                      {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedPayload ? "Copiado!" : "Copiar JSON"}
                    </Button>
                  )}
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-border text-zinc-300 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-48">
                  {selectedLog.query ? (
                    <pre>{JSON.stringify(selectedLog.query, null, 2)}</pre>
                  ) : (
                    <span className="text-muted-foreground italic">Nenhum payload de entrada registrado.</span>
                  )}
                </div>
              </div>

              {/* Stack Trace */}
              {selectedLog.errorStack && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      <Code2 className="w-4 h-4 text-purple-400" />
                      Stack Trace Completo:
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(selectedLog.errorStack || "", "stack")}
                      className="h-7 text-[11px] gap-1 text-muted-foreground"
                    >
                      {copiedStack ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedStack ? "Copiado!" : "Copiar Stack"}
                    </Button>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-border text-zinc-300 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-56 select-all">
                    <pre>{selectedLog.errorStack}</pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border flex justify-end bg-surface-muted/30">
              <Button onClick={() => setSelectedLog(null)} variant="outline" size="sm">
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
