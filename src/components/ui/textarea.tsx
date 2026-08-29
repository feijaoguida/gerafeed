import * as React from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError = false, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        aria-invalid={hasError ? "true" : undefined}
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border bg-surface-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:bg-surface",
          "disabled:cursor-not-allowed disabled:opacity-50",
          hasError
            ? "border-rose-500 focus-visible:ring-rose-500"
            : "border-border hover:border-input-hover focus-visible:border-primary",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
