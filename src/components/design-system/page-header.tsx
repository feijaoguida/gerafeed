import * as React from "react";
import { cn } from "@/lib/cn";

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  icon,
  breadcrumb,
  badge,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-6 border-b border-border/80",
        className
      )}
      {...props}
    >
      <div className="space-y-1.5 min-w-0">
        {breadcrumb && <div className="mb-2">{breadcrumb}</div>}
        <div className="flex items-center gap-3 flex-wrap">
          {icon && (
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#2563EB]/10 to-[#7C3AED]/10 text-primary flex items-center justify-center shrink-0 border border-primary/10">
              {icon}
            </div>
          )}
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate">
            {title}
          </h1>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
        {description && (
          <p className="font-sans text-sm text-muted-foreground max-w-3xl leading-normal">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}
