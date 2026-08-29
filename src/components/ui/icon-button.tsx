import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export const iconButtonVariants = cva(
  "inline-flex items-center justify-center rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer shrink-0",
  {
    variants: {
      variant: {
        ghost: "hover:bg-muted text-muted-foreground hover:text-foreground",
        outline: "border border-border bg-transparent hover:bg-muted text-foreground",
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20",
      },
      size: {
        sm: "h-8 w-8 p-1.5",
        md: "h-9 w-9 p-2",
        lg: "h-10 w-10 p-2.5",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "md",
    },
  }
);

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "aria-label">,
    VariantProps<typeof iconButtonVariants> {
  "aria-label": string; // Obrigatório para acessibilidade
  isLoading?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      children,
      disabled,
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        aria-label={ariaLabel}
        disabled={disabled || isLoading}
        className={cn(iconButtonVariants({ variant, size }), className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
        ) : (
          children
        )}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
