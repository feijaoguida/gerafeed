import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";

export const alertVariants = cva(
  "relative w-full rounded-xl border p-4 text-sm transition-all duration-150 flex items-start gap-3",
  {
    variants: {
      variant: {
        default:
          "bg-surface text-foreground border-border",
        info:
          "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
        success:
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
        warning:
          "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/25",
        destructive:
          "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const alertIcons = {
  default: Info,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: AlertCircle,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  onClose?: () => void;
  icon?: React.ReactNode;
}

export function Alert({
  className,
  variant = "default",
  title,
  icon,
  onClose,
  children,
  ...props
}: AlertProps) {
  const IconComponent = alertIcons[variant || "default"];

  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <span className="shrink-0 mt-0.5" aria-hidden="true">
        {icon || <IconComponent className="h-5 w-5" />}
      </span>

      <div className="flex-1 min-w-0 space-y-1">
        {title && (
          <h5 className="font-heading font-semibold text-sm leading-tight">
            {title}
          </h5>
        )}
        {children && (
          <div className="font-sans text-xs sm:text-sm opacity-90 leading-relaxed">
            {children}
          </div>
        )}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar alerta"
          className="shrink-0 rounded-md p-1 opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-opacity cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
