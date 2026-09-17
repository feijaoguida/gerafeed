"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Clock,
  Sparkles,
  TrendingUp,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  ArrowRight,
  Mail,
  KeyRound,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/design-system/form-field";
import { Heading1, Heading2, Text } from "@/components/design-system/typography";
import { BrandDecoration } from "@/components/design-system/brand-decoration";
import { Logo } from "@/components/brand/logo";
import { trackEvent } from "@/lib/analytics";
import { savePlanIntent, getStoredPlanIntent } from "@/lib/plan-intent";

type RegisterStep = "email_step" | "otp_step" | "password_step";

export function RegisterView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados de Plano inicializados a partir de searchParams ou storage
  const urlPlan = searchParams.get("plan");
  const urlCycle = searchParams.get("cycle");

  const [planConfig] = useState<{ slug: string; cycle: "MONTHLY" | "YEARLY" }>(() => {
    if (urlPlan) {
      const parsedCycle = urlCycle?.toUpperCase() === "YEARLY" ? "YEARLY" : "MONTHLY";
      return { slug: urlPlan.toLowerCase(), cycle: parsedCycle };
    }
    const stored = getStoredPlanIntent();
    if (stored) {
      return { slug: stored.slug, cycle: stored.cycle };
    }
    return { slug: "free", cycle: "MONTHLY" };
  });

  const planSlug = planConfig.slug;
  const cycle = planConfig.cycle;

  // Estados do Formulário
  const [step, setStep] = useState<RegisterStep>("email_step");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Estados de Controle
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Sincronizar storage externo
  useEffect(() => {
    if (urlPlan) {
      const parsedCycle = urlCycle?.toUpperCase() === "YEARLY" ? "YEARLY" : "MONTHLY";
      savePlanIntent({ slug: urlPlan.toLowerCase(), cycle: parsedCycle });
    }
  }, [urlPlan, urlCycle]);

  // Temporizador para reenvio de código
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Passo 1: Enviar Código de Verificação
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!agreeTerms) {
      setError("Você deve concordar com os Termos de Uso e Política de Privacidade.");
      return;
    }

    if (!email || !email.includes("@")) {
      setError("Por favor, informe um endereço de e-mail profissional válido.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/send-verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao enviar código de confirmação. Tente novamente.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage("Código enviado! Verifique sua caixa de entrada.");
      setStep("otp_step");
      setResendCooldown(60);
    } catch {
      setError("Erro de conexão ao solicitar código. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reenviar código OTP
  const handleResendCode = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/send-verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao reenviar código.");
      } else {
        setSuccessMessage("Novo código enviado com sucesso!");
        setResendCooldown(60);
      }
    } catch {
      setError("Erro de conexão ao reenviar código.");
    } finally {
      setIsLoading(false);
    }
  };

  // Passo 2: Validar Código de 6 Dígitos
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanCode = otpCode.trim();
    if (cleanCode.length !== 6) {
      setError("O código de confirmação deve ter exatamente 6 dígitos.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: cleanCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Código incorreto ou expirado.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage("E-mail confirmado com sucesso!");
      setStep("password_step");
    } catch {
      setError("Erro de conexão ao validar código.");
    } finally {
      setIsLoading(false);
    }
  };

  // Passo 3: Criar Conta e Autenticar
  const handleFinalRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password.length < 6) {
      setError("A senha deve conter no mínimo 6 caracteres.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Registrar Usuário no DB com o código confirmado
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          code: otpCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao criar conta. Tente novamente.");
        setIsLoading(false);
        return;
      }

      // Evento de conversão (sem PII)
      trackEvent("sign_up_completed", { page_path: "/register" });

      // 2. Login automático com credenciais
      const loginResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (loginResult?.error) {
        router.push("/login");
        return;
      }

      // 3. Bifurcação: Se for plano pago, direcionar para onboarding de faturamento
      const isPaidPlan = planSlug && planSlug !== "free";
      if (isPaidPlan) {
        router.push(`/checkout/billing?plan=${encodeURIComponent(planSlug)}&cycle=${cycle}`);
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      setError("Erro de conexão ao criar conta. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const isPaid = planSlug && planSlug !== "free";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background text-foreground transition-colors duration-200">
      {/* Lado Esquerdo — Painel Institucional GeraFeed */}
      <div className="lg:w-[48%] bg-gradient-to-br from-[#0F172A] via-[#111F38] to-[#0A1224] p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden text-white selection:bg-primary selection:text-white">
        <BrandDecoration variant="waves" />
        <BrandDecoration variant="glow" />

        {/* Top Logo */}
        <div className="relative z-10">
          <Logo href="/" size="md" forceDark priority />
        </div>

        {/* Center Content */}
        <div className="my-12 lg:my-0 max-w-lg relative z-10">
          <Heading1 className="text-3xl sm:text-4xl lg:text-[40px] text-white leading-tight mb-8">
            Conteúdo que flui. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#C084FC]">
              Inteligência que publica.
            </span>
          </Heading1>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5 border border-white/10 shadow-xs">
                <Clock className="w-5 h-5 text-[#38BDF8]" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-white text-base">
                  Automação com Controle Editorial
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mt-0.5">
                  Publique com agilidade mantendo a curadoria humana como padrão.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5 border border-white/10 shadow-xs">
                <Sparkles className="w-5 h-5 text-[#C084FC]" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-white text-base">
                  Curadoria Assistida por IA
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mt-0.5">
                  Captura scraping do texto integral e gera matérias originais e completas.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5 border border-white/10 shadow-xs">
                <TrendingUp className="w-5 h-5 text-[#00C2A8]" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-white text-base">
                  Escalabilidade Multi-WordPress
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mt-0.5">
                  Conecte múltiplos portais e distribua notícias por categorias e destinos.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Testimonial */}
        <div className="relative z-10 pt-8 border-t border-white/10 text-sm">
          <p className="text-slate-300 italic">
            &ldquo;A melhor ferramenta para operação de portais de notícias e afiliados.&rdquo;
          </p>
          <p className="text-xs text-blue-300/80 mt-1 font-medium font-heading">
            — Equipe Editorial Web
          </p>
        </div>
      </div>

      {/* Lado Direito — Formulário de Cadastro em Etapas */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-20 bg-background transition-colors duration-200">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-[440px] mx-auto space-y-6 my-auto">
          {/* Card Indicador de Plano Selecionado */}
          {isPaid && (
            <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-foreground font-medium">
                  Plano selecionado: <strong className="uppercase text-primary">{planSlug}</strong> ({cycle === "YEARLY" ? "Anual" : "Mensal"})
                </span>
              </div>
              <Link
                href="/#precos"
                className="text-primary font-semibold hover:underline"
              >
                Trocar
              </Link>
            </div>
          )}

          {/* Cabeçalho do Passo */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
              {step === "email_step" && <span>Passo 1 de 3 • Identificação</span>}
              {step === "otp_step" && <span>Passo 2 de 3 • Confirmação de E-mail</span>}
              {step === "password_step" && <span>Passo 3 de 3 • Criação de Senha</span>}
            </div>

            <Heading2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {step === "email_step" && "Crie sua conta no GeraFeed"}
              {step === "otp_step" && "Confirme seu e-mail"}
              {step === "password_step" && "Defina sua senha de acesso"}
            </Heading2>

            <Text variant="muted" className="mt-1.5 leading-relaxed text-sm">
              {step === "email_step" && "Preencha seus dados para receber o código de verificação."}
              {step === "otp_step" && `Digite o código de 6 dígitos enviado para ${email}.`}
              {step === "password_step" && "Quase pronto! Crie uma senha segura para proteger sua conta."}
            </Text>
          </div>

          {/* Feedback de Erro ou Sucesso */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && !error && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2.5">
              <Check className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ETAPA 1: Nome, E-mail e Termos */}
          {step === "email_step" && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <FormField label="Nome completo" required>
                <Input
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                />
              </FormField>

              <FormField label="E-mail profissional" required>
                <Input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@empresa.com"
                  leadingIcon={<Mail className="w-4 h-4 text-muted-foreground" />}
                />
              </FormField>

              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-muted-foreground leading-relaxed select-none">
                  <input
                    type="checkbox"
                    required
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                  <span>
                    Concordo com os{" "}
                    <a href="#termos" className="font-semibold text-primary hover:underline">
                      Termos de Uso
                    </a>{" "}
                    e a{" "}
                    <a href="#privacidade" className="font-semibold text-primary hover:underline">
                      Política de Privacidade
                    </a>
                    .
                  </span>
                </label>
              </div>

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full mt-2"
                isLoading={isLoading}
                trailingIcon={!isLoading && <ArrowRight className="w-4 h-4" />}
              >
                Continuar e Receber Código
              </Button>
            </form>
          )}

          {/* ETAPA 2: Digitação do Código OTP */}
          {step === "otp_step" && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <FormField label="Código de 6 dígitos" required>
                <div className="relative">
                  <Input
                    type="text"
                    required
                    maxLength={6}
                    autoComplete="one-time-code"
                    value={otpCode}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setOtpCode(clean);
                    }}
                    placeholder="000000"
                    className="text-center font-mono text-2xl font-bold tracking-[8px] h-14"
                    leadingIcon={<KeyRound className="w-4 h-4 text-muted-foreground" />}
                  />
                </div>
              </FormField>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email_step");
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="hover:text-foreground underline cursor-pointer"
                >
                  Alterar e-mail informado
                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || isLoading}
                  className="flex items-center gap-1.5 hover:text-foreground disabled:opacity-50 disabled:pointer-events-none cursor-pointer text-primary font-medium"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>
                    {resendCooldown > 0
                      ? `Reenviar em ${resendCooldown}s`
                      : "Reenviar código"}
                  </span>
                </button>
              </div>

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full mt-2"
                isLoading={isLoading}
                disabled={otpCode.length !== 6}
                trailingIcon={!isLoading && <ShieldCheck className="w-4 h-4" />}
              >
                Confirmar Código
              </Button>
            </form>
          )}

          {/* ETAPA 3: Criação da Senha */}
          {step === "password_step" && (
            <form onSubmit={handleFinalRegister} className="space-y-4">
              <FormField label="Defina sua senha" required>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo de 6 caracteres"
                    trailingIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        aria-label="Alternar visualização da senha"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    }
                  />
                </div>
              </FormField>

              <p className="text-xs text-muted-foreground">
                Sua senha é criptografada e protegida com SALT seguro antes de ser gravada.
              </p>

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full mt-2"
                isLoading={isLoading}
                trailingIcon={!isLoading && <ArrowRight className="w-4 h-4" />}
              >
                {isPaid ? "Concluir Cadastro e Ir para Pagamento" : "Concluir Cadastro e Começar"}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground pt-1">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline transition-colors"
            >
              Fazer login
            </Link>
          </p>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} GeraFeed. Inteligência que publica.
        </div>
      </div>
    </div>
  );
}
