"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Rss,
  Globe,
  ShieldCheck,
  Zap,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ChevronDown,
  Cpu,
  Image as ImageIcon,
  Check,
  Star,
  Sliders,
  Building2,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-zinc-100 selection:bg-emerald-500 selection:text-zinc-950 font-sans antialiased overflow-x-hidden transition-colors duration-300">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 opacity-70 dark:opacity-100">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-indigo-500/15 to-emerald-500/10 dark:from-indigo-600/15 dark:to-emerald-500/10 blur-[130px] rounded-full" />
        <div className="absolute top-[45%] -left-40 w-[600px] h-[500px] bg-indigo-500/10 dark:bg-indigo-700/10 blur-[140px] rounded-full" />
        <div className="absolute top-[75%] -right-40 w-[600px] h-[500px] bg-emerald-500/10 dark:bg-emerald-600/10 blur-[140px] rounded-full" />
      </div>

      {/* 1. Header (Navbar) */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-[#090D16]/80 border-b border-zinc-200 dark:border-zinc-800/60 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-slate-100 dark:bg-[#0E1322] rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-1.5">
                GeraFeed
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  AI
                </span>
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <a href="#funcionalidades" className="hover:text-zinc-950 dark:hover:text-white transition-colors duration-200">
              Funcionalidades
            </a>
            <a href="#como-funciona" className="hover:text-zinc-950 dark:hover:text-white transition-colors duration-200">
              Como Funciona
            </a>
            <a href="#diferenciais" className="hover:text-zinc-950 dark:hover:text-white transition-colors duration-200">
              Diferenciais
            </a>
            <a href="#precos" className="hover:text-zinc-950 dark:hover:text-white transition-colors duration-200">
              Preços
            </a>
            <a href="#faq" className="hover:text-zinc-950 dark:hover:text-white transition-colors duration-200">
              FAQ
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="relative group overflow-hidden px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-950 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
            >
              <span className="relative z-10 flex items-center gap-1.5">
                Comece Grátis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* 2. Hero Section */}
        <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-8 shadow-xs"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Para Donos de Blogs, Agências & Afiliados de Alta Performance
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.1] mb-6 max-w-5xl mx-auto"
          >
            Automatize seu Blog com Curadoria de Notícias via{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-emerald-500 to-teal-500 dark:from-indigo-400 dark:via-emerald-400 dark:to-teal-300">
              Inteligência Artificial
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-300 max-w-3xl mx-auto leading-relaxed mb-10"
          >
            Pare de perder horas caçando e reescrevendo pautas. O <strong>GeraFeed</strong> coleta feeds
            RSS, cria conteúdo único otimizado para SEO e publica direto no seu WordPress. Comece
            grátis hoje mesmo.
          </motion.p>

          {/* Value Bullets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex flex-wrap items-center justify-center gap-y-3 gap-x-6 text-sm text-zinc-700 dark:text-zinc-300 mb-10 max-w-3xl mx-auto"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Artigos 100% únicos em menos de 10s</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Imagens Anti-Plágio com Crédito Legal</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Publicação direta no WordPress (REST API)</span>
            </div>
          </motion.div>

          {/* Main CTA Block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col items-center justify-center gap-4 max-w-md mx-auto"
          >
            <Link
              href="/register"
              className="w-full py-4 px-8 rounded-2xl font-bold text-base text-zinc-950 bg-gradient-to-r from-emerald-400 via-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition-all duration-300 shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <span>Criar Conta Grátis Agora</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 inline" />
              Não exige cartão de crédito. Traga sua própria API Key no plano grátis.
            </p>
          </motion.div>

          {/* Social Proof Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 pt-10 border-t border-zinc-200 dark:border-zinc-800/60 flex flex-col sm:flex-row items-center justify-center gap-6 text-zinc-500 dark:text-zinc-400 text-sm"
          >
            <div className="flex items-center gap-1.5 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-500" />
              ))}
              <span className="text-zinc-900 dark:text-white font-bold ml-1">4.9 / 5.0</span>
            </div>
            <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-800 hidden sm:block" />
            <span className="text-zinc-600 dark:text-zinc-300">
              Mais de <strong className="text-zinc-900 dark:text-white font-semibold">10.000 artigos</strong> já
              gerados por agências, portais de notícia e afiliados.
            </span>
          </motion.div>
        </section>

        {/* 3. Seção "Problema vs. Solução" */}
        <section id="diferenciais" className="py-20 bg-zinc-100/70 dark:bg-[#0C101D] border-y border-zinc-200 dark:border-zinc-800/60 relative transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3">
                Transformação Editorial
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                O Jeito Antigo vs. O Jeito <span className="text-emerald-600 dark:text-emerald-400">GeraFeed</span>
              </p>
              <p className="text-zinc-600 dark:text-zinc-400 text-base mt-4">
                Redatores manuais custam caro e demoram horas. Plugins automáticos copiam e colam
                gerando penalizações no Google. O GeraFeed une IA sofisticada à revisão em 1 clique.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* O Jeito Antigo */}
              <div className="p-8 rounded-3xl bg-white dark:bg-zinc-950/70 border border-red-200 dark:border-red-500/20 relative overflow-hidden shadow-sm dark:shadow-none">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Jeito Tradicional & Exaustivo</h3>
                    <p className="text-xs text-red-600 dark:text-red-400/80">Lento, caro e sujeito a processos</p>
                  </div>
                </div>

                <ul className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
                  <li className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>2 a 3 horas perdidas</strong> diariamente buscando pautas em dezenas de portais.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Risco grave de plágio:</strong> Imagens baixadas e republicadas sem alteração violam direitos autorais.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Penalização por conteúdo duplicado:</strong> O algoritmo do Google identifica cópias e afunda seu SEO.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Trabalho manual monótono:</strong> Copiar título, baixar imagem, colar no editor do WP, configurar tags.
                    </span>
                  </li>
                </ul>
              </div>

              {/* O Jeito GeraFeed */}
              <div className="p-8 rounded-3xl bg-white dark:bg-gradient-to-b dark:from-[#11172A] dark:to-[#0D1424] border border-emerald-500/30 relative overflow-hidden shadow-xl shadow-emerald-500/10">
                <div className="absolute top-0 right-0 px-4 py-1 bg-emerald-500 text-zinc-950 text-[11px] font-extrabold uppercase tracking-wider rounded-bl-xl">
                  Eficiência Máxima
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Com o GeraFeed AI</h3>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Escala infinita com segurança jurídica</p>
                  </div>
                </div>

                <ul className="space-y-4 text-sm text-zinc-700 dark:text-zinc-200">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Coleta contínua e automática:</strong> Feeds RSS monitorados 24/7 sem você mexer um dedo.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Reescrita Jornalística com IA:</strong> Títulos magnéticos, formatação em tópicos e SEO on-page de ponta.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Imagens Anti-Plágio & Créditos Legais:</strong> Transformação visual automática e menção da fonte original.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Aprovação em 1 Clique:</strong> Revise em segundos e despache instantaneamente para o WordPress.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Como Funciona */}
        <section id="como-funciona" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">
              Fluxo Simplificado
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              4 Passos para Automatizar a Produção do seu Portal
            </p>
            <p className="text-zinc-600 dark:text-zinc-400 text-base mt-4">
              Do feed RSS bruto à matéria impecavelmente publicada no seu WordPress em segundos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                icon: <Rss className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
                title: "Conecte suas Fontes RSS",
                desc: "Cadastre portais de notícias, blogs de nicho ou veículos globais que você deseja monitorar.",
              },
              {
                step: "02",
                icon: <Cpu className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
                title: "Reescrita Inteligente",
                desc: "A IA recria o texto do zero com seu tom de voz exclusivo, gerando Title, Meta e estrutura escaneável.",
              },
              {
                step: "03",
                icon: <ImageIcon className="w-6 h-6 text-sky-600 dark:text-sky-400" />,
                title: "Imagens Anti-Plágio",
                desc: "O pipeline visual processa a imagem de capa e anexa a citação legal da fonte original.",
              },
              {
                step: "04",
                icon: <Globe className="w-6 h-6 text-teal-600 dark:text-teal-400" />,
                title: "Aprovação em 1 Clique",
                desc: "Você revisa o resultado final e publica no WordPress com um único toque na tela.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="p-6 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 relative hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm dark:shadow-none transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/50 group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <span className="text-3xl font-black text-zinc-300 dark:text-zinc-700 group-hover:text-emerald-500/40 transition-colors">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Features Grid */}
        <section id="funcionalidades" className="py-20 bg-zinc-100/70 dark:bg-[#0C101D] border-y border-zinc-200 dark:border-zinc-800/60 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3">
                Recursos Premium
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                Tudo o Que Você Precisa para Dominar o Tráfego Orgânico
              </p>
              <p className="text-zinc-600 dark:text-zinc-400 text-base mt-4">
                Construído especificamente para editores exigentes que demandam qualidade e conformidade.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Cpu className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
                  title: "Suporte Multi-IA (OpenAI, Gemini, Anthropic)",
                  desc: "Escolha o modelo que melhor se adapta ao seu orçamento e estilo. Compatível também com OpenRouter e DeepSeek.",
                },
                {
                  icon: <Globe className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
                  title: "WordPress REST API Nativa",
                  desc: "Integração limpa e direta via Application Passwords. Zero plugins instalados, sem deixar seu site lento.",
                },
                {
                  icon: <ImageIcon className="w-6 h-6 text-sky-600 dark:text-sky-400" />,
                  title: "Pipeline de Imagens Anti-Plágio",
                  desc: "Transformações inteligentes com compressão JPEG/PNG, modulação de contraste e espelhamento automático.",
                },
                {
                  icon: <ShieldCheck className="w-6 h-6 text-teal-600 dark:text-teal-400" />,
                  title: "Atribuição Automática de Créditos",
                  desc: "Garante total segurança jurídica e ética jornalística inserindo o crédito da fonte no rodapé do artigo.",
                },
                {
                  icon: <Sliders className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
                  title: "Tom de Voz & Estilos Editoriais",
                  desc: "Configure o nicho do portal (Tecnologia, Agro, Fofoca, Finanças) e selecione estilos como 'Direto', 'Sensacionalista' ou 'Analítico'.",
                },
                {
                  icon: <Building2 className="w-6 h-6 text-violet-600 dark:text-violet-400" />,
                  title: "Multi-Tenant & Workspaces",
                  desc: "Gerencie múltiplos portais e clientes com total isolamento de fontes, configurações de IA e credenciais.",
                },
              ].map((feat) => (
                <div
                  key={feat.title}
                  className="p-8 rounded-2xl bg-white dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm dark:shadow-none transition-all duration-300 flex flex-col justify-between space-y-4"
                >
                  <div className="p-3 w-fit rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    {feat.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">{feat.title}</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Depoimentos */}
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">
              Depoimentos Reais
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              Quem Usa e Recomenda o GeraFeed
            </p>
            <p className="text-zinc-600 dark:text-zinc-400 text-base mt-4">
              Veja como profissionais do mercado digital escalaram seus resultados editoriais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 shadow-sm dark:shadow-none flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex text-amber-500 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-500" />
                  ))}
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 italic leading-relaxed">
                  &ldquo;Gerenciamos 12 portais de notícias regionais. Antes precisávamos de uma equipe
                  de 4 redatores só para ficar garimpando notícias. Com o GeraFeed, uma única pessoa
                  revisa e publica mais de 60 matérias por dia com alta qualidade.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-600/30 border border-indigo-200 dark:border-indigo-500/40 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-300">
                  RC
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Rodrigo Carvalho</h4>
                  <p className="text-xs text-zinc-500">Diretor na Vox Media Agency</p>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 shadow-sm dark:shadow-none flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex text-amber-500 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-500" />
                  ))}
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 italic leading-relaxed">
                  &ldquo;A função de imagem anti-plágio e a atribuição automática me deram a paz de
                  espírito que faltava. Nosso tráfego orgânico no Google Discover cresceu mais de 180%
                  em dois meses pela frequência e velocidade das publicações.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-600/30 border border-emerald-200 dark:border-emerald-500/40 flex items-center justify-center font-bold text-emerald-700 dark:text-emerald-300">
                  ML
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Mariana Lacerda</h4>
                  <p className="text-xs text-zinc-500">Fundadora do TechDiário.com.br</p>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 shadow-sm dark:shadow-none flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex text-amber-500 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-500" />
                  ))}
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 italic leading-relaxed">
                  &ldquo;O modelo BYOK no plano gratuito é sensacional. Conectei minha chave da OpenAI e
                  comecei a rodar em menos de 5 minutos sem nenhum custo inicial. Já fiz o upgrade para
                  o plano Creator para gerenciar meus outros 3 blogs.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
                <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-sky-600/30 border border-sky-200 dark:border-sky-500/40 flex items-center justify-center font-bold text-sky-700 dark:text-sky-300">
                  FA
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Felipe Albuquerque</h4>
                  <p className="text-xs text-zinc-500">Especialista em SEO & Afiliados</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Pricing (Tabela de Preços) */}
        <section id="precos" className="py-24 bg-zinc-100/70 dark:bg-[#0C101D] border-y border-zinc-200 dark:border-zinc-800/60 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">
                Planos Transparentes
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                Escolha o Plano Ideal para a Sua Escala
              </p>
              <p className="text-zinc-600 dark:text-zinc-400 text-base mt-4">
                Sem surpresas. Comece grátis e faça upgrade conforme o seu tráfego e volume de blogs
                aumentarem.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
              {/* Plano Starter (Grátis) */}
              <div className="p-8 rounded-3xl bg-white dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800/80 shadow-sm dark:shadow-none flex flex-col justify-between space-y-8">
                <div>
                  <div className="inline-block px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-4">
                    Starter
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Gratuito</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                    Ideal para testar o poder da plataforma e pequenos blogs individuais.
                  </p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-zinc-900 dark:text-white">R$ 0</span>
                    <span className="text-zinc-500 text-sm">/mês</span>
                  </div>

                  <ul className="mt-8 space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
                    <li className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Até <strong>10 artigos</strong> por mês</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span><strong>1 site</strong> WordPress conectado</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Até <strong>3 fontes RSS</strong> ativas</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>BYOK (Traga sua própria API Key)</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Atribuição automática de fonte</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register"
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-zinc-900 dark:text-white bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-center transition-colors block border border-zinc-200 dark:border-zinc-700"
                >
                  Começar Gratuitamente
                </Link>
              </div>

              {/* Plano Creator (Destaque) */}
              <div className="p-8 rounded-3xl bg-white dark:bg-gradient-to-b dark:from-[#131B30] dark:to-[#0E1526] border-2 border-emerald-500 flex flex-col justify-between space-y-8 relative shadow-2xl shadow-emerald-500/20">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-emerald-400 to-teal-400 text-zinc-950 font-black text-[11px] uppercase tracking-widest rounded-full shadow-lg">
                  Mais Escolhido
                </div>

                <div>
                  <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-emerald-200 dark:border-emerald-500/30">
                    Creator
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Profissional</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-2">
                    Para criadores, portais e agências que precisam de escala e IA inclusa.
                  </p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-zinc-900 dark:text-white">R$ 67</span>
                    <span className="text-zinc-500 dark:text-zinc-400 text-sm">/mês</span>
                  </div>

                  <ul className="mt-8 space-y-4 text-sm text-zinc-700 dark:text-zinc-200">
                    <li className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Até <strong>150 artigos</strong> por mês</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Até <strong>3 sites</strong> WordPress</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Até <strong>10 fontes RSS</strong> ativas</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span><strong>IA Inclusa</strong> (OpenAI / Gemini / Claude)</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Processamento de Imagens Anti-Plágio</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Personalização avançada de tom de voz</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register"
                  className="w-full py-4 px-6 rounded-xl font-bold text-sm text-zinc-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-center transition-all duration-300 shadow-xl shadow-emerald-500/25 block hover:scale-[1.02]"
                >
                  Assinar Plano Creator
                </Link>
              </div>

              {/* Plano Scale */}
              <div className="p-8 rounded-3xl bg-white dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800/80 shadow-sm dark:shadow-none flex flex-col justify-between space-y-8">
                <div>
                  <div className="inline-block px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-indigo-200 dark:border-indigo-500/30">
                    Scale
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Agências</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                    Para redes de portais, afiliados e agências com grande demanda diária.
                  </p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-zinc-900 dark:text-white">R$ 197</span>
                    <span className="text-zinc-500 text-sm">/mês</span>
                  </div>

                  <ul className="mt-8 space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
                    <li className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Até <strong>800 artigos</strong> por mês</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Até <strong>10 sites</strong> WordPress</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Até <strong>30 fontes RSS</strong> ativas</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>IA Inclusa de alta velocidade</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Multi-workspaces com isolamento total</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Suporte prioritário via WhatsApp</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register"
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 text-center transition-colors block shadow-lg shadow-indigo-600/20"
                >
                  Assinar Plano Scale
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 8. FAQ (Accordion) */}
        <section id="faq" className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3">
              Tire suas Dúvidas
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              Perguntas Frequentes
            </p>
            <p className="text-zinc-600 dark:text-zinc-400 text-base mt-3">
              Tudo o que você precisa saber antes de começar a usar o GeraFeed.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Preciso da minha própria chave de API da OpenAI?",
                a: "No plano gratuito (Starter), você utiliza o modelo BYOK (Bring Your Own Key), bastando colar sua própria API Key da OpenAI, OpenRouter ou Gemini. Nos planos Creator e Scale, a Inteligência Artificial já está 100% inclusa na mensalidade sem custos adicionais.",
              },
              {
                q: "O GeraFeed funciona com qualquer site WordPress?",
                a: "Sim! O GeraFeed se comunica nativamente com qualquer instalação do WordPress (versão 5.6 ou superior) utilizando a WordPress REST API e Application Passwords. Você não precisa instalar nenhum plugin pesado ou de terceiros.",
              },
              {
                q: "O conteúdo gerado é considerado plágio pelo Google?",
                a: "Não. A IA do GeraFeed lê a matéria original e reescreve o texto integralmente com nova estrutura, vocabulário jornalístico e subtítulos otimizados para SEO. Além disso, incluímos automaticamente a citação de crédito e o link canônico/atribuição da fonte para garantir segurança ética e jurídica.",
              },
              {
                q: "Como funciona a tecnologia de imagens anti-plágio?",
                a: "O GeraFeed processa as imagens captadas do feed RSS através de uma pipeline que ajusta modulação de contraste, espelhamento e recompressão, gerando uma nova versão visual exclusiva sem perder a fidelidade estética.",
              },
              {
                q: "As matérias são publicadas automaticamente ou passam por revisão?",
                a: "Por padrão, o fluxo é totalmente revisado por você: as notícias chegam como rascunhos com IA já aplicada, você visualiza a prévia, edita se desejar e clica em 'Aprovar e Publicar'. Nos planos avançados, você também pode ativar a publicação direta.",
              },
              {
                q: "Posso cancelar minha assinatura quando quiser?",
                a: "Sim, sem nenhuma fidelidade ou multa rescisória. Você pode cancelar sua assinatura com apenas um clique a qualquer momento diretamente no seu painel de controle.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 overflow-hidden shadow-sm dark:shadow-none transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <span className="font-bold text-zinc-900 dark:text-white text-base">{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-zinc-400 shrink-0 transition-transform duration-300 ${
                      openFaq === idx ? "rotate-180 text-emerald-600 dark:text-emerald-400" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-6 pb-6 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/40 pt-4"
                    >
                      {item.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* 9. Footer CTA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center relative">
          <div className="p-12 sm:p-16 rounded-3xl bg-gradient-to-br from-indigo-900 via-[#0D1424] to-emerald-950 text-white border border-emerald-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 max-w-2xl mx-auto leading-tight">
              Pronto para Escalar sua Produção de Conteúdo?
            </h2>
            <p className="text-zinc-300 text-base sm:text-lg max-w-xl mx-auto mb-8">
              Junte-se a dezenas de portais, agências e afiliados que automatizaram seus blogs com
              qualidade profissional e segurança.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <Link
                href="/register"
                className="w-full sm:w-auto py-4 px-8 rounded-2xl font-bold text-base text-zinc-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 transition-all duration-300 shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                <span>Criar Minha Conta Gratuita</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <p className="text-xs text-zinc-400 mt-4">
              Comece em 60 segundos • Sem necessidade de cartão de crédito
            </p>
          </div>
        </section>
      </main>

      {/* 10. Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#070A12] py-12 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="font-bold text-zinc-800 dark:text-zinc-300 text-sm">GeraFeed</span>
            <span>— Plataforma de Curadoria de Notícias com IA para WordPress</span>
          </div>

          <div className="flex items-center gap-6 text-zinc-600 dark:text-zinc-400">
            <a href="#funcionalidades" className="hover:text-zinc-950 dark:hover:text-white transition-colors">
              Funcionalidades
            </a>
            <a href="#precos" className="hover:text-zinc-950 dark:hover:text-white transition-colors">
              Preços
            </a>
            <a href="#faq" className="hover:text-zinc-950 dark:hover:text-white transition-colors">
              FAQ
            </a>
            <Link href="/login" className="hover:text-zinc-950 dark:hover:text-white transition-colors">
              Painel
            </Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-900 text-center text-[11px] text-zinc-500 dark:text-zinc-600">
          © {new Date().getFullYear()} GeraFeed. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
