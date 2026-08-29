import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/brand/logo";

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export function Sidebar({ className, children, ...props }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex flex-col w-64 shrink-0 h-full bg-surface border-r border-border transition-colors select-none",
        className
      )}
      {...props}
    >
      {children}
    </aside>
  );
}

export interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  logoHref?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export function SidebarHeader({
  logoHref = "/dashboard",
  badge,
  actions,
  className,
  ...props
}: SidebarHeaderProps) {
  return (
    <div
      className={cn(
        "h-16 px-4 flex items-center justify-between border-b border-border/80 shrink-0",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <Logo href={logoHref} size="sm" priority />
        {badge}
      </div>

      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}

export interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function SidebarContent({
  className,
  children,
  ...props
}: SidebarContentProps) {
  return (
    <nav
      className={cn(
        "flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin",
        className
      )}
      {...props}
    >
      {children}
    </nav>
  );
}

export interface SidebarSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function SidebarSection({
  className,
  children,
  ...props
}: SidebarSectionProps) {
  return (
    <div className={cn("space-y-1", className)} {...props}>
      {children}
    </div>
  );
}

export interface SidebarSectionLabelProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export function SidebarSectionLabel({
  className,
  children,
  ...props
}: SidebarSectionLabelProps) {
  return (
    <p
      className={cn(
        "font-heading px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

export interface SidebarItemProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  icon?: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export function SidebarItem({
  icon,
  label,
  href,
  active = false,
  badge,
  disabled = false,
  className,
  ...props
}: SidebarItemProps) {
  if (disabled) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground/50 cursor-not-allowed opacity-60",
          className
        )}
      >
        <div className="flex items-center gap-3 truncate">
          {icon && <span className="h-4 w-4 shrink-0">{icon}</span>}
          <span className="truncate">{label}</span>
        </div>
        {badge && <span className="shrink-0">{badge}</span>}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-gradient-to-r from-primary/15 via-primary-purple/10 to-transparent text-primary dark:text-primary font-semibold shadow-xs border-l-2 border-primary"
          : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3 truncate">
        {icon && (
          <span
            className={cn(
              "h-4 w-4 shrink-0 transition-colors",
              active
                ? "text-primary"
                : "text-muted-foreground group-hover:text-foreground"
            )}
          >
            {icon}
          </span>
        )}
        <span className="truncate">{label}</span>
      </div>
      {badge && <span className="shrink-0">{badge}</span>}
    </Link>
  );
}

export interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function SidebarFooter({
  className,
  children,
  ...props
}: SidebarFooterProps) {
  return (
    <div
      className={cn(
        "p-3 border-t border-border/80 mt-auto shrink-0 bg-surface/50 space-y-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
