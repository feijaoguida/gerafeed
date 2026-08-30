"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Sparkles,
  TrendingUp,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  ArrowRight,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/design-system/form-field";
import { Heading1, Heading2, Text } from "@/components/design-system/typography";
import { BrandDecoration } from "@/components/design-system/brand-decoration";
import { Logo } from "@/components/brand/logo";
import { trackEvent } from "@/lib/analytics";

export function RegisterView() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agreeTerms) {
      setError("Você deve concordar com os Termos de Uso e Política de Privacidade.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Register User in DB
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao criar conta. Tente novamente.");
        setIsLoading(false);
        return;
      }

      // Evento de conversão (sem PII)
      trackEvent("sign_up_completed", { page_path: "/register" });

      // 2. Automatically Log in
      const loginResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (loginResult?.error) {
        router.push("/login");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Erro de conexão ao criar conta. Tente novamente.");
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
                  Reescrita IA Completa
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

      {/* Lado Direito — Formulário de Cadastro */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-20 bg-background transition-colors duration-200">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-[420px] mx-auto space-y-6 my-auto">
          <div>
            <Heading2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Crie sua conta no GeraFeed
            </Heading2>
            <Text variant="muted" className="mt-1.5 leading-relaxed">
              Comece a transformar feeds de notícias em artigos de alta autoridade.
            </Text>

            {/* Badges de Confiança */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs font-medium text-muted-foreground">
              <div className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-[#00C2A8]" />
                <span>Configuração rápida</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-[#00C2A8]" />
                <span>Integração WordPress</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-[#00C2A8]" />
                <span>Sem taxa de adesão</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              />
            </FormField>

            <FormField label="Senha" required>
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
              Criar Conta e Começar
            </Button>
          </form>

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
