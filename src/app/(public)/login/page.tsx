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
  ArrowRight,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/design-system/form-field";
import { Heading1, Heading2, Text } from "@/components/design-system/typography";
import { BrandDecoration } from "@/components/design-system/brand-decoration";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("E-mail ou senha incorretos. Verifique suas credenciais.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Erro ao conectar com o servidor. Tente novamente.");
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
                  Curadoria e Publicação Automática
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mt-0.5">
                  Conecte seus feeds RSS e alimente portais WordPress com revisões em segundos.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5 border border-white/10 shadow-xs">
                <Sparkles className="w-5 h-5 text-[#C084FC]" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-white text-base">
                  Reescrita IA Anti-Plágio
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mt-0.5">
                  Artigos exclusivos e estruturados com base factual completa da matéria original.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5 border border-white/10 shadow-xs">
                <TrendingUp className="w-5 h-5 text-[#00C2A8]" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-white text-base">
                  Monetização com Afiliados
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mt-0.5">
                  Gere reviews e guias de compra automáticos integrados ao seu catálogo de produtos.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Testimonial */}
        <div className="relative z-10 pt-8 border-t border-white/10 text-sm">
          <p className="text-slate-300 italic">
            &ldquo;Multiplicamos a produção de conteúdo dos nossos portais com total controle editorial.&rdquo;
          </p>
          <p className="text-xs text-blue-300/80 mt-1 font-medium font-heading">
            — Rede de Notícias Tech & Negócios
          </p>
        </div>
      </div>

      {/* Lado Direito — Formulário de Login */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-20 bg-background transition-colors duration-200">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-[420px] mx-auto space-y-7 my-auto">
          <div>
            <Heading2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Bem-vindo de volta
            </Heading2>
            <Text variant="muted" className="mt-1.5 leading-relaxed">
              Entre para gerenciar seus feeds, artigos e publicações.
            </Text>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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

            <FormField label="Senha" required>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
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

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              trailingIcon={!isLoading && <ArrowRight className="w-4 h-4" />}
            >
              Entrar na Plataforma
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground pt-2">
            Ainda não tem conta?{" "}
            <Link
              href="/register"
              className="font-semibold text-primary hover:underline transition-colors"
            >
              Cadastre-se grátis
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
