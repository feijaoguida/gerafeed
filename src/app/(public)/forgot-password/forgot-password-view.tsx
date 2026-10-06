"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  ShieldCheck,
  Lock,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Mail,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/design-system/form-field";
import { Heading1, Heading2, Text } from "@/components/design-system/typography";
import { BrandDecoration } from "@/components/design-system/brand-decoration";

type ForgotStep = "request_step" | "reset_step" | "success_step";

export function ForgotPasswordView() {
  const router = useRouter();

  // Estados do fluxo
  const [step, setStep] = useState<ForgotStep>("request_step");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estados de feedback e controle
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Timer de cooldown regressivo (60 segundos)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Passo 1: Solicitar código OTP via e-mail
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email || !email.includes("@")) {
      setError("Por favor, informe um endereço de e-mail válido.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao solicitar código de recuperação. Tente novamente.");
        return;
      }

      setSuccessMessage(data.message || "Código enviado! Verifique sua caixa de entrada.");
      setStep("reset_step");
      setResendCooldown(60);
    } catch {
      setError("Erro ao conectar com o servidor. Tente novamente.");
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
      const res = await fetch("/api/auth/forgot-password/send-code", {
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

  // Passo 2: Validar código e redefinir senha
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanCode = code.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      setError("Informe o código de segurança de 6 dígitos.");
      return;
    }

    if (!password || password.length < 6) {
      setError("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas informadas não coincidem.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: cleanCode,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Código inválido ou expirado. Verifique os dados.");
        return;
      }

      setStep("success_step");
    } catch {
      setError("Erro de conexão ao redefinir a senha. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

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
            Acesso seguro. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#C084FC]">
              Recuperação simplificada.
            </span>
          </Heading1>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5 border border-white/10 shadow-xs">
                <ShieldCheck className="w-5 h-5 text-[#38BDF8]" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-white text-base">
                  Código de Uso Único
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mt-0.5">
                  Seus dados protegidos com códigos numéricos de expiração rápida de 15 minutos.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5 border border-white/10 shadow-xs">
                <Lock className="w-5 h-5 text-[#818CF8]" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-white text-base">
                  Criptografia Forte
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mt-0.5">
                  Senhas protegidas com hashing bcrypt irreversível e fator de custo rigoroso.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5 border border-white/10 shadow-xs">
                <KeyRound className="w-5 h-5 text-[#C084FC]" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-white text-base">
                  Retome o Fluxo
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mt-0.5">
                  Redefina em segundos e volte imediatamente a orquestrar suas publicações.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Testimonial */}
        <div className="relative z-10 pt-8 border-t border-white/10 text-sm">
          <p className="text-slate-300 italic">
            &ldquo;Segurança e privacidade de ponta a ponta em cada etapa da sua jornada editorial.&rdquo;
          </p>
          <p className="text-xs text-blue-300/80 mt-1 font-medium font-heading">
            — Segurança GeraFeed
          </p>
        </div>
      </div>

      {/* Lado Direito — Formulário */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-20 bg-background transition-colors duration-200">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-[420px] mx-auto space-y-7 my-auto">
          {/* Header do Passo */}
          {step === "request_step" && (
            <div>
              <Heading2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Esqueceu sua senha?
              </Heading2>
              <Text variant="muted" className="mt-1.5 leading-relaxed">
                Informe o seu e-mail cadastrado e enviaremos um código de 6 dígitos para criar uma nova senha.
              </Text>
            </div>
          )}

          {step === "reset_step" && (
            <div>
              <Heading2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Redefinir senha
              </Heading2>
              <Text variant="muted" className="mt-1.5 leading-relaxed">
                Digite o código enviado e escolha uma nova senha segura para sua conta.
              </Text>
            </div>
          )}

          {/* Alertas */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && step !== "success_step" && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* PASSO 1: Solicitação */}
          {step === "request_step" && (
            <form onSubmit={handleRequestCode} className="space-y-5">
              <FormField label="E-mail" required>
                <Input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@exemplo.com"
                />
              </FormField>

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full"
                isLoading={isLoading}
                trailingIcon={!isLoading && <ArrowRight className="w-4 h-4" />}
              >
                Enviar código de recuperação
              </Button>

              <p className="text-center text-sm text-muted-foreground pt-2">
                Lembrou sua senha?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-primary hover:underline transition-colors"
                >
                  Fazer login
                </Link>
              </p>
            </form>
          )}

          {/* PASSO 2: Código e Nova Senha */}
          {step === "reset_step" && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              {/* Badge com e-mail e opção de trocar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border text-xs">
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate font-medium text-foreground">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep("request_step");
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-primary hover:underline font-semibold shrink-0 cursor-pointer ml-2"
                >
                  Trocar
                </button>
              </div>

              {/* Código OTP */}
              <FormField label="Código de 6 dígitos" required description="Insira o código que você recebeu por e-mail">
                <Input
                  type="text"
                  required
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="text-center tracking-widest text-lg font-mono font-bold"
                  autoComplete="one-time-code"
                />
              </FormField>

              {/* Nova Senha */}
              <div className="space-y-1.5 w-full">
                <Label htmlFor="new-password" required>
                  Nova Senha
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
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
              </div>

              {/* Confirmar Nova Senha */}
              <div className="space-y-1.5 w-full">
                <Label htmlFor="confirm-password" required>
                  Confirmar Nova Senha
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    trailingIcon={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        aria-label="Alternar visualização da confirmação de senha"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    }
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full"
                isLoading={isLoading}
                trailingIcon={!isLoading && <KeyRound className="w-4 h-4" />}
              >
                Salvar nova senha
              </Button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || isLoading}
                  className="font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed cursor-pointer"
                >
                  {resendCooldown > 0
                    ? `Reenviar código (${resendCooldown}s)`
                    : "Reenviar código de segurança"}
                </button>

                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Voltar ao login
                </Link>
              </div>
            </form>
          )}

          {/* PASSO 3: Sucesso */}
          {step === "success_step" && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <Heading2 className="text-2xl font-bold tracking-tight">
                  Senha alterada com sucesso!
                </Heading2>
                <Text variant="muted" className="mt-2 text-sm leading-relaxed max-w-sm mx-auto">
                  Sua conta já está atualizada com a nova senha. Agora você pode entrar na plataforma e continuar sua curadoria.
                </Text>
              </div>

              <Button
                type="button"
                variant="gradient"
                size="lg"
                className="w-full"
                onClick={() => router.push("/login")}
                trailingIcon={<ArrowRight className="w-4 h-4" />}
              >
                Ir para o Login
              </Button>
            </div>
          )}
        </div>

        <div className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} GeraFeed. Inteligência que publica.
        </div>
      </div>
    </div>
  );
}
