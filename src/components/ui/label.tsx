import * as React from "react";
import { cn } from "@/lib/cn";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "font-sans text-xs sm:text-sm font-medium text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 select-none inline-flex items-center gap-1",
          className
        )}
        {...props}
      >
        {children}
        {required && (
          <span className="text-rose-500 font-semibold" aria-hidden="true">
            *
          </span>
        )}
      </label>
    );
  }
);

Label.displayName = "Label";
