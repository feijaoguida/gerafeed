"use client";

import { useState, useEffect } from "react";
import { Image as ImageIcon, Save, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/design-system/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

type ImageStrategy = "ORIGINAL" | "MODIFIED";

export default function SettingsImagesPage() {
  const [defaultStrategy, setDefaultStrategy] = useState<ImageStrategy>("ORIGINAL");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadConfig() {
      try {
        const res = await fetch("/api/images/config");
        if (!res.ok) throw new Error("Erro ao buscar configurações.");
        const data = await res.json();

        if (!active) return;

        setDefaultStrategy(data.defaultStrategy || "ORIGINAL");
      } catch (err) {
        if (!active) return;
        console.error("Error loading image config:", err);
        setErrorMessage("Erro ao carregar configurações de imagem.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadConfig();
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/images/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultStrategy,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar configurações de imagem.");

      setSuccessMessage(data.message || "Estratégia de imagens salva com sucesso!");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao salvar configurações de imagem.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header com PageHeader */}
      <PageHeader
        title="Estratégia de Imagens"
        description="Defina o comportamento padrão para as imagens das matérias coletadas via RSS (imagem original vs. processamento com IA e Sharp)."
        icon={<ImageIcon className="w-5 h-5" />}
      />

      {/* Current Active Strategy Card */}
      <Card className="p-4 flex items-center justify-between shadow-xs bg-surface-muted/40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="font-heading text-xs font-semibold text-foreground">
              Estratégia Padrão Ativa:{" "}
              <span className="uppercase text-primary font-bold">
                {defaultStrategy === "ORIGINAL" ? "Usar Imagem Original" : "Processar / Modificar Imagem"}
              </span>
            </p>
            <p className="font-sans text-[11px] text-muted-foreground">
              Esta preferência será aplicada como valor inicial no editor de notícias.
            </p>
          </div>
        </div>
        <Badge variant={defaultStrategy === "ORIGINAL" ? "outline" : "purple"}>
          {defaultStrategy === "ORIGINAL" ? "Original RSS" : "Sharp / IA"}
        </Badge>
      </Card>

      {/* Alerts */}
      {errorMessage && (
        <Alert variant="destructive" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave}>
        <Card className="p-6 space-y-6 shadow-xs">
          <CardHeader className="p-0 border-b border-border pb-3">
            <CardTitle className="text-sm font-semibold">
              Seleção da Estratégia Padrão
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Original Image */}
              <label
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                  defaultStrategy === "ORIGINAL"
                    ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/20 text-foreground"
                    : "bg-surface border-border hover:border-muted-foreground/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="strategy"
                      value="ORIGINAL"
                      checked={defaultStrategy === "ORIGINAL"}
                      onChange={() => setDefaultStrategy("ORIGINAL")}
                      className="accent-primary"
                    />
                    <span className="font-heading text-xs font-bold text-foreground">Usar Imagem Original</span>
                  </div>
                  {defaultStrategy === "ORIGINAL" && (
                    <Badge variant="outline" size="sm">Selecionada</Badge>
                  )}
                </div>
                <p className="font-sans text-[11px] text-muted-foreground leading-relaxed">
                  Mantém a imagem original extraída do feed RSS da matéria sem alterações ou filtros adicionais.
                </p>
              </label>

              {/* Option 2: Processed / Modified Image */}
              <label
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                  defaultStrategy === "MODIFIED"
                    ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/20 text-foreground"
                    : "bg-surface border-border hover:border-muted-foreground/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="strategy"
                      value="MODIFIED"
                      checked={defaultStrategy === "MODIFIED"}
                      onChange={() => setDefaultStrategy("MODIFIED")}
                      className="accent-primary"
                    />
                    <span className="font-heading text-xs font-bold text-foreground">Processar / Alterar Imagem</span>
                  </div>
                  {defaultStrategy === "MODIFIED" && (
                    <Badge variant="purple" size="sm">Selecionada</Badge>
                  )}
                </div>
                <p className="font-sans text-[11px] text-muted-foreground leading-relaxed">
                  Gera e aplica filtros/modificações na imagem para padronização visual e diferenciação do conteúdo original.
                </p>
              </label>
            </div>
          </CardContent>

          <CardFooter className="p-0 pt-2">
            <Button
              type="submit"
              variant="gradient"
              isLoading={isSaving}
              leadingIcon={<Save className="w-4 h-4" />}
            >
              Salvar Estratégia de Imagens
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
