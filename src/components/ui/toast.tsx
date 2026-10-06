"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react";

export type ToastVariant = "error" | "success" | "warning" | "info";

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

export interface ShowToastOptions {
  title?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (message: string, options?: ShowToastOptions) => void;
  removeToast: (id: string) => void;
  toast: {
    error: (message: string, options?: Omit<ShowToastOptions, "variant">) => void;
    success: (message: string, options?: Omit<ShowToastOptions, "variant">) => void;
    warning: (message: string, options?: Omit<ShowToastOptions, "variant">) => void;
    info: (message: string, options?: Omit<ShowToastOptions, "variant">) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Listener global para permitir chamadas fora do React tree (ex: em helpers assíncronos)
type ToastListener = (message: string, options?: ShowToastOptions) => void;
let globalToastEmitter: ToastListener | null = null;

export function emitGlobalToast(message: string, options?: ShowToastOptions) {
  if (globalToastEmitter) {
    globalToastEmitter(message, options);
  } else {
    console.warn("[Toast] Provedor ainda não montado:", message);
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, options?: ShowToastOptions) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const variant = options?.variant || "info";
      const duration = options?.duration ?? (variant === "error" ? 6000 : 4000);

      const newItem: ToastItem = {
        id,
        title: options?.title,
        message,
        variant,
        duration,
      };

      setToasts((prev) => [...prev.slice(-4), newItem]); // Mantém no máximo 5 toasts simultâneos

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  // Registra o emissor global
  React.useEffect(() => {
    globalToastEmitter = showToast;
    return () => {
      globalToastEmitter = null;
    };
  }, [showToast]);

  const toast = React.useMemo(
    () => ({
      error: (msg: string, opt?: Omit<ShowToastOptions, "variant">) =>
        showToast(msg, { ...opt, variant: "error" }),
      success: (msg: string, opt?: Omit<ShowToastOptions, "variant">) =>
        showToast(msg, { ...opt, variant: "success" }),
      warning: (msg: string, opt?: Omit<ShowToastOptions, "variant">) =>
        showToast(msg, { ...opt, variant: "warning" }),
      info: (msg: string, opt?: Omit<ShowToastOptions, "variant">) =>
        showToast(msg, { ...opt, variant: "info" }),
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, toast }}>
      {children}
      {/* Toast Container nos cantos da tela */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2 sm:p-0"
      >
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={() => removeToast(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const getIcon = () => {
    switch (item.variant) {
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />;
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      case "info":
      default:
        return <Info className="w-5 h-5 text-blue-500 shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (item.variant) {
      case "error":
        return "border-red-500/25 bg-red-950/20";
      case "success":
        return "border-emerald-500/25 bg-emerald-950/20";
      case "warning":
        return "border-amber-500/25 bg-amber-950/20";
      case "info":
      default:
        return "border-blue-500/25 bg-blue-950/20";
    }
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border backdrop-blur-md bg-card/95 text-card-foreground shadow-lg transition-all duration-300 ${getBorderColor()}`}
      role="alert"
    >
      {getIcon()}
      <div className="flex-1 text-xs">
        {item.title && <p className="font-semibold text-foreground mb-0.5">{item.title}</p>}
        <p className="text-muted-foreground leading-relaxed break-words">{item.message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-muted transition-colors shrink-0"
        aria-label="Fechar notificação"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser usado dentro de um ToastProvider");
  }
  return context;
}
