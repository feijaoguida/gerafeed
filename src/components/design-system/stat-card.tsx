import * as React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  trend?: string | number;
  trendDirection?: "up" | "down" | "neutral";
  trendPeriod?: string;
  action?: React.ReactNode;
  variant?: "default" | "elevated" | "interactive";
}

export function StatCard({
  title,
  value,
  description,
  icon,
  badge,
  trend,
  trendDirection = "neutral",
  trendPeriod,
  action,
  variant = "default",
  className,
  ...props
}: StatCardProps) {
  const isPositive = trendDirection === "up";
  const isNegative = trendDirection === "down";

  return (
    <Card variant={variant} className={cn("relative overflow-hidden", className)} {...props}>
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
              {title}
            </span>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
          {icon && (
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <div className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {value}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>

        {(trend !== undefined || description) && (
          <div className="mt-3 flex items-center gap-2 text-xs flex-wrap">
            {trend !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded-sm",
                  isPositive && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                  isNegative && "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                  !isPositive && !isNegative && "bg-muted text-muted-foreground"
                )}
              >
                {isPositive && <TrendingUp className="h-3 w-3" aria-hidden="true" />}
                {isNegative && <TrendingDown className="h-3 w-3" aria-hidden="true" />}
                {!isPositive && !isNegative && <Minus className="h-3 w-3" aria-hidden="true" />}
                {trend}
              </span>
            )}
            {trendPeriod && (
              <span className="text-muted-foreground">{trendPeriod}</span>
            )}
            {description && !trendPeriod && (
              <span className="text-muted-foreground">{description}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
