import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary/10 text-primary border border-primary/20",
        secondary:
          "bg-secondary text-secondary-foreground border border-border",
        success:
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
        warning:
          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
        danger:
          "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
        info:
          "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20",
        purple:
          "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
        outline:
          "border border-border text-foreground bg-transparent",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px]",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export type SystemStatus =
  | "ACTIVE"
  | "PENDING"
  | "PUBLISHED"
  | "REJECTED"
  | "FAILED"
  | "PROCESSING"
  | "CONNECTED"
  | "DISCONNECTED"
  | "PAST_DUE"
  | "SUSPENDED"
  | "REWRITTEN";

const statusVariantMap: Record<SystemStatus, VariantProps<typeof badgeVariants>["variant"]> = {
  ACTIVE: "success",
  CONNECTED: "success",
  PUBLISHED: "success",
  PENDING: "warning",
  PAST_DUE: "warning",
  PROCESSING: "info",
  REWRITTEN: "purple",
  REJECTED: "danger",
  FAILED: "danger",
  DISCONNECTED: "danger",
  SUSPENDED: "danger",
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  status?: SystemStatus;
  dot?: boolean;
}

export function Badge({
  className,
  variant,
  size,
  status,
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const resolvedVariant = status ? statusVariantMap[status] : variant;

  return (
    <div
      className={cn(badgeVariants({ variant: resolvedVariant, size }), className)}
      {...props}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-current shrink-0"
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}
