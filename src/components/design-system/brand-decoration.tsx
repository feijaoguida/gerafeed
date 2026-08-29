import * as React from "react";
import { cn } from "@/lib/cn";

export interface BrandDecorationProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "waves" | "sparkles" | "glow";
}

export function BrandDecoration({
  variant = "waves",
  className,
  ...props
}: BrandDecorationProps) {
  if (variant === "glow") {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -top-12 -right-12 h-64 w-64 rounded-full bg-gradient-to-br from-[#2563EB]/20 via-[#7C3AED]/15 to-transparent blur-3xl opacity-70 dark:opacity-40",
          className
        )}
        {...props}
      />
    );
  }

  if (variant === "sparkles") {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 overflow-hidden opacity-30 dark:opacity-20",
          className
        )}
        {...props}
      >
        <svg
          className="absolute right-0 top-0 h-full w-48 text-primary"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="20" cy="20" r="1.5" fill="currentColor" />
          <circle cx="80" cy="35" r="1" fill="#7C3AED" />
          <circle cx="45" cy="70" r="1.5" fill="#00C2A8" />
          <circle cx="65" cy="85" r="2" fill="currentColor" />
        </svg>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute right-0 bottom-0 overflow-hidden opacity-25 dark:opacity-15",
        className
      )}
      {...props}
    >
      <svg
        width="220"
        height="120"
        viewBox="0 0 220 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 60 C 60 20, 140 100, 220 50"
          stroke="url(#brand-grad)"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <path
          d="M0 80 C 70 40, 150 110, 220 70"
          stroke="url(#brand-grad)"
          strokeWidth="1.5"
          opacity="0.6"
        />
        <defs>
          <linearGradient id="brand-grad" x1="0" y1="0" x2="220" y2="120" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2563EB" />
            <stop offset="0.5" stopColor="#7C3AED" />
            <stop offset="1" stopColor="#00C2A8" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
