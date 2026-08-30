"use client";

import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoredConsent, saveConsent } from "@/lib/consent";

export function ConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verifica se o usuário já manifestou preferência
    const timer = setTimeout(() => {
      const existing = getStoredConsent();
      if (!existing) {
        setIsVisible(true);
      }
    }, 0);

    // Ouvinte para permitir reabertura das preferências pelo rodapé ou configurações
    const handleReopen = () => {
      setIsVisible(true);
    };

    window.addEventListener("open-consent-preferences", handleReopen);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("open-consent-preferences", handleReopen);
    };
  }, []);

  if (!isVisible) return null;

  const handleAccept = () => {
    saveConsent(true);
    setIsVisible(false);
  };

  const handleDecline = () => {
    saveConsent(false);
    setIsVisible(false);
  };

  return (
    <div
      role="region"
      aria-label="Preferências de privacidade e cookies"
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 pointer-events-none"
    >
      <div className="max-w-4xl mx-auto pointer-events-auto bg-surface/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl p-5 sm:p-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 max-w-2xl">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5 sm:mt-0">
              <Cookie className="w-5 h-5" />
            </div>
            <div className="text-sm leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">
                Sua privacidade e preferências de navegação
              </p>
              <p>
                Utilizamos cookies essenciais para autenticação e operação da
                plataforma, além de cookies analíticos anônimos para entender o
                uso e aprimorar nossos serviços. Nenhuma informação de
                identificação pessoal é compartilhada.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDecline}
              className="font-medium"
            >
              Continuar sem Analytics
            </Button>
            <Button
              type="button"
              variant="gradient"
              size="sm"
              onClick={handleAccept}
              className="font-semibold shadow-xs"
            >
              Aceitar Analytics
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
