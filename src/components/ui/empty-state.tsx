import * as React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-border bg-surface/50",
        className
      )}
      {...props}
    >
      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#2563EB]/10 to-[#7C3AED]/10 text-primary flex items-center justify-center mb-4 border border-primary/10 shadow-xs">
        {icon || <Inbox className="h-7 w-7 text-primary" aria-hidden="true" />}
      </div>

      <h3 className="font-heading text-lg font-semibold text-foreground mb-1.5 tracking-tight">
        {title}
      </h3>

      {description && (
        <p className="font-sans text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
