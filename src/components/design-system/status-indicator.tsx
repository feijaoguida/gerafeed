import * as React from "react";
import { cn } from "@/lib/cn";
import { type SystemStatus } from "@/components/ui/badge";

export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: SystemStatus;
  label?: string;
  showLabel?: boolean;
  pulse?: boolean;
  size?: "sm" | "md" | "lg";
}

const defaultStatusLabels: Record<SystemStatus, string> = {
  ACTIVE: "Ativo",
  CONNECTED: "Conectado",
  PUBLISHED: "Publicado",
  PENDING: "Pendente",
  PAST_DUE: "Atrasado",
  PROCESSING: "Processando",
  REWRITTEN: "Reescrito",
  REJECTED: "Rejeitado",
  FAILED: "Falhou",
  DISCONNECTED: "Desconectado",
  SUSPENDED: "Suspenso",
};

const statusColors: Record<SystemStatus, { bg: string; dot: string; pulse: string }> = {
  ACTIVE: {
    bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    pulse: "bg-emerald-400",
  },
  CONNECTED: {
    bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    pulse: "bg-emerald-400",
  },
  PUBLISHED: {
    bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    pulse: "bg-emerald-400",
  },
  PENDING: {
    bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
    pulse: "bg-amber-400",
  },
  PAST_DUE: {
    bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
    pulse: "bg-amber-400",
  },
  PROCESSING: {
    bg: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    dot: "bg-sky-500",
    pulse: "bg-sky-400",
  },
  REWRITTEN: {
    bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    dot: "bg-purple-500",
    pulse: "bg-purple-400",
  },
  REJECTED: {
    bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
    pulse: "bg-rose-400",
  },
  FAILED: {
    bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
    pulse: "bg-rose-400",
  },
  DISCONNECTED: {
    bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
    pulse: "bg-rose-400",
  },
  SUSPENDED: {
    bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
    pulse: "bg-rose-400",
  },
};

export function StatusIndicator({
  status,
  label,
  showLabel = true,
  pulse = false,
  size = "md",
  className,
  ...props
}: StatusIndicatorProps) {
  const config = statusColors[status] || statusColors.PENDING;
  const displayLabel = label ?? defaultStatusLabels[status];
  const shouldPulse = pulse || status === "PROCESSING";

  const sizeConfig = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-2.5 w-2.5",
  };

  return (
    <span
      className={cn("inline-flex items-center gap-2 text-xs font-medium", className)}
      {...props}
    >
      <span className="relative flex h-2.5 w-2.5 items-center justify-center">
        {shouldPulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              config.pulse
            )}
          />
        )}
        <span
          className={cn(
            "relative inline-flex rounded-full",
            sizeConfig[size],
            config.dot
          )}
        />
      </span>
      {showLabel && (
        <span className="text-foreground/90 select-none">{displayLabel}</span>
      )}
    </span>
  );
}
