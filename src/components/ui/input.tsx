import * as React from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type = "text", hasError = false, leadingIcon, trailingIcon, ...props },
    ref
  ) => {
    return (
      <div className="relative flex items-center w-full">
        {leadingIcon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-muted-foreground">
            {leadingIcon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          aria-invalid={hasError ? "true" : undefined}
          className={cn(
            "flex h-10 w-full rounded-lg border bg-surface-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:bg-surface",
            "disabled:cursor-not-allowed disabled:opacity-50",
            hasError
              ? "border-rose-500 focus-visible:ring-rose-500"
              : "border-border hover:border-input-hover focus-visible:border-primary",
            leadingIcon && "pl-10",
            trailingIcon && "pr-10",
            className
          )}
          {...props}
        />
        {trailingIcon && (
          <div className="absolute right-3 flex items-center text-muted-foreground">
            {trailingIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
