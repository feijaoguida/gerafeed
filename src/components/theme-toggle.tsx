"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  // SSR-safe client mounting check without cascading renders in React 19
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <button
        type="button"
        className={`p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-400 opacity-60 cursor-default ${className}`}
        aria-label="Carregando tema"
        disabled
      >
        <Sun className="w-4 h-4" />
      </button>
    );
  }

  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`relative flex items-center justify-center p-2 rounded-lg border transition-all duration-200 
        bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-700 shadow-sm
        dark:bg-zinc-900/80 dark:hover:bg-zinc-800 dark:border-zinc-800 dark:text-zinc-300 dark:shadow-none
        hover:scale-105 active:scale-95 ${className}`}
      aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      title={isDark ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-300 rotate-0 hover:-rotate-12" />
      )}
    </button>
  );
}

export function ThemeToggleRow({ className = "" }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <div className={`p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 animate-pulse h-9 ${className}`} />
    );
  }

  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium 
        bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 
        dark:bg-zinc-800/40 dark:hover:bg-zinc-800/80 dark:border-zinc-800 dark:text-zinc-300 
        transition ${className}`}
      title={isDark ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
    >
      <div className="flex items-center gap-2.5">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600" />
        )}
        <span>{isDark ? "Modo Escuro" : "Modo Claro"}</span>
      </div>

      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 text-zinc-600 dark:text-zinc-300 uppercase shadow-xs">
        {isDark ? "Dark" : "Light"}
      </span>
    </button>
  );
}
