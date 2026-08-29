import * as React from "react";
import { cn } from "@/lib/cn";

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  className?: string;
}

export function Display({ children, className, ...props }: TypographyProps) {
  return (
    <h1
      className={cn(
        "font-heading text-4xl sm:text-5xl font-bold tracking-tight text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

export function Heading1({ children, className, ...props }: TypographyProps) {
  return (
    <h1
      className={cn(
        "font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

export function Heading2({ children, className, ...props }: TypographyProps) {
  return (
    <h2
      className={cn(
        "font-heading text-xl sm:text-2xl font-semibold tracking-tight text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

export function Heading3({ children, className, ...props }: TypographyProps) {
  return (
    <h3
      className={cn(
        "font-heading text-lg sm:text-xl font-semibold text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function Heading4({ children, className, ...props }: TypographyProps) {
  return (
    <h4
      className={cn(
        "font-heading text-base sm:text-lg font-semibold text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </h4>
  );
}

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: "body" | "body-small" | "label" | "caption" | "muted";
  as?: "p" | "span" | "div" | "label";
}

export function Text({
  children,
  className,
  variant = "body",
  as = "p",
  ...props
}: TextProps) {
  const variantStyles = {
    body: "text-sm sm:text-base text-foreground font-normal leading-relaxed",
    "body-small": "text-xs sm:text-sm text-foreground font-normal leading-relaxed",
    label: "text-xs sm:text-sm font-medium text-foreground",
    caption: "text-xs text-muted-foreground leading-normal",
    muted: "text-sm text-muted-foreground",
  };

  const Component = as as React.ElementType;

  return (
    <Component
      className={cn("font-sans", variantStyles[variant], className)}
      {...props}
    >
      {children}
    </Component>
  );
}


export function Caption({ children, className, ...props }: TypographyProps) {
  return (
    <span
      className={cn("font-sans text-xs text-muted-foreground leading-normal", className)}
      {...props}
    >
      {children}
    </span>
  );
}

export function Overline({ children, className, ...props }: TypographyProps) {
  return (
    <span
      className={cn(
        "font-heading text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
