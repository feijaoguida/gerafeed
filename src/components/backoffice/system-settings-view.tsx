"use client";

import React, { useState, useEffect } from "react";
import {
  Trash2,
  Save,
  Clock,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Layers,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/design-system/page-header";
import { useToast } from "@/components/ui/toast";

interface SettingsStats {
  totalLogs: number;
  oldestLogDate: string | null;
  retentionDays: number;
  eligibleForCleanupCount: number;
}

export function SystemSettingsView() {
  const { toast } = useToast();
  const [retentionDays, setRetentionDays] = useState<number>(180);
  const [stats, setStats] = useState<SettingsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadSettings() {
      try {
        const res = await fetch("/api/backoffice/settings");
        if (!res.ok) {
          throw new Error("Erro ao carregar configurações");
        }
        const data = await res.json();
        if (!ignore) {
          if (data.settings?.error_log_retention_days) {
            setRetentionDays(data.settings.error_log_retention_days);
          }
          if (data.stats) {
            setStats(data.stats);
          }
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          console.error(err);
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      ignore = true;
    };
  }, []);

  const handleRefreshStats = async () => {
    try {
      const res = await fetch("/api/backoffice/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.stats) setStats(data.stats);
      }
    } catch {
      // Ignora erro
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (retentionDays < 1 || retentionDays > 3650) {
      toast.error("O tempo de retenção deve ser entre 1 e 3650 dias.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/backoffice/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "error_log_retention_days",
          value: retentionDays,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao salvar");
      }

      toast.success("Configuração de retenção salva com sucesso!");
      handleRefreshStats();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleCleanup = async () => {
    const confirmMessage = `Tem certeza que deseja apagar todos os registros de erro com mais de ${retentionDays} dias?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setCleaning(true);
    setCleanupResult(null);
    try {
      const res = await fetch("/api/backoffice/settings/cleanup-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retentionDays }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Falha ao executar limpeza");
      }

      const data = await res.json();
      setCleanupResult(data.message);
      toast.success(
        data.deletedCount > 0
          ? `${data.deletedCount} logs excluídos com sucesso!`
          : "Nenhum log com mais de 180 dias encontrado para exclusão."
      );
      handleRefreshStats();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao executar limpeza");
    } finally {
      setCleaning(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">Carregando configurações do sistema...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Configurações do Sistema"
        description="Gerenciamento de parâmetros globais, políticas de governança e ciclo de vida de dados."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Política de Retenção */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Retenção de Logs de Erro
                </h3>
                <p className="text-xs text-muted-foreground">
                  Define o prazo máximo que registros de diagnóstico permanecem gravados.
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-2">
              <div className="space-y-2">
                <label
                  htmlFor="retention-days-input"
                  className="text-xs font-semibold text-foreground flex items-center justify-between"
                >
                  <span>Prazo de Retenção (dias)</span>
                  <span className="text-muted-foreground font-normal">Padrão: 180 dias</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    id="retention-days-input"
                    type="number"
                    min={1}
                    max={3650}
                    value={retentionDays}
                    onChange={(e) => setRetentionDays(parseInt(e.target.value, 10) || 0)}
                    className="h-10 text-sm font-mono"
                    required
                  />
                  <Button
                    type="submit"
                    disabled={saving}
                    className="gap-2 shrink-0 h-10 px-4"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-muted/50 border border-border text-xs text-muted-foreground leading-relaxed">
                Registros com data de criação anterior ao limite configurado (ex: 180 dias)
                são elegíveis para expurgo na rotina de limpeza, mantendo o banco leve e otimizado.
              </div>
            </form>
          </div>
        </div>

        {/* Card 2: Rotina de Limpeza e Manutenção */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Rotina de Limpeza do Banco
                </h3>
                <p className="text-xs text-muted-foreground">
                  Expurgo manual de registros antigos da tabela de erros.
                </p>
              </div>
            </div>

            {/* Métricas do Banco */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-surface-muted/40 border border-border">
                <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Total Armazenado
                </p>
                <p className="text-xl font-bold text-foreground font-mono mt-1">
                  {stats?.totalLogs ?? 0}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-surface-muted/40 border border-border">
                <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Elegíveis para Limpeza
                </p>
                <p className="text-xl font-bold text-amber-500 font-mono mt-1">
                  {stats?.eligibleForCleanupCount ?? 0}
                </p>
              </div>
            </div>

            {stats?.oldestLogDate && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Registro mais antigo:{" "}
                <span className="font-mono text-foreground font-medium">
                  {new Date(stats.oldestLogDate).toLocaleDateString("pt-BR")}
                </span>
              </p>
            )}

            {cleanupResult && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {cleanupResult}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border">
            <Button
              onClick={handleCleanup}
              disabled={cleaning}
              variant="outline"
              className="w-full gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
            >
              <Trash2 className="w-4 h-4" />
              {cleaning ? "Executando limpeza..." : `Limpar registros com mais de ${retentionDays} dias agora`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
