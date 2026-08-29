import * as React from "react";
import { cn } from "@/lib/cn";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  label?: string;
  description?: string;
  showValue?: boolean;
  variant?: "default" | "gradient" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value,
      max = 100,
      label,
      description,
      showValue = false,
      variant = "default",
      size = "md",
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max(0, Math.round((value / max) * 100)), 100);

    const sizeStyles = {
      sm: "h-1.5",
      md: "h-2.5",
      lg: "h-4",
    };

    const variantStyles = {
      default: "bg-primary",
      gradient: "bg-gradient-to-r from-[#2563EB] to-[#7C3AED]",
      success: "bg-emerald-500",
      warning: "bg-amber-500",
      danger: "bg-rose-500",
    };

    return (
      <div className={cn("w-full space-y-1.5", className)} ref={ref} {...props}>
        {(label || showValue) && (
          <div className="flex items-center justify-between text-xs font-medium">
            {label && <span className="text-foreground">{label}</span>}
            {showValue && (
              <span className="text-muted-foreground ml-auto">{percentage}%</span>
            )}
          </div>
        )}

        <div
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          className={cn(
            "w-full overflow-hidden rounded-full bg-secondary/80",
            sizeStyles[size]
          )}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300 ease-out",
              variantStyles[variant]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    );
  }
);

Progress.displayName = "Progress";
