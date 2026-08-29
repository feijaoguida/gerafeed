import * as React from "react";
import { cn } from "@/lib/cn";

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function SectionHeader({
  title,
  description,
  icon,
  action,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn("flex items-start justify-between gap-4 pb-3", className)}
      {...props}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {icon && <span className="text-primary shrink-0">{icon}</span>}
          <h2 className="font-heading text-lg sm:text-xl font-semibold text-foreground tracking-tight">
            {title}
          </h2>
        </div>
        {description && (
          <p className="font-sans text-xs sm:text-sm text-muted-foreground leading-normal">
            {description}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
