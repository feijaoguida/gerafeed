"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Rss,
  Clock,
  Sparkles,
  TrendingUp,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function RegisterPage() {
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-zinc-950 transition-colors duration-200">
      {/* Lado Esquerdo — Painel Institucional Azul */}
      <div className="lg:w-[48%] bg-[#1E3EB3] p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden text-white selection:bg-emerald-400 selection:text-zinc-950">
        {/* Background Subtle Dot Pattern */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Top Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-[#00C06A] flex items-center justify-center shadow-md shadow-emerald-950/20">
              <Rss className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              GeraFeed
            </span>
          </Link>
        </div>

        {/* Center Content */}
        <div className="my-12 lg:my-0 max-w-lg relative z-10">
          <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-bold leading-tight mb-10 text-white tracking-tight">
            Seu blog trabalhando pelas suas redes sociais.
          </h1>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5 border border-white/10">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-base">
                  Publique no piloto automático
                </h3>
                <p className="text-sm text-blue-100/80 leading-relaxed mt-0.5">
                  Conecte seu blog e deixe a IA gerar posts prontos para redes sociais.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5 border border-white/10">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-base">
                  IA que entende seu nicho
                </h3>
                <p className="text-sm text-blue-100/80 leading-relaxed mt-0.5">
                  Conteúdo adaptado ao seu tom de voz e público-alvo.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5 border border-white/10">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-base">
                  Mais alcance com menos esforço
                </h3>
                <p className="text-sm text-blue-100/80 leading-relaxed mt-0.5">
                  Transforme cada artigo em uma semana inteira de conteúdo.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Testimonial */}
        <div className="relative z-10 pt-8 border-t border-white/10 text-sm">
          <p className="text-blue-100/90 italic">
            &ldquo;Economizo 10 horas por semana desde que comecei a usar o GeraFeed.&rdquo;
          </p>
          <p className="text-xs text-blue-200/80 mt-1 font-medium">
            — Marina Costa, criadora de conteúdo
          </p>
        </div>
      </div>

      {/* Lado Direito — Formulário de Cadastro */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-20 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-[420px] mx-auto space-y-7 my-auto">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Comece grátis hoje
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
              Crie sua conta e gere seus primeiros posts em minutos.
            </p>

            {/* Badges de Confiança */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-[#00C06A] stroke-[3]" />
                <span>7 dias grátis</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-[#00C06A] stroke-[3]" />
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-[#00C06A] stroke-[3]" />
                <span>Cancele quando quiser</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 dark:text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2"
              >
                Nome completo
              </label>
              <input
                id="name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full px-4 py-3 rounded-xl bg-zinc-50/50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#00C06A]/30 focus:border-[#00C06A] transition"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                className="w-full px-4 py-3 rounded-xl bg-zinc-50/50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#00C06A]/30 focus:border-[#00C06A] transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2"
              >
                Senha
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Crie uma senha segura"
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-zinc-50/50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#00C06A]/30 focus:border-[#00C06A] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
                  aria-label="Alternar visualização da senha"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-3 cursor-pointer text-xs text-zinc-600 dark:text-zinc-400 leading-normal select-none">
                <input
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-[#00C06A] focus:ring-[#00C06A] accent-[#00C06A] cursor-pointer"
                />
                <span>
                  Concordo com os{" "}
                  <a href="#termos" className="font-semibold text-[#1E3EB3] dark:text-indigo-400 hover:underline">
                    Termos de Uso
                  </a>{" "}
                  e a{" "}
                  <a href="#privacidade" className="font-semibold text-[#1E3EB3] dark:text-indigo-400 hover:underline">
                    Política de Privacidade
                  </a>
                  .
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-[#00C06A] hover:bg-[#00AB5E] transition shadow-md shadow-emerald-600/20 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Criando conta...</span>
                </>
              ) : (
                "Criar minha conta grátis"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 pt-2">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="font-bold text-[#1E3EB3] dark:text-indigo-400 hover:underline transition"
            >
              Entrar
            </Link>
          </p>
        </div>

        <div className="text-center text-xs text-zinc-400 dark:text-zinc-600">
          © {new Date().getFullYear()} GeraFeed. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
}
