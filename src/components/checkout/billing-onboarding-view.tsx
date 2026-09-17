"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Shield,
  Building2,
  AlertCircle,
  Search,
  ExternalLink,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/design-system/form-field";
import { Heading2, Text } from "@/components/design-system/typography";
import { Logo } from "@/components/brand/logo";
import { getStoredPlanIntent, clearPlanIntent } from "@/lib/plan-intent";
import {
  isValidDocument,
  formatCPFOrCNPJ,
  formatPhone,
  formatCEP,
  cleanDocument,
} from "@/lib/validation/cpf-cnpj";

export function BillingOnboardingView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlPlan = searchParams.get("plan");
  const urlCycle = searchParams.get("cycle");

  const [planConfig] = useState<{ slug: string; cycle: "MONTHLY" | "YEARLY" }>(() => {
    if (urlPlan) {
      return {
        slug: urlPlan.toLowerCase(),
        cycle: urlCycle?.toUpperCase() === "YEARLY" ? "YEARLY" : "MONTHLY",
      };
    }
    const stored = getStoredPlanIntent();
    if (stored) {
      return {
        slug: stored.slug,
        cycle: stored.cycle,
      };
    }
    return { slug: "pro", cycle: "MONTHLY" };
  });

  const planSlug = planConfig.slug;
  const cycle = planConfig.cycle;

  // Dados Fiscais
  const [name, setName] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // Estados de Controle
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Pré-carregar dados existentes se houver
    async function loadExistingProfile() {
      try {
        const res = await fetch("/api/billing/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            const p = data.profile;
            if (p.name) setName(p.name);
            if (p.cpfCnpj) setCpfCnpj(formatCPFOrCNPJ(p.cpfCnpj));
            if (p.mobilePhone) setMobilePhone(formatPhone(p.mobilePhone));
            if (p.postalCode) setPostalCode(formatCEP(p.postalCode));
            if (p.address) setAddress(p.address);
            if (p.addressNumber) setAddressNumber(p.addressNumber);
            if (p.complement) setComplement(p.complement);
            if (p.province) setProvince(p.province);
            if (p.city) setCity(p.city);
            if (p.state) setState(p.state);
          }
        }
      } catch {
        // Silencioso se não logado ou sem perfil
      }
    }

    loadExistingProfile();
  }, [urlPlan, urlCycle]);

  // Consulta automática de CEP via ViaCEP
  const handleCepBlur = async () => {
    const cleanCep = cleanDocument(postalCode);
    if (cleanCep.length !== 8) return;

    setIsSearchingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        if (data.logradouro) setAddress(data.logradouro);
        if (data.bairro) setProvince(data.bairro);
        if (data.localidade) setCity(data.localidade);
        if (data.uf) setState(data.uf);
      }
    } catch {
      // Ignora erro de rede ViaCEP
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações locais
    const cleanDoc = cleanDocument(cpfCnpj);
    if (!isValidDocument(cleanDoc)) {
      setError("Por favor, informe um CPF ou CNPJ válido.");
      return;
    }

    const cleanPhone = cleanDocument(mobilePhone);
    if (cleanPhone.length < 10) {
      setError("Informe um número de telefone com DDD válido.");
      return;
    }

    const cleanCep = cleanDocument(postalCode);
    if (cleanCep.length !== 8) {
      setError("Informe um CEP válido com 8 dígitos.");
      return;
    }

    if (!addressNumber.trim()) {
      setError("O número do endereço é obrigatório.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Salvar dados fiscais em /api/billing/profile
      const profileRes = await fetch("/api/billing/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          cpfCnpj: cleanDoc,
          mobilePhone: cleanPhone,
          postalCode: cleanCep,
          address: address.trim(),
          addressNumber: addressNumber.trim(),
          complement: complement.trim() || undefined,
          province: province.trim(),
          city: city.trim(),
          state: state.trim(),
        }),
      });

      if (!profileRes.ok) {
        const pData = await profileRes.json();
        setError(pData.error || "Erro ao salvar dados de cobrança.");
        setIsLoading(false);
        return;
      }

      // 2. Chamar /api/billing/checkout para gerar a assinatura no Asaas
      const checkoutRes = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSlug,
          cycle,
          billingMethod: "CREDIT_CARD",
        }),
      });

      const checkoutData = await checkoutRes.json();

      if (!checkoutRes.ok || !checkoutData.checkoutUrl) {
        setError(checkoutData.error || "Não foi possível gerar a página de pagamento. Tente novamente.");
        setIsLoading(false);
        return;
      }

      // 3. Limpar intenção temporária e redirecionar para a URL oficial do Asaas
      clearPlanIntent();
      window.location.href = checkoutData.checkoutUrl;
    } catch {
      setError("Erro de conexão ao processar checkout. Tente novamente.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-border pb-6">
          <Logo href="/" size="md" />
          <ThemeToggle />
        </div>

        {/* Banner de Informação do Plano */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/10 via-surface to-surface border border-primary/20 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Finalizando Assinatura
              </span>
            </div>
            <h3 className="font-heading font-bold text-xl text-foreground">
              Plano <span className="uppercase text-primary">{planSlug}</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Ciclo de cobrança: {cycle === "YEARLY" ? "Anual com Desconto" : "Mensal"} • Pagamento seguro via Asaas
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Ambiente Criptografado</span>
          </div>
        </div>

        {/* Título da Seção */}
        <div>
          <Heading2 className="text-2xl font-bold tracking-tight">
            Dados de Faturamento & Cobrança
          </Heading2>
          <Text variant="muted" className="mt-1 text-sm leading-relaxed">
            Exigidos legalmente pela Receita Federal e pelo gateway de pagamentos para emissão de notas fiscais e faturas.
          </Text>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulário Fiscal */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-6 rounded-3xl bg-surface border border-border space-y-4 shadow-xs">
            <FormField label="Nome Completo ou Razão Social" required>
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do titular ou empresa pagadora"
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="CPF ou CNPJ" required>
                <Input
                  type="text"
                  required
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(formatCPFOrCNPJ(e.target.value))}
                  placeholder="000.000.000-00"
                  leadingIcon={<Building2 className="w-4 h-4 text-muted-foreground" />}
                />
              </FormField>

              <FormField label="Celular / WhatsApp (com DDD)" required>
                <Input
                  type="text"
                  required
                  value={mobilePhone}
                  onChange={(e) => setMobilePhone(formatPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                />
              </FormField>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-surface border border-border space-y-4 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="CEP" required>
                <div className="relative">
                  <Input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(formatCEP(e.target.value))}
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
                    trailingIcon={
                      isSearchingCep ? (
                        <span className="text-xs text-primary animate-pulse">Buscando...</span>
                      ) : (
                        <Search className="w-4 h-4 text-muted-foreground" />
                      )
                    }
                  />
                </div>
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Endereço / Logradouro" required>
                  <Input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua, Avenida, etc."
                  />
                </FormField>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Número" required>
                <Input
                  type="text"
                  required
                  value={addressNumber}
                  onChange={(e) => setAddressNumber(e.target.value)}
                  placeholder="123"
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Complemento (opcional)">
                  <Input
                    type="text"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Apto, Sala, Bloco"
                  />
                </FormField>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Bairro" required>
                <Input
                  type="text"
                  required
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Bairro"
                />
              </FormField>

              <FormField label="Cidade" required>
                <Input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Cidade"
                />
              </FormField>

              <FormField label="UF" required>
                <Input
                  type="text"
                  required
                  maxLength={2}
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="SP"
                  className="uppercase"
                />
              </FormField>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full h-14 font-bold text-base"
              isLoading={isLoading}
              trailingIcon={!isLoading && <ExternalLink className="w-4 h-4" />}
            >
              Ir para Pagamento Seguro no Asaas
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  clearPlanIntent();
                  router.push("/dashboard");
                }}
                className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer py-1"
              >
                Pular esta etapa e começar com o Plano Gratuito (Starter)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
