import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, hasError = false, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          aria-invalid={hasError ? "true" : undefined}
          className={cn(
            "flex h-10 w-full appearance-none rounded-lg border bg-surface-muted/50 px-3 py-2 pr-9 text-sm text-foreground transition-all duration-150 cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:bg-surface",
            "disabled:cursor-not-allowed disabled:opacity-50",
            hasError
              ? "border-rose-500 focus-visible:ring-rose-500"
              : "border-border hover:border-input-hover focus-visible:border-primary",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    );
  }
);

Select.displayName = "Select";
