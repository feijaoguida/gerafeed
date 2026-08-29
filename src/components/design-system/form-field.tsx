import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  id?: string;
  label?: string;
  required?: boolean;
  description?: string;
  error?: string;
  children: React.ReactNode;
}

export function FormField({
  id: explicitId,
  label,
  required = false,
  description,
  error,
  children,
  className,
  ...props
}: FormFieldProps) {
  const generatedId = React.useId();
  const id = explicitId || generatedId;
  const descriptionId = description ? `${id}-desc` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn("space-y-1.5 w-full", className)} {...props}>
      {label && (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      )}

      {/* Render children com injeção automática de id se for elemento React válido */}
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<{
            id?: string;
            hasError?: boolean;
            "aria-describedby"?: string;
          }>, {
            id: (children as React.ReactElement<{ id?: string }>).props.id || id,
            hasError: Boolean(error),
            "aria-describedby":
              errorId || descriptionId || undefined,
          })
        : children}

      {error ? (
        <p id={errorId} className="text-xs font-medium text-rose-500 flex items-center gap-1">
          {error}
        </p>
      ) : description ? (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
